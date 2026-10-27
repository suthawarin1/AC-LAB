/* Shared between the public intake subsite and the AC Lab content manager. */
(function (global) {
'use strict';
const field=(key,label,type='text',required=false)=>({key,label,type,required});
const title=field('title','ชื่อเรื่อง (English) / Title','text',true);
const titleTh=field('titleTh','ชื่อภาษาไทย / Thai title');
const desc=field('desc','รายละเอียด (English) / Description','textarea');
const descTh=field('descTh','รายละเอียด (ภาษาไทย)','textarea');
const image=field('img','ภาพหลัก / Main image (Google Drive หรือ HTTPS)','image');
const categories={
  team:{name:'ลงทะเบียนนักศึกษาและบุคลากร / Lab personnel',group:'01 · Lab members',fields:[]},
  grantteam:{name:'ผู้ร่วมโครงการ / Grant team',group:'People',fields:[field('en','ชื่อภาษาอังกฤษ','text',true),field('th','ชื่อภาษาไทย'),field('role','ตำแหน่ง/บทบาท','text'),field('roleTh','ตำแหน่งภาษาไทย'),field('institution','สังกัด'),field('country','ประเทศ'),field('email','อีเมลสำหรับเผยแพร่','email'),field('phone','โทรศัพท์'),field('bio','ประวัติ','textarea'),field('tags','สาขาความเชี่ยวชาญ','tags'),image]},
  news:{name:'ข่าวสาร / News',group:'Updates',fields:[title,field('date','วันที่ข่าว (เช่น 27 Oct 2026)'),field('body','เนื้อหาข่าว (ข้อความธรรมดา)','textarea',true),image]},
  pubs:{name:'ผลงานตีพิมพ์ / Publications',group:'Research',fields:[title,field('authors','ผู้แต่ง / Authors','textarea',true),field('year','ปี / Year','text'),field('journal','วารสาร / Journal'),field('link','DOI URL / Link','url'),field('abstract','บทคัดย่อ / Abstract','textarea')]},
  ip:{name:'สิทธิบัตร / Intellectual property',group:'Research',fields:[field('formula','ชื่อสูตร/งานภาษาไทย','text',true),field('formulaEn','ชื่อภาษาอังกฤษ'),field('kind','ประเภท','select:petty-application|petty-granted|patent-application|patent-granted'),field('number','เลขคำขอ/เลขสิทธิบัตร'),field('date','วันยื่น/วันจดทะเบียน'),field('tradeName','ชื่อทางการค้า'),field('registration','รายละเอียดทะเบียน','textarea')]},
  products:{name:'ผลิตภัณฑ์ / Products',group:'Research',fields:[field('name','ชื่อผลิตภัณฑ์ (English)','text',true),field('nameTh','ชื่อภาษาไทย'),field('type','ประเภท / Type'),field('typeTh','ประเภทภาษาไทย'),field('benefit','จุดเด่น / Benefit','textarea'),field('benefitTh','จุดเด่นภาษาไทย','textarea'),field('ingredients','ส่วนประกอบ / Ingredients','textarea'),field('size','ขนาด / Package size'),field('price','ราคา / Price'),image]},
  awards:{name:'รางวัลและเกียรติยศ / Awards',group:'Updates',fields:[title,titleTh,field('year','ปี ค.ศ.'),field('yearTh','ปี พ.ศ.'),field('level','ระดับรางวัล (English)'),field('levelTh','ระดับรางวัล (ภาษาไทย)'),field('type','ประเภทรางวัล (English)'),field('typeTh','ประเภทรางวัล (ไทย)'),desc,descTh,field('photo','ภาพพิธีมอบรางวัล / Award photo','image'),field('shield','ภาพโล่หรือเกียรติบัตร / Shield image','image'),field('gallery','ภาพเพิ่มเติม / Gallery (1 link per line)','images')]},
  videos:{name:'วิดีโอ / Videos',group:'Updates',fields:[title,titleTh,field('cat','หมวดวิดีโอ','select:intro|tutorial'),desc,descTh,field('yt','ลิงก์ YouTube','url',true)]},
  taxa:{name:'พืชศึกษา / Taxa',group:'Research',fields:[field('sp','ชื่อวิทยาศาสตร์ / Scientific name','text',true),field('en','ชื่อสามัญภาษาอังกฤษ'),field('enTh','ชื่อสามัญภาษาไทย'),field('acc','รหัสตัวอย่าง / Accession'),desc,descTh,image]},
  collabs:{name:'สถาบันเครือข่าย / Partners',group:'People',fields:[field('name','ชื่อสถาบัน / Institution','text',true),field('cc','ประเทศ / Country'),desc,descTh,field('tags','หัวข้อความร่วมมือ','tags'),field('flag','ภาพธง/โลโก้ (URL)','image')]},
  voices:{name:'ประสบการณ์ศิษย์เก่า / Voices',group:'People',fields:[field('name','ชื่อผู้เล่า / Name','text',true),field('role','ตำแหน่ง / Role'),field('roleTh','ตำแหน่งภาษาไทย'),field('q','ข้อความแนะนำ / Experience','textarea',true),field('qTh','ข้อความภาษาไทย','textarea'),image]},
  banner:{name:'แบนเนอร์ / Announcements',group:'Updates',fields:[field('caption','คำอธิบายภาพ (English)','text',true),field('captionTh','คำอธิบายภาษาไทย'),field('link','ลิงก์เมื่อคลิก / Link','url'),field('img','ภาพแบนเนอร์ / Banner image','image',true)]},
  events:{name:'กิจกรรม / Events',group:'Updates',fields:[title,titleTh,field('month','เดือน (เช่น Oct)','text',true),field('day','วันที่ (01–31)','text',true),field('who','รายละเอียดสถานที่/เวลา (English)'),field('whoTh','รายละเอียดภาษาไทย')]},
  gallery:{name:'ภาพกิจกรรม / Gallery',group:'Updates',fields:[field('img','ลิงก์รูปภาพ / Photo URL','image',true),field('caption','คำบรรยายภาพ (สำหรับตรวจสอบ)')]},
  resources:{name:'เอกสารและทรัพยากร / Resources',group:'Research',fields:[title,titleTh,field('meta','ชนิดไฟล์และรายละเอียด','text'),field('metaTh','รายละเอียดภาษาไทย'),field('link','ลิงก์เอกสาร HTTPS','url',true)]},
  themes:{name:'หัวข้องานวิจัย / Research cards',group:'Website',fields:[title,titleTh,desc,descTh,field('tags','แท็ก / Tags','tags')]},
  pipe:{name:'ขั้นตอนการวิจัย / Pipeline',group:'Website',fields:[title,titleTh,desc,descTh,field('img','ภาพประกอบขั้นตอน','image')]},
  facilities:{name:'เครื่องมือและห้องปฏิบัติการ / Facilities',group:'Website',fields:[title,titleTh,field('spec','รายละเอียดเครื่องมือ / Specification','textarea'),field('specTh','รายละเอียดภาษาไทย','textarea'),image]},
  timeline:{name:'เหตุการณ์สำคัญ / Timeline',group:'Website',fields:[field('yr','ปี / Year','text',true),title,titleTh,desc,descTh]},
  road:{name:'ขั้นตอนเข้าร่วมแล็บ / Joining guide',group:'Website',fields:[title,titleTh,desc,descTh]},
  innov:{name:'นวัตกรรมอนาคต / Future innovation',group:'Website',fields:[title,titleTh,desc,descTh,image]}
};
// Specialized intake. All categories continue to use the same moderation queue and CMS.
// Group-specific fields never disappear from the final approved record.
const memberTypes={
 intern:{name:'Internship / นักศึกษาฝึกงาน',description:'มหาวิทยาลัยต้นสังกัด ช่วงปีฝึกงาน งานที่ทำ และอาจารย์/พี่เลี้ยง',fields:[
 field('institution','มหาวิทยาลัยต้นสังกัด / Home university','text',true),
 field('faculty','คณะ / Faculty'),field('program','สาขาวิชา / Major / Program'),
 field('studyYear','ชั้นปีที่กำลังศึกษา / Year of study'),
 field('internshipYear','ปีที่เข้าฝึกงาน (ค.ศ.) / Internship year','text',true),
 field('internshipTerm','ภาคเรียน / Internship semester'),
 field('startDate','วันที่เริ่มฝึกงาน / Start date','date'),field('endDate','วันที่สิ้นสุดฝึกงาน / End date','date'),
 field('internshipTopic','หัวข้อการฝึกงานหรือโครงการที่ทำ / Internship project','textarea',true),
 field('internshipWork','งานและเทคนิคที่ได้ทำ / Activities & laboratory techniques','textarea',true),
 field('advisor','อาจารย์/พี่เลี้ยงในแล็บ / Lab supervisor'),
 field('outputs','ผลงาน/สิ่งที่ได้เรียนรู้ / Outcomes','textarea')]},
 master:{name:'Master’s / นักศึกษาปริญญาโท',description:'หลักสูตร ปีที่ศึกษา หัวข้อวิทยานิพนธ์ และความก้าวหน้างานวิจัย',fields:[
 field('institution','มหาวิทยาลัย / University','text',true),field('faculty','คณะ / Faculty'),
 field('program','หลักสูตร/สาขาวิชา / MSc program','text',true),
 field('studyYear','ปีที่ศึกษา / Year of study'),field('enrolledYear','ปีที่เข้าศึกษา (ค.ศ.) / Enrollment year'),
 field('thesisTitle','หัวข้อวิทยานิพนธ์ (English) / Thesis title','textarea',true),
 field('thesisTitleTh','หัวข้อวิทยานิพนธ์ภาษาไทย','textarea'),
 field('researchTopic','ประเด็นวิจัย / Research focus','textarea'),
 field('advisor','อาจารย์ที่ปรึกษาหลัก / Principal advisor'),field('coAdvisor','อาจารย์ที่ปรึกษาร่วม / Co-advisor'),
 field('methodologies','เครื่องมือและเทคนิคที่ใช้ / Methods','textarea'),
 field('researchProgress','ความก้าวหน้าโครงการ (สำหรับเผยแพร่) / Progress','textarea'),
 field('expectedGraduation','ปีที่คาดว่าจะสำเร็จการศึกษา (ค.ศ.)')]},
 phd:{name:'PhD / นักศึกษาปริญญาเอก',description:'หลักสูตรปริญญาเอก วิทยานิพนธ์ โครงการวิจัย เทคนิค และผลงาน',fields:[
 field('institution','มหาวิทยาลัย / University','text',true),field('faculty','คณะ / Faculty'),
 field('program','หลักสูตร/สาขาวิชา / PhD program','text',true),
 field('studyYear','ปีที่ศึกษา / Year of study'),field('enrolledYear','ปีที่เข้าศึกษา (ค.ศ.) / Enrollment year'),
 field('thesisTitle','หัวข้อดุษฎีนิพนธ์ (English) / Dissertation title','textarea',true),
 field('thesisTitleTh','หัวข้อดุษฎีนิพนธ์ภาษาไทย','textarea'),
 field('researchTopic','คำถามหรือเป้าหมายการวิจัย / Research questions','textarea'),
 field('advisor','อาจารย์ที่ปรึกษาหลัก / Principal advisor'),field('coAdvisor','อาจารย์ที่ปรึกษาร่วม / Co-advisor'),
 field('methodologies','วิธีวิจัยสำคัญ / Research methods','textarea'),
 field('researchProgress','ความก้าวหน้างานวิจัย (สำหรับเผยแพร่)','textarea'),
 field('publications','ผลงานตีพิมพ์/การประชุม / Publications & conferences','textarea'),
 field('expectedGraduation','ปีที่คาดว่าจะสำเร็จการศึกษา (ค.ศ.)')]},
 staff:{name:'Lab staff / บุคลากรประจำแล็บ',description:'ตำแหน่ง สังกัด บทบาทหน้าที่ และทักษะในห้องปฏิบัติการ',fields:[
 field('role','ตำแหน่งภาษาอังกฤษ / Position','text',true),field('roleTh','ตำแหน่งภาษาไทย'),
 field('institution','สถาบันต้นสังกัด / Institution','text',true),field('department','หน่วยงาน/ฝ่าย / Department'),
 field('startYear','เริ่มทำงานในแล็บปี (ค.ศ.)'),
 field('responsibilities','บทบาทและความรับผิดชอบ / Responsibilities','textarea',true),
 field('methodologies','ทักษะและเครื่องมือที่ใช้ / Technical expertise','textarea'),
 field('researchTopic','งานวิจัยที่ร่วมดำเนินการ / Related projects','textarea')]},
 ra:{name:'Research assistant / ผู้ช่วยวิจัย',description:'โครงการที่รับผิดชอบ ช่วงเวลาทำงาน และเทคนิคที่ใช้',fields:[
 field('institution','สถาบันต้นสังกัด / Institution'),field('faculty','คณะ / Faculty'),
 field('role','บทบาท/ตำแหน่ง / Position'),field('startDate','เริ่มงาน / Start date','date'),
 field('endDate','สิ้นสุดสัญญา (ถ้ามี) / End date','date'),
 field('researchTopic','ชื่อโครงการวิจัย / Research project','textarea',true),
 field('responsibilities','หน้าที่รับผิดชอบ / Responsibilities','textarea',true),
 field('methodologies','เทคนิคและเครื่องมือ / Methods','textarea'),
 field('advisor','หัวหน้าโครงการ / Project supervisor')]},
 postdoc:{name:'Postdoctoral researcher / นักวิจัยหลังปริญญาเอก',description:'สถาบันต้นสังกัด หัวข้อวิจัย โครงการ และผลงาน',fields:[
 field('institution','มหาวิทยาลัยหรือสถาบัน / Institution','text',true),
 field('department','ภาควิชา/หน่วยวิจัย / Department'),
 field('startYear','ปีที่เริ่มร่วมแล็บ (ค.ศ.)'),field('researchTopic','หัวข้อวิจัย / Research topic','textarea',true),
 field('advisor','หัวหน้าทีม/PI'),field('methodologies','เทคนิควิจัย','textarea'),
 field('publications','ผลงานตีพิมพ์ที่เกี่ยวข้อง','textarea')]},
 'alumni-master':{name:'Master’s alumni / ศิษย์เก่าปริญญาโท',description:'ปีจบ หัวข้อวิทยานิพนธ์ และการทำงานปัจจุบัน',fields:[
 field('institution','มหาวิทยาลัยที่สำเร็จการศึกษา / University','text',true),field('program','หลักสูตร / Program'),
 field('graduationYear','ปีที่สำเร็จการศึกษา (ค.ศ.)','text',true),
 field('thesisTitle','หัวข้อวิทยานิพนธ์ / Thesis','textarea'),
 field('advisor','อาจารย์ที่ปรึกษา'),field('currentPosition','ตำแหน่งปัจจุบัน / Current position'),
 field('currentInstitution','สังกัดปัจจุบัน / Current workplace'),field('careerStory','เส้นทางอาชีพ / Career journey','textarea')]},
 'alumni-phd':{name:'PhD alumni / ศิษย์เก่าปริญญาเอก',description:'ปีจบ หัวข้อดุษฎีนิพนธ์ ผลงาน และการทำงานปัจจุบัน',fields:[
 field('institution','มหาวิทยาลัยที่สำเร็จการศึกษา / University','text',true),field('program','หลักสูตร / Program'),
 field('graduationYear','ปีที่สำเร็จการศึกษา (ค.ศ.)','text',true),
 field('thesisTitle','หัวข้อดุษฎีนิพนธ์ / Dissertation','textarea'),
 field('advisor','อาจารย์ที่ปรึกษา'),field('publications','ผลงานวิชาการ','textarea'),
 field('currentPosition','ตำแหน่งปัจจุบัน / Current position'),
 field('currentInstitution','สังกัดปัจจุบัน / Current workplace'),field('careerStory','เส้นทางอาชีพ / Career journey','textarea')]},
 co:{name:'Researcher / นักวิจัยร่วม',description:'สังกัด โครงการร่วมวิจัย ความเชี่ยวชาญ และผลงาน',fields:[
 field('role','ตำแหน่ง / Academic position'),field('institution','สถาบัน / Institution','text',true),
 field('department','ภาควิชา / Department'),field('researchTopic','หัวข้อโครงการร่วม / Collaborative research','textarea',true),
 field('methodologies','ความเชี่ยวชาญ / Expertise','textarea'),field('publications','ผลงานที่เกี่ยวข้อง','textarea')]},
 intl:{name:'Visiting / International researcher',description:'สถาบันต้นสังกัด ช่วงเวลามาเยือน และงานวิจัยร่วม',fields:[
 field('role','ตำแหน่ง / Position'),field('institution','สถาบันต้นสังกัด / Home institution','text',true),
 field('department','คณะ/หน่วยงาน / Department'),field('startDate','เริ่มเข้าร่วม / Start date','date'),
 field('endDate','สิ้นสุด / End date','date'),field('researchTopic','โครงการร่วมวิจัย / Project','textarea',true),
 field('advisor','นักวิจัยประสานงาน / Host supervisor')]},
 lead:{name:'Principal investigator / หัวหน้าทีมวิจัย',description:'ตำแหน่ง หน่วยงาน งานวิจัย และผลงาน',fields:[
 field('role','ตำแหน่งทางวิชาการ / Academic title'),field('institution','สถาบัน / Institution','text',true),
 field('department','ภาควิชา / Department'),field('researchTopic','ความสนใจวิจัย / Research focus','textarea'),
 field('publications','ผลงานสำคัญ / Highlights','textarea')]}
};
const memberTypeOrder=['intern','master','phd','staff','ra','postdoc','alumni-master','alumni-phd','co','intl','lead'];
const commonMemberFields=[
 field('group','ประเภทสมาชิก / Member category','member-type',true),
 field('en','ชื่อ-นามสกุลภาษาอังกฤษ / Full name (English)','text',true),
 field('th','ชื่อ-นามสกุลภาษาไทย / Full name (Thai)'),
 field('country','ประเทศ / Country'),
];
const endMemberFields=[
 field('bio','แนะนำตัวสั้น ๆ (สำหรับหน้าโปรไฟล์สาธารณะ) / Short biography','textarea'),
 field('tags','คำสำคัญ/ความสนใจวิจัย (คั่นด้วยจุลภาค) / Tags','tags'),
 field('email','อีเมลสำหรับเผยแพร่บนเว็บ (ไม่บังคับ) / Public email','email'),
 field('orcid','ORCID URL','url'),field('scholar','Google Scholar URL','url'),
 field('researchgate','ResearchGate URL','url'),field('website','เว็บไซต์ส่วนตัว / Website URL','url'),
 field('img','ภาพโปรไฟล์ (Google Drive link) / Profile photo','image'),
 field('photos','ภาพกิจกรรม/โครงการเพิ่มเติม (หนึ่งลิงก์ต่อบรรทัด) / Additional photos','images')
];
function fieldsFor(category,raw){
 if(category!=='team')return categories[category]?.fields||[];
 const group=raw?.group||'intern';
 return [...commonMemberFields,...(memberTypes[group]||memberTypes.intern).fields,...endMemberFields];
}
categories.team.fields=fieldsFor('team',{group:'intern'});
const IMAGE_KEYS = new Set(['img','photo','shield','flag','gallery']);
function driveImage(url){
 const str=String(url||'').trim();
 let id='';
 const m=str.match(/(?:\/file\/d\/|\/d\/)([a-zA-Z0-9_-]{15,})/) || str.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
 if(m) id=m[1];
 return id?'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w1600':str;
}
function normalizeImage(v){const u=driveImage(v);return /^https:\/\/[a-z\d.-]+(?::\d+)?(?:[/?#]|$)/i.test(u)?u:'';}
function sanitizeRecord(category, raw){
 const cfg=categories[category];if(!cfg)throw Error('Invalid content category');
 const fields=fieldsFor(category,raw);
 if(category==='team' && !memberTypes[raw.group])throw Error('กรุณาเลือกประเภทสมาชิกที่ถูกต้อง');
 const output={};
 for(const f of fields){
   let v=raw[f.key];
   if(f.type==='member-type') {
     v=String(v||'').trim();if(!memberTypes[v])throw Error('ประเภทสมาชิกไม่ถูกต้อง');
   } else if(f.type==='date') {
     v=String(v||'').trim();if(v && !/^\d{4}-\d{2}-\d{2}$/.test(v))throw Error('รูปแบบวันที่ไม่ถูกต้อง: '+f.label);
   } else if(f.type==='tags' || f.type==='images') {
     const items=Array.isArray(v)?v:String(v||'').split(/[\n,]+/);
     v=items.map(x=>String(x).trim()).filter(Boolean).slice(0,30);
     if(f.type==='images'){
       if(v.some(x=>!normalizeImage(x)))throw Error('ลิงก์รูปภาพเพิ่มเติมไม่ถูกต้อง');
       v=v.map(normalizeImage);
     } else v=v.map(x=>x.replace(/[<>]/g,'').slice(0,120));
   }else{
     v=String(v==null?'':v).trim();
     if(f.type==='image'){
       if(v && !normalizeImage(v))throw Error('ลิงก์ภาพ '+f.label+' ต้องเป็น Google Drive หรือ HTTPS');
       v=normalizeImage(v);
     } else if(f.type==='url') {
       if(v && !/^https:\/\//i.test(v))throw Error('ลิงก์ '+f.label+' ต้องขึ้นต้นด้วย https://');
       if(v && !normalizeImage(v))throw Error('ลิงก์ไม่ถูกต้อง');
       v=v.slice(0,1500);
     } else if(f.type==='email'){
       if(v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw Error('รูปแบบอีเมลไม่ถูกต้อง');
       v=v.slice(0,250);
     } else {
       // Submitted content is text, never trusted markup/HTML.
       v=v.replace(/</g,'‹').replace(/>/g,'›').slice(0,f.type==='textarea'?7500:600);
     }
   }
   if(f.required && (!v || (Array.isArray(v)&&!v.length)))throw Error('กรุณากรอก: '+f.label);
   if(v && (!Array.isArray(v)||v.length))output[f.key]=v;
 }
 return output;
}
global.ACLabSubmissionSchema={categories,memberTypes,memberTypeOrder,fieldsFor,normalizeImage,driveImage,sanitizeRecord,IMAGE_KEYS};
})(window);
