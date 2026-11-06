"""File-backed editor for The AC Lab's public pages."""
from __future__ import annotations

from copy import deepcopy
from hashlib import sha256
from io import BytesIO
import json
import math
from pathlib import Path
import re
import time
from urllib.parse import unquote, urlsplit
from zipfile import ZIP_DEFLATED, ZipFile

from team_manager import APIError, atomic_write


ADMIN = "/api/team/admin/site/"
PUBLIC = "/api/editor/"
EDITOR_KEY = "_manager"
IDENTIFIER = re.compile(r"[a-zA-Z0-9_-]{1,80}\Z")
DANGEROUS_KEYS = {"__proto__", "constructor", "prototype"}
URL_KEYS = {"url", "path", "href", "pdf", "sourceUrl", "mapLink", "mapEmbed",
            "photo", "image", "cover"}
RECORDS = {
    "main": ("heroSlides", "introSlides", "bento", "news"),
    "about": ("researchAreas", "stages"),
    "publication": ("topics", "papers"), "blog": ("categories", "tags", "posts"),
    "funding": ("grants",), "awards": ("awards",), "patents": ("records",),
}
STATUS = {
    "patents": {"patent-granted", "patent-application", "petty-granted", "petty-application"},
    "blog": {"draft", "published"},
}
CONTAINERS = {
    "blog": ("sections", "sources", "tags"), "publication": ("authors", "topics"),
    "awards": ("recipients", "gallery"),
}
REQUIRED_FIELDS = {
    "papers": {"date": str, "year": int, "authors": list, "topics": list},
    "posts": {"date": str, "title": dict, "sections": list, "tags": list, "sources": list},
    "grants": {"fiscalYear": int, "grant": dict, "project": dict},
    "awards": {"year": int, "recipients": list, "gallery": list},
    "records": {"number": str, "title": dict, "date": str},
}


def dump(value, *, script=False):
    text = json.dumps(value, ensure_ascii=False, allow_nan=False,
                      separators=(",", ":") if script else None, indent=None if script else 2)
    return text.replace("<", "\\u003c") if script else text + "\n"


def overlay(base, changed):
    if isinstance(base, dict) and isinstance(changed, dict):
        return {key: overlay(value, changed[key]) if key in changed else deepcopy(value)
                for key, value in base.items()}
    return deepcopy(changed)


def differences(base, value):
    if isinstance(base, dict):
        if not isinstance(value, dict) or base.keys() != value.keys():
            raise APIError(400, "โครงข้อความของหน้านี้ไม่ตรงกับข้อมูลเดิม")
        changed = {}
        for key, item in base.items():
            child = differences(item, value[key])
            if child is not None:
                changed[key] = child
        return changed or None
    if type(value) is not type(base):
        raise APIError(400, "ประเภทข้อมูลข้อความไม่ถูกต้อง")
    return value if value != base else None


def valid_url(raw, image=False):
    if not raw:
        return True
    if not isinstance(raw, str) or re.search(r"[\x00-\x20\\]", raw):
        return False
    if image and re.fullmatch(r"data:image/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+", raw):
        return True
    try:
        url = urlsplit(raw)
        if url.scheme:
            return url.scheme in {"http", "https"} and bool(url.hostname) and not url.username
        return not url.netloc and not raw.startswith("//")
    except ValueError:
        return False


def validate_tree(value, path="", depth=0):
    if depth > 14:
        raise APIError(400, "ข้อมูลซ้อนกันลึกเกินไป")
    if isinstance(value, dict):
        if len(value) > 400:
            raise APIError(400, "ช่องข้อมูลมากเกินไป")
        for key, child in value.items():
            if key in DANGEROUS_KEYS or len(key) > 120 or "\x00" in key:
                raise APIError(400, "รหัสช่องข้อมูลไม่ถูกต้อง")
            if isinstance(child, str) and (key in URL_KEYS or path.endswith(".media")):
                image = key in {"photo", "image", "cover"} or path.endswith(".media")
                if not valid_url(child, image):
                    raise APIError(400, f"ลิงก์ในช่อง {key} ไม่ถูกต้อง")
            validate_tree(child, path + "." + key, depth + 1)
    elif isinstance(value, list):
        if len(value) > 2000:
            raise APIError(400, "รายการมากเกินกำหนด")
        for child in value:
            validate_tree(child, path, depth + 1)
    elif isinstance(value, str):
        limit = 6_400_000 if value.startswith("data:image/") else 80_000
        if len(value) > limit or "\x00" in value:
            raise APIError(400, "ข้อความยาวเกินกำหนดหรือมีอักขระที่ใช้ไม่ได้")
    elif type(value) is float and not math.isfinite(value):
        raise APIError(400, "ตัวเลขไม่ถูกต้อง")
    elif value is not None and type(value) not in {bool, int, float}:
        raise APIError(400, "รูปแบบข้อมูลไม่ถูกต้อง")


