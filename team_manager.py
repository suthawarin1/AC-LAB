"""Team content, uploads and shared Manager routes. Python standard library only."""
from __future__ import annotations

import base64
import copy
import json
import os
import re
import secrets
import threading
import time
from pathlib import Path
from urllib.parse import urlsplit

from manager_auth import APIError, ManagerAuth


GROUPS = {"pi", "collaboration", "researcher", "student"}
CONFIG_RE = re.compile(r'(<script id="team-config" type="application/json">)\s*.*?\s*(</script>)', re.S)


def atomic_write(path: Path, raw: bytes, private: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + "." + secrets.token_hex(6) + ".tmp")
    try:
        with temporary.open("xb") as handle:
            if private:
                os.chmod(temporary, 0o600)
            handle.write(raw)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def image_type(raw: bytes) -> str:
    if raw.startswith(b"\xff\xd8\xff") and raw.endswith(b"\xff\xd9"):
        return "jpeg"
    if raw.startswith(b"\x89PNG\r\n\x1a\n") and b"IEND" in raw[-20:]:
        return "png"
    if raw.startswith(b"RIFF") and raw[8:12] == b"WEBP":
        return "webp"
    raise APIError(400, "ใช้ภาพ JPEG, PNG หรือ WebP เท่านั้น")


def safe_image(value: str) -> str:
    if not isinstance(value, str) or len(value) > 6_400_000:
        raise APIError(400, "ที่อยู่ภาพไม่ถูกต้อง")
    value = value.strip()
    if not value:
        return ""
    if value.startswith("data:image/"):
        match = re.fullmatch(r"data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)", value)
        if not match:
            raise APIError(400, "ข้อมูลภาพไม่ถูกต้อง")
        try:
            raw = base64.b64decode(match[2], validate=True)
        except ValueError as error:
            raise APIError(400, "ข้อมูลภาพไม่ถูกต้อง") from error
        if len(raw) > 4_500_000 or image_type(raw) != match[1]:
            raise APIError(400, "ภาพต้องมีขนาดไม่เกิน 4.5 MB และมีชนิดไฟล์ตรงกัน")
        return value
    parsed = urlsplit(value)
    if parsed.scheme in {"https", "http"} and parsed.hostname and not parsed.username and not parsed.password:
        if any(c in value for c in "\r\n\\"):
            raise APIError(400, "ที่อยู่ภาพไม่ถูกต้อง")
        return value
    if re.fullmatch(r"(?:profiles|uploads|images)/[A-Za-z0-9_./-]+\.(?:jpg|jpeg|png|webp)", value, re.I) and ".." not in value:
        return value
    raise APIError(400, "ใช้ URL ภาพ http/https หรือภาพที่อัปโหลดผ่าน Manager")


def text_value(value, maximum=300, required=False):
    if not isinstance(value, str) or len(value) > maximum or "\x00" in value:
        raise APIError(400, "ข้อความยาวเกินกำหนดหรือไม่ถูกต้อง")
    value = value.strip()
    if required and not value:
        raise APIError(400, "กรุณากรอกชื่ออย่างน้อยหนึ่งภาษา")
    return value


def bilingual(value, maximum=300, lists=False):
    if not isinstance(value, dict):
        raise APIError(400, "ข้อมูลภาษาไม่ถูกต้อง")
    result = {}
    for lang in ("en", "th"):
        entry = value.get(lang, [] if lists else "")
        if lists:
            if not isinstance(entry, list) or len(entry) > 16:
                raise APIError(400, "ระบุความเชี่ยวชาญได้ไม่เกิน 16 รายการต่อภาษา")
            result[lang] = [text_value(item, 120) for item in entry if item]
        else:
            result[lang] = text_value(entry, maximum)
    return result


def position(value):
    if not isinstance(value, str) or not re.fullmatch(r"(?:100|\d{1,2})(?:\.\d+)?% (?:100|\d{1,2})(?:\.\d+)?%", value):
        raise APIError(400, "จุดโฟกัสภาพต้องเป็นเปอร์เซ็นต์ เช่น 50% 25%")
    if any(float(part[:-1]) > 100 for part in value.split()):
        raise APIError(400, "จุดโฟกัสภาพต้องอยู่ระหว่าง 0–100%")
    return value


