# The AC Lab — โลโก้และ SEO

## 1. ไฟล์ที่แก้ไข

- หน้าหลักและ subweb ทั้ง 9 หน้า: `index.html`, `about/`, `team/`, `publication/`, `blog/`, `reward/funding/`, `reward/awards/`, `reward/patents/`, `contact/`
- โลโก้จริงจากไฟล์ “โลโก้ The AC Lab ธีมธรรมชาติและวิทยาศาสตร์.png” จัดทำขนาดที่เหมาะกับ header, favicon, Apple icon และภาพสำรองสำหรับแชร์ใน `assets/aclab-logo-*.png` โดยคงงานออกแบบเดิม
- ระบบ SEO: `assets/seo-core.js`, `seo.js`, `seo-pages.js`, `seo.css`, `researcher.css`
- Manager: `manager/index.html`, `manager.js`, `seo-manager.js`, `catalog.json`, `public-files.json` และ `assets/manager-data.js`, `manager-export.js`
- การสร้างเว็บ: `scripts/build-seo.mjs`, `scripts/prerender.mjs`, `scripts/check-seo.mjs`, `package.json`, `package-lock.json`, `.github/workflows/pages.yml`
- `manager.html`, `team/manager.html`, `req-manager/index.html` กำหนด noindex; `manager.html` ยังส่งต่อไป `/manager/`
- หลัง build ได้ HTML ใน `dist/` พร้อม `sitemap.xml` และ `robots.txt`

## 2. SEO และการจัดการที่เพิ่ม

- Title และ Description แยกหน้าและภาษา, canonical, Open Graph, Twitter Card, favicon และโลโก้ในส่วนหัว
- URL ไทย–อังกฤษจริง เช่น `/th/about/`, `/en/about/`, `/en/publications/` พร้อม hreflang ที่อ้างถึงหน้าซึ่งสร้างขึ้นจริง และ x-default ที่หน้าต้อนรับ
- สร้าง HTML จากตัวเรนเดอร์เดิมให้มีข้อความตั้งแต่ก่อนรัน JavaScript พร้อมฝังข้อมูลที่เผยแพร่เพื่อรองรับกรณีการเชื่อมต่อสดล้มเหลว
- ชื่อหลัก The AC Lab และชื่อทางเลือกเริ่มต้น TheACLab เท่านั้น ไม่ใส่รายการคำค้นทั้งหมดใน alternateName หรือ meta keywords
- โปรไฟล์รายบุคคลสร้างเมื่อมีชื่อเต็มที่ตรวจสอบได้ แหล่งอ้างอิง และเจ้าของเว็บเปิดเผยแพร่ ผู้ที่มีเฉพาะชื่อเล่นหรือข้อมูลตัวอย่างยังไม่มีหน้าโปรไฟล์ค้นหา
- Team เชื่อมโปรไฟล์; โปรไฟล์เชื่อมผลงานที่รายชื่อผู้เขียนตรงกัน; บทความจริงเชื่อมผู้เขียนได้เมื่อผูก member ID
- บทความฉบับร่างและบทความตัวอย่างไม่สร้าง URL บทความสำหรับ sitemap; Article markup เกิดจากบทความจริงที่เผยแพร่แล้วเท่านั้น
- งานวิจัยอ้างถึงส่วน Research ใน About และโครงการใน Research Funding ตามเนื้อหาที่มีอยู่ ไม่สร้างหน้าซ้ำที่ไม่มีสาระเพิ่ม
- Manager มีหมวด “SEO และการค้นหา” แก้ Title, Description, Slug, Canonical, การอนุญาต index และชื่อทางเลือก พร้อมตัวอย่าง snippet และตรวจข้อมูลขาด/ซ้ำก่อนบันทึก
- SEO บุคลากรอยู่ในแต่ละรายชื่อ: ยืนยันข้อมูล, แหล่งอ้างอิง, ชื่อทางเลือก, ตำแหน่งและสังกัดที่ตรวจแล้ว; SEO บทความอยู่ในแต่ละโพสต์
- ใช้ JSONB ของ CMS เดิม ไม่ต้องเพิ่มตาราง SQL และไม่ต้องรัน Python เพื่อเปิด Manager
- ปุ่ม “ส่งออกเว็บ SEO” ดึงข้อมูลสาธารณะที่เผยแพร่จริง สร้าง HTML ไทย–อังกฤษ โปรไฟล์ บทความและ sitemap ภายใน ZIP สำหรับอัปโหลดทันที ไม่ส่งออกข้อมูลส่วนตัวหรือรหัสผ่าน

## 3. Keyword Mapping

ดู `seo/keyword-map.csv` จำนวน 58 คำ แบ่ง Brand, Researcher Name, Institution, Research Topic, Publication, Transliteration และ Spelling Variations พร้อม URL เป้าหมาย

