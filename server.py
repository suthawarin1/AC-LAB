"""The AC Lab: main-site server and public content API. Python 3.10+."""
from __future__ import annotations

import argparse
import json
import re
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unicodedata import normalize
from urllib.parse import unquote, urlsplit
from team_manager import TeamStore
from site_manager import SiteManager, EDITOR_KEY


ROOT = Path(__file__).resolve().parent
TEAM = TeamStore(ROOT)
MANAGER = SiteManager(ROOT, TEAM)
PUBLIC_SECTIONS = {
    "/api/site": "",
    "/api/about": "about",
    "/api/publication": "publication",
    "/api/blog": "blog",
    "/api/funding": "reward/funding",
    "/api/awards": "reward/awards",
    "/api/patents": "reward/patents",
    "/api/contact": "contact",
}
CONFIG_IDS = {
    "": "site-config",
    "about": "about-config",
    "publication": "publication-config",
    "blog": "blog-config",
    "reward/funding": "funding-config",
    "reward/awards": "awards-config",
    "reward/patents": "patents-config",
    "contact": "contact-config",
}


def public_team() -> dict:
    try:
        return TEAM.public()
    except (OSError, ValueError):
        return {"members": [], "media": {}}


def public_portrait(member: dict, media: dict, prefix: str) -> dict:
    photo = media.get(member.get("photo"), member.get("photo", ""))
    if photo and not urlsplit(photo).scheme and not photo.startswith("/"):
        photo = prefix + photo
    return {
        "name": member["name"],
        "photo": photo,
        "photoPosition": member.get("photoPosition", "center"),
        "photoZoom": member.get("photoZoom", 1),
    }


def public_blog(content: dict) -> dict:
    """Serve published posts and the public profile of each credited author."""
    posts = [post for post in content.get("posts", []) if post.get("status") == "published"]
    author_ids = {post.get("authorId") for post in posts}
    authors = {}
    for author_id, author in content.get("authors", {}).items():
        if author_id in author_ids:
            authors[author_id] = {
                key: author[key] for key in ("name", "photo", "photoPosition", "photoZoom") if key in author
            }

    if author_ids - authors.keys():
        team = public_team()
        for member in team["members"]:
            member_id = member["id"]
            if member_id not in author_ids or member_id in authors:
                continue
            authors[member_id] = public_portrait(member, team["media"], "../team/")

    media_keys = {content.get("hero", {}).get("image")}
    media_keys.update(post.get("cover") for post in posts)
    media_keys.update(author.get("photo") for author in authors.values())
    return {
        "hero": content.get("hero", {}),
        "categories": content.get("categories", []),
        "tags": content.get("tags", []),
        "media": {key: value for key, value in content.get("media", {}).items() if key in media_keys},
        "posts": posts,
        "authors": authors,
    }


def profile_names(value) -> set[str]:
    names = value.values() if isinstance(value, dict) else (value,)
    return {
        " ".join(normalize("NFKC", name).casefold().split())
        for name in names
        if isinstance(name, str) and name.strip()
    }


def match_profile(members: list[dict], member_id, name) -> dict | None:
    if member_id:
        return next((member for member in members if member["id"] == member_id), None)
    names = profile_names(name)
    matches = [member for member in members if profile_names(member["name"]) & names]
    return matches[0] if len(matches) == 1 else None


def public_funding(content: dict) -> dict:
    """Link grants to visible Team profiles by ID or a unique full name."""
    grants = content.get("grants", [])
    if not isinstance(grants, list):
        raise ValueError("Funding grants must be a list")
    team = public_team()
    records = []
    for grant in grants:
        if not isinstance(grant, dict):
            continue
        record = {
            field: grant[field] for field in
            ("id", "fiscalYear", "grant", "funder", "project", "leaderId", "leaderName", "sample")
            if field in grant
        }
        leader = match_profile(team["members"], record.get("leaderId"), record.get("leaderName"))
        if leader:
            record["leader"] = public_portrait(leader, team["media"], "../../team/")
        records.append(record)
    return {
        "hero": content.get("hero", {}),
        "media": content.get("media", {}),
        "grants": records,
    }


def available_award_image(key, media: dict) -> str:
    if not isinstance(key, str) or not key:
        return ""
    source = media.get(key, key)
    if not isinstance(source, str) or not source:
        return ""
    parsed = urlsplit(source)
    if parsed.scheme:
        return key if parsed.scheme in {"https", "data"} else ""
    if parsed.netloc:
        return ""
    base = ROOT if parsed.path.startswith("/") else ROOT / "reward/awards"
    path = (base / unquote(parsed.path).lstrip("/")).resolve()
    return key if path.is_relative_to(ROOT) and path.is_file() else ""