def validate_content(data):
    if not isinstance(data, dict):
        raise APIError(400, "ข้อมูลทีมไม่ถูกต้อง")
    members = data.get("members")
    if not isinstance(members, list) or len(members) > 200:
        raise APIError(400, "รองรับสมาชิกไม่เกิน 200 คน")
    media = data.get("media", {})
    if not isinstance(media, dict) or len(media) > 240:
        raise APIError(400, "ข้อมูลภาพไม่ถูกต้อง")
    clean_media = {}
    for key, value in media.items():
        if not re.fullmatch(r"[a-zA-Z0-9_-]{1,80}", key):
            raise APIError(400, "รหัสภาพไม่ถูกต้อง")
        clean_media[key] = safe_image(value)
    seen, clean_members = set(), []
    for member in members:
        if not isinstance(member, dict):
            raise APIError(400, "ข้อมูลสมาชิกไม่ถูกต้อง")
        mid = member.get("id", "")
        if not isinstance(mid, str) or not re.fullmatch(r"[a-zA-Z0-9_-]{1,80}", mid) or mid in seen:
            raise APIError(400, "รหัสสมาชิกซ้ำหรือไม่ถูกต้อง")
        seen.add(mid)
        group = member.get("group")
        if group not in GROUPS:
            raise APIError(400, "หมวดสมาชิกไม่ถูกต้อง")
        name = bilingual(member.get("name"), 150)
        if not any(name.values()):
            raise APIError(400, "กรุณากรอกชื่อสมาชิกอย่างน้อยหนึ่งภาษา")
        email = text_value(member.get("email", ""), 254)
        if email and not re.fullmatch(r"[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+", email):
            raise APIError(400, "รูปแบบอีเมลไม่ถูกต้อง")
        photo = text_value(member.get("photo", ""), 6_400_000)
        if photo and photo not in clean_media:
            photo = safe_image(photo)
        zoom = member.get("photoZoom", 1)
        if type(zoom) not in {int, float} or not 1 <= zoom <= 3:
            raise APIError(400, "การขยายภาพต้องอยู่ระหว่าง 1–3 เท่า")
        source = text_value(member.get("sourceUrl", ""), 1500)
        if source and (urlsplit(source).scheme not in {"https", "http"} or not urlsplit(source).hostname):
            raise APIError(400, "URL แหล่งข้อมูลไม่ถูกต้อง")
        clean_members.append({
            "id": mid, "group": group, "name": name,
            "academicTitle": bilingual(member.get("academicTitle", {})),
            "position": bilingual(member.get("position", {})),
            "expertise": bilingual(member.get("expertise", {}), lists=True),
            "affiliation": bilingual(member.get("affiliation", {}), 500),
            "bio": bilingual(member.get("bio", {}), 2500),
            "email": email, "photo": photo, "sourceUrl": source,
            "photoPosition": position(member.get("photoPosition", "50% 25%")),
            "photoZoom": zoom,
            "visible": member.get("visible", True) is True,
            "order": len(clean_members),
        })
    hero = data.get("hero", {})
    if not isinstance(hero, dict) or hero.get("mode") not in {"mosaic", "image"}:
        raise APIError(400, "รูปแบบแบนเนอร์ไม่ถูกต้อง")
    hero_image = safe_image(hero.get("image", ""))
    if hero["mode"] == "image" and not hero_image:
        raise APIError(400, "กรุณาเลือกภาพรวมทีมก่อนใช้แบนเนอร์ภาพเดียว")
    contact = text_value(data.get("contactEmail", ""), 254)
    if not re.fullmatch(r"[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+", contact):
        raise APIError(400, "กรุณาระบุอีเมลกลางของแล็บให้ถูกต้อง")
    return {"revision": int(data.get("revision", 0)), "contactEmail": contact, "media": clean_media,
            "hero": {"mode": hero["mode"], "image": hero_image,
                     "position": position(hero.get("position", "50% 40%")),
                     "title": bilingual(hero.get("title", {})),
                     "subtitle": bilingual(hero.get("subtitle", {}), 600)},
            "members": clean_members}


