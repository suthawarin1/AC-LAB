"""Supabase authentication and server-side sessions shared by both managers."""
from __future__ import annotations

import base64
from dataclasses import dataclass, field
from http.cookies import CookieError, SimpleCookie
import json
import os
import re
import secrets
from threading import Lock
from time import monotonic
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from uuid import UUID


COOKIE_NAME = "aclab_manager_session"
COOKIE_PATH = "/api/team/admin"
SESSION_SECONDS = 8 * 3600
LOGIN_REQUIRED = "กรุณาเข้าสู่ระบบ Manager อีกครั้ง"
NO_ACCESS = "บัญชีนี้ยังไม่มีสิทธิ์ผู้ดูแลเว็บไซต์"
SUPABASE_UNAVAILABLE = "เชื่อมต่อ Supabase ไม่สำเร็จ กรุณาตรวจ URL, API key และสิทธิ์ของตารางผู้ดูแล"


class APIError(Exception):
    def __init__(self, status: int, message: str):
        self.status, self.message = status, message


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def public_key(key: str) -> bool:
    if re.fullmatch(r"sb_publishable_[A-Za-z0-9_-]+", key):
        return True
    if not re.fullmatch(r"[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", key):
        return False
    try:
        payload = key.split(".")[1]
        claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        return isinstance(claims, dict) and claims.get("role") == "anon"
    except (ValueError, UnicodeError):
        return False


@dataclass(frozen=True)
class AuthTokens:
    user_id: str
    email: str
    access: str = field(repr=False)
    refresh: str = field(repr=False)
    expires: float


@dataclass
class ManagerSession:
    tokens: AuthTokens
    expires: float
    csrf: str = field(default_factory=lambda: secrets.token_urlsafe(32), repr=False)
    lock: Lock = field(default_factory=Lock, repr=False)

    def public(self):
        return {"authenticated": True, "email": self.tokens.email, "csrf": self.csrf}


