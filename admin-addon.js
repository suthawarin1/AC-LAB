/* AC Lab v3 — conditional member intake + content approval/cloud sync. */
(function(){
'use strict';
const S=window.ACLabSubmissionSchema;
const $=id=>document.getElementById(id);
const safe=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let queue=[],activeFilter='pending',pendingCount=0,busy=false;
let approvedSubmissionIds=[];
function currentSnapshot(){
 return {members:MEMBERS,news:NEWS,cpubs:CPUBS,ipAssets:IP_ASSETS,products:PRODUCTS,videos:VIDEOS,
 taxa:TAXA,collabs:COLLABS,testimonials:TESTIMONIALS,banners:BANNERS,events:EVENTS,gallery:GALLERY,
 resources:RESOURCES,grantTeam:GRANT_TEAM,awards:AWARDS,theme:SITE_ACCENT,
 hiddenSections:[...HIDDEN_SECTIONS],themes:THEMES,pipe:PIPE,facilities:FACILITIES,
 timeline:TIMELINE,road:ROAD,innov:INNOV,textOverrides:TEXT_OVERRIDES,
 sectionOrder:SECTION_ORDER,customSections:CUSTOM_SECTIONS,publishedSubmissionIds:approvedSubmissionIds};
}
// Restore an approval ledger, allowing safe retry after a partial save.
try{let l=JSON.parse(localStorage.getItem('aclab_cms_v1')||'{}');if(Array.isArray(l.publishedSubmissionIds))approvedSubmissionIds=l.publishedSubmissionIds;}catch(e){}
// Keep in sync when loading cloud data, including Events and Gallery, which the legacy loader omitted.
function applyCloudSupplement(record){
 if(!record||typeof record!=='object')return;
 if(Array.isArray(record.events))EVENTS=record.events;
 if(Array.isArray(record.gallery))GALLERY=record.gallery;
 if(Array.isArray(record.publishedSubmissionIds))approvedSubmissionIds=record.publishedSubmissionIds;
 renderEvents();renderGallery();
}
function refreshCloud(){if(!window.supa)return;window.supa.from('site_content').select('data').eq('id',1).single().then(({data,error})=>{if(!error&&data)applyCloudSupplement(data.data);});}
setTimeout(refreshCloud,1000);
// Replace legacy browser-only/partial cloud sync with a single complete snapshot.
// The RLS of site_content must enforce admin-only UPDATE.
saveStore=function(silent){
 const obj=currentSnapshot();let localOK=true;
 try{localStorage.setItem('aclab_cms_v1',JSON.stringify(obj));}catch(e){localOK=false;console.warn('Local cache unavailable',e);}
 if(window.supa){window.supa.from('site_content').update({data:obj,updated_at:new Date().toISOString()}).eq('id',1).then(({error})=>{
  if(error){console.error('Cloud CMS write failed',error);toast('⚠️ Cloud save failed: '+error.message);}
  else if(!silent)toast('✓ Cloud content updated');
 });}
 else if(!silent)toast(localOK?'Saved in this browser only · Supabase unavailable':'Unable to save');
 return localOK;
};
/* Full-fidelity member editing in the legacy Team Manager.
   Older Team editor only stored 10 fields and previously discarded type-specific data. */
const oldEditMember=window.admEditMember;
window.admEditMember=function(i){
 oldEditMember(i);
 const actions=document.querySelector('#adminContent .adm-actions');if(!actions)return;
 const holder=document.createElement('div');holder.id='cmsMemberExtras';
 holder.style.cssText='border-top:1px solid var(--line);margin-top:16px;padding-top:18px';
 actions.before(holder);
 function redraw(){
  const group=$('f_group').value;
  const meta=S.memberTypes[group]||S.memberTypes.intern;
  const base=new Set(['group','en','th','institution','country','email','img','bio','tags']);
  const current=i>=0?MEMBERS[i]:{};
  const currentForm={};holder.querySelectorAll('[data-personnel-extra]').forEach(e=>currentForm[e.dataset.personnelExtra]=e.value);
  holder.innerHTML=`<div class="adm-section-t">รายละเอียดเฉพาะประเภท · ${safe(meta.name)}</div><p style="color:var(--muted);font-size:12px">${safe(meta.description)}</p>`+
  S.fieldsFor('team',{group}).filter(f=>!base.has(f.key)).map(f=>{
    const v=Object.prototype.hasOwnProperty.call(currentForm,f.key)?currentForm[f.key]:current[f.key];
    const str=Array.isArray(v)?v.join('\n'):String(v??'');
    const typ=f.type==='textarea'||f.type==='images'?'textarea':f.type==='date'?'date':'text';
    return `<div class="adm-field"><label>${safe(f.label)} ${f.required?'*':''}</label>${typ==='textarea'?`<textarea data-personnel-extra="${safe(f.key)}">${safe(str)}</textarea>`:`<input data-personnel-extra="${safe(f.key)}" type="${typ}" value="${safe(str)}">`}</div>`;
  }).join('');
 }
 $('f_group').addEventListener('change',redraw);
 redraw();
};
window.admSaveMember=function(){
 const en=($('f_en')?.value||'').trim();if(!en){toast('Please enter a name');return;}
 const group=$('f_group')?.value||'intern';
 const current=editIdx>=0?MEMBERS[editIdx]:{};
 const draft={...current,group,en,th:($('f_th').value||'').trim(),
  tags:($('f_tags').value||'').split(',').map(s=>s.trim()).filter(Boolean),
  institution:($('f_inst').value||'').trim(),country:($('f_country').value||'').trim(),
  phone:($('f_phone').value||'').trim(),email:($('f_email').value||'').trim(),
  bio:($('f_bio').value||'').trim(),img:formImg,pi:!!current.pi||group==='lead'};
 $('cmsMemberExtras')?.querySelectorAll('[data-personnel-extra]').forEach(e=>{
   draft[e.dataset.personnelExtra]=e.value;
 });
 let data;try{data=S.sanitizeRecord('team',draft);}catch(e){toast(e.message);return;}
 // Keep legacy admin-only phone or PI marker, neither is requested in public form.
 const next={...data,phone:draft.phone,pi:draft.pi};
 if(editIdx>=0)MEMBERS[editIdx]=next;else MEMBERS.push(next);
 saveStore();renderProjectTeam();renderTeam(teamCat);renderAdmin('team');
};
function getCollection(cat){
 return {team:MEMBERS,grantteam:GRANT_TEAM,news:NEWS,pubs:CPUBS,ip:IP_ASSETS,products:PRODUCTS,
 awards:AWARDS,videos:VIDEOS,taxa:TAXA,collabs:COLLABS,voices:TESTIMONIALS,banner:BANNERS,
 events:EVENTS,gallery:GALLERY,resources:RESOURCES,themes:THEMES,pipe:PIPE,facilities:FACILITIES,
 timeline:TIMELINE,road:ROAD,innov:INNOV}[cat];
}
function titleOf(cat,item,i){
 if(cat==='gallery')return 'Photo '+(i+1)+' · '+String(item).slice(-27);
 return String(item?.en||item?.name||item?.title||item?.titleTh||item?.sp||item?.formula||item?.caption||item?.q||item?.yr||'Record '+(i+1)).slice(0,100);
}
function convert(cat,p){
 const item={...p};
 if(cat==='gallery')return p.img;
 if(cat==='news'){
  item.id=Math.max(0,...NEWS.map(x=>Number(x.id)||0))+1;
  item.body='<p>'+safe(p.body||'').replace(/\n\n+/g,'</p><p>').replace(/\n/g,'<br>')+'</p>';
 }
 if(cat==='pubs')item.id=-(Date.now());
 if(cat==='awards')item.id='award-'+Date.now()+'-'+Math.floor(Math.random()*10000);
 if(cat==='team'){item.group=item.group||'intern';item.pi=item.group==='lead';}
 if(cat==='ip'){item.no=String(IP_ASSETS.length+1).padStart(2,'0');item.kind=item.kind||'petty-application';}
 if(cat==='products'){item.c1='#2f6b4f';item.c2='#4f9d78';item.icon='i-flask';}
 if(cat==='videos'){item.cat=item.cat||'tutorial';item.c1='#2f6b4f';item.c2='#4f9d78';}
 if(cat==='themes'||cat==='facilities')item.icon='i-leaf';
 if(cat==='pipe') {item.no=String(PIPE.length+1).padStart(2,'0');item.icon='i-flask';}
 if(cat==='innov'){item.no=String(INNOV.length+1).padStart(2,'0');item.icon='i-spark';}
 if(cat==='road')item.no=String(ROAD.length+1);
 if(cat==='resources')item.icon='i-doc';
 return item;
}
function renderLive(cat){
 const actions={team:()=>{renderProjectTeam();renderTeam(teamCat);},grantteam:renderGrantTeam,news:renderNews,
 pubs:renderPubAll,ip:renderIP,products:renderProducts,awards:renderAwardSpotlight,videos:renderVideos,
 taxa:renderTaxa,collabs:renderCollabs,voices:renderTesti,banner:renderBanner,events:renderEvents,
 gallery:renderGallery,resources:renderResources,themes:renderThemes,pipe:renderPipe,
 facilities:renderFacilities,timeline:renderTimeline,road:renderRoad,innov:renderInnov};
 try{actions[cat]?.();}catch(e){console.warn('Live content refresh',e);}
}
function reviewRows(v,cat){
 const cfg=S.categories[cat];if(!cfg)return '<p>Unknown category</p>';
 return S.fieldsFor(cat,v).map(f=>{
 const value=v[f.key];const str=Array.isArray(value)?value.join(f.type==='images'?'\n':', '):String(value||'');
 const preview=f.type==='image' && S.normalizeImage(str)?`<img src="${safe(S.normalizeImage(str))}" loading="lazy" style="width:140px;height:92px;object-fit:cover;border-radius:10px;margin:7px 0 0" onerror="this.style.display='none'">`:'';
 let control;
 if(f.type==='textarea'||f.type==='images'||f.type==='tags')control=`<textarea data-content-field="${safe(f.key)}" style="min-height:80px">${safe(str)}</textarea>`;
 else if(f.type==='member-type')control=`<select data-content-field="group" onchange="cmsRefreshMemberType(this.value)">${S.memberTypeOrder.map(x=>`<option value="${safe(x)}" ${str===x?'selected':''}>${safe(S.memberTypes[x].name)}</option>`).join('')}</select>`;
 else if(f.type.startsWith('select:'))control=`<select data-content-field="${safe(f.key)}">${f.type.slice(7).split('|').map(x=>`<option value="${safe(x)}" ${str===x?'selected':''}>${safe(x)}</option>`).join('')}</select>`;
 else control=`<input data-content-field="${safe(f.key)}" value="${safe(str)}" type="${f.type==='email'?'email':f.type==='date'?'date':'text'}">`;
 return `<div class="adm-field"><label>${safe(f.label)}${f.required?' *':''}</label>${control}${preview}</div>`;
 }).join('');
}
const nativeRender=window.renderAdmin;
window.renderAdmin=function(tab){if(tab==='submissions')return showQueue();return nativeRender(tab);};
function showQueue(){
 const c=$('adminContent');if(!c)return;
 c.innerHTML=`<div class="data-card"><h4>📥 Content submissions <span id="submissionsCount"></span></h4><p>รับข้อมูลจากหน้า <a href="submit/index.html" target="_blank" rel="noopener" style="color:var(--accent)">Submit Information</a> · ตรวจสอบและอนุมัติก่อนเผยแพร่บนเว็บไซต์หลัก ข้อมูลจากผู้ส่งยังไม่เผยแพร่โดยอัตโนมัติ</p><p style="font-size:12px">รูปภาพ: แนะนำ Google Drive → แชร์เป็น “ทุกคนที่มีลิงก์” → นำลิงก์มาใส่ เพื่อประหยัดพื้นที่ฐานข้อมูล</p><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:12px">${['pending','approved','rejected','all'].map(x=>`<button class="btn btn--sm ${activeFilter===x?'btn--primary':'btn--ghost'}" onclick="cmsQueueFilter('${x}')">${{pending:'รอตรวจ',approved:'อนุมัติแล้ว',rejected:'ปฏิเสธ',all:'ทั้งหมด'}[x]}</button>`).join('')}</div></div><div id="cmsQueueList"><p style="color:var(--muted)">Loading...</p></div>`;
 if(!window.supa){$('cmsQueueList').textContent='Supabase unavailable';return;}
 (async()=>{
  const {data,error}=await window.supa.from('content_submissions').select('*').order('created_at',{ascending:false}).limit(300);
  if(!$('cmsQueueList')||adminCurrentTab!=='submissions')return;
  if(error){$('cmsQueueList').innerHTML=`<div class="data-card danger"><p>${safe(error.message)}</p><p>ตรวจสอบการรัน supabase/setup.sql และเพิ่ม admin user ใน cms_admin_users</p></div>`;return;}
  queue=data||[];pendingCount=queue.filter(r=>r.status==='pending').length;
  const subset=queue.filter(r=>activeFilter==='all'||r.status===activeFilter);
  $('submissionsCount').textContent='('+pendingCount+' waiting)';
  $('cmsQueueList').innerHTML=subset.length?`<div class="adm-section-t">${subset.length} submissions (แสดงสูงสุด 300 รายการล่าสุด)</div>`+subset.map(r=>{
   const obj=r.payload||{};const t=titleOf(r.category,obj,0);const cat=S.categories[r.category]?.name||r.category;
   return `<div class="adm-row"><span class="mono-av" style="background:var(--accent)">${r.status==='pending'?'⏳':r.status==='approved'?'✓':'×'}</span><div class="r-main"><h4>${safe(t)}</h4><div class="r-sub">${safe(cat)}${r.category==='team'?' · '+safe(S.memberTypes[obj.group]?.name||obj.group||''):''} · ${safe(r.action==='update'?'ขอแก้ไข':'เพิ่มใหม่')} · ${safe(r.submitter_name)}</div><div class="r-sub">${safe(new Date(r.created_at).toLocaleString('th-TH'))} · ${safe(r.status)}</div></div><div class="r-act"><button class="btn btn--ghost btn--sm" onclick="cmsReview('${safe(r.id)}')">ตรวจสอบ</button></div></div>`;
  }).join(''):`<div class="data-card"><p>ไม่มีคำขอในสถานะนี้</p></div>`;
 })();
}
window.cmsQueueFilter=function(k){activeFilter=k;showQueue();};
window.cmsReview=function(id){
 const r=queue.find(x=>x.id===id);if(!r)return;
 const cat=r.category,p=r.payload||{},records=getCollection(cat)||[];
 const proposed=convert(cat,p);
 const already=approvedSubmissionIds.includes(id);
 const suggestion=(r.target_hint||'').toLowerCase();
 const list=records.map((m,i)=>`<option value="${i}" ${suggestion&&titleOf(cat,m,i).toLowerCase().includes(suggestion)?'selected':''}>${safe(titleOf(cat,m,i))}</option>`).join('');
 const c=$('adminContent');
 c.innerHTML=`<span class="adm-back" onclick="renderAdmin('submissions')">← Back to submissions</span>
 <div class="data-card"><h4>${safe(S.categories[cat]?.name||cat)}</h4><p><b>ผู้ส่ง:</b> ${safe(r.submitter_name)} · ${safe(r.submitter_email)}<br><b>รูปแบบ:</b> ${safe(r.action)} · ${safe(r.target_hint||'')}<br><b>ส่งเมื่อ:</b> ${safe(new Date(r.created_at).toLocaleString('th-TH'))}<br><b>สถานะ:</b> ${safe(r.status)}</p>${r.notes?`<p style="white-space:pre-wrap"><b>หมายเหตุ:</b> ${safe(r.notes)}</p>`:''}${already?'<p style="color:#9b541b">ข้อมูลรายการนี้เคยบันทึกเข้าเนื้อหาเว็บไซต์แล้ว — หากยังอยู่ระหว่างรอตรวจ ให้กดปิดงานคำขอด้านล่าง</p>':''}</div>
 <div class="adm-form" id="cmsReviewForm"><div class="adm-field"><label>การเผยแพร่ / การแทนที่รายการเดิม</label><select id="cmsMode" onchange="document.getElementById('cmsTargetWrap').style.display=this.value==='replace'?'block':'none'"><option value="append">เพิ่มเป็นรายการใหม่</option><option value="replace" ${r.action==='update'?'selected':''}>แทนที่รายการที่มีอยู่ (เลือกอย่างระมัดระวัง)</option></select></div><div class="adm-field" id="cmsTargetWrap" style="display:${r.action==='update'?'block':'none'}"><label>รายการเดิมที่จะอัปเดต</label><select id="cmsTarget">${list}</select>${!records.length?'<small>ไม่มีรายการเดิม เลือกเพิ่มใหม่แทน</small>':''}</div><div class="adm-section-t">ข้อมูลที่เสนอ (แก้ไขก่อนอนุมัติได้)</div>
 <div id="cmsDynamicReview">${reviewRows(p,cat)}</div><div class="adm-field"><label>หมายเหตุการตรวจสอบ</label><textarea id="cmsReviewNote" style="min-height:78px">${safe(r.review_note||'')}</textarea></div>
 <div class="adm-actions">${already&&r.status==='pending'?`<button class="btn btn--primary" onclick="cmsFinalize('${safe(id)}')">ปิดงานคำขอที่เผยแพร่แล้ว</button>`:''}<button class="btn btn--ghost" onclick="cmsReject('${safe(id)}')" ${r.status==='pending'&&!already?'':'disabled'}>ปฏิเสธ</button><button class="btn btn--primary" onclick="cmsApprove('${safe(id)}')" ${r.status==='pending'&&!already?'':'disabled'}>✓ อนุมัติและเผยแพร่</button></div></div>`;
};
window.cmsRefreshMemberType=function(group){
 const raw={};document.querySelectorAll('#cmsDynamicReview [data-content-field]').forEach(e=>raw[e.dataset.contentField]=e.value);
 raw.group=group;const section=$('cmsDynamicReview');if(section)section.innerHTML=reviewRows(raw,'team');
};
function reviewedPayload(cat){
 const raw={};document.querySelectorAll('#cmsReviewForm [data-content-field]').forEach(e=>raw[e.dataset.contentField]=e.value);
 return S.sanitizeRecord(cat,raw);
}
window.cmsApprove=async function(id){
 if(busy)return;
 const r=queue.find(x=>x.id===id);if(!r||r.status!=='pending'||approvedSubmissionIds.includes(id))return;
 const cat=r.category, collection=getCollection(cat);
 if(!collection){toast('Invalid collection');return;}
 let data;try{data=reviewedPayload(cat);}catch(e){toast(e.message);return;}
 const mode=$('cmsMode')?.value||'append';const target=Number($('cmsTarget')?.value);
 if(mode==='replace'&&(!Number.isInteger(target)||target<0||target>=collection.length)){toast('กรุณาเลือกรายการที่จะอัปเดตให้ถูกต้อง');return;}
 const what=mode==='replace'?'แทนที่ข้อมูลเดิม':'เพิ่มรายการใหม่';
 if(!confirm('คุณต้องการอนุมัติและ'+what+'บนเว็บไซต์หลักใช่หรือไม่?'))return;
 busy=true;
 const before=mode==='replace'?collection[target]:null;
 const next=convert(cat,data);
 if(mode==='replace'){
  if(cat==='gallery')collection[target]=next;
  else{const original=before||{};
   const revised=(cat==='team' && original.group!==next.group)?{...next,pi:!!original.pi}:{...original,...next};
   if(cat==='news')revised.id=original.id;
   if(cat==='pubs'||cat==='awards')revised.id=original.id;
   if(cat==='ip')revised.no=original.no;
   if(cat==='team')revised.pi=!!original.pi||revised.group==='lead';
   collection[target]=revised;
  }
 }else collection.push(next);
 const previousIDs=approvedSubmissionIds;
 approvedSubmissionIds=[...approvedSubmissionIds,id];
 const snapshot=currentSnapshot();
 let cloudWritten=false;
 const note=($('cmsReviewNote')?.value||'').slice(0,1800);
 try{
  if(!window.supa)throw Error('Supabase unavailable');
  const {data:saved,error:writeErr}=await window.supa.from('site_content').update({data:snapshot,updated_at:new Date().toISOString()}).eq('id',1).select('id');
  if(writeErr)throw writeErr;
  if(!saved||!saved.length)throw Error('ไม่ได้รับสิทธิ์เขียน site_content — โปรดตรวจ RLS');
  cloudWritten=true;
  try{localStorage.setItem('aclab_cms_v1',JSON.stringify(snapshot));}catch(e){console.warn('Local cache full');}
  renderLive(cat);
  const {data:{user}}=await window.supa.auth.getUser();
  const {error:statusErr}=await window.supa.from('content_submissions').update({status:'approved',review_note:note,reviewed_at:new Date().toISOString(),reviewed_by:user?.id||null}).eq('id',id);
  if(statusErr)throw Error('เผยแพร่แล้ว แต่เปลี่ยนสถานะคำขอไม่สำเร็จ: '+statusErr.message);
  toast('✓ เผยแพร่ข้อมูลบนเว็บไซต์เรียบร้อย');renderAdmin('submissions');
 }catch(e){
  // A failed content update should restore our local state. If only the status
  // update fails, the persisted ID ledger still prevents duplicate publication.
  if(!cloudWritten){
   if(mode==='replace')collection[target]=before;else collection.pop();approvedSubmissionIds=previousIDs;
  }
  console.error('CMS approval issue',e);toast('⚠️ '+e.message);
 }finally{busy=false;}
};
window.cmsFinalize=async function(id){
 if(busy||!approvedSubmissionIds.includes(id))return;
 const {data:{user}}=await window.supa.auth.getUser();
 const {error}=await window.supa.from('content_submissions').update({status:'approved',reviewed_at:new Date().toISOString(),reviewed_by:user?.id||null}).eq('id',id);
 if(error)toast('⚠️ '+error.message);else{toast('สถานะคำขออัปเดตแล้ว');renderAdmin('submissions');}
};
window.cmsReject=async function(id){
 if(busy)return;const r=queue.find(x=>x.id===id);if(!r||r.status!=='pending')return;
 if(!confirm('ปฏิเสธคำขอนี้ใช่หรือไม่?'))return;
 busy=true;
 try{
  const {data:{user}}=await window.supa.auth.getUser();
  const {error}=await window.supa.from('content_submissions').update({status:'rejected',review_note:($('cmsReviewNote')?.value||'').slice(0,1800),reviewed_at:new Date().toISOString(),reviewed_by:user?.id||null}).eq('id',id);
  if(error)throw error;toast('บันทึกการปฏิเสธแล้ว');renderAdmin('submissions');
 }catch(e){toast('⚠️ '+e.message);}finally{busy=false;}
};
})();