class TeamStore:
    def __init__(self, root: Path):
        self.root = root
        self.folder = root / "team"
        self.backups = root / ".aclab" / "backups"
        self.lock = threading.RLock()
        self.auth = ManagerAuth()

    def content(self):
        return json.loads((self.folder / "site.json").read_text(encoding="utf-8"))

    def public(self, content=None, embed=False):
        result = copy.deepcopy(content if content is not None else self.content())
        result.pop("_manager", None)
        result["members"] = [m for m in result["members"] if m.get("visible", True)]
        for member in result["members"]:
            member.pop("sourceUrl", None)
        used = {m.get("photo") for m in result["members"]} | {"researchScene", "studentScene"}
        result["media"] = {k: v for k, v in result.get("media", {}).items() if k in used}
        if embed:
            def embedded(value):
                if value and not urlsplit(value).scheme:
                    path = (self.folder / value).resolve()
                    try:
                        path.relative_to(self.folder.resolve())
                    except ValueError:
                        return ""
                    if path.is_file():
                        raw = path.read_bytes()
                        return f"data:image/{image_type(raw)};base64," + base64.b64encode(raw).decode()
                return value
            result["media"] = {key: embedded(value) for key, value in result["media"].items()}
            for member in result["members"]:
                if member.get("photo") not in result["media"]:
                    member["photo"] = embedded(member.get("photo", ""))
            result["hero"]["image"] = embedded(result["hero"].get("image", ""))
        return result

    def save(self, data, expected_revision, *, editor=None):
        with self.lock:
            previous = self.content()
            if type(expected_revision) is not int or expected_revision != previous.get("revision"):
                raise APIError(409, "ข้อมูลถูกแก้ไขจากหน้าต่างอื่น กรุณาส่งออกฉบับที่กำลังแก้ไข แล้วโหลดข้อมูลล่าสุด")
            clean = validate_content(data)
            clean["revision"] = previous["revision"] + 1
            metadata = previous.get("_manager") if editor is None else editor
            if metadata is not None:
                clean["_manager"] = metadata
            page = self.folder / "index.html"
            old_html, old_json = page.read_bytes(), (self.folder / "site.json").read_bytes()
            snapshot = json.dumps(self.public(clean, embed=True), ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
            new_html, count = CONFIG_RE.subn(lambda m: m[1] + "\n" + snapshot + "\n" + m[2], old_html.decode())
            if count != 1:
                raise APIError(500, "ไม่พบจุดบันทึกข้อมูลในหน้า Team")
            backup = self.backups / f"team-{previous['revision']:06d}-{time.time_ns()}.json"
            atomic_write(backup, old_json, True)
            try:
                atomic_write(page, new_html.encode())
                atomic_write(self.folder / "site.json", json.dumps(clean, ensure_ascii=False, indent=2).encode())
            except OSError:
                atomic_write(page, old_html)
                atomic_write(self.folder / "site.json", old_json)
                raise
            for stale in sorted(backup.parent.glob("team-*.json"))[:-20]:
                stale.unlink(missing_ok=True)
            return clean

    def require_session(self, handler, mutate=False):
        return self.auth.require_session(handler, mutate)

    def check_origin(self, handler):
        origin = urlsplit(handler.headers.get("Origin", ""))
        if (not origin.netloc or origin.netloc != handler.headers.get("Host") or
                origin.scheme not in {"http", "https"} or handler.headers.get("X-ACLab-Manager") != "1"):
            raise APIError(403, "คำขอนี้ไม่ได้มาจากหน้า Manager ของเว็บไซต์")
        if origin.scheme == "http" and origin.hostname not in {"127.0.0.1", "localhost", "::1"}:
            raise APIError(403, "กรุณาเปิด Manager ผ่าน HTTPS")

    def body(self, handler, maximum=9_000_000):
        try:
            size = int(handler.headers.get("Content-Length", "0"))
        except ValueError as error:
            raise APIError(400, "ขนาดข้อมูลไม่ถูกต้อง") from error
        if size < 1 or size > maximum:
            raise APIError(413, "ข้อมูลใหญ่เกินกำหนด (ภาพไม่เกิน 4.5 MB)")
        if handler.headers.get_content_type() != "application/json":
            raise APIError(415, "ต้องใช้ข้อมูล JSON")
        try:
            data = json.loads(handler.rfile.read(size))
        except (ValueError, UnicodeDecodeError) as error:
            raise APIError(400, "ข้อมูล JSON ไม่ถูกต้อง") from error
        if not isinstance(data, dict):
            raise APIError(400, "ข้อมูล JSON ไม่ถูกต้อง")
        return data

    def handle(self, handler, head=False):
        path = urlsplit(handler.path).path
        if path != "/api/team" and not path.startswith("/api/team/admin/"):
            return False
        try:
            if path == "/api/team":
                if handler.command not in {"GET", "HEAD"}:
                    raise APIError(405, "Method not allowed")
                with self.lock:
                    result = self.public()
            elif handler.command in {"GET", "HEAD"}:
                if path == "/api/team/admin/status":
                    result = self.auth.status(handler)
                elif path == "/api/team/admin/content":
                    self.require_session(handler)
                    with self.lock:
                        result = self.content()
                else:
                    raise APIError(404, "Not found")
            elif handler.command == "POST":
                self.check_origin(handler)
                if path == "/api/team/admin/login":
                    result = self.auth.login(handler, self.body(handler, maximum=8192))
                elif path == "/api/team/admin/logout":
                    result = self.auth.logout(handler)
                elif path == "/api/team/admin/save":
                    self.require_session(handler, True)
                    data = self.body(handler)
                    saved = self.save(data.get("content"), data.get("expectedRevision"))
                    result = {"saved": True, "revision": saved["revision"], "content": saved}
                elif path == "/api/team/admin/upload":
                    self.require_session(handler, True)
                    data = self.body(handler)
                    value = safe_image(data.get("image", ""))
                    if not value.startswith("data:"):
                        raise APIError(400, "กรุณาเลือกไฟล์ภาพ")
                    raw = base64.b64decode(value.split(",", 1)[1])
                    extension = {"jpeg": "jpg", "png": "png", "webp": "webp"}[image_type(raw)]
                    filename = f"uploads/{secrets.token_hex(16)}.{extension}"
                    atomic_write(self.folder / filename, raw)
                    result = {"url": filename}
                else:
                    raise APIError(404, "Not found")
            else:
                raise APIError(405, "Method not allowed")
            handler._json(result, head=head)
        except APIError as error:
            handler._json({"error": error.message}, error.status, head)
        except (OSError, ValueError, TypeError, KeyError):
            handler._json({"error": "ไม่สามารถอ่านหรือบันทึกข้อมูลได้ กรุณาตรวจไฟล์และสิทธิ์โฟลเดอร์"}, 500, head)
        return True