class ManagerAuth:
    def __init__(self):
        self.url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
        self.key = (os.environ.get("SUPABASE_PUBLISHABLE_KEY") or os.environ.get("SUPABASE_ANON_KEY", "")).strip()
        try:
            url = urlsplit(self.url)
            self.configured = (url.scheme == "https" and bool(url.hostname) and not url.username
                               and not url.password and not (url.path or url.query or url.fragment)
                               and public_key(self.key))
        except ValueError:
            self.configured = False
        self.http = build_opener(NoRedirect())
        self.sessions: dict[str, ManagerSession] = {}
        self.attempts: dict[tuple[str, str], list[float]] = {}
        self.lock = Lock()

    def request(self, path, *, body=None, access=None, token_error=None):
        if not self.configured:
            raise APIError(503, "กรุณาตั้ง SUPABASE_URL และ SUPABASE_PUBLISHABLE_KEY บนเซิร์ฟเวอร์")
        headers = {"Accept": "application/json", "apikey": self.key}
        if access or not self.key.startswith("sb_publishable_"):
            headers["Authorization"] = "Bearer " + (access or self.key)
        data = None
        if body is not None:
            headers["Content-Type"] = "application/json"
            data = json.dumps(body).encode("utf-8")
        try:
            with self.http.open(Request(self.url + path, data, headers), timeout=6) as response:
                raw = response.read(128 * 1024)
                return json.loads(raw) if raw else None
        except HTTPError as error:
            status = error.code
            error.close()
            if status == 429:
                raise APIError(429, "มีคำขอเข้าสู่ระบบมากเกินไป กรุณาลองอีกครั้งภายหลัง") from None
            if token_error and status in {400, 422}:
                raise APIError(401, token_error) from None
            if status == 401 and (access or token_error == LOGIN_REQUIRED):
                raise APIError(401, LOGIN_REQUIRED) from None
            raise APIError(503, SUPABASE_UNAVAILABLE) from None
        except (URLError, OSError, ValueError):
            raise APIError(503, SUPABASE_UNAVAILABLE) from None

    def exchange(self, grant, body, message):
        started = monotonic()
        response = self.request("/auth/v1/token?grant_type=" + grant, body=body, token_error=message)
        try:
            user = response["user"]
            user_id = str(UUID(user["id"]))
            email = user.get("email") or ""
            access, refresh = response["access_token"], response["refresh_token"]
            lifetime = int(response["expires_in"])
            if not re.fullmatch(r"[A-Za-z0-9_.-]+", access) or not isinstance(refresh, str) or not refresh or lifetime <= 0:
                raise ValueError("Invalid token response")
        except (KeyError, TypeError, ValueError, AttributeError):
            raise APIError(503, SUPABASE_UNAVAILABLE) from None
        return AuthTokens(user_id, email, access, refresh, started + lifetime)

    def check_admin(self, tokens):
        query = urlencode({"select": "user_id", "user_id": "eq." + tokens.user_id, "limit": 1})
        rows = self.request("/rest/v1/cms_admin_users?" + query, access=tokens.access)
        if not isinstance(rows, list):
            raise APIError(503, SUPABASE_UNAVAILABLE)
        if rows != [{"user_id": tokens.user_id}]:
            raise APIError(403, NO_ACCESS)

    def revoke(self, tokens):
        try:
            self.request("/auth/v1/logout?scope=local", body={}, access=tokens.access)
        except APIError:
            # The local session is already invalidated even if Supabase is unreachable.
            pass

    def set_cookie(self, handler, value="", seconds=0):
        secure = "; Secure" if urlsplit(handler.headers.get("Origin", "")).scheme == "https" else ""
        handler.team_cookie = (f"{COOKIE_NAME}={value}; Path={COOKIE_PATH}; HttpOnly; SameSite=Strict; "
                               f"Max-Age={seconds}{secure}")

    def session(self, handler):
        cookie = SimpleCookie()
        try:
            cookie.load(handler.headers.get("Cookie", ""))
        except CookieError:
            return "", None
        morsel = cookie.get(COOKIE_NAME)
        token = morsel.value if morsel else ""
        with self.lock:
            session = self.sessions.get(token)
            if session and session.expires <= monotonic():
                del self.sessions[token]
                session = None
        return token, session

    def check_csrf(self, handler, session):
        csrf = handler.headers.get("X-ACLab-CSRF", "")
        if not secrets.compare_digest(csrf.encode("utf-8"), session.csrf.encode("ascii")):
            raise APIError(403, "เซสชันไม่ถูกต้อง กรุณาเข้าสู่ระบบอีกครั้ง")

    def require_session(self, handler, mutate=False):
        token, session = self.session(handler)
        if not session:
            raise APIError(401, LOGIN_REQUIRED)
        if mutate:
            self.check_csrf(handler, session)
        with session.lock:
            if self.session(handler)[1] is not session:
                raise APIError(401, LOGIN_REQUIRED)
            try:
                if session.tokens.expires - monotonic() <= 30:
                    new_tokens = self.exchange("refresh_token", {"refresh_token": session.tokens.refresh}, LOGIN_REQUIRED)
                    if new_tokens.user_id != session.tokens.user_id:
                        raise APIError(401, LOGIN_REQUIRED)
                    session.tokens = new_tokens
                self.check_admin(session.tokens)
            except APIError as error:
                if error.status in {401, 403}:
                    with self.lock:
                        self.sessions.pop(token, None)
                raise
        return session

    def status(self, handler):
        result = {"configured": self.configured, "authenticated": False}
        try:
            return {**result, **self.require_session(handler).public()}
        except APIError as error:
            if error.status not in {401, 403}:
                raise
        return result

    def login(self, handler, body):
        email, password = body.get("email"), body.get("password")
        if (not isinstance(email, str) or len(email) > 320 or not re.fullmatch(r"[^\s@]+@[^\s@]+", email.strip())
                or not isinstance(password, str) or not 1 <= len(password) <= 1024):
            raise APIError(400, "กรุณากรอกอีเมลและรหัสผ่านให้ถูกต้อง")
        email = email.strip()
        key = (handler.client_address[0], email.casefold())
        with self.lock:
            now = monotonic()
            self.attempts = {address: [stamp for stamp in stamps if stamp > now - 600]
                             for address, stamps in self.attempts.items() if stamps[-1] > now - 600}
            recent = self.attempts.setdefault(key, [])
            if len(recent) >= 5:
                raise APIError(429, "เข้าสู่ระบบหลายครั้ง กรุณาลองอีกครั้งใน 10 นาที")
            recent.append(now)
        tokens = self.exchange("password", {"email": email, "password": password}, "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
        try:
            self.check_admin(tokens)
        except APIError:
            self.revoke(tokens)
            raise
        old_token, _ = self.session(handler)
        token = secrets.token_urlsafe(40)
        session = ManagerSession(tokens, monotonic() + SESSION_SECONDS)
        with self.lock:
            self.attempts.pop(key, None)
            self.sessions = {key: active for key, active in self.sessions.items() if active.expires > now}
            self.sessions.pop(old_token, None)
            self.sessions[token] = session
        self.set_cookie(handler, token, SESSION_SECONDS)
        return session.public()

    def logout(self, handler):
        token, session = self.session(handler)
        if session:
            self.check_csrf(handler, session)
            with session.lock:
                with self.lock:
                    removed = self.sessions.pop(token, None)
                if removed:
                    self.revoke(session.tokens)
        self.set_cookie(handler)
        return {"authenticated": False}
