# AreWarin Portal V12 — Static Verification Report

วันที่จัดทำ: 6 สิงหาคม 2026

## ผลรวม

```text
checks_run = 86
checks_failed = 0
RESULT = PASS
```

## สิ่งที่ตรวจแล้ว

- มีไฟล์เว็บไซต์ครบ: Main, Register, Staff, Student และ Library
- หน้า Register มี Supabase RPC ที่จำเป็นครบ
- ไม่มี `SweetAlert`, `Swal.fire` หรือ `google.script.run` ในหน้า Register
- มีระบบนักเรียนใหม่ นักเรียนเดิม เรียนเดี่ยว และเรียนกลุ่ม
- มีคอร์ส แพ็กเกจ ติวเตอร์ รอบเรียน ส่วนลด การชำระ และอัปโหลดสลิป
- มีการตรวจจำนวนที่นั่งของทั้งกลุ่มจากฝั่งฐานข้อมูล
- มีการตรวจเวลาชนกันทั้งในใบสมัครและตารางเดิมของนักเรียน
- มี Trigger ซิงก์คอร์สใหม่จากระบบหลักเข้าสู่ระบบรับสมัคร
- แพ็กเกจและรอบที่แอดมินแก้เองถูกป้องกันไม่ให้ Auto Sync เขียนทับ
- มี Public API และ Admin API แยกสิทธิ์
- Storage สลิปเป็น Private
- Main Dashboard มีการอนุมัติใบสมัครและเชื่อม Student/Enrollment/Schedule/Tutor/Payment
- ตรวจ JavaScript ทุก Inline Script ด้วย `node --check` แล้วผ่านทั้งหมด
- ตรวจ responsive breakpoint สำหรับมือถือและ iPad
- ตรวจ Safe Area สำหรับอุปกรณ์ iOS/iPadOS

## ข้อจำกัดของการตรวจ

การตรวจครั้งนี้เป็น Static Verification ภายในไฟล์ และไม่ได้รัน SQL กับโปรเจกต์ Supabase จริง `wurqxpzlluetcbifdicq` เนื่องจากไม่มีสิทธิ์เข้าถึงโปรเจกต์โดยตรง

หลังติดตั้งควรทดสอบ End-to-End อย่างน้อยหนึ่งรายการ:

1. เปิดคอร์สและรอบเรียน
2. ส่งใบสมัครจาก `/register/`
3. อัปโหลดสลิป
4. ตรวจใบสมัครใน Dashboard
5. อนุมัติ
6. ตรวจ Student ID, Enrollment, Schedule, Tutor Assignment และ Payment Plan