def check_list(rows, *, ids=False, nonempty=False):
    if not isinstance(rows, list) or (nonempty and not rows) or any(not isinstance(row, dict) for row in rows):
        raise APIError(400, "รายการต้องเป็นชุดข้อมูลที่ถูกต้องและมีรายการตามที่กำหนด")
    if ids:
        keys = [row.get("id") for row in rows]
        if any(not isinstance(key, str) or not IDENTIFIER.fullmatch(key) for key in keys) or len(keys) != len(set(keys)):
            raise APIError(400, "รหัสรายการต้องไม่ซ้ำและใช้ตัวอักษรอังกฤษ ตัวเลข หรือขีด")


def check_text_pair(value):
    return isinstance(value, dict) and set(value) == {"th", "en"} and all(isinstance(text, str) for text in value.values())


def patch_script(page, script_id, config):
    pattern = rf'(<script id="{script_id}" type="application/json">)\s*.*?\s*(</script>)'
    updated, count = re.subn(pattern, lambda match: match[1] + "\n" + dump(config, script=True) + "\n" + match[2],
                             page, count=1, flags=re.S)
    if count != 1:
        raise ValueError("Missing public configuration: " + script_id)
    return updated


class SiteManager:
    def __init__(self, root: Path, auth):
        self.root = root
        self.auth = auth
        catalog = json.loads((root / "manager/catalog.json").read_text(encoding="utf-8"))
        self.pages = {page["id"]: page for page in catalog}

    def catalog(self):
        return [{key: value for key, value in page.items() if key not in {"copy", "static"}}
                for page in self.pages.values()]

    def source(self, page):
        return self.root / page["folder"] / "site.json"

    def read(self, page):
        raw = self.source(page).read_bytes()
        settings = json.loads(raw)
        metadata = settings.pop(EDITOR_KEY, {})
        return raw, settings, metadata

    def editor_state(self, page):
        raw, settings, metadata = self.read(page)
        copy = {
            key: overlay(definition["value"], metadata.get("copy", {}).get(key, {}))
            for key, definition in page["copy"].items()
        }
        static = {
            key: overlay(definition["value"], metadata.get("static", {}).get(key, {}))
            for key, definition in page["static"].items()
        }
        return {
            "id": page["id"], "version": sha256(raw).hexdigest(), "settings": settings,
            "copy": copy, "static": static, "blocks": metadata.get("blocks", []),
            "copyGroups": {key: group["label"] for key, group in page["copy"].items()},
            "staticFields": {key: {k: v for k, v in group.items() if k != "value"}
                             for key, group in page["static"].items()},
        }

    def public_editor(self, page):
        _, _, metadata = self.read(page)
        return {
            "copy": metadata.get("copy", {}), "static": metadata.get("static", {}),
            "blocks": [block for block in metadata.get("blocks", []) if block.get("visible")],
            "anchors": {key: anchor["selector"] for key, anchor in page["anchors"].items()},
        }

    def validate_settings(self, page, current, updated):
        if not isinstance(updated, dict) or current.keys() != updated.keys():
            raise APIError(400, "โครงข้อมูลของหน้าเว็บไม่ตรงกับข้อมูลเดิม")
        for key, original in current.items():
            if type(updated[key]) is not type(original):
                raise APIError(400, f"ประเภทข้อมูลของ {key} ไม่ถูกต้อง")
        validate_tree(updated, page["id"])
        page_id = page["id"]
        for key in RECORDS.get(page_id, ()):
            check_list(updated[key], ids=key not in {"heroSlides", "introSlides", "bento", "researchAreas"},
                       nonempty=key in {"heroSlides", "introSlides", "stages"})
            for record in updated[key]:
                for name, kind in REQUIRED_FIELDS.get(key, {}).items():
                    if not isinstance(record.get(name), kind):
                        raise APIError(400, f"กรุณาตรวจช่อง {name} ในรายการ {key}")
                for name in CONTAINERS.get(page_id, ()):
                    if key in {"posts", "papers", "awards"} and not isinstance(record.get(name, []), list):
                        raise APIError(400, f"ข้อมูล {name} ต้องเป็นรายการ")
                if key in {"records", "posts"} and page_id in STATUS:
                    flag = "status" if key == "posts" else "kind"
                    if record.get(flag) not in STATUS[page_id]:
                        raise APIError(400, "ประเภทหรือสถานะรายการไม่ถูกต้อง")
        if page_id == "main":
            routes = updated["routes"]
            public_paths = {self.root / item["path"] for item in self.pages.values()}
            if routes.keys() != current["routes"].keys():
                raise APIError(400, "กรุณาระบุเมนูของเว็บไซต์ให้ครบ")
            for key, route in routes.items():
                if not isinstance(route, dict) or not check_text_pair(route.get("label")) or type(route.get("enabled")) is not bool:
                    raise APIError(400, "ชื่อและสถานะเมนูไม่ถูกต้อง")
                target = urlsplit(route.get("url", ""))
                destination = (self.root / unquote(target.path)).resolve()
                if target.scheme or target.netloc or not destination.is_relative_to(self.root):
                    raise APIError(400, "ลิงก์เมนูต้องเป็นหน้าในโฟลเดอร์เว็บนี้")
                if route["enabled"] and destination not in public_paths:
                    raise APIError(400, f"ยังไม่พบหน้าสาธารณะในชุดเว็บสำหรับเมนู {key}")
            if not 3000 <= updated["slideInterval"] <= 120000:
                raise APIError(400, "เวลาสลับสไลด์ต้องอยู่ในช่วง 3000–120000 มิลลิวินาที")
        elif page_id == "about":
            for stage in updated["stages"]:
                nodes = stage.get("nodes")
                edges = stage.get("edges")
                check_list(nodes, ids=True, nonempty=True)
                check_list(edges)
                node_ids = {node["id"] for node in nodes}
                if any(edge.get("from") not in node_ids or edge.get("to") not in node_ids for edge in edges):
                    raise APIError(400, "จุดเชื่อมของเครือข่ายต้องอ้างถึงรหัสจุดที่อยู่ในช่วงเดียวกัน")
                for node in nodes:
                    for view in ("desktop", "mobile"):
                        coordinates = node.get(view)
                        if not isinstance(coordinates, list) or len(coordinates) != 2 or any(
                            type(value) not in {int, float} for value in coordinates
                        ):
                            raise APIError(400, "ตำแหน่งจุดเครือข่ายต้องมีตัวเลขสองค่า")
        elif page_id == "contact":
            contact = updated["contact"]
            if not check_text_pair(contact.get("address")) or not re.fullmatch(
                r"[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+", str(contact.get("email", ""))
            ):
                raise APIError(400, "กรุณาตรวจอีเมลและที่อยู่ติดต่อ")

    def validate_blocks(self, page, blocks):
        check_list(blocks, ids=True)
        if len(blocks) > 50:
            raise APIError(400, "เพิ่มเซกชันได้ไม่เกิน 50 รายการต่อหน้า")
        fields = {"id", "after", "visible", "kicker", "title", "body", "linkLabel", "url", "image", "imageAlt"}
        for block in blocks:
            if set(block) != fields or block["after"] not in ("end", *page["anchors"]) or type(block["visible"]) is not bool:
                raise APIError(400, "โครงเซกชันไม่ถูกต้อง")
            for key in ("kicker", "title", "body", "linkLabel", "imageAlt"):
                if not check_text_pair(block[key]):
                    raise APIError(400, "ข้อมูลภาษาในเซกชันไม่ถูกต้อง")
            if block["visible"] and not any(text.strip() for text in block["title"].values()):
                raise APIError(400, "กรุณาตั้งหัวข้อก่อนแสดงเซกชัน")
            if not isinstance(block["url"], str) or not isinstance(block["image"], str):
                raise APIError(400, "ลิงก์หรือภาพในเซกชันไม่ถูกต้อง")

    def save(self, page, payload):
        with self.auth.lock:
            raw, current, _ = self.read(page)
            if payload.get("version") != sha256(raw).hexdigest():
                raise APIError(409, "มีการแก้หน้านี้จากที่อื่นแล้ว ฉบับที่กำลังแก้ยังอยู่ กรุณาดาวน์โหลดฉบับร่างก่อนโหลดใหม่")
            settings, blocks = payload.get("settings"), payload.get("blocks")
            self.validate_settings(page, current, settings)
            validate_tree(blocks)
            self.validate_blocks(page, blocks)
            metadata = {"blocks": blocks}
            for key in ("copy", "static"):
                value = payload.get(key)
                validate_tree(value)
                base = {name: field["value"] for name, field in page[key].items()}
                metadata[key] = differences(base, value) or {}
            if page["id"] == "team":
                self.auth.save(settings, current["revision"], editor=metadata)
            else:
                destination = self.source(page)
                backup = self.root / ".aclab" / "backups" / f"page-{page['id']}-{time.time_ns()}.json"
                atomic_write(backup, raw, private=True)
                atomic_write(destination, dump({**settings, EDITOR_KEY: metadata}).encode("utf-8"))
                for old in sorted(backup.parent.glob(f"page-{page['id']}-*.json"))[:-20]:
                    old.unlink(missing_ok=True)
            return self.editor_state(page)

    def static_export(self, public_settings, config_ids):
        """Create a portable copy using only the public projections of saved data."""
        bundle = BytesIO()
        with self.auth.lock, ZipFile(bundle, "w", ZIP_DEFLATED) as archive:
            routes = public_settings("")["routes"]
            mentioned = set()
            for page in self.pages.values():
                folder = page["folder"]
                html = (self.root / page["path"]).read_text(encoding="utf-8")
                script_id = "team-config" if page["id"] == "team" else config_ids[folder]
                match = re.search(rf'<script id="{script_id}" type="application/json">\s*(.*?)\s*</script>', html, re.S)
                original = json.loads(match[1])
                live = self.auth.public(embed=True) if page["id"] == "team" else public_settings(folder)
                data = {**original, **live}
                if page["id"] not in {"team", "blog"}:
                    data["media"] = {**original.get("media", {}), **live.get("media", {})}
                if page["id"] in {"main", "about"}:
                    data["routes"] = routes
                html = patch_script(html, script_id, data)
                if 'id="editorial-routes"' in html:
                    html = patch_script(html, "editorial-routes", routes)
                if page["id"] == "team":
                    html = re.sub(r"const routes=\{.*?\};", lambda _: "const routes=" + dump(routes, script=True) + ";",
                                  html, count=1, flags=re.S)
                html = patch_script(html, "aclab-editor-snapshot", self.public_editor(page))
                archive.writestr("The_AC_Lab_Public/" + page["path"], html)
                mentioned.update(re.findall(r"(?:team/)?uploads/([a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp))", html))
            asset_dirs = {"assets", "about/fonts", "about/images", "team/images", "team/profiles"}
            asset_dirs.update(f"{page['folder']}/assets" for page in self.pages.values() if page["folder"])
            for folder in sorted(asset_dirs):
                for asset in (self.root / folder).rglob("*"):
                    if asset.is_file() and asset.resolve().is_relative_to(self.root) and asset.suffix.lower() in {
                        ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".woff", ".woff2", ".css", ".js", ".txt", ".pdf"
                    }:
                        archive.write(asset, "The_AC_Lab_Public/" + asset.relative_to(self.root).as_posix())
            for filename in sorted(mentioned):
                asset = self.root / "team" / "uploads" / filename
                if asset.is_file() and asset.resolve().is_relative_to(self.root):
                    archive.write(asset, "The_AC_Lab_Public/team/uploads/" + filename)
        return bundle.getvalue()

    def handle(self, handler, public_settings, config_ids, head=False):
        path = urlsplit(handler.path).path
        if not path.startswith((ADMIN, PUBLIC)):
            return False
        try:
            if path.startswith(PUBLIC):
                if handler.command not in {"GET", "HEAD"}:
                    raise APIError(405, "Method not allowed")
                page = self.pages.get(path.removeprefix(PUBLIC))
                if not page:
                    raise APIError(404, "ไม่พบหน้าเว็บ")
                result = self.public_editor(page)
            else:
                suffix = path.removeprefix(ADMIN)
                mutate = handler.command == "POST"
                if mutate:
                    self.auth.check_origin(handler)
                self.auth.require_session(handler, mutate)
                if suffix == "catalog" and not mutate:
                    result = {"pages": self.catalog()}
                elif suffix == "export" and not mutate:
                    raw = self.static_export(public_settings, config_ids)
                    handler.send_response(200)
                    handler.send_header("Content-Type", "application/zip")
                    handler.send_header("Content-Disposition", 'attachment; filename="The_AC_Lab_Public.zip"')
                    handler.send_header("Content-Length", str(len(raw)))
                    handler.send_header("Cache-Control", "no-store")
                    handler.end_headers()
                    if not head:
                        handler.wfile.write(raw)
                    return True
                elif suffix.startswith("page/") and suffix[5:] in self.pages:
                    page = self.pages[suffix[5:]]
                    if mutate:
                        result = self.save(page, self.auth.body(handler))
                    else:
                        with self.auth.lock:
                            result = self.editor_state(page)
                else:
                    raise APIError(404, "ไม่พบหน้าเว็บ")
            handler._json(result, head=head)
        except APIError as error:
            handler._json({"error": error.message}, error.status, head)
        except (OSError, ValueError, TypeError, KeyError):
            handler._json({"error": "ไม่สามารถอ่านหรือบันทึกข้อมูล กรุณาตรวจไฟล์และสิทธิ์โฟลเดอร์"}, 500, head)
        return True
