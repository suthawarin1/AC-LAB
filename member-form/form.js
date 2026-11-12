(function(){
'use strict';
const form=document.getElementById('member-form'),status=document.getElementById('status-message');
const submitButton=document.getElementById('submit-button'),picker=document.getElementById('portrait');
const preview=document.getElementById('portrait-preview');const photoURL=document.getElementById('photoURL');
const roleSelect=form.elements.namedItem('group');
const internshipSection=document.getElementById('internship-fields');
const internshipInstitution=document.getElementById('internshipInstitutionEN');
function updateInternshipFields(){const intern=roleSelect.value==='internship';internshipSection.hidden=!intern;internshipInstitution.required=intern;const pos=form.elements.namedItem('positionEN'),posTH=form.elements.namedItem('positionTH');if(intern){if(!pos.value)pos.value='Internship Student';if(!posTH.value)posTH.value='นักศึกษาฝึกงาน';}else{if(pos.value==='Internship Student')pos.value='';if(posTH.value==='นักศึกษาฝึกงาน')posTH.value='';}}
roleSelect.addEventListener('change',updateInternshipFields);updateInternshipFields();
const known=[
 ['arunrat','Arunrat Chaveerach (PI)'],['runglawan','Runglawan Sudmoon (PI)'],
 ['tawatchai','Tawatchai Tanee (PI)'],['yannick','Yannick D. Benoit (Collaborator)'],
 ['shiou-yih','Shiou Yih Lee (Collaborator)'],['nisachon','Nisachon Jangpromma (Collaborator)'],
 ['sakda','Sakda Daduang (Collaborator)'],['joy','Joy (Researcher)'],
 ['angka','Angka (Researcher)'],['researcher-03','Researcher 03 (Researcher)'],
 ['ar','Ar (Student)'],['arnold','Arnold (Student)'],['ja','Ja (Student)']
];
const existing=document.getElementById('existingMemberId');for(const [id,name] of known){const opt=new Option(name,id);existing.append(opt);}
let objectURL=null;
function notify(message,type=''){status.textContent=message;status.className='status-message '+type;}
function safeURL(raw){if(!raw)return '';try{const u=new URL(raw);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}}
function showPicture(url){preview.replaceChildren();if(url){const img=document.createElement('img');img.src=url;img.alt='Your proposed portrait';preview.append(img);}else{const span=document.createElement('span');span.textContent='Photo preview';preview.append(span);}}
picker.addEventListener('change',()=>{if(objectURL)URL.revokeObjectURL(objectURL);const file=picker.files[0];if(!file){showPicture('');return;}if(file.size>5242880||!['image/jpeg','image/png','image/webp'].includes(file.type)){picker.value='';notify('Please select a JPG, PNG or WebP image smaller than 5 MB.','error');showPicture('');return;}document.getElementById('photo-name').textContent=file.name;objectURL=URL.createObjectURL(file);showPicture(objectURL);});
photoURL.addEventListener('change',()=>{if(!picker.files.length){const url=safeURL(photoURL.value);showPicture(url);}});
function values(){const fd=new FormData(form),get=k=>String(fd.get(k)||'').trim();const tags=k=>get(k).split(',').map(x=>x.trim()).filter(Boolean).slice(0,12);const publicEmail=get('publicEmail');
 return {existingMemberId:get('existingMemberId'),group:get('group'),nameEN:get('nameEN'),nameTH:get('nameTH'),academicTitleEN:get('academicTitleEN'),academicTitleTH:get('academicTitleTH'),positionEN:get('positionEN'),positionTH:get('positionTH'),affiliationEN:get('affiliationEN'),affiliationTH:get('affiliationTH'),expertiseEN:tags('expertiseEN'),expertiseTH:tags('expertiseTH'),education:get('education'),bioEN:get('bioEN'),bioTH:get('bioTH'),researchProjects:get('researchProjects'),selectedPublications:get('selectedPublications'),contactEmail:get('contactEmail'),publicEmail,showPublicEmail:fd.has('showPublicEmail')&&Boolean(publicEmail),orcidURL:get('orcidURL'),scholarURL:get('scholarURL'),researchGateURL:get('researchGateURL'),websiteURL:get('websiteURL'),photoURL:get('photoURL'),internshipInstitutionEN:get('internshipInstitutionEN'),internshipProgramEN:get('internshipProgramEN'),internshipSupervisorEN:get('internshipSupervisorEN'),internshipStart:get('internshipStart'),internshipEnd:get('internshipEnd'),internshipProjectEN:get('internshipProjectEN')};}
function validate(){if(!form.reportValidity())return false;const v=values();if(v.group==='internship'&&v.internshipStart&&v.internshipEnd&&v.internshipStart>v.internshipEnd){notify('Internship end date must not be before the start date.','error');return false;}if(v.expertiseEN.length===0){notify('Please enter at least one English expertise keyword.','error');return false;}
for(const key of ['orcidURL','scholarURL','researchGateURL','websiteURL','photoURL'])if(v[key]&&!safeURL(v[key])){notify('Please provide a valid http(s) URL for '+key+'.','error');return false;}
if(document.getElementById('showPublicEmail').checked&&!v.publicEmail){notify('Enter a public email or untick public email publication.','error');return false;}
if((picker.files.length||v.photoURL)&&!document.getElementById('consentPhoto').checked){notify('Please consent to photo publication or remove the photo.','error');return false;}
if(picker.files.length&&v.photoURL){notify('Choose either an uploaded photo or a photo URL, not both.','error');return false;}
return true;}
function review(){if(!validate())return;const data=values();const content=document.getElementById('review-content'),dl=document.createElement('dl');content.replaceChildren();const labels={existingMemberId:'Updating profile',group:'Member category',internshipInstitutionEN:'Home university / college (EN)',internshipProgramEN:'Degree / programme',internshipSupervisorEN:'Lab supervisor',internshipStart:'Internship start',internshipEnd:'Internship end',internshipProjectEN:'Internship project',nameEN:'Name (English)',nameTH:'Name (Thai)',academicTitleEN:'Academic title (EN)',academicTitleTH:'Academic title (TH)',positionEN:'Position (EN)',positionTH:'Position (TH)',affiliationEN:'Affiliation (EN)',affiliationTH:'Affiliation (TH)',expertiseEN:'Expertise (EN)',expertiseTH:'Expertise (TH)',bioEN:'Biography (EN)',bioTH:'Biography (TH)',education:'Education',researchProjects:'Research projects',selectedPublications:'Selected publications',contactEmail:'Private contact email',publicEmail:'Public email',orcidURL:'ORCID',scholarURL:'Scholar',researchGateURL:'ResearchGate',websiteURL:'Website',photoURL:'Photo URL'};
for(const [key,label] of Object.entries(labels)){const value=Array.isArray(data[key])?data[key].join(' · '):data[key];if(!value)continue;const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;dl.append(dt,dd);}content.append(dl);const photo=picker.files[0];if(photo){const p=document.createElement('p');p.textContent='Portrait upload: '+photo.name;content.append(p);}document.getElementById('review-dialog').showModal();}
document.getElementById('review-button').addEventListener('click',review);document.getElementById('close-review').onclick=()=>document.getElementById('review-dialog').close();document.getElementById('confirm-review').onclick=()=>document.getElementById('review-dialog').close();
let busy=false;form.addEventListener('submit',async(e)=>{e.preventDefault();if(busy||!validate())return;const fd=new FormData(form);if(fd.get('companyWebsite'))return;busy=true;submitButton.disabled=true;submitButton.textContent='Submitting…';notify('Saving your submission securely…');let photoPath=null;
try{const db=window.ACLabTeamDB.client(),id=crypto.randomUUID(),photo=picker.files[0];if(photo){const ext=photo.type==='image/png'?'png':photo.type==='image/webp'?'webp':'jpg';photoPath=`incoming/${id}/portrait.${ext}`;const upload=await db.storage.from('aclab-pending-portraits').upload(photoPath,photo,{contentType:photo.type,upsert:false});if(upload.error)throw upload.error;}
const profile=values(),{error}=await db.from('aclab_team_submissions').insert({id,profile,photo_path:photoPath,consent_publish:true,consent_photo:fd.has('consentPhoto')});if(error)throw error;
form.reset();updateInternshipFields();if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}showPicture('');document.getElementById('photo-name').textContent='JPG, PNG or WebP · max 5 MB';notify('Submission received! Your profile is pending administrator review. It is not publicly visible.','success');window.scrollTo({top:0,behavior:'smooth'});
}catch(err){notify('Submission failed: '+(err.message||'Please retry or contact the lab manager.')+' Your information was not approved or published.','error');}
finally{busy=false;submitButton.disabled=false;submitButton.innerHTML='Submit for approval <span aria-hidden="true">↗</span>';}});
})();