def public_awards(content: dict) -> dict:
    """Publish award details with public Team profiles or named recipients."""
    awards = content.get("awards", [])
    media = content.get("media", {})
    if not isinstance(awards, list) or not isinstance(media, dict):
        raise ValueError("Awards must be a list and media must be an object")
    team = public_team()
    records = []
    roles = {"pi": "faculty", "collaboration": "collaborator"}
    for award in awards:
        if not isinstance(award, dict):
            continue
        record = {
            field: award[field] for field in
            ("id", "year", "title", "description", "level", "type", "issuer", "source")
            if field in award
        }
        recipients = award.get("recipients", [])
        gallery = award.get("gallery", [])
        if not isinstance(recipients, list) or not isinstance(gallery, list):
            raise ValueError("Award recipients and gallery must be lists")
        record["recipients"] = []
        for recipient in recipients:
            if not isinstance(recipient, dict):
                continue
            member = match_profile(team["members"], recipient.get("memberId"), recipient.get("name"))
            name = member["name"] if member else recipient.get("name")
            if not profile_names(name):
                continue
            group = member.get("group", "other") if member else "other"
            role = recipient.get("role")
            if not isinstance(role, str) or not role:
                role = roles.get(group, group)
            profile = {
                "memberId": member["id"] if member else recipient.get("memberId"),
                "name": name,
                "role": role,
                "photo": available_award_image(recipient.get("photo"), media),
            }
            if member:
                portrait = public_portrait(member, team["media"], "../../team/")
                portrait["photo"] = portrait["photo"] or profile["photo"]
                profile.update(portrait)
            record["recipients"].append(profile)
        record["gallery"] = [
            image for value in gallery if (image := available_award_image(value, media))
        ]
        records.append(record)
    return {"hero": content.get("hero", {}), "media": media, "awards": records}


def read_content(section: str) -> dict:
    """Read public overrides; fall back to the standalone HTML's configuration."""
    page_root = ROOT / section
    overrides = page_root / "site.json"
    if overrides.is_file():
        content = json.loads(overrides.read_text(encoding="utf-8"))
    else:
        html = (page_root / "index.html").read_text(encoding="utf-8")
        config_id = CONFIG_IDS[section]
        match = re.search(
            rf'<script id="{config_id}" type="application/json">\s*(.*?)\s*</script>',
            html,
            flags=re.DOTALL,
        )
        if not match:
            raise ValueError("The site-config block is missing from index.html")
        content = json.loads(match.group(1))
    if not isinstance(content, dict):
        raise ValueError("site.json must contain a JSON object")
    content.pop(EDITOR_KEY, None)
    if not overrides.is_file() and section in {"", "about"}:
        content.pop("media", None)
    return content


def update_source(section: str) -> dict:
    """A missing optional feed should leave the other announcements available."""
    try:
        return read_content(section)
    except (OSError, ValueError):
        return {}


def update_year(value) -> int:
    try:
        year = int(value)
    except (TypeError, ValueError, OverflowError):
        return 0
    return year - 543 if year >= 2400 else year


def update_cover(post: dict, media: dict) -> str:
    cover = post.get("cover", "")
    if not isinstance(cover, str) or not cover:
        return "botanical"
    source = media.get(cover, cover)
    if not isinstance(source, str) or not source:
        return "botanical"
    if source.startswith(("https://", "data:image/")):
        return source
    folder = ROOT if source.startswith("/") else ROOT / "blog"
    path = (folder / source.lstrip("/")).resolve()
    if path.is_relative_to(ROOT) and path.is_file():
        return path.relative_to(ROOT).as_posix()
    return "botanical"


def update_records(content: dict, key: str) -> list[dict]:
    rows = content.get(key)
    if not isinstance(rows, list):
        return []
    return [row for row in rows if isinstance(row, dict)]


