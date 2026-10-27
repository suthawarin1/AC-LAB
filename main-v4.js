/* AC Lab Main Website v4 · Interactive Lab Directory
   Works against the approved MEMBERS array; no invented counts or sample records.
   Loaded after the existing CMS and submission handlers to retain v3 functionality. */
(function () {
  'use strict';
  const groupKeys = new Set(['intern','master','phd','staff','ra','alumni-phd','alumni-master','postdoc']);
  let query = '';
  let sortBy = 'featured';
  let selectedGroup = 'all';
  let alumniType = 'alumni-phd';
  const elem = id => document.getElementById(id);
  const safe = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const localeTh = () => typeof lang !== 'undefined' && lang === 'th';
  const tr = (en, th) => localeTh()?th:en;
  const labels = {
    intern:['Research intern','นักศึกษาฝึกงาน'],master:["Master’s student",'นักศึกษาปริญญาโท'],
    phd:['PhD student','นักศึกษาปริญญาเอก'],staff:['Lab staff','บุคลากรแล็บ'],
    ra:['Research assistant','ผู้ช่วยวิจัย'],postdoc:['Postdoctoral researcher','นักวิจัยหลังปริญญาเอก'], 'alumni-phd':['PhD alumnus/alumna','ศิษย์เก่าปริญญาเอก'],
    'alumni-master':["Master’s alumnus/alumna",'ศิษย์เก่าปริญญาโท']
  };
  const members = () => (Array.isArray(MEMBERS)? MEMBERS:[]).filter(m => m && groupKeys.has(m.group) && m.hidden !== true);
  const includesType = (m, c) => c==='all' || (c==='staff'? ['staff','ra','postdoc'].includes(m.group) : c==='alumni'?['alumni-phd','alumni-master'].includes(m.group):m.group===c);
  const plain = v => Array.isArray(v)?v.join(' '):String(v??'');
  const textForSearch = m => ['en','th','institution','country','faculty','department','program','studyYear',
    'internshipYear','internshipTopic','internshipWork','thesisTitle','thesisTitleTh','researchTopic',
    'researchProgress','responsibilities','role','roleTh','methodologies','advisor','enrolledYear',
    'graduationYear','currentPosition','currentInstitution','tags'].map(k=>plain(m[k])).join(' ').normalize('NFKC').toLocaleLowerCase();
  const year = m => {
    const values=['internshipYear','enrolledYear','startYear','graduationYear','startDate'];
    for(const k of values){const v=String(m[k]||'').match(/\b(?:19|20)\d{2}\b/);if(v)return Number(v[0]);}
    return 0;
  };
  function avatarMarkup(m){
    let url=String(m.img||'').trim();
    // Normalize only genuine Drive URLs; do not blindly extract arbitrary ?id= values.
    if(/^https:\/\/(?:drive|docs)\.google\.com\//i.test(url) && typeof driveDirectUrl==='function') url=driveDirectUrl(url)||url;
    if(!/^https:\/\//i.test(url) && !/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(url))url='';
    return url ? `<img src="${safe(url)}" alt="${safe(m.en||m.th||'Member')}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="mono-av" style="display:none;background:${hue(String(m.en||m.th||'?'))}">${safe(initials(m.en||m.th||'?'))}</span>`:
      `<span class="mono-av" style="background:${hue(String(m.en||m.th||'?'))}">${safe(initials(m.en||m.th||'?'))}</span>`;
  }
  function summary(m){
    if(m.group==='intern')return m.internshipTopic || m.internshipWork || m.researchTopic || m.bio || '';
    if(m.group==='master'||m.group==='phd')return m.thesisTitle || m.thesisTitleTh || m.researchTopic || m.bio || '';
    if(['staff','ra','postdoc'].includes(m.group))return m.responsibilities||m.researchTopic||m.methodologies||m.bio||'';
    return m.researchTopic||m.currentPosition||m.careerStory||m.bio||'';
  }
  function compactMeta(m){
    const arr=[];
    if(m.group==='intern' && m.internshipYear) arr.push((localeTh()?'ฝึกงาน ':'Internship ')+m.internshipYear);
    if(['master','phd'].includes(m.group)&&m.studyYear)arr.push((localeTh()?'ปีที่ ':'Year ')+m.studyYear);
    if(m.program)arr.push(m.program);
    if(m.group.startsWith('alumni-')&&m.graduationYear)arr.push((localeTh()?'จบปี ':'Graduated ')+m.graduationYear);
    if(['staff','ra','postdoc'].includes(m.group)&&m.startYear)arr.push((localeTh()?'เริ่มงาน ':'Since ')+m.startYear);
    return arr.slice(0,2);
  }
  function card(m){
    const index=MEMBERS.indexOf(m);
    const role=labels[m.group] ? labels[m.group][localeTh()?1:0]:m.group;
    const tags=(Array.isArray(m.tags)?m.tags:[]).slice(0,2).map(t=>`<span>${safe(t)}</span>`).join('');
    const aff= m.institution || tr('Khon Kaen University','มหาวิทยาลัยขอนแก่น');
    const meta=compactMeta(m).filter(Boolean).map(v=>`<span>${safe(v)}</span>`).join('');
    const short=summary(m);
    return `<article class="directory-card" role="button" tabindex="0" aria-label="${safe(tr('View profile of ','ดูโปรไฟล์ ')+(m.en||m.th||''))}" onclick="openMember(${index})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openMember(${index})}">
      <div class="directory-card__header"><div class="directory-card__avatar">${avatarMarkup(m)}</div><div class="directory-card__names"><h3>${safe(m.en||m.th||'—')}</h3>${m.th?`<div class="thai">${safe(m.th)}</div>`:''}</div></div>
      <span class="directory-card__role">${safe(role)}</span>
      <div class="directory-card__institution"><svg class="icon" aria-hidden="true"><use href="#i-building"/></svg><span>${safe(aff)}</span></div>
      ${short?`<p class="directory-card__summary">${safe(short)}</p>`:''}
      ${meta?`<div class="directory-card__meta">${meta}</div>`:''}
      <div class="directory-card__bottom"><div class="directory-card__tags">${tags}</div><span class="directory-card__action">${tr('View profile ↗','ดูโปรไฟล์ ↗')}</span></div>
    </article>`;
  }
  function renderStats(all){
    const n = c => all.filter(m=>includesType(m,c)).length;
    const cards=[['all',tr('Lab members','สมาชิกแล็บ')],['intern',tr('Research interns','นักศึกษาฝึกงาน')],['graduate',tr('Graduate students','นักศึกษาบัณฑิตศึกษา')],['staff',tr('Staff & assistants','บุคลากรและผู้ช่วยวิจัย')]];
    const amounts={all:all.length,intern:n('intern'),graduate:n('master')+n('phd'),staff:n('staff')};
    const host=elem('directoryStats');if(host)host.innerHTML=cards.map(([k,l])=>`<div class="directory-stat"><div class="directory-stat__value">${amounts[k]}</div><div class="directory-stat__label">${safe(l)}</div></div>`).join('');
    const allChip=document.querySelector('[data-count="all"]');if(allChip)allChip.textContent='('+all.length+')';
  }
  function refreshLanguage(){
    const dict={
      directoryIntro:['Find students, research interns, lab staff and alumni. Explore their research interests, internships and thesis projects.','ค้นหานักศึกษา นักศึกษาฝึกงาน บุคลากร และศิษย์เก่า พร้อมดูหัวข้องานวิจัย โครงการฝึกงาน และวิทยานิพนธ์'],
      directoryRegisterText:['Register your profile','ลงทะเบียนสมาชิกแล็บ'],directoryUpdateText:['Update a profile','แก้ไขข้อมูลสมาชิก'],
      directoryFooterTitle:['Are you part of AC Lab?','คุณเป็นสมาชิก AC Lab หรือไม่?'],
      directoryFooterDesc:['Help keep our lab directory current. Submit a profile with internship, thesis, project and photo links. All submissions are reviewed before publication.','ร่วมอัปเดตข้อมูลแล็บด้วยประวัติการฝึกงาน หัวข้อวิทยานิพนธ์ โครงการวิจัย และลิงก์ภาพ ข้อมูลทุกชิ้นต้องผ่านการตรวจสอบก่อนเผยแพร่'],
      directoryFooterAction:['Submit member information','ส่งข้อมูลสมาชิก'],
      shortcutDirectory:['Explore the lab directory','สำรวจสมาชิกแล็บ'],shortcutRegister:['Register / update a profile','ลงทะเบียน / แก้ไขโปรไฟล์'],
      shortcutResearch:['Discover our research','สำรวจงานวิจัย'],joinMemberNote:['Already a student or staff member? Register your lab profile.','เป็นนักศึกษาหรือบุคลากรในแล็บอยู่แล้ว? ลงทะเบียนข้อมูลโปรไฟล์ของคุณได้ที่นี่'],
      joinMemberLink:['Submit member information ↗','ส่งข้อมูลสมาชิก ↗']
    };
    Object.entries(dict).forEach(([id,vals])=>{const e=elem(id);if(e)e.textContent=vals[localeTh()?1:0];});
    const search=elem('directorySearch');if(search)search.placeholder=tr('Search names, universities, research topics, internship year…','ค้นหาชื่อ มหาวิทยาลัย หัวข้องานวิจัย ปีฝึกงาน…');
    const sort=elem('directorySort');if(sort){const opts=[['Default order','ลำดับเดิม'],['Name A–Z','ชื่อ ก–ฮ / A–Z'],['Name Z–A','ชื่อ Z–A'],['Newest year','ปีล่าสุด']];Array.from(sort.options).forEach((o,i)=>o.textContent=opts[i][localeTh()?1:0]);}
    const clear=elem('directoryClear');if(clear)clear.setAttribute('aria-label',tr('Clear search','ล้างคำค้น'));
    const allBtn=document.querySelector('#filters [data-cat="all"]');if(allBtn&&allBtn.firstChild)allBtn.firstChild.textContent=tr('All members ','ทั้งหมด ');
    const staffBtn=document.querySelector('#filters [data-cat="staff"]');if(staffBtn)staffBtn.textContent=tr('Staff & assistants','บุคลากรและผู้ช่วยวิจัย');
  }
  function render(cat){
    const host=elem('teamGrid');if(!host)return;
    selectedGroup=cat||selectedGroup||'all';
    // Keep v3 state compatible with the page-wide applyLang() and cloud reload handlers.
    if(typeof teamCat!=='undefined')teamCat=selectedGroup;
    const all=members();
    refreshLanguage();renderStats(all);
    const selected=selectedGroup;
    const needle=query.normalize('NFKC').toLocaleLowerCase().trim();
    let filtered=all.filter(m=>includesType(m,selected) && (!needle || textForSearch(m).includes(needle)));
    if(sortBy==='az'||sortBy==='za'){filtered.sort((a,b)=>String(a.en||a.th||'').localeCompare(String(b.en||b.th||''),'en')*(sortBy==='az'?1:-1));}
    if(sortBy==='recent')filtered.sort((a,b)=>year(b)-year(a));
    host.innerHTML=filtered.length?filtered.map(card).join(''):`<div class="directory-empty"><h3>${tr('No matching members','ไม่พบสมาชิกที่ตรงกับการค้นหา')}</h3><p>${tr('Try another keyword or reset the filters. New member details can be submitted for review.','ลองเปลี่ยนคำค้นหรือเลือกประเภทสมาชิกอื่น และสามารถส่งข้อมูลสมาชิกใหม่ให้ผู้ดูแลตรวจสอบได้')}</p><button type="button" class="btn btn--ghost" onclick="directoryReset()">${tr('Show all members','แสดงสมาชิกทั้งหมด')}</button></div>`;
    const status=elem('directoryResults');if(status)status.textContent=tr(`${filtered.length} of ${all.length} members`,`แสดง ${filtered.length} จากทั้งหมด ${all.length} คน`);
    const clear=elem('directoryClear');if(clear)clear.hidden=!query;
    document.querySelectorAll('#filters .filter').forEach(b=>{const active=b.dataset.cat===(selectedGroup==='alumni-phd'||selectedGroup==='alumni-master'?'alumni':selectedGroup);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    const alum=elem('alumniSub');if(alum)alum.style.display=(selectedGroup==='alumni'||selectedGroup.startsWith('alumni-'))?'inline-flex':'none';
    document.querySelectorAll('#alumniSub .filter').forEach(b=>{const active=selectedGroup!=='alumni' && b.dataset.cat===alumniType;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    host.style.opacity='1';
  }
  window.renderTeam=render;
  window.filterTeam=function(cat){
    // Alumni defaults to all alumni, with an optional narrower subfilter.
    render(cat);
  };
  window.filterAlumniSub=function(sub){alumniType=sub;render(sub);};
  window.directorySearchChanged=function(v){query=String(v||'').slice(0,150);render(selectedGroup);};
  window.directorySortChanged=function(v){sortBy=['featured','az','za','recent'].includes(v)?v:'featured';render(selectedGroup);};
  window.directoryClearSearch=function(){query='';const el=elem('directorySearch');if(el){el.value='';el.focus();}render(selectedGroup);};
  window.directoryReset=function(){query='';sortBy='featured';selectedGroup='all';if(elem('directorySearch'))elem('directorySearch').value='';if(elem('directorySort'))elem('directorySort').value='featured';render('all');};
  // Cloud update + old Admin may invoke applyLang(), which itself invokes renderTeam().
  // All language changes (including a cloud content refresh) redraw dynamic labels and cards.
  if(typeof window.applyLang==='function'){const original=window.applyLang;window.applyLang=function(){original();render(selectedGroup);};}
  render('all');
})();