High / Medium / Low เป็นสมมติฐานด้านความเกี่ยวข้อง ไม่ใช่ปริมาณค้นหาจริงหรือการทำนายอันดับ หัวข้อ Cannabaceae ยังไม่สร้างหน้าเฉพาะจนกว่าจะมีเนื้อหาจริงเผยแพร่

## 4. Structured Data และความถูกต้องบุคลากร

ติดตั้ง JSON-LD ประเภท Organization/ResearchOrganization, WebSite, WebPage/AboutPage/ContactPage, ProfilePage + Person, Article/BlogPosting, ScholarlyArticle และ BreadcrumbList ตามชนิดและข้อมูลของหน้า

Organization เชื่อม Khon Kaen University; Person เชื่อมชื่อไทย–อังกฤษ แหล่งอ้างอิงและความสัมพันธ์กับแล็บตามรายชื่อเดิม โดยไม่สร้าง ORCID หรือตำแหน่งขึ้นเอง ScholarlyArticle อ้างชื่อเรื่อง DOI และผู้เขียนที่มีอยู่บนหน้า Publications

เริ่มจาก 7 รายชื่อที่มีแหล่งตรวจชื่อเต็ม ได้ 12 URL โปรไฟล์ เพราะ 2 รายชื่อมีเพียงชื่อภาษาอังกฤษในข้อมูลเดิม จึงยังไม่สร้างหน้าภาษาไทยซ้ำเพื่อใส่ hreflang