def homepage_updates() -> list[dict]:
    """Build announcements from the same public data as the linked subwebs."""
    items = []
    grants = [
        grant for grant in update_records(update_source("reward/funding"), "grants")
        if grant.get("grant") and grant.get("project") and update_year(grant.get("fiscalYear")) > 0
    ]
    if grants:
        grant = max(grants, key=lambda row: (not row.get("sample"), update_year(row["fiscalYear"])))
        year = update_year(grant["fiscalYear"])
        items.append({
            "route": "funding", "params": {"year": year}, "image": "laboratory",
            "year": year, "sample": bool(grant.get("sample")),
            "title": grant["grant"], "summary": grant["project"],
        })

    awards = [
        award for award in update_records(update_source("reward/awards"), "awards")
        if award.get("title") and update_year(award.get("year")) > 0
    ]
    if awards:
        award = max(awards, key=lambda row: (not row.get("sample"), update_year(row["year"])))
        year = update_year(award["year"])
        items.append({
            "route": "awards", "params": {"year": year}, "image": "discovery",
            "year": year, "sample": bool(award.get("sample")),
            "title": award["title"], "summary": award.get("description"),
        })

    blog = update_source("blog")
    media = blog.get("media")
    if not isinstance(media, dict):
        media = {}
    posts = [
        post for post in update_records(blog, "posts")
        if post.get("status") == "published" and post.get("id") and post.get("title")
    ]
    posts.sort(key=lambda post: (not post.get("sample"), str(post.get("date") or "")), reverse=True)
    for post in posts[:4]:
        items.append({
            "route": "blog", "params": {"post": post["id"]},
            "image": update_cover(post, media), "position": post.get("coverPosition"),
            "date": post.get("date"), "sample": bool(post.get("sample")),
            "title": post["title"], "summary": post.get("summary"),
        })
    return items


def site_content(section: str = "") -> dict:
    content = read_content(section)
    if section == "blog":
        return public_blog(content)
    if section == "reward/funding":
        return public_funding(content)
    if section == "reward/awards":
        return public_awards(content)
    if section == "contact" and "contact" not in content:
        content["contact"] = read_content("").get("contact", {})
    if not section:
        content["contact"] = read_content("contact").get("contact", content.get("contact", {}))
        content["updates"] = homepage_updates()
    return content


class LabHandler(SimpleHTTPRequestHandler):
    """Serve only public website files; subweb directories can be added later."""

    def _json(self, data: dict, status: int = 200, head: bool = False) -> None:
        raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        if not head:
            self.wfile.write(raw)

    def _handle(self, head: bool = False) -> None:
        path = unquote(urlsplit(self.path).path)
        if MANAGER.handle(self, site_content, CONFIG_IDS, head) or TEAM.handle(self, head):
            return
        if path in PUBLIC_SECTIONS:
            try:
                self._json(site_content(PUBLIC_SECTIONS[path]), head=head)
            except (OSError, ValueError, json.JSONDecodeError):
                self._json({"error": "Site content is unavailable. Check site.json."}, 500, head)
            return
        if path == "/api/health":
            self._json({"status": "ok", "site": "The AC Lab"}, head=head)
            return
        candidate = Path(self.translate_path(path)).resolve()
        # Do not expose Python source, settings, hidden folders or directory listings.
        try:
            relative = candidate.relative_to(ROOT)
        except ValueError:
            self.send_error(404)
            return
        if any(part.startswith(".") for part in relative.parts) or candidate.suffix.lower() in {".py", ".pyc", ".json", ".md", ".bat"}:
            self.send_error(404)
            return
        if candidate.is_dir() and not any((candidate / name).is_file() for name in ("index.html", "index.htm")):
            self.send_error(404)
            return
        if head:
            super().do_HEAD()
        else:
            super().do_GET()

    def do_GET(self) -> None:
        self._handle()

    def do_HEAD(self) -> None:
        self._handle(head=True)

    def do_POST(self) -> None:
        if not (MANAGER.handle(self, site_content, CONFIG_IDS) or TEAM.handle(self)):
            self._json({"error": "Not found"}, 404)

    def end_headers(self) -> None:
        cookie = getattr(self, "team_cookie", None)
        if cookie:
            self.send_header("Set-Cookie", cookie)
            self.team_cookie = None
        if urlsplit(self.path).path.startswith(("/team/", "/manager/")):
            self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run The AC Lab main website")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--setup-manager", action="store_true", help="Create/reset the Manager password locally, then exit")
    parser.add_argument("--manager", action="store_true", help="Set up the Manager password if needed and run the website")
    args = parser.parse_args()
    if args.setup_manager or (args.manager and not TEAM.configured()):
        try:
            TEAM.prompt_setup()
        except ValueError as error:
            parser.error(str(error))
        if args.setup_manager:
            return
    handler = partial(LabHandler, directory=str(ROOT))
    with ThreadingHTTPServer((args.host, args.port), handler) as server:
        print(f"The AC Lab: http://{args.host}:{args.port}/", flush=True)
        print(f"Site Manager: http://{'127.0.0.1' if args.host == '0.0.0.0' else args.host}:{args.port}/manager/", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    main()
