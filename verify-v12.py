#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FAILURES: list[str] = []
CHECKS = 0


def check(condition: bool, label: str) -> None:
    global CHECKS
    CHECKS += 1
    if not condition:
        FAILURES.append(label)


def text(path: str) -> str:
    p = ROOT / path
    check(p.exists(), f"missing file: {path}")
    return p.read_text(encoding="utf-8", errors="replace") if p.exists() else ""


main = text("index.html")
register = text("register/index.html")
staff = text("staff/index.html")
student = text("student/index.html")
library = text("library/index.html")
sql = text("portal-v12-registration-subweb.sql")

for path in [
    "START-HERE.txt",
    "INSTALL-V12.md",
    "CHECK-V12-PREREQUISITES.sql",
]:
    text(path)

# Public subweb and integration markers.
for marker in [
    "สมัครเรียน | กวดวิชาชีววิทยา อาวริน",
    "public_registration_v12_bootstrap",
    "public_registration_v12_submit",
    "public_registration_v12_attach_slip",
    "public_registration_v12_check_status",
    "public_registration_v12_submit_speaker_request",
    "registration-slips",
    "paymentOption",
    "installmentCount",
    "scheduleConflict",
    "studentCodeClaim",
    "additional_students",
    "public_registration_v12_check_discount",
]:
    check(marker in register, f"register marker missing: {marker}")

check("Swal.fire" not in register and "SweetAlert" not in register, "SweetAlert remains in register")
check("google.script.run" not in register, "Google Apps Script remains in register")
check("@media(max-width:640px)" in register, "mobile breakpoint missing")
check("max-width:1024px" in register, "tablet/iPad breakpoint missing")
check("viewport-fit=cover" in register, "safe-area viewport missing")
check("env(safe-area-inset-bottom)" in register, "safe-area CSS missing")
check("supabase-js@2.110.8" in register, "Supabase client not pinned")

# Main dashboard integration.
for marker in [
    "ใบสมัคร V12",
    "./register/",
    "admin_v12_registration_bootstrap",
    "admin_v12_review_application",
    "admin_v12_update_course_registration",
    "admin_v12_save_registration_package",
    "admin_v12_save_schedule_slot",
    "admin_v12_save_discount",
    "admin_v12_review_speaker_request",
]:
    check(marker in main, f"main marker missing: {marker}")

# Database structures and security.
for marker in [
    "create table if not exists public.student_applications",
    "create table if not exists public.student_application_items",
    "create table if not exists public.course_registration_packages",
    "create table if not exists public.course_schedule_slots",
    "create table if not exists public.registration_discount_codes",
    "create table if not exists public.speaker_requests",
    "private.v12_slot_reserved_count",
    "private.v12_valid_registration_upload_token",
    "private.v12_sync_course_registration_defaults",
    "trg_v12_sync_course_registration_defaults",
    "admin_v12_review_application",
    "private.v11_apply_course_rows",
    "registration-slips",
    "security definer",
    "revoke all on public.course_registration_packages",
]:
    check(marker in sql, f"SQL marker missing: {marker}")

check("private.v12_slot_reserved_count(v_slot.id)+v_group_size>v_slot.capacity" in sql,
      "group seat capacity is not enforced server-side")
check("รอบเรียนที่เลือกมีเวลาเรียนชนกัน" in sql, "server-side schedule collision check missing")
check("ชนกับตารางเรียนเดิมของนักเรียน" in sql, "renewal schedule collision check missing")
check("Student ID หรือเบอร์โทรไม่ตรง" in sql, "renewal identity validation missing")
check("auto_sync=false" in sql, "manual package/slot protection missing")
check("limit 500) a" in sql and "limit 300) r" in sql, "admin bootstrap row limits missing")
check(sql.count("$$") % 2 == 0, "unbalanced SQL dollar quotes")
check(sql.strip().endswith("private_slips_ready;"), "SQL verification query missing")

# Existing subweb files are included and remain responsive.
for name, content in [("staff", staff), ("student", student), ("library", library)]:
    check("<meta name=\"viewport\"" in content or "<meta name='viewport'" in content,
          f"{name} viewport missing")
    check("@media" in content, f"{name} responsive rules missing")

# Parse/check every inline script with Node.
html_files = list(ROOT.glob("**/*.html"))
for html in html_files:
    source = html.read_text(encoding="utf-8", errors="replace")
    scripts = re.findall(r"<script(?P<attrs>[^>]*)>(?P<body>.*?)</script>", source, re.I | re.S)
    for idx, (attrs, body) in enumerate(scripts, 1):
        if "src=" in attrs.lower() or not body.strip():
            continue
        suffix = ".mjs" if "type=\"module\"" in attrs.lower() or "type='module'" in attrs.lower() else ".js"
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=suffix, delete=False) as fh:
            fh.write(body)
            temp_name = fh.name
        result = subprocess.run(["node", "--check", temp_name], capture_output=True, text=True)
        check(result.returncode == 0, f"JavaScript syntax: {html.relative_to(ROOT)} script {idx}: {result.stderr.strip()}")
        Path(temp_name).unlink(missing_ok=True)

print(f"checks_run={CHECKS}")
print(f"checks_failed={len(FAILURES)}")
if FAILURES:
    for failure in FAILURES:
        print(f"FAIL: {failure}")
    sys.exit(1)
print("RESULT=PASS")