- Arunrat Chaveerach: ยืนยันชื่อ ตำแหน่ง Professor และสังกัดจาก [สาขาชีววิทยา มข.](https://bio.kku.net/showteacher.php?id=arunrat)
- Runglawan Sudmoon และ Tawatchai Tanee: ยืนยันชื่อจาก [PubMed](https://pubmed.ncbi.nlm.nih.gov/35956463/) ไม่อ้างตำแหน่งหรือสังกัดปัจจุบันที่ยังยืนยันไม่ได้ โดยรายชื่อคณะนิติศาสตร์ มข. ปี 2025 ใช้คำว่าอาจารย์สำหรับ อ.รุ่งลาวัลย์ ต่างจากข้อมูลตั้งต้น
- Yannick D. Benoit: [University of Ottawa](https://www.uottawa.ca/faculty-medicine/directory/dr-yannick-benoit)
- Shiou Yih Lee: [เว็บไซต์นักวิจัย](https://leeshiouyih.owlstown.net/)
- Nisachon Jangpromma: [PubMed](https://pubmed.ncbi.nlm.nih.gov/38467647/)
- Sakda Daduang: [PubMed](https://pubmed.ncbi.nlm.nih.gov/40553907/)

ชื่อไทยของสองรายชื่อท้ายและความสัมพันธ์กับแล็บใช้ตามข้อมูลที่เจ้าของเว็บไซต์มีอยู่ ไม่อ้างว่า PubMed ยืนยันชื่อไทยหรือการเป็นสมาชิกแล็บ ตรวจรายละเอียดได้ใน `seo/verification-sources.json`

## 5. ตรวจสอบใน Google Search Console

1. เพิ่ม Domain property `theaclab.in.th` และยืนยัน DNS ตามค่าที่ Google ให้ หรือใช้ URL-prefix `https://theaclab.in.th/` และ HTML tag
2. ถ้าใช้ HTML tag ให้คัดลอกเฉพาะค่า `content` ลง Manager → หน้าหลัก → SEO → Search Console token บันทึก แล้ว Run workflow รอ Deploy เสร็จก่อนกด Verify
3. ส่ง sitemap ที่ `https://theaclab.in.th/sitemap.xml`
4. ใช้ URL Inspection → Test live URL สำหรับ `/th/`, `/en/`, `/th/about/`, `/en/people/arunrat-chaveerach/` ตรวจ HTML ที่ Google เห็นและ canonical แล้ว Request indexing ตามความเหมาะสม
5. ตรวจ JSON-LD ด้วย [Schema Markup Validator](https://validator.schema.org/) และ [Rich Results Test](https://search.google.com/test/rich-results) โดยบางประเภทไม่ใช่ฟีเจอร์ Rich Result ของ Google
6. ดูรายงาน Pages และ Performance กรองคำค้น `theaclab`, `The AC Lab`, ชื่อบุคลากรและคำค้นงานวิจัย เมื่อมีข้อมูลจริงจึงปรับลำดับความสำคัญ

ยังไม่ได้ยืนยัน Search Console แทนเจ้าของบัญชี เพราะไม่มี DNS/โทเค็นและสิทธิ์เข้าบัญชี Google ของเว็บไซต์

## 6. อัปโหลดและงานหลัง Deploy

1. ใช้โฟลเดอร์ `AC-LAB` ใน ZIP อัปโหลดเนื้อหาภายในไปยังราก repository เดิม รวม `.github/workflows/pages.yml` และไฟล์ package ไม่ใช่อัปโหลดโฟลเดอร์ AC-LAB ซ้อนลงไปอีกชั้น
2. GitHub → repository → Settings → Pages → Build and deployment → Source เลือก **GitHub Actions** ตาม [เอกสาร GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
3. Actions → Build and deploy The AC Lab → Run workflow ระบบอ่านเฉพาะ public CMS ผ่าน Publishable key แล้วสร้าง HTML, sitemap, ตรวจ SEO และ Deploy
4. หลังเพิ่มบทความ/โปรไฟล์หรือเปลี่ยน slug ให้ Run workflow เพื่อสร้าง URL ใหม่ หรือรอรอบ schedule ทุกชั่วโมง GitHub อาจหน่วงเวลา schedule; เมื่ออ่าน Supabase หรือทดสอบไม่ผ่านจะไม่แทนที่เว็บไซต์ที่ Deploy อยู่
5. อีกทางเลือกคือ Manager → ส่งออกเว็บ SEO แล้วอัปโหลดไฟล์สาธารณะจาก ZIP ที่ได้ทับเว็บเดิม โดยคง Manager เดิมไว้
6. โปรไฟล์ที่เปลี่ยนชื่อ สาระหรือผลงานจะปรับ HTML เมื่อ build ครั้งถัดไป; หน้าเดิมยังโหลดข้อมูลสดตามระบบเดิม ส่วน URL และ sitemap ของหน้าใหม่ต้อง build/export ก่อนใช้งาน
7. หากเปลี่ยน slug/canonical ที่มีคนใช้งานแล้ว ควรวาง redirect ของ URL เดิมก่อนเผยแพร่ เพื่อคงลิงก์จากภายนอก
8. หลัง Deploy ตรวจ header/logo บนมือถือและ Desktop, Manager login, editor บทความ, `/manager/`, sitemap, URL โปรไฟล์ และดู View Source ว่ามีข้อความจริง

**สถานะชุดส่งมอบ:** ดึง public Supabase ได้ 7 หน้า (main/contact/about/funding/awards/patents/team) เมื่อ 7 พ.ย. 2026 ใช้ข้อมูลที่เผยแพร่เหล่านี้สร้าง HTML ส่วน Publications และ Lab Blog ยังไม่มีแถวใน CMS จึงใช้ข้อมูลจากไฟล์เดิมจนกว่าจะบันทึกเผยแพร่ครั้งแรก ไม่สร้างบทความตัวอย่างเป็น Article หรือ URL ใน sitemap เมื่อ build ออนไลน์ หากเชื่อมต่อ Supabase ไม่ได้จะหยุดและไม่แทนที่เว็บที่ Deploy อยู่ การทดสอบ Search Console/Googlebot จริงทำต่อหลัง Deploy

เอกสารอ้างอิง: [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions), [Search Console](https://developers.google.com/search/docs/monitor-debug/search-console-start), [Schema ResearchOrganization](https://schema.org/ResearchOrganization)

ไม่รับประกันการจัดทำดัชนีหรืออันดับค้นหา ผลขึ้นอยู่กับ Google และใช้เวลาหลัง Deploy และ crawl ใหม่

## ผลตรวจชุดนี้

- HTML 31 หน้า / sitemap 31 URL: Title, Description, canonical, OG/Twitter, JSON-LD syntax และชนิดข้อมูล, hreflang ไป–กลับ, ลิงก์ภายใน และ noindex ของ Manager ผ่าน
- ทดสอบ Manager ด้วยข้อมูลจำลองในเครื่อง: snippet เปลี่ยนตามการพิมพ์ แจ้ง Title ซ้ำ และดาวน์โหลด ZIP สาธารณะสำเร็จจริง
- ทดสอบการบันทึกกับฐานข้อมูลทดสอบ: อัปเกรดเอกสารเดิม เพิ่ม Publications/Blog ครั้งแรก ความขัดแย้ง revision, รูป Drive, ฉบับร่าง, รูป private/public และ rich editor ยังทำงาน
- ตรวจ Desktop และ iframe มือถือ 390px: หน้าหลักและโปรไฟล์ไม่มีเนื้อหาล้นแนวนอน โลโก้และภาพบุคลากรแสดง; หน้าต้อนรับเชื่อม URL ภาษาไทยจริง
- ยังไม่ได้ทดสอบ login ด้วยบัญชีจริง เปลี่ยนข้อมูลในฐานข้อมูลจริง Deploy หรือขอ Google จัดทำดัชนีแทนเจ้าของเว็บ
