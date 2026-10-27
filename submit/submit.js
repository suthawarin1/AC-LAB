(()=>{
'use strict';
const SB_URL='https://nmzwvxdegtfartbhoixx.supabase.co';
const SB_PUBLIC_KEY='sb_publishable_EsNS8St8xkIZgSqEGxp4yQ_y1BmeTDh';
const schema=window.ACLabSubmissionSchema;
const q=s=>document.querySelector(s);
const client=window.supabase?.createClient(SB_URL,SB_PUBLIC_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const draftsKey='aclab_submission_draft_v3';
let category='team',step=1,stored={};
const started=Date.now();
function requestUuid(){
 if(window.crypto?.randomUUID)return window.crypto.randomUUID();
 const bytes=new Uint8Array(16);
 if(window.crypto?.getRandomValues)window.crypto.getRandomValues(bytes);
 else for(let i=0;i<16;i++)bytes[i]=Math.floor(Math.random()*256);
 bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const h=[...bytes].map(n=>n.toString(16).padStart(2,'0')).join('');
 return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
}
function alertStatus(message,error=false){const e=q('#status');e.textContent=message;e.classList.toggle('error',error);e.hidden=false;document.querySelector('main').scrollIntoView({block:'start',behavior:'smooth'});}
function clearStatus(){q('#status').hidden=true;}
function stepTo(n){step=n;clearStatus();for(const el of document.querySelectorAll('.pane'))el.hidden=true;q(n===4?'#paneDone':'#pane'+n).hidden=false;q('#progressBar').style.width=(n===4?100:n===3?80:n===2?50:25)+'%';document.querySelectorAll('.sideStep').forEach(el=>el.classList.toggle('active',Number(el.dataset.s)===n));document.querySelector('main').scrollIntoView({block:'start',behavior:'smooth'});}
function fieldControl(f){
 const outer=document.createElement('div');outer.className='field';
 const label=document.createElement('label');label.htmlFor='f_'+f.key;label.textContent=f.label+' ';
 if(f.required){const req=document.createElement('em');req.textContent='*';label.append(req);}outer.append(label);
 let control;
 if(f.type==='textarea'||f.type==='tags'||f.type==='images'){
  control=document.createElement('textarea');control.rows=f.type==='images'?3:4;
  control.placeholder=f.type==='images'?'วาง 1 ลิงก์ต่อบรรทัด':'กรอกข้อมูล...';
 }else if(f.type==='member-type'){
  control=document.createElement('select');for(const key of schema.memberTypeOrder){const opt=document.createElement('option');opt.value=key;opt.textContent=schema.memberTypes[key].name;control.append(opt);}
 }else if(f.type.startsWith('select:')){
  control=document.createElement('select');for(const v of f.type.slice(7).split('|')){const opt=document.createElement('option');opt.value=v;opt.textContent=v;control.append(opt);}
 }else{
  control=document.createElement('input');control.type=f.type==='image'||f.type==='url'?'url':f.type==='email'?'email':f.type==='date'?'date':'text';
  if(f.type==='image')control.placeholder='https://drive.google.com/file/d/.../view';
  if(f.type==='url')control.placeholder='https://...';
 }
 control.id='f_'+f.key;control.dataset.field=f.key;control.required=!!f.required;control.maxLength=(f.type==='textarea'||f.type==='images')?7500:1500;
 const saved=stored[category]?.[f.key];if(saved!==undefined)control.value=Array.isArray(saved)?saved.join(f.type==='images'?'\n':', '):saved;
 else if(f.type==='member-type')control.value='intern';
 if(f.type==='image'){
  const preview=document.createElement('div');preview.className='preview';
  const pic=document.createElement('img');pic.alt='Image preview';pic.hidden=true;
  const txt=document.createElement('span');txt.textContent='ใส่ลิงก์รูปภาพจาก Google Drive ที่แชร์เป็นสาธารณะ';
  preview.append(pic,txt);outer.append(control,preview);
  control.addEventListener('input',()=>{
   const link=schema.normalizeImage(control.value);
   pic.hidden=!link;txt.textContent=link?'แสดงตัวอย่าง (หากไม่ขึ้น ให้ตรวจสิทธิ์การแชร์รูปภาพ)':'ใส่ลิงก์รูปภาพจาก Google Drive ที่แชร์เป็นสาธารณะ';
   if(link)pic.src=link;
  });
  pic.addEventListener('error',()=>{txt.textContent='ไม่สามารถแสดงภาพตัวอย่างได้ โปรดตรวจลิงก์และสิทธิ์การแชร์';pic.hidden=true;});
  if(control.value)control.dispatchEvent(new Event('input'));
 }else outer.append(control);
 if(f.type==='member-type')control.addEventListener('change',()=>{const current=collect().payload;stored.team={...stored.team,...current,group:control.value};renderFields();saveDraft();});
 else control.addEventListener('input',saveDraft);
 return outer;
}
function saveDraft(){try{const s=collect();stored[category]=s.payload;localStorage.setItem(draftsKey,JSON.stringify({category,stored,name:q('#submittedBy').value,email:q('#submitEmail').value,action:q('#recordAction').value,targetHint:q('#targetHint').value,note:q('#submitNote').value}));}catch(e){/* browsers may block storage */}}
function collect(){const raw={};document.querySelectorAll('#dynamicFields [data-field]').forEach(e=>raw[e.dataset.field]=e.value);return {category,payload:raw};}
function renderFields(){
 const saved=stored[category]||{};if(category==='team'&&!saved.group)stored.team={...saved,group:'intern'};
 const group=stored.team?.group||'intern';
 q('#formTitle').textContent=category==='team'?'โปรไฟล์ '+schema.memberTypes[group].name:schema.categories[category].name;
 const explanation=q('#typeHint');explanation.hidden=category!=='team';
 if(category==='team'){explanation.textContent='แบบฟอร์มเฉพาะประเภท · '+schema.memberTypes[group].description+' · โปรดกรอกเฉพาะข้อมูลที่ยินยอมให้แสดงสาธารณะ';}
 const fields=schema.fieldsFor(category,category==='team'?{group}:saved);
 q('#dynamicFields').replaceChildren(...fields.map(fieldControl));
}
function renderMemberTypes(){const root=q('#memberTypeTiles');if(!root)return;root.replaceChildren();
 for(const g of ['intern','master','phd','staff','ra','postdoc','alumni-master','alumni-phd','co','intl','lead']){
 const info=schema.memberTypes[g],tile=document.createElement('button');tile.type='button';tile.className='typeTile';
 const label=document.createElement('b');label.textContent=info.name;const detail=document.createElement('span');detail.textContent=info.description;
 tile.append(label,detail);tile.onclick=()=>{saveDraft();category='team';stored.team={...(stored.team||{}),group:g};renderCategories();renderFields();stepTo(2);saveDraft();};root.append(tile);
 }}
function renderCategories(){const groups={};Object.entries(schema.categories).forEach(([id,v])=>(groups[v.group]??=[]).push([id,v]));const dest=q('#categories');dest.replaceChildren();Object.entries(groups).forEach(([group,records])=>{for(const [id,item] of records){const btn=document.createElement('button');btn.className='cat'+(id===category?' active':'');btn.type='button';const badge=document.createElement('span');badge.textContent=group;btn.append(badge,document.createTextNode(item.name));btn.onclick=()=>{category=id;renderCategories();renderFields();};dest.append(btn);}});}
function validate(){const form=q('#pane2');for(const el of form.querySelectorAll('[required]')){if(!el.reportValidity()){el.focus();return null;}}
 try{
 const {payload}=collect();const clean=schema.sanitizeRecord(category,payload);
 const name=q('#submittedBy').value.trim();const email=q('#submitEmail').value.trim();
 if(name.length<2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('กรุณากรอกชื่อและอีเมลติดต่อที่ถูกต้อง');
 if(q('#recordAction').value==='update' && !q('#targetHint').value.trim())throw Error('กรุณาระบุชื่อรายการเดิมที่ต้องการแก้ไข');
 return {category,payload:clean,submitter_name:name.slice(0,150),submitter_email:email.slice(0,250),action:q('#recordAction').value,target_hint:q('#targetHint').value.trim().slice(0,250),note:q('#submitNote').value.trim().slice(0,1800)};
 }catch(e){alertStatus(e.message,true);return null;}}
function review(data){const target=q('#review');target.replaceChildren();const add=(label,value,isImg=false)=>{const dt=document.createElement('dt');dt.textContent=label;const dd=document.createElement('dd');if(isImg&&typeof value==='string'){const img=document.createElement('img');img.src=value;img.alt=label;img.onerror=()=>img.replaceWith(document.createTextNode(value));dd.append(img);}else dd.textContent=Array.isArray(value)?value.join('\n'):String(value||'—');target.append(dt,dd);};
 add('ประเภทข้อมูล',schema.categories[data.category].name);add('ผู้ส่ง',data.submitter_name);add('อีเมลติดต่อ',data.submitter_email);add('รูปแบบคำขอ',data.action==='update'?'เสนอแก้ไข '+data.target_hint:'เพิ่มรายการใหม่');
 const fields=schema.fieldsFor(category,data.payload);fields.forEach(f=>{if(data.payload[f.key])add(f.label,data.payload[f.key],f.type==='image');});if(data.note)add('หมายเหตุถึงผู้ดูแล',data.note);
}
q('#to2').onclick=()=>{renderFields();stepTo(2);};q('#back1').onclick=()=>{saveDraft();stepTo(1);};
q('#to3').onclick=()=>{const data=validate();if(!data)return;saveDraft();review(data);stepTo(3);};
q('#back2').onclick=()=>stepTo(2);
q('#send').onclick=async()=>{
 clearStatus();if(!q('#consent').checked){alertStatus('กรุณายืนยันสิทธิ์ในการส่งข้อมูลก่อน',true);return;}
 const data=validate();if(!data){stepTo(2);alertStatus('ข้อมูลยังไม่ครบ กรุณาตรวจสอบอีกครั้ง',true);return;}
 if(Date.now()-started<2500){alertStatus('กรุณาตรวจทานข้อมูลก่อนส่ง',true);return;}
 if(!client){alertStatus('ไม่สามารถโหลดระบบรับข้อมูล โปรดตรวจการเชื่อมต่ออินเทอร์เน็ต',true);return;}
 const btn=q('#send');btn.disabled=true;btn.textContent='กำลังส่งข้อมูล...';
 const id=requestUuid();
 try{
  const row={id,category:data.category,submitter_name:data.submitter_name,submitter_email:data.submitter_email,action:data.action,target_hint:data.target_hint||null,notes:data.note||null,payload:data.payload,consent:true};
  const {error}=await client.from('content_submissions').insert(row);
  if(error)throw error;
  try{localStorage.removeItem(draftsKey);}catch(e){}
  q('#requestID').textContent='Submission ID: '+id;
  stored={};stepTo(4);
 }catch(e){let msg=e.message||String(e);if(/relation|not found|schema cache|permission denied/i.test(msg))msg+=' · โปรดให้ผู้ดูแลรันไฟล์ supabase/setup.sql ก่อนใช้งาน';alertStatus('ส่งข้อมูลไม่สำเร็จ: '+msg,true);}
 finally{btn.disabled=false;btn.textContent='ส่งข้อมูลให้ผู้ดูแล';}
};
q('#sendAnother').onclick=()=>{q('#consent').checked=false;q('#submitNote').value='';q('#targetHint').value='';q('#recordAction').value='add';renderFields();stepTo(1);};
for(const el of document.querySelectorAll('#pane2 input,#pane2 textarea,#pane2 select'))el.addEventListener('change',saveDraft);
try{const draft=JSON.parse(localStorage.getItem(draftsKey)||'null');if(draft&&draft.stored){category=schema.categories[draft.category]?draft.category:'team';stored=draft.stored;q('#submittedBy').value=draft.name||'';q('#submitEmail').value=draft.email||'';q('#recordAction').value=draft.action||'add';q('#targetHint').value=draft.targetHint||'';q('#submitNote').value=draft.note||'';}}catch(e){}
// Main-site v4 deep links pre-select a content type or an update request.
try {
 const deepLink = new URLSearchParams(location.search);
 if (deepLink.get('category') && schema.categories[deepLink.get('category')]) category=deepLink.get('category');
 if (deepLink.get('action')==='update') q('#recordAction').value='update';
} catch(e) { /* ignore invalid URL parameters */ }
renderMemberTypes();renderCategories();renderFields();
})();
