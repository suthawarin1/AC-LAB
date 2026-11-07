เวอร์ชันปัจจุบัน: อัปโหลดไฟล์ตาม START-HERE-SEO-TH.txt และอ่าน SEO_REPORT_TH.md เปิด Manager ผ่าน /manager/ ด้วย Supabase บน GitHub Pages ได้โดยตรง

# The AC Lab Manager บน GitHub Pages

1. รันไฟล์ `The_AC_Lab_Supabase.sql` ใน SQL Editor ของโปรเจกต์ Supabase เดิม
2. เลือกหรือสร้างบัญชีใน **Authentication → Users** แล้วรันคำสั่งเพิ่มสิทธิ์ท้ายไฟล์ SQL โดยใส่อีเมลของผู้ดูแลแต่ละคน
3. แตก ZIP แล้วอัปโหลดไฟล์และโฟลเดอร์ภายใน `The_AC_Lab_Manager` ไปยังแหล่งเผยแพร่ของ GitHub Pages ให้ `index.html` และ `.nojekyll` อยู่ระดับเดียวกัน
4. เปิดลิงก์ GitHub Pages แล้วต่อท้ายด้วย `/manager/` จากนั้นใช้อีเมลและรหัสผ่านจาก Supabase Auth

Team Manager อยู่ที่ `/team/manager.html` และใช้เซสชันเดียวกัน บัญชีผู้ดูแลมีแถวใน `cms_admin_users` เพื่อแยกสิทธิ์ออกจากบัญชีลูกค้าร้านค้า

## การบันทึกและเผยแพร่

- Manager รองรับ Main, About, Team, Publication, Lab Blog, Research Funding, Awards, Patents และ Contact รวมถึงข้อความสองภาษาและเซกชันเพิ่มเติม
- กด **บันทึกและเผยแพร่** แล้วเปิดหรือรีเฟรชหน้าสาธารณะ ข้อมูลแสดงจาก Supabase ส่วนบทความร่างและสมาชิกที่ซ่อนเก็บในข้อมูลผู้ดูแล
- Team Manager อัปโหลดภาพ JPEG, PNG และ WebP ได้ ภาพที่อยู่ในรายการเผยแพร่จะถูกคัดลอกไปยังพื้นที่สาธารณะ
- **ส่งออกเว็บ** ดาวน์โหลด ZIP ของหน้าสาธารณะที่เผยแพร่แล้ว ภาพจาก Supabase Storage เปิดผ่าน URL เดิม

ไฟล์ `assets/supabase-config.js` ใช้ Project URL และ Publishable key จากเว็บเดิม เปลี่ยนสองค่านี้เมื่อย้ายโปรเจกต์ Supabase เก็บไฟล์ SQL ตั้งต้นแยกจากโฟลเดอร์ที่อัปโหลดขึ้น GitHub Pages

SQL เพิ่มข้อมูลตั้งต้นของชุดเว็บนี้และไม่เขียนทับหน้าที่บันทึกไว้แล้ว โครงสร้างร้านค้าและ API ของเว็บเดิมใช้โปรเจกต์เดิม ส่วน Product และ Alumni ยังเป็นรายการเมนูสำหรับต่อเติมในชุดเว็บนี้
