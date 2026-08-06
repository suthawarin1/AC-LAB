let admTextFilter='';
let admTextColorVal='';
function admTextRowsHtml(){
  buildTextRegistry();
  const keys=Object.keys(TEXT_REGISTRY).sort((a,b)=>{
    const sa=TEXT_REGISTRY[a].section,sb=TEXT_REGISTRY[b].section;
    if(sa!==sb)return sa<sb?-1:1;
    return a<b?-1:1;
  });
  const term=admTextFilter.toLowerCase();
  const filtered=keys.filter(k=>{
    if(!term)return true;
    const r=TEXT_REGISTRY[k];
    return (k+' '+r.section+' '+r.defaultEn+' '+r.defaultTh).toLowerCase().includes(term);
  });
  if(!filtered.length)return `<p style="font-size:.85rem;color:var(--muted)">${lang==='th'?'ไม่พบข้อความที่ตรงกับการค้นหา':'No matching text found.'}</p>`;
  let lastSec='';
  return filtered.map(k=>{
    const r=TEXT_REGISTRY[k];
    const ov=TEXT_OVERRIDES[k];
    const preview=((ov&&ov.en)||r.defaultEn||'').replace(/<[^>]+>/g,'');
    let head='';
    if(r.section!==lastSec){lastSec=r.section;head=`<div class="adm-section-t">${esc(r.section)}</div>`;}
    return head+`<div class="adm-row"><span class="mono-av" style="background:${hue(k)}">${icon('i-doc')}</span><div class="r-main"><h4>${esc(k)}</h4><div class="r-sub">${esc(preview.slice(0,70))}${ov?(lang==='th'?' · แก้ไขแล้ว':' · edited'):''}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditText('${k}')">${icon('i-doc')}</button>${ov?`<button class="adm-ic del" onclick="admResetText('${k}')">${icon('i-close')}</button>`:''}</div></div>`;
  }).join('');
}
function admTextList(){
  return `<div class="data-card"><h4>${icon('i-spark')} ${lang==='th'?'ข้อความและหัวข้อทั่วเว็บไซต์':'Sitewide text &amp; headings'}</h4><p>${lang==='th'?'แก้ไขหัวข้อ คำโปรย และข้อความสั้นๆ ที่ปรากฏทั่วเว็บไซต์ได้ที่นี่ พร้อมปรับสี น้ำหนักตัวอักษร (ความเข้ม) และระยะห่างตัวอักษร (การเว้น) ของแต่ละข้อความได้เอง รองรับ HTML พื้นฐาน เช่น &lt;span&gt; หรือ &lt;em&gt;':'Edit headings, taglines and short copy used across the site — and adjust each one\u2019s color, font weight and letter spacing. Supports simple HTML such as &lt;span&gt; or &lt;em&gt;.'}</p></div>  <div class="pub-search" style="margin-bottom:14px"><svg class="icon"><use href="#i-search"/></svg><input type="text" id="admTextSearch" value="${esc(admTextFilter)}" oninput="admTextFilter=this.value;el('admTextRows').innerHTML=admTextRowsHtml()" placeholder="${lang==='th'?'ค้นหาข้อความหรือคีย์…':'Search text or key…'}"></div>
  <div id="admTextRows">${admTextRowsHtml()}</div>`;
}
window.admEditText=function(k){
  const r=TEXT_REGISTRY[k];const ov=TEXT_OVERRIDES[k]||{};
  admTextColorVal=ov.color||'';
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('text')">${icon('i-arrow')} Back</span>
  <div class="data-card"><h4>${icon('i-doc')} ${esc(k)}</h4><p>${esc(r.section)}</p></div>
  <div class="adm-form">
    <div class="adm-field"><label>English</label><textarea id="tx_ov_en" style="min-height:90px"></textarea></div>
    <div class="adm-field"><label>Thai / ไทย</label><textarea id="tx_ov_th" style="min-height:90px"></textarea></div>
    <div class="adm-section-t">${lang==='th'?'สไตล์ของข้อความนี้':'Style for this text'}</div>
    <div class="adm-2">
      <div class="adm-field">
        <label>${lang==='th'?'สีตัวอักษร':'Text color'}</label>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="color" id="tx_color" value="${ov.color||'#2f6b4f'}" style="width:48px;height:40px;padding:2px;border-radius:8px;flex:none" oninput="admTextColorVal=this.value;el('tx_colorLbl').textContent=this.value">
          <button type="button" class="adm-file" onclick="admTextColorVal='';el('tx_colorLbl').textContent='${lang==='th'?'ค่าเริ่มต้น':'Default'}'">${lang==='th'?'ใช้ค่าเริ่มต้น':'Use default'}</button>
        </div>
        <div class="r-sub" id="tx_colorLbl" style="margin-top:6px">${ov.color?ov.color:(lang==='th'?'ค่าเริ่มต้น':'Default')}</div>
      </div>
      <div class="adm-field">
        <label>${lang==='th'?'น้ำหนักตัวอักษร (ความเข้ม)':'Font weight'}</label>
        <select id="tx_weight">
          <option value="">${lang==='th'?'ค่าเริ่มต้น':'Default'}</option>
          <option value="300">${lang==='th'?'บาง (Light)':'Light'}</option>
          <option value="400">${lang==='th'?'ปกติ (Regular)':'Regular'}</option>
          <option value="500">${lang==='th'?'กลาง (Medium)':'Medium'}</option>
          <option value="600">${lang==='th'?'กึ่งหนา (Semibold)':'Semibold'}</option>
          <option value="700">${lang==='th'?'หนา (Bold)':'Bold'}</option>
        </select>
      </div>
    </div>
    <div class="adm-field">
      <label>${lang==='th'?'ระยะห่างตัวอักษร (การเว้น)':'Letter spacing'}</label>
      <div style="display:flex;align-items:center;gap:12px">
        <input type="range" id="tx_spacing" min="-1" max="6" step="0.5" style="flex:1" oninput="el('tx_spacingLbl').textContent=this.value+'px'">
        <span id="tx_spacingLbl" class="mono" style="width:48px;text-align:right;font-size:11px;color:var(--muted)"></span>
      </div>
    </div>
    <div class="data-card"><h4>${icon('i-globe')} ${lang==='th'?'ค่าเริ่มต้น':'Default text'}</h4><p style="font-family:var(--mono);font-size:11px">EN: ${esc(r.defaultEn)}<br>${r.defaultTh?('TH: '+esc(r.defaultTh)):''}</p></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('text')">Cancel</button><button class="btn btn--primary" onclick="admSaveText('${k}')">${icon('i-check')} Save</button></div>
    ${(ov.en||ov.th||ov.color||ov.weight||ov.spacing)?`<button class="adm-add" style="margin-top:10px;color:#e05656" onclick="admResetText('${k}')">${icon('i-close')} ${lang==='th'?'ล้างทุกการแก้ไขของข้อความนี้':'Reset this text completely'}</button>`:''}
  </div>`;
  el('tx_ov_en').value=ov.en||'';el('tx_ov_th').value=ov.th||'';
  el('tx_weight').value=ov.weight||'';
  el('tx_spacing').value=ov.spacing!=null?ov.spacing:0;
  el('tx_spacingLbl').textContent=(ov.spacing!=null?ov.spacing:0)+'px';
};
window.admSaveText=function(k){
  const en=val('tx_ov_en').trim(),th=val('tx_ov_th').trim();
  const color=admTextColorVal||'';
  const weight=val('tx_weight')||'';
  const spacing=+val('tx_spacing')||0;
  if(!en&&!th&&!color&&!weight&&!spacing){delete TEXT_OVERRIDES[k];}
  else{
    const item={};
    if(en)item.en=en;
    if(th)item.th=th;
    if(color)item.color=color;
    if(weight)item.weight=weight;
    if(spacing)item.spacing=spacing;
    TEXT_OVERRIDES[k]=item;
  }
  saveStore();applyLang();renderAdmin('text');
};
window.admResetText=function(k){
  delete TEXT_OVERRIDES[k];
  saveStore();applyLang();renderAdmin('text');
};

const PROF_IMG="assets/media/professor-arunrat.jpg";

/* ============ DATA ============ */
let THEMES=[
  {icon:'i-leaf',title:'Plant genomics',desc:'We decode complete chloroplast genomes and reconstruct evolutionary relationships using next-generation sequencing — turning raw reads into annotated plastomes and phylogenetic trees.',tags:['NGS','Plastome assembly','Phylogenetics','DNA barcoding']},
  {icon:'i-flask',title:'Phytochemistry',desc:'We isolate and identify the bioactive compounds that medicinal plants produce, resolving their chemical structures and quantifying them across species and tissues.',tags:['Extraction','HPLC','Structure ID','Resveratrol']},
  {icon:'i-cell',title:'Biomedical testing',desc:'We put plant compounds to work against human cell lines — screening for cytotoxicity, measuring anticancer potential and tracing the molecular mechanisms behind the effect.',tags:['Cytotoxicity','Cancer cells','Gene expression','Mechanism']}
];
let PIPE=[
  {no:'01',icon:'i-plant',title:'Collect',desc:'Field collection with properly vouchered herbarium specimens.'},
  {no:'02',icon:'i-dna',title:'Sequence',desc:'NGS library prep and chloroplast genome sequencing.'},
  {no:'03',icon:'i-wave',title:'Assemble',desc:'Plastome assembly, annotation and phylogenetic placement.'},
  {no:'04',icon:'i-flask',title:'Extract',desc:'Phytochemical extraction and HPLC compound profiling.'},
  {no:'05',icon:'i-cell',title:'Test',desc:'Cytotoxicity and bioassays on human cancer cell lines.'}
];
let TAXA=[
  {sp:'Cratoxylum formosum',en:'Hypericaceae · resveratrol source',acc:'CP · 157,204 bp',img:'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop',desc:'A rich, newly-recognised source of resveratrol. We characterised its plastid genome and tested its extracts on normal and cancer cells.'},
  {sp:'Barleria',en:'Acanthaceae · model plastome',acc:'CP · first assembly',img:'https://images.unsplash.com/photo-1470509037663-253afd7f0f51?q=80&w=800&auto=format&fit=crop',desc:'The genus behind our first NGS project in 2018 — the chloroplast genome that put the lab on the genomics map.'},
  {sp:'Morinda citrifolia',en:'Rubiaceae · noni',acc:'Leaf extract study',img:'https://images.unsplash.com/photo-1615485925600-97237c4fc1ec?q=80&w=800&auto=format&fit=crop',desc:'Better known as noni. We investigated how its leaf extracts influence collagen type II synthesis through gene expression.'}
];
let FACILITIES=[
  {icon:'i-dna',title:'Molecular lab',spec:'PCR · Gel doc · NGS prep'},
  {icon:'i-flask',title:'Extraction suite',spec:'Rotary evaporator · HPLC'},
  {icon:'i-cell',title:'Cell culture',spec:'Biosafety Level 2'},
  {icon:'i-scope',title:'Microscopy',spec:'Fluorescence · SEM'}
];
let TIMELINE=[
  {yr:'2024',title:'Biomedical expansion',desc:'Opened a collaboration with the Faculty of Medicine to bring plant chemistry into cancer research.'},
  {yr:'2018',title:'First NGS project',desc:'Sequenced and assembled the <em>Barleria</em> chloroplast genome — our entry into genomics.'},
  {yr:'2010',title:'The lab is founded',desc:'Established by Prof. Dr. Arunrat Chaveerach at the Faculty of Science.'}
];
let CPUBS=[];
let PUBS=[
  {id:1,year:'2024',topic:['biomed','phyto'],title:'A new source and large quantity of resveratrol in Cratoxylum species and their activities on normal human and cancer cells',authors:'Kaewdaungdee S., Chaveerach A., et al.',journal:'Biology',link:'#',abstract:'Reports Cratoxylum as an unexpectedly abundant source of resveratrol and examines how the extracts behave against both normal human cells and cancer cell lines.',feat:true},
  {id:2,year:'2023',topic:['biomed','phyto'],title:'Investigation of Morinda citrifolia activity related to collagen type II synthesis through gene expression',authors:'Ameamsri N., Sudmoon R., Tanee T., Chaveerach A.',journal:'HAYATI Journal of Biosciences',link:'#',abstract:'Explores how leaf extracts of Morinda citrifolia (noni) influence the expression of genes involved in collagen type II synthesis.'},
  {id:3,year:'2023',topic:['phyto'],title:'High inhibition efficacy of pancreatic cholesterol esterase and porcine pancreatic lipase from natural products',authors:'Sudmoon R., Chaveerach A., et al.',journal:'Asian Journal of Agriculture & Biology',link:'#',abstract:'Screens a panel of medicinal plants for their ability to inhibit digestive enzymes linked to lipid and cholesterol metabolism.'},
  {id:4,year:'2022',topic:['genomics'],title:'Characterization of the plastid genome of Cratoxylum species (Hypericaceae)',authors:'Sudmoon R., Chaveerach A., et al.',journal:'Scientific Reports',link:'#',abstract:'Presents a structural analysis of the Cratoxylum chloroplast genome, yielding new molecular markers for the genus.'}
];
let MEMBERS=[
  {group:'lead',en:'Prof. Dr. Arunrat Chaveerach',th:'ศ. ดร. อรุณรัตน์ ฉวีราช',img:PROF_IMG,pi:true,tags:['Molecular systematics','Phytochemistry','Toxicity testing','Green nanotech','Drug delivery','qRT-PCR','Innovation & IP']},
  {group:'co',en:'Assoc. Prof. Dr. Tawatchai Tanee',th:'รศ. ดร. ธวัดชัย ธานี',img:'assets/media/team/tawatchai-tanee.jpg',tags:['Environmental science','Biochemistry']},
  {group:'co',en:'Prof. Dr. Sakda Daduang',th:'ศ. ดร. ศักดา ดาดวง',img:'assets/media/team/sakda-daduang.jpg',tags:['Biochemistry','Immunological biochem','Animal cell culture','Toxicology','Proteomics','Biotechnology']},
  {group:'co',en:'Dr. Sanit Kaewdaungdee',th:'ดร. สานิตย์ แก้วดวงดี',img:'assets/media/team/sanit-kaewdaungdee.jpg',tags:['Plant systematics','Chloroplast genome','Secondary metabolites','Nutraceuticals','Molecular biology','Cell culture','Organoids']},
  {group:'co',en:'Asst. Prof. Dr. Runglawan Sudmoon',th:'ผศ. ดร. รุ่งลาวัลย์ สุดมูล',img:'assets/media/team/runglawan-sudmoon.jpg',tags:['Biochemistry','Molecular biology','Forensic science']},
  {group:'co',en:'Asst. Prof. Dr. Nisachon Jangpromma',th:'ผศ. ดร. นิศาชล แจ้งพรมมา',img:'assets/media/team/nisachon-jangpromma.jpg',tags:['Molecular biology','Biochemistry','Proteomics','Cell culture','Biological function']},
  {group:'intl',en:'Prof. Dr. Shiou Yih Lee',th:'',img:'assets/media/team/shiou-yih-lee.jpg',tags:['Forest biotechnology','Plant phylogenetics','Systematics & evolution','Molecular breeding','Wood forensic']},
  {group:'intl',en:'Assoc. Prof. Dr. Yannick D. Benoit',th:'',img:'assets/media/team/yannick-benoit.jpg',tags:['Molecular biology','Epigenetics','Cancer','Pharmacology','Digestive system']}
];
const BIOS={
 'Prof. Dr. Arunrat Chaveerach':'Founder and director of the lab (2010). Leads the integrated programme spanning molecular systematics, phytochemistry, toxicity testing and green-nanotechnology drug delivery, and oversees analysis, publication, funding and intellectual-property registration.',
 'Assoc. Prof. Dr. Tawatchai Tanee':'Contributes expertise in environmental science and biochemistry, supporting the ecological and biochemical dimensions of the programme.',
 'Prof. Dr. Sakda Daduang':'Specialist in biochemistry, immunological biochemistry, animal cell-culture technology, toxicology, proteomics and biotechnology.',
 'Dr. Sanit Kaewdaungdee':'Works on plant systematics, chloroplast genomes and plant secondary metabolites, extending into nutraceuticals, molecular biology, cell culture and organoids, and helps supervise and analyse the research.',
 'Asst. Prof. Dr. Runglawan Sudmoon':'Brings together biochemistry, molecular biology and forensic science across the analytical work of the programme.',
 'Asst. Prof. Dr. Nisachon Jangpromma':'Expertise in molecular biology, biochemistry, proteomics, cell culture and biological function.',
 'Prof. Dr. Shiou Yih Lee':'International collaborator in forest biotechnology and plant molecular phylogenetics, systematics and evolution, molecular breeding and wood forensics.',
 'Assoc. Prof. Dr. Yannick D. Benoit':'International collaborator in molecular biology, epigenetics, cancer, pharmacology and the digestive system.'
};
MEMBERS.push(
 {group:'postdoc',en:'Postdoctoral Researcher',th:'นักวิจัยหลังปริญญาเอก',img:'',tags:['Add expertise'],bio:'Placeholder profile — open the admin panel (gear icon, lower-left) to add the post-doc\u2019s name, photo and bio.'},
 {group:'phd',en:'PhD Student (1)',th:'นักศึกษาปริญญาเอก',img:'',tags:['Plant genomics'],bio:'Placeholder PhD student. Replace with a real profile from the admin panel.'},
 {group:'phd',en:'PhD Student (2)',th:'นักศึกษาปริญญาเอก',img:'',tags:['Phytochemistry'],bio:'Placeholder PhD student. Replace with a real profile from the admin panel.'},
 {group:'master',en:'Master\u2019s Student (1)',th:'นักศึกษาปริญญาโท',img:'',tags:['Cell culture'],bio:'Placeholder MSc student. Editable via the admin panel.'},
 {group:'master',en:'Master\u2019s Student (2)',th:'นักศึกษาปริญญาโท',img:'',tags:['Molecular biology'],bio:'Placeholder MSc student. Editable via the admin panel.'},
 {group:'intern',en:'Research Intern (1)',th:'นักศึกษาฝึกงาน',img:'',tags:['Lab techniques'],bio:'Placeholder intern. Editable via the admin panel.'},
{group:'intern',en:'Research Intern (2)',th:'นักศึกษาฝึกงาน',img:'',tags:['Field sampling'],bio:'Placeholder intern. Editable via the admin panel.'},
 {group:'alumni-phd',en:'PhD Alumnus (2023)',th:'ศิษย์เก่า ปริญญาเอก (2566)',img:'',tags:['Now: Researcher, Dept. of Agriculture'],bio:'Placeholder alumni profile — open the admin panel to add the graduate\u2019s name, current position and story.'},
 {group:'alumni-master',en:'Master\u2019s Alumnus (2022)',th:'ศิษย์เก่า ปริญญาโท (2565)',img:'',tags:['Now: QC Scientist, CPF'],bio:'Placeholder alumni profile — open the admin panel to add the graduate\u2019s name, current position and story.'}
);let GRANT_TEAM=[
  // นำโดย ศ.ดร.อรุณรัตน์ (ดูประวัติเต็มได้ใน "The researchers behind the programme" ด้านบนแล้ว)
  // เพิ่มผู้ร่วมวิจัยไทย (intl:false) หรือต่างประเทศ (intl:true) ได้จากแผงแอดมิน
];let INNOV=[
  {no:'01',icon:'i-dna',title:'Molecular biology',titleTh:'ชีววิทยาโมเลกุล',desc:'Gene-expression analysis, qRT-PCR and enzyme assays to read plant bioactivity at the level of the gene.',descTh:'การวิเคราะห์การแสดงออกของยีน qRT-PCR และเอนไซม์แอสเซย์ เพื่ออ่านฤทธิ์ทางชีวภาพของพืชในระดับยีน'},
  {no:'02',icon:'i-scholar',title:'Multi-omics technology',titleTh:'เทคโนโลยีมัลติโอมิกส์',desc:'Integrating genomics, transcriptomics, proteomics and metabolomics into one high-resolution picture of each plant.',descTh:'ผสานจีโนมิกส์ ทรานสคริปโตมิกส์ โปรตีโอมิกส์ และเมตาโบโลมิกส์ เป็นภาพความละเอียดสูงของพืชแต่ละชนิด'},
  {no:'03',icon:'i-spark',title:'Green nano-delivery',titleTh:'นาโนระบบนำส่งสีเขียว',desc:'Eco-friendly nanoparticle carriers and encapsulation that deliver plant compounds safely and effectively.',descTh:'ตัวพาอนุภาคนาโนที่เป็นมิตรกับสิ่งแวดล้อมและการเอนแคปซูเลต เพื่อนำส่งสารจากพืชอย่างปลอดภัยและได้ผล'},
  {no:'04',icon:'i-cell',title:'Bioactivity mechanisms',titleTh:'กลไกการออกฤทธิ์',desc:'Decoding how compounds act on human cells — from cancer to the digestive system — to prove therapeutic potential.',descTh:'ถอดรหัสว่าสารออกฤทธิ์ทำงานกับเซลล์มนุษย์อย่างไร ตั้งแต่มะเร็งจนถึงระบบทางเดินอาหาร เพื่อพิสูจน์ศักยภาพการรักษา'},
  {no:'05',icon:'i-doc',title:'IP & products',titleTh:'ทรัพย์สินทางปัญญาและผลิตภัณฑ์',desc:'Turning results into registered innovations — medicine, supplements, cosmetics, food — protected by petty patents and patents.',descTh:'แปลงผลวิจัยเป็นนวัตกรรมที่ขึ้นทะเบียน — ยา อาหารเสริม เครื่องสำอาง อาหาร — คุ้มครองด้วยอนุสิทธิบัตรและสิทธิบัตร'}
];
let IP_ASSETS=[
  {
    "no": "01",
    "formula": "ผลิตภัณฑ์โอลีเอไมด์ในน้ำมันรำข้าว",
    "formulaEn": "Rice-bran-oil oleamide product",
    "kind": "petty-granted",
    "number": "19554",
    "date": "30 มีนาคม 2565",
    "tradeName": "Nat OleA",
    "registration": "เลขสารบบอาหาร อย. 20-1-13451-5-0086 · 3 กุมภาพันธ์ 2564"
  },
  {
    "no": "02",
    "formula": "สูตรซีรั่มบำรุงเส้นผมและหนังศีรษะ",
    "formulaEn": "Hair and scalp nourishing serum formula",
    "kind": "patent-application",
    "number": "2001000059",
    "date": "15 พฤศจิกายน 2562",
    "tradeName": "Nat Hair Serum",
    "registration": "ใบรับจดแจ้ง 20-1-6400028970 · 1 กรกฎาคม 2567"
  },
  {
    "no": "03",
    "formula": "สูตรแชมพูสระผม",
    "formulaEn": "Shampoo formula",
    "kind": "petty-granted",
    "number": "21065",
    "date": "7 มีนาคม 2566",
    "tradeName": "Nat Hair Shampoo",
    "registration": "ใบรับจดแจ้ง 20-1-6400028990 · 2 สิงหาคม 2564"
  },
  {
    "no": "04",
    "formula": "สูตรสารสกัดต้านการอักเสบสำหรับแผลที่ผิวหนัง",
    "formulaEn": "Anti-inflammatory extract formula for skin wounds",
    "kind": "petty-granted",
    "number": "25893",
    "date": "30 มิถุนายน 2563",
    "tradeName": "Nat Amy",
    "registration": "ใบรับจดแจ้ง 20-1-6400036317 · 22 กันยายน 2564"
  },
  {
    "no": "05",
    "formula": "ผลิตภัณฑ์ลดความอยากอาหารและคอเลสเตอรอล",
    "formulaEn": "Appetite- and cholesterol-reducing product",
    "kind": "petty-granted",
    "number": "23068",
    "date": "20 ธันวาคม 2564",
    "tradeName": "Nat OneC",
    "registration": "เลขสารบบอาหาร อย. 20-1-13451-5-0101 · 14 ธันวาคม 2564"
  },
  {
    "no": "06",
    "formula": "สูตรสมุนไพรเสริมสร้างคอลลาเจน",
    "formulaEn": "Herbal collagen-support formula",
    "kind": "petty-granted",
    "number": "26211",
    "date": "21 สิงหาคม 2568",
    "tradeName": "Wonwi",
    "registration": "เลขสารบบอาหาร อย. 20-1-13451-5-0110 · 23 มีนาคม 2565"
  },
  {
    "no": "07",
    "formula": "สูตรครีมกันแดดที่มีส่วนประกอบผลยอและใบมะหาด",
    "formulaEn": "Sunscreen formula containing noni fruit and lakoocha leaves",
    "kind": "petty-application",
    "number": "2303000724",
    "date": "14 มีนาคม 2566",
    "tradeName": "EPA Sunscreen",
    "registration": "ใบรับจดแจ้ง 40-1-6700006088 · 22 กุมภาพันธ์ 2567"
  },
  {
    "no": "08",
    "formula": "เจลล้างหน้าจากสารสกัดพืช",
    "formulaEn": "Plant-extract facial cleansing gel",
    "kind": "petty-application",
    "number": "2403002488",
    "date": "8 สิงหาคม 2567",
    "tradeName": "EPC Cleansing Gel",
    "registration": "ใบรับจดแจ้ง 40-16700005985 · 21 กุมภาพันธ์ 2567"
  },
  {
    "no": "09",
    "formula": "สูตรส่วนผสมยาระบาย มะขาม : มะขามแขก",
    "formulaEn": "Laxative blend: tamarind and senna",
    "kind": "petty-application",
    "number": "2403002602",
    "date": "16 สิงหาคม 2567",
    "tradeName": "Nat Lax",
    "registration": "ทะเบียนยา G 481/2568 · ผลิตจากใบและฝักมะขามแขก"
  },
  {
    "no": "10",
    "formula": "ผงปรุงรสต้มยำ ลดเค็ม",
    "formulaEn": "Reduced-sodium tom yum seasoning powder",
    "kind": "petty-application",
    "number": "2503003888",
    "date": "3 ตุลาคม 2568",
    "tradeName": "",
    "registration": ""
  },
  {
    "no": "11",
    "formula": "ผงปรุงรสแกงจืด ลดเค็ม",
    "formulaEn": "Reduced-sodium clear-soup seasoning powder",
    "kind": "petty-application",
    "number": "2503003886",
    "date": "3 ตุลาคม 2568",
    "tradeName": "",
    "registration": ""
  },
  {
    "no": "12",
    "formula": "สูตรส่วนผสมสำหรับแคปซูลที่มีสารสกัดใบกระทุ่มเนินและสารสกัดผักบุ้ง",
    "formulaEn": "Capsule formula with Kratum Noen leaf and water-spinach extracts",
    "kind": "patent-application",
    "number": "2501001075",
    "date": "19 กุมภาพันธ์ 2568",
    "tradeName": "RhynoleA",
    "registration": "ดำเนินการจดทะเบียนยา โดย PharmCare Pharmaceutical คณะเภสัชศาสตร์ มหาวิทยาลัยมหาสารคาม"
  },
  {
    "no": "13",
    "formula": "สูตรส่วนผสมสำหรับแคปซูลที่มีส่วนผสมของเพชรสังฆาตและส้มแขก",
    "formulaEn": "Capsule formula containing Cissus quadrangularis and Garcinia",
    "kind": "patent-application",
    "number": "2601003650",
    "date": "24 พฤษภาคม 2569",
    "tradeName": "",
    "registration": ""
  }
];
let COLLABS=[
  {flag:'https://flagcdn.com/w160/us.png',cc:'USA',name:'University of Washington',desc:'Primate genetics and global health at the Center for Global Field Study.',tags:['Genetics','Primatology']},
  {flag:'https://flagcdn.com/w160/be.png',cc:'Belgium',name:'KU Leuven',desc:'Joint work in toxicology and pharmacology, focused on ion-channel inhibitors.',tags:['Toxicology','Pharmacology']},
  {flag:'https://flagcdn.com/w160/cn.png',cc:'China',name:'Chinese Academy of Sciences',desc:'Plant taxonomy and evolution with the South China Botanical Garden.',tags:['Botany','Evolution']}
];
let ROAD=[
  {no:'1',title:'Reach out to the PI',desc:'Send your CV and a short statement of research interests to Prof. Dr. Arunrat to discuss possible topics.'},
  {no:'2',title:'Apply formally',desc:'Submit through the KKU Graduate School portal and check which scholarships you qualify for.'},
  {no:'3',title:'Interview',desc:'Meet the faculty committee — online or in person — and get to know the current lab members.'}
];
let RESOURCES=[
  {icon:'i-doc',title:'Lab safety manual',titleTh:'คู่มือความปลอดภัยในแล็บ',meta:'Updated 2024 · PDF',metaTh:'อัปเดต 2024 · PDF',link:''},
  {icon:'i-doc',title:'Equipment request form',titleTh:'แบบฟอร์มขอใช้เครื่องมือ',meta:'Form 01-B · DOCX',metaTh:'แบบฟอร์ม 01-B · DOCX',link:''},
  {icon:'i-book',title:'Thesis template',titleTh:'เทมเพลตวิทยานิพนธ์',meta:'KKU format · DOCX',metaTh:'รูปแบบ มข. · DOCX',link:''}
];
let NEWS=[
  {id:1,title:'Best presentation award 2024',date:'15 Jan 2024',img:'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop',body:'<p>We are proud to share that <strong>Ms. Suda</strong> received the Best Oral Presentation Award at the International Conference on Biodiversity. Her work on <em>Barleria</em> genomics impressed the judges with its depth and clarity.</p><p>The award recognises months of careful sequencing and analysis, and a talk that made a complex genome accessible to a broad audience.</p>'},
  {id:2,title:'New sequencing capacity installed',date:'20 Dec 2023',img:'https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=1200&auto=format&fit=crop',body:'<p>The lab has upgraded to the latest sequencing technology, allowing <strong>faster and more accurate</strong> chloroplast genome assembly.</p><p>The new capacity shortens the path from sample to finished plastome, freeing students to spend more time on analysis and interpretation.</p>'},
  {id:3,title:'Field trip: Phu Kradueng',date:'10 Nov 2023',img:'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop',body:'<p>Our annual sample-collection trip took the team into the field, where we gathered over <strong>50 species</strong> for the DNA barcoding project.</p><p>Every specimen was carefully vouchered — the first, essential step in the pipeline that turns a plant in the wild into a genome on the screen.</p>'}
];
let PRODUCTS=[
  {name:'Nat Rhynole',nameTh:'แนท ไรนอลเอ',type:'Sleep support',typeTh:'ช่วยการนอนหลับ',c1:'#1e2f74',c2:'#3d5cd6',icon:'i-moon',img:'',
   benefit:'A capsule supplement developed to help improve sleep quality.',benefitTh:'ผลิตภัณฑ์เสริมอาหารชนิดแคปซูล ช่วยเพิ่มคุณภาพการนอนหลับ',
   ingredients:'Ipomoea aquatica extract 250 mg · Mitragyna rotundifolia extract 250 mg',size:'20 capsules · 500 mg',price:''},
  {name:'Nat EPA Sunscreen',nameTh:'แนท อีพีเอ ซันสกรีน',type:'Sunscreen · SPF50+ PA++++',typeTh:'กันแดด SPF50+ PA++++',c1:'#2f7d43',c2:'#67bd78',icon:'i-sun',img:'',
   benefit:'Broad-spectrum daily sun protection blended with plant-derived actives.',benefitTh:'ครีมกันแดดปกป้องผิวจากรังสี ผสมสารสกัดจากพืช',
   ingredients:'Zinc oxide · Titanium dioxide · Morinda citrifolia · Artocarpus lakoocha extract',size:'50 ml',price:''},
  {name:'Nat Hair Serum',nameTh:'แนท แฮร์ เซรั่ม',type:'Hair & scalp care',typeTh:'บำรุงเส้นผมและหนังศีรษะ',c1:'#3a3f47',c2:'#6b7280',icon:'i-spark',img:'',
   benefit:'A nourishing serum for hair and scalp, developed from KKU-SCI research.',benefitTh:'เซรั่มบำรุงเส้นผมและหนังศีรษะ พัฒนาจากงานวิจัย KKU-SCI',
   ingredients:'Plant-derived actives from lab research',size:'50 ml',price:'฿1,190'},
  {name:'Nat EPC Cleansing Gel',nameTh:'แนท อีพีซี เจลล้างหน้า',type:'Facial cleanser',typeTh:'เจลทำความสะอาดผิวหน้า',c1:'#1f7ab0',c2:'#63c2e6',icon:'i-wave',img:'',
   benefit:'A gentle daily facial cleansing gel for all skin types.',benefitTh:'เจลทำความสะอาดผิวหน้าสูตรอ่อนโยน ใช้ได้ทุกสภาพผิว',
   ingredients:'Morinda citrifolia · Camellia sinensis · Aloe vera leaf extract',size:'100 ml',price:''},
  {name:'Nat OneC',nameTh:'แนท วันซี',type:'Dietary supplement',typeTh:'ผลิตภัณฑ์เสริมอาหาร',c1:'#2f5d3a',c2:'#5f9d5f',icon:'i-leaf',img:'',
   benefit:'A plant-based dietary supplement in capsule form.',benefitTh:'ผลิตภัณฑ์เสริมอาหารจากพืชชนิดแคปซูล',
   ingredients:'Water spinach powder 200 mg · Tea powder 150 mg · Garcinia powder 150 mg',size:'90 capsules · 54 g',price:''},
  {name:'Nat WonWi',nameTh:'แนท วันวิ',type:'Dietary supplement',typeTh:'ผลิตภัณฑ์เสริมอาหาร',c1:'#c9971f',c2:'#e8c65a',icon:'i-plant',img:'',
   benefit:'A plant-based dietary supplement in capsule form.',benefitTh:'ผลิตภัณฑ์เสริมอาหารจากพืชชนิดแคปซูล',
   ingredients:'Noni powder 250 mg · Mulberry leaf powder 150 mg · Centella powder 100 mg',size:'60 capsules · 36 g',price:''},
  {name:'Nat OleA',nameTh:'แนท โอลีเอ',type:'Dietary supplement',typeTh:'ผลิตภัณฑ์เสริมอาหาร',c1:'#7a5a2c',c2:'#c9a15c',icon:'i-leaf',img:'',
   benefit:'A rice-bran-oil oleamide product developed from protected laboratory research.',benefitTh:'ผลิตภัณฑ์โอลีเอไมด์ในน้ำมันรำข้าว ต่อยอดจากงานวิจัยที่ได้รับการคุ้มครอง',
   ingredients:'Oleamide in rice bran oil',size:'',price:''},
  {name:'Nat Hair Shampoo',nameTh:'แนท แฮร์ แชมพู',type:'Hair & scalp care',typeTh:'ดูแลเส้นผมและหนังศีรษะ',c1:'#30424b',c2:'#6c8792',icon:'i-wave',img:'',
   benefit:'A shampoo formula protected by petty patent and developed for hair care.',benefitTh:'สูตรแชมพูสระผมที่ได้รับอนุสิทธิบัตรและต่อยอดเพื่อดูแลเส้นผม',
   ingredients:'Protected shampoo formula',size:'',price:''},
  {name:'Nat Amy',nameTh:'แนท เอมี',type:'Skin care',typeTh:'ผลิตภัณฑ์ดูแลผิว',c1:'#7b3f54',c2:'#c47c96',icon:'i-spark',img:'',
   benefit:'A skin-care innovation based on an anti-inflammatory extract formula.',benefitTh:'นวัตกรรมดูแลผิวจากสูตรสารสกัดต้านการอักเสบสำหรับแผลที่ผิวหนัง',
   ingredients:'Plant-derived anti-inflammatory extract',size:'',price:''},
  {name:'Nat Lax',nameTh:'แนท แลกซ์',type:'Registered herbal medicine',typeTh:'ยาสมุนไพรขึ้นทะเบียน',c1:'#476b34',c2:'#8fad68',icon:'i-plant',img:'',
   benefit:'A registered herbal laxative developed from tamarind and senna.',benefitTh:'ยาสมุนไพรระบายจากมะขามและมะขามแขก ได้รับเลขทะเบียนยา G 481/2568',
   ingredients:'Tamarind · Senna leaves and pods',size:'',price:''}
];
let VIDEOS=[
  {cat:'intro',title:'Welcome to AC Lab',titleTh:'แนะนำ AC Lab',desc:'A short tour of who we are, what we study, and the questions that drive the lab.',descTh:'ทัวร์สั้นๆ ว่าเราเป็นใคร ศึกษาอะไร และคำถามที่ขับเคลื่อนแล็บ',yt:'',c1:'#20583f',c2:'#3f8f66'},
  {cat:'tutorial',title:'From plant to plastome',titleTh:'จากพืชสู่จีโนมคลอโรพลาสต์',desc:'How a field sample becomes an assembled, annotated chloroplast genome.',descTh:'ตัวอย่างภาคสนามกลายเป็นจีโนมคลอโรพลาสต์ที่ประกอบและใส่คำอธิบายได้อย่างไร',yt:'',c1:'#8a5f1f',c2:'#c69a3e'},
  {cat:'tutorial',title:'Phytochemistry: HPLC basics',titleTh:'เคมีพฤกษ์: พื้นฐาน HPLC',desc:'A quick walkthrough of our compound extraction and HPLC analysis workflow.',descTh:'อธิบายขั้นตอนการสกัดสารและการวิเคราะห์ด้วย HPLC แบบรวบรัด',yt:'',c1:'#1e4f96',c2:'#4f8fd6'}
];
let GALLERY=[
  'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1554475900-0a0350e3fc7b?q=80&w=800&auto=format&fit=crop'
];
let EVENTS=[
  {month:'Feb',day:'14',title:'PhD dissertation defense',titleTh:'สอบป้องกันวิทยานิพนธ์ ป.เอก',who:'Ms. Suda C. · Room 3201',whoTh:'นางสาวสุดา ซี. · ห้อง 3201'},
  {month:'Feb',day:'28',title:'Monthly lab meeting',titleTh:'ประชุมกลุ่มประจำเดือน',who:'Progress updates · 13:00',whoTh:'รายงานความคืบหน้า · 13:00 น.'},
  {month:'Mar',day:'09',title:'Field trip — Phu Kradueng',titleTh:'ออกภาคสนาม — ภูกระดึง',who:'Sample collection · all members',whoTh:'เก็บตัวอย่าง · สมาชิกทุกคน'}
];let TESTIMONIALS=[
  {q:'Studying at AC Lab taught me to think systematically. The NGS skills I gained went straight into my job, and the atmosphere was supportive throughout.',
   qTh:'การเรียนที่ AC Lab สอนให้คิดเป็นระบบ ความรู้ด้าน NGS นำไปใช้ทำงานจริงได้ทันที บรรยากาศในแล็บสนับสนุนกันดีมาก',
   name:'Dr. Somchai T.',role:'Researcher · Dept. of Agriculture',roleTh:'นักวิจัย · กรมวิชาการเกษตร',
   img:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'},
  {q:'I gained intense research experience, both in the lab and in the field. I am proud to have been part of new discoveries here.',
   qTh:'ได้รับประสบการณ์วิจัยที่เข้มข้น ทั้งในแล็บและการลงพื้นที่จริง ภูมิใจที่ได้เป็นส่วนหนึ่งของการค้นพบใหม่ๆ',
   name:'Ms. Malee J.',role:'QC Scientist · CPF',roleTh:'นักวิทยาศาสตร์ QC · CPF',
   img:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop'},
  {q:'The working atmosphere is warm, seniors mentor juniors, and the instruments are modern enough for international-level research.',
   qTh:'บรรยากาศการทำงานเป็นกันเอง รุ่นพี่สอนรุ่นน้อง เครื่องมือทันสมัยพร้อมสำหรับงานวิจัยระดับนานาชาติ',
   name:'Dr. Pratee',role:'Postdoctoral researcher',roleTh:'นักวิจัยหลังปริญญาเอก',
   img:'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200&auto=format&fit=crop'}
];
let BANNERS=[
  {img:'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=1600&auto=format&fit=crop',
   caption:'Now accepting applications for the 2026 intake',captionTh:'เปิดรับสมัครนักศึกษาใหม่ ปีการศึกษา 2569',link:'#join'}
];
const FAQ={
  en:[
    {q:'How do I apply for a position in the lab?',a:'Send your CV and a brief statement of research interests to Prof. Dr. Arunrat by email. We welcome students with backgrounds in biology, genetics or biochemistry.'},
    {q:'Are scholarships available?',a:'Yes. KKU offers several scholarships, including the Research Potential Scholarship, and the lab provides partial support for research expenses.'},
    {q:'Can outside researchers use the facilities?',a:'External researchers can request access through the Faculty of Science equipment centre, or by contacting our lab manager directly.'},
    {q:'What background do I need for the genomics work?',a:'A grounding in molecular biology helps, but we train students in NGS and bioinformatics from the ground up — curiosity matters more than a perfect starting point.'}
  ],
  th:[
    {q:'สมัครเข้าร่วมแล็บได้อย่างไร?',a:'ส่ง CV และคำอธิบายความสนใจงานวิจัยสั้นๆ ถึง ศ.ดร.อรุณรัตน์ ทางอีเมล เรายินดีต้อนรับนักศึกษาจากสาขาชีววิทยา พันธุศาสตร์ หรือชีวเคมี'},
    {q:'มีทุนการศึกษาหรือไม่?',a:'มีครับ มหาวิทยาลัยขอนแก่นมีทุนหลายประเภท รวมถึงทุนศักยภาพการวิจัย และแล็บสนับสนุนค่าใช้จ่ายวิจัยบางส่วน'},
    {q:'นักวิจัยภายนอกใช้เครื่องมือได้ไหม?',a:'นักวิจัยภายนอกขอใช้บริการได้ผ่านศูนย์เครื่องมือคณะวิทยาศาสตร์ หรือติดต่อผู้จัดการแล็บโดยตรง'},
    {q:'ต้องมีพื้นฐานอะไรสำหรับงานจีโนมิกส์?',a:'พื้นฐานชีววิทยาโมเลกุลช่วยได้ แต่เราฝึกนักศึกษาด้าน NGS และชีวสารสนเทศตั้งแต่เริ่มต้น — ความอยากรู้สำคัญกว่าจุดเริ่มที่สมบูรณ์แบบ'}
  ]
};

/* ============ i18n ============ */
const I18N={en:{},th:{
nav_awards:'รางวัล',award_eye:'รางวัลและการยอมรับ',award_title:'งานวิจัยที่ได้รับการยอมรับ ตั้งแต่ระดับมหาวิทยาลัยสู่เวทีนานาชาติ',award_lede:'บันทึกผลงานวิจัย นวัตกรรม และการใช้ประโยชน์ที่ได้รับการยอมรับในระดับมหาวิทยาลัย ระดับประเทศ และระดับนานาชาติ',
nav_value_chain:'ต้นน้ำ–กลางน้ำ–ปลายน้ำ',nav_ip:'สิทธิบัตรและทรัพย์สินทางปัญญา',nav_research:'งานวิจัย',nav_pipeline:'กระบวนการ',nav_pubs:'ผลงานตีพิมพ์',nav_innov:'นวัตกรรม',nav_products:'ผลิตภัณฑ์',nav_shop:'ร้านค้า',nav_videos:'วิดีโอ',nav_team:'ทีมงาน',nav_collab:'เครือข่าย',nav_contact:'ติดต่อ',nav_join:'ร่วมงานกับเรา',nav_facilities:'เครื่องมือ',  hero_chip:'ศูนย์ความเป็นเลิศ · ตั้งแต่ 2010',
  hero_title:'อ่านจีโนมพืช เพื่อค้นหา<span class="em">ยาแห่งอนาคต</span>',
  hero_lede:'ห้องปฏิบัติการวิจัย มหาวิทยาลัยขอนแก่น ที่ทำงานบนจุดบรรจบของจีโนมิกส์พืช เคมีผลิตภัณฑ์ธรรมชาติ และชีววิทยามะเร็ง',
  hero_cta1:'เราทำอะไร',hero_cta2:'อ่านผลงาน',
  prof_tag:'หัวหน้าห้องปฏิบัติการ',prof_role:'ผู้ก่อตั้งและหัวหน้าแล็บ · 2010',prof_view:'ประวัติ',
  p1_t:'จีโนมิกส์พืช',p1_d:'เราถอดรหัสจีโนมคลอโรพลาสต์ทั้งจีโนม และสร้างความสัมพันธ์เชิงวิวัฒนาการระหว่างชนิดพืช',
  p2_t:'เคมีพฤกษศาสตร์',p2_d:'เราแยกและวิเคราะห์สารออกฤทธิ์ทางชีวภาพที่พืชสมุนไพรผลิตขึ้น',
  p3_t:'การทดสอบชีวการแพทย์',p3_d:'เราทดสอบสารเหล่านั้นต่อเซลล์มะเร็งมนุษย์ และติดตามกลไกการออกฤทธิ์',
  loc_title:'คณะวิทยาศาสตร์ มข.',stat_pubs:'ผลงานระดับนานาชาติ',cp_meta:'cpDNA · ≈157 kbp',
  vc_eye:'ห่วงโซ่งานวิจัย',vc_title:'จากการค้นพบพืช สู่ผลิตภัณฑ์ที่นำไปใช้ได้จริง',vc_lede:'เส้นทางเดียวที่เชื่อมต้นน้ำด้านความหลากหลายทางชีวภาพและการวิจัยพืช กลางน้ำด้านผลงานวิจัยและทรัพย์สินทางปัญญา และปลายน้ำด้านผลิตภัณฑ์ที่ต่อยอดผ่าน Sciseeit Co., Ltd.',
  vc_up_phase:'ต้นน้ำ',vc_up_title:'การค้นพบพืชและงานวิจัยพื้นฐาน',vc_up_desc:'คัดเลือกพืชเป้าหมาย บันทึกความหลากหลาย ศึกษาจีโนมและสารสำคัญ พร้อมทดสอบฤทธิ์ทางชีวภาพในห้องปฏิบัติการ',vc_up_cta:'ดูงานวิจัยต้นน้ำ',vc_taxa_stat:'กลุ่มพืชเป้าหมาย',
  vc_mid_phase:'กลางน้ำ',vc_mid_title:'ผลงานวิจัยและทรัพย์สินทางปัญญา',vc_mid_desc:'แปลงหลักฐานเชิงวิทยาศาสตร์เป็นบทความวิจัย สิทธิบัตร และอนุสิทธิบัตร เพื่อคุ้มครองสูตรและรองรับการถ่ายทอดเทคโนโลยี',vc_mid_cta:'ดูทรัพย์สินทางปัญญา',vc_ip_stat:'รายการทรัพย์สินทางปัญญา',
  vc_down_phase:'ปลายน้ำ',vc_down_title:'ผลิตภัณฑ์ขึ้นทะเบียนและการนำไปใช้',vc_down_desc:'นำสูตรที่ได้รับการคุ้มครองไปพัฒนาเป็นผลิตภัณฑ์สุขภาพ สมุนไพร อาหาร และเครื่องสำอาง ผ่าน Sciseeit Co., Ltd.',vc_down_cta:'ดูผลิตภัณฑ์ปลายน้ำ',vc_product_stat:'รายการผลิตภัณฑ์',vc_legend:'เส้นทางต่อเนื่องจากหลักฐานสู่การใช้ประโยชน์',
  vc_method_cta:'เปิดดูวิธีดำเนินงานวิจัย',
  method_eye:'รายละเอียดวิธีดำเนินงาน',method_title:'สำรวจโครงข่ายวิธีวิจัยของห้องปฏิบัติการ',method_lede:'แผนผัง HTML แบบตอบสนองตามหน้าจอ แบ่งเป็น 4 ระยะ เพื่อให้หน้าเว็บกระชับและเลือกดูรายละเอียดได้ง่าย',method_open:'เปิดแผนผังวิธีวิจัย',method_close:'ปิดแผนผังวิธีวิจัย',
  method_intro:'แทนการวางไดอะแกรมขนาดยาวทั้งภาพบนหน้าเว็บ โครงข่ายถูกแบ่งเป็นระยะที่กดเลือกได้ เพื่อดูวิธีทดสอบ เครื่องมือ และจุดตัดสินใจของแต่ละช่วงอย่างชัดเจน',method_note:'รองรับมือถือ · ใช้คีย์บอร์ดได้ · แก้ไขข้อความได้',
  method_tab_1:'อนุกรมวิธานพืช',method_tab_2:'การทดสอบก่อนคลินิก',method_tab_3:'นวัตกรรมผลิตภัณฑ์',method_tab_4:'การขึ้นทะเบียนผลิตภัณฑ์',
  method_sys_title:'อนุกรมวิธานพืชและการค้นพบสารสำคัญ',method_sys_desc:'กลุ่มพืชเป้าหมายผ่านการระบุชนิด การวิเคราะห์จีโนมคลอโรพลาสต์ และการวิเคราะห์สารพฤกษเคมี ก่อนคัดเลือกเป็นผู้สมัครสำหรับการค้นคว้ายา',method_stage_upstream:'งานวิจัยต้นน้ำ',
  method_plant_group:'กลุ่มพืชเป้าหมาย',method_plant_group_sub:'ฐานความหลากหลายทางชีวภาพ',method_lane_a:'เส้นทางอนุกรมวิธาน',method_lane_b:'เส้นทางพฤกษเคมี',method_identification:'การระบุชนิดพืช',method_chloroplast:'การวิเคราะห์จีโนมคลอโรพลาสต์',method_marker:'การค้นหาเครื่องหมายพันธุกรรม',method_phylogeny:'การวิเคราะห์ความสัมพันธ์เชิงวิวัฒนาการ',method_evolution:'วิวัฒนาการของพืช',method_ecology:'นิเวศวิทยาของพืช',method_phyto:'การวิเคราะห์สารพฤกษเคมี',method_drug_discovery:'การค้นคว้ายา',method_lead_compounds:'สารสกัดและสารต้นแบบที่มีศักยภาพ',
  method_pre_title:'การทดสอบก่อนคลินิก',method_pre_desc:'สารสกัดและสารสำคัญจะถูกคัดกรองความเป็นพิษก่อน ผู้สมัครที่ไม่เป็นพิษจึงเข้าสู่การทดสอบฤทธิ์ทางชีวภาพด้วยแบบจำลองระดับโมเลกุล เซลล์ สัตว์ และคอมพิวเตอร์',method_stage_validation:'การยืนยันหลักฐาน',method_analysis_toolbox:'ชุดเครื่องมือวิเคราะห์',method_multiomics:'มัลติโอมิกส์: จีโนมิกส์ ทรานสคริปโตมิกส์ โปรตีโอมิกส์ และเมตาโบโลมิกส์',method_enzyme:'การทดสอบเอนไซม์และการแสดงออกของตัวบ่งชี้ชีวภาพ',method_docking:'การจำลองการจับระดับโมเลกุลและเครือข่ายเภสัชวิทยา',method_green_nano:'การสังเคราะห์อนุภาคนาโนสีเขียว',method_encapsulation:'เทคโนโลยีการห่อหุ้มสาร',method_toxicity:'การทดสอบความเป็นพิษ',method_cytotoxicity:'ความเป็นพิษต่อเซลล์',method_genotoxicity:'ความเป็นพิษต่อสารพันธุกรรม',method_non_toxic:'ผู้สมัครที่ไม่เป็นพิษ',method_bioactivity:'การทดสอบฤทธิ์ทางชีวภาพ',method_test_platforms:'แพลตฟอร์มการทดสอบ',method_invitro:'เซลล์และเนื้อเยื่อมนุษย์เพาะเลี้ยง (in vitro)',method_organoids:'สเฟียรอยด์และออร์แกนอยด์',method_microfluidic:'ชิปไมโครฟลูอิดิกสำหรับเพาะเลี้ยงเซลล์',method_invivo:'แบบจำลองสัตว์ (in vivo)',method_insilico:'การทดสอบด้วยคอมพิวเตอร์ (in silico)',method_epidemiology:'ระบาดวิทยาในประชากรมนุษย์',method_imaging:'CT, AMS, อัลตราซาวด์ และเทคนิคเวชศาสตร์นิวเคลียร์',method_ion:'การทดสอบช่องไอออน',
  method_innov_title:'นวัตกรรมผลิตภัณฑ์และการพิสูจน์คุณภาพ',method_innov_desc:'ผลงานวิจัยที่มีฤทธิ์จะถูกพัฒนาเป็นผลิตภัณฑ์ต้นแบบ ผ่านการพิสูจน์ความปลอดภัยและคุณภาพ แล้วต่อยอดเป็นทรัพย์สินทางปัญญา ผลงานตีพิมพ์ และผลิตภัณฑ์ที่ยื่นขึ้นทะเบียนได้',method_stage_translation:'การพัฒนาสู่การใช้ประโยชน์',method_safety_tests:'การทดสอบความปลอดภัยและคุณภาพ',method_irritation:'การทดสอบการระคายเคือง',method_sensitisation:'การทดสอบการก่อการแพ้',method_toxicity_repeat:'การทดสอบความเป็นพิษ',method_stability:'การทดสอบความคงตัว',method_contamination:'การทดสอบการปนเปื้อนและโลหะหนัก',method_prototype:'ผลิตภัณฑ์ต้นแบบ',method_proof:'การพิสูจน์ความปลอดภัยและคุณภาพ',method_ip:'ทรัพย์สินทางปัญญา',method_publication:'ผลงานตีพิมพ์',method_fda:'การอนุมัติจาก อย.',method_commercial:'การใช้ประโยชน์เชิงพาณิชย์',method_product_forms:'ประเภทผลิตภัณฑ์ต้นแบบ',method_nutraceuticals:'โภชนเภสัช',method_functional_foods:'อาหารฟังก์ชัน',method_cosmetics:'เครื่องสำอาง',method_herbal:'ยาสมุนไพร',method_supplements:'ผลิตภัณฑ์เสริมอาหาร',
  method_reg_title:'การขึ้นทะเบียนผลิตภัณฑ์และการใช้ประโยชน์เชิงพาณิชย์',method_reg_desc:'ในกรณีที่จำเป็น ผลิตภัณฑ์จะเข้าสู่การทดลองทางคลินิกก่อนการอนุมัติจากหน่วยงานกำกับดูแล เมื่อได้รับอนุมัติแล้วจึงเข้าสู่การผลิต การเปิดตัว และการใช้ประโยชน์เชิงพาณิชย์',method_stage_downstream:'ผลลัพธ์ปลายน้ำ',method_registration:'การขึ้นทะเบียนผลิตภัณฑ์',method_clinical:'การทดลองทางคลินิก',method_if_needed:'เมื่อจำเป็น',method_reg_note:'เส้นทางการขึ้นทะเบียนจริงขึ้นอยู่กับประเภทของผลิตภัณฑ์ เช่น เครื่องสำอาง อาหาร ผลิตภัณฑ์เสริมอาหาร ยาสมุนไพร หรือยา',method_source:'โครงสร้างและคำศัพท์ในแผนผังเชิงโต้ตอบนี้แปลงจากไดอะแกรมขั้นตอนการทำงานที่ห้องปฏิบัติการจัดส่ง โดยปรับการจัดวางให้เหมาะกับเว็บไซต์แบบตอบสนองตามหน้าจอ และยังคง 4 ระยะหลักตามต้นฉบับ',

  ip_eye:'ทรัพย์สินทางปัญญา',ip_title:'สิทธิบัตร อนุสิทธิบัตร และสูตรที่ได้รับการคุ้มครอง',ip_lede:'สะพานกลางน้ำระหว่างหลักฐานจากห้องปฏิบัติการกับผลิตภัณฑ์จริง ครอบคลุมนวัตกรรมสุขภาพ สมุนไพร เครื่องสำอาง และอาหาร',ip_source:'ข้อมูลทรัพย์สินทางปัญญาจัดทำโดยห้องปฏิบัติการ รายละเอียดเลขทะเบียนแสดงตามเอกสารต้นฉบับที่แนบมา',
  research_eye:'สิ่งที่เราศึกษา',research_title:'จากภาคสนามสู่เซลล์ไลน์',
  research_lede:'สามศาสตร์ที่เชื่อมโยงกัน ทำให้เราติดตามพืชหนึ่งชนิดได้ตั้งแต่ตัวอย่างบนแผ่นพรรณไม้ ไปจนถึงผลระดับโมเลกุลต่อเซลล์มนุษย์',
  pipe_eye:'ขั้นตอนการทำงาน',pipe_title:'จากใบไม้สู่สารออกฤทธิ์',
  pipe_lede:'ทุกโครงการดำเนินผ่านห้าขั้นตอนเดียวกัน — ตั้งแต่การเก็บตัวอย่างภาคสนามจนถึงการทดสอบฤทธิ์ที่โต๊ะปฏิบัติการ',
  taxa_eye:'พืชเป้าหมาย',taxa_title:'พืชที่เป็นแกนกลางของงานเรา',taxa_lede:'สกุลพืชที่เรากลับมาศึกษาซ้ำทั้งด้านจีโนมและเคมีในหลายโครงการและผลงาน',
  fig_eye:'ตัวเลขของแล็บ',fig_title:'ผลงานตลอด 14 ปี',
  fig_pubs:'ผลงานตีพิมพ์ในวารสารนานาชาติ',fig_years:'ปีที่ดำเนินการ ตั้งแต่ 2010',fig_grads:'นักวิจัยบัณฑิตศึกษาที่ฝึกอบรม',fig_countries:'ประเทศที่มีผู้ร่วมวิจัย',fig_inst:'สถาบันพันธมิตรทั่วโลก',fig_fam:'วงศ์พืชที่ศึกษา',
  pub_eye:'ผลงานคัดสรร',pub_title:'สิ่งที่เราตีพิมพ์',pub_empty:'ไม่พบผลงานที่ตรงกับการค้นหา',pub_all:'ดูผลงานทั้งหมด',
  pf_all:'ทั้งหมด',pf_gen:'จีโนมิกส์',pf_phy:'เคมีพฤกษ์',pf_bio:'ชีวการแพทย์',
  fac_eye:'เครื่องมือและพื้นที่',fac_title:'ห้องแล็บที่สร้างเพื่อโมเลกุล',
  fac_lede:'ตั้งแต่การสกัด DNA ไปจนถึงการทดสอบระดับเซลล์ โต๊ะปฏิบัติการของเราพร้อมเครื่องมือทั้งจีโนมิกส์และเคมีผลิตภัณฑ์ธรรมชาติในที่เดียว',
  fac_bsl:'ห้องเพาะเลี้ยงเซลล์ได้มาตรฐาน Biosafety Level 2',
  tl_eye:'เหตุการณ์สำคัญ',tl_title:'เส้นทางที่ผ่านมา',
  innov_eye:'นวัตกรรมในอนาคต',innov_title:'เปลี่ยนความหลากหลายทางชีวภาพให้เป็นนวัตกรรมสุขภาพมูลค่าสูง',
  innov_lede:'โครงการหลักของเราคือระบบวิจัยบูรณาการ ที่นำความหลากหลายของพืชในไทยเดินทางตั้งแต่การค้นพบระดับโมเลกุล ไปจนถึงผลิตภัณฑ์สุขภาพมูลค่าสูงที่ขึ้นทะเบียนแล้ว',
  innov_from:'ความหลากหลายทางชีวภาพ',innov_mid:'วิจัยบูรณาการ',innov_to:'ผลิตภัณฑ์ที่ขึ้นทะเบียน',
  prod_eye:'จากแล็บสู่ชั้นวาง',prod_title:'ผลิตภัณฑ์จากงานวิจัยของเรา',
  prod_lede:'งานวิจัยของเราไม่ได้จบแค่บทความ ผลการค้นพบจากห้องแล็บถูกต่อยอดผ่าน Sciseeit Co., Ltd. เป็นผลิตภัณฑ์สุขภาพ สมุนไพร อาหาร และเครื่องสำอางที่มีการขึ้นทะเบียน',
  prod_foot:'ต่อยอดเชิงพาณิชย์ผ่าน Sciseeit Co., Ltd. — ภาพผลิตภัณฑ์เป็นภาพประกอบและสามารถอัปเดตได้ในระบบหลังบ้าน',
prod_ing:'ส่วนประกอบสำคัญ',prod_size:'ขนาด',prod_price:'ราคา',prod_shop_cta:'ไปที่ร้านค้าของเรา',prod_buy:'ซื้อที่ร้านค้าของเรา',  vid_eye:'รับชม',vid_title:'ทำความรู้จักแล็บ — และเรียนรู้ไปกับเรา',vid_lede:'วิดีโอแนะนำแล็บ พร้อมบทเรียนที่พาดูเทคนิคที่เราใช้งานจริงในทุกๆ วัน',
  team_eye:'ทีมงานโครงการ',team_title:'นักวิจัยเบื้องหลังโครงการ',team_lede:'นักวิจัย 8 ท่านจากมหาวิทยาลัยขอนแก่นและสถาบันพันธมิตร ร่วมขับเคลื่อนโครงการวิจัยบูรณาการ ตั้งแต่ชีววิทยาโมเลกุลและมัลติโอมิกส์ ไปจนถึงการทดสอบฤทธิ์ทางชีวภาพและทรัพย์สินทางปัญญา',
  mem_eye:'ภายในแล็บ',mem_title:'สมาชิกในแล็บ',
  team_all:'ทั้งหมด',team_lead:'หัวหน้าโครงการ',team_co:'ผู้ร่วมวิจัย',team_intl:'ต่างประเทศ',
team_postdoc:'หลังปริญญาเอก',team_phd:'ป.เอก',team_master:'ป.โท',team_intern:'ฝึกงาน',team_alumni:'ศิษย์เก่า',team_alumni_sub_phd:'ปริญญาเอก',team_alumni_sub_master:'ปริญญาโท',mem_lede:'นักศึกษาปัจจุบัน นักศึกษาฝึกงาน และศิษย์เก่าของแล็บ',pub_chart_t:'ผลงานต่อปี',saved_toast:'บันทึกแล้ว',  grant_eye:'กลุ่มวิจัยเฉพาะกิจ',grant_title:'ทีมวิจัย (สำหรับยื่นข้อเสนอโครงการ)',grant_lede:'ทีมวิจัยที่แยกออกมาต่างหาก ใช้สำหรับยื่นข้อเสนอขอทุนวิจัยโดยเฉพาะ นำโดย ศ.ดร.อรุณรัตน์ ฉวีราช เพิ่มผู้ร่วมวิจัยได้ภายหลังจากระบบหลังบ้าน',voices_share:'ร่วมเขียนรีวิว',voices_share_chip:'เรื่องราวจากศิษย์เก่า',voices_share_title:'แบ่งปันประสบการณ์ของคุณ',
voices_role:'ตำแหน่ง/ที่ทำงานปัจจุบันของคุณ',voices_quote:'เรื่องราวของคุณ',voices_submit:'ส่งเพื่อตรวจสอบ',
voices_note:'ทีมงานจะตรวจสอบก่อนเผยแพร่บนเว็บไซต์',voices_photo:'รูปถ่ายของคุณ (ไม่บังคับ)',  collab_eye:'เครือข่ายระดับโลก',collab_title:'ทำงานข้ามพรมแดน',
  collab_lede:'ความร่วมมือเชื่อมขอนแก่นกับสถาบันชั้นนำในสามทวีป สนับสนุนการแลกเปลี่ยนนักศึกษาและผลงานตีพิมพ์ร่วม',
  collab_wide_title:'จากขอนแก่นสู่โลกกว้าง',collab_wide_sub:'พื้นที่ภาคสนามในไทยหล่อเลี้ยงความร่วมมือที่เปลี่ยนความหลากหลายทางชีวภาพท้องถิ่นให้เป็นวิทยาศาสตร์ร่วมระดับโลก',
  collab_countries:'ประเทศ',collab_inst:'สถาบัน',
  join_eye:'ร่วมงานกับเรา',join_title:'เส้นทางเข้าสู่แล็บของคุณ',join_lede:'เรายินดีต้อนรับนักศึกษาที่มีความอยากรู้จากสาขาชีววิทยา พันธุศาสตร์ และชีวเคมี นี่คือวิธีสมัคร',join_cta:'เยี่ยมชมบัณฑิตวิทยาลัย',
  res_title:'แหล่งข้อมูลนักศึกษา',res_1:'คู่มือความปลอดภัยในแล็บ',res_2:'แบบฟอร์มขอใช้เครื่องมือ',res_3:'เทมเพลตวิทยานิพนธ์',
  news_eye:'ชีวิตในแล็บ',news_title:'ข่าวสารล่าสุด',news_all:'ดูข่าวย้อนหลัง',
  upcoming:'กิจกรรมที่จะถึง',gallery:'แกลเลอรี',
  ev1:'สอบป้องกันวิทยานิพนธ์ ป.เอก',ev2:'ประชุมกลุ่มประจำเดือน',ev3:'ออกภาคสนาม — ภูกระดึง',
  voices:'เสียงจากศิษย์เก่า',faq:'คำถามที่พบบ่อย',
  contact_eye:'ติดต่อเรา',contact_title:'มาพบเราได้ที่นี่',
  ci_loc:'ที่ตั้งห้องแล็บ',ci_email:'อีเมล',ci_copy:'คลิกเพื่อคัดลอก',ci_reply:'ตอบกลับภายใน 1–2 วันทำการ',
form_title:'ส่งข้อความ',form_name:'ชื่อของคุณ',form_email:'อีเมล',form_subj:'หัวข้อ',form_s1:'สอบถามทั่วไป',form_s2:'สมัครเข้าร่วมแล็บ',form_s3:'ความร่วมมือวิจัย',form_s4:'ฝึกงาน',form_msg:'ข้อความ',form_send:'ส่งข้อความ',  nl_title:'ติดตามข่าวสาร',nl_sub:'ผลงานใหม่ การรับสมัคร และข่าวแล็บ — เป็นครั้งคราว ไม่มีสแปม',nl_btn:'สมัครรับข่าว',
  foot_desc:'จีโนมิกส์พืช เคมีพฤกษศาสตร์ และงานวิจัยชีวการแพทย์ ณ คณะวิทยาศาสตร์ มหาวิทยาลัยขอนแก่น',
  foot_explore:'สำรวจ',foot_connect:'เชื่อมต่อ',foot_grad:'บัณฑิตวิทยาลัย',
  abstract:'บทคัดย่อ',read_paper:'อ่านฉบับเต็ม',research_article:'บทความวิจัย',copy_cite:'คัดลอกการอ้างอิง',
  pi_title:'ศาสตราจารย์ด้านชีววิทยา · ผู้ก่อตั้ง AC Lab (2010)',
  pi_interests:'ความสนใจวิจัย',pi_interests_t:'ไซโทเจเนติกส์พืช จีโนมิกส์ และดีเอ็นเอบาร์โค้ด เคมีของพืชสมุนไพร และฤทธิ์ทางชีวการแพทย์ของสารจากพืชต่อเซลล์มะเร็ง',
  pi_focus:'สิ่งที่มุ่งเน้นปัจจุบัน',pi_focus_t:'เชื่อมจีโนมิกส์คลอโรพลาสต์กับเคมีพฤกษศาสตร์ — โยงเรื่องราววิวัฒนาการของพืชเข้ากับโมเลกุลที่มันสร้างและผลต่อเซลล์มนุษย์',
  pi_contact:'ติดต่อ',lb_close:'คลิกที่ใดก็ได้เพื่อปิด',
  res_toast:'ไฟล์ตัวอย่าง — แทนที่ด้วยลิงก์ของคุณ',ev_toast:'รายละเอียดกิจกรรมเร็วๆ นี้',nl_toast:'สมัครรับข่าวเรียบร้อย — ขอบคุณครับ',link_toast:'เพิ่มลิงก์ของคุณ',cite_toast:'คัดลอกการอ้างอิงแล้ว',email_toast:'คัดลอกอีเมลแล้ว',form_toast:'ส่งข้อความเรียบร้อย'
}};
const TX={
  res_toast:'Sample file — replace with your own link',ev_toast:'Event details coming soon',nl_toast:'Subscribed — thank you',link_toast:'Add your link',cite_toast:'Citation copied',email_toast:'Email copied',form_toast:'Message sent — thank you',saved_toast:'Saved'
};
let lang='en';
let TEXT_OVERRIDES={};
let TEXT_REGISTRY=null;
function buildTextRegistry(){
  if(TEXT_REGISTRY)return TEXT_REGISTRY;
  TEXT_REGISTRY={};
  document.querySelectorAll('[data-i18n]').forEach(node=>{
    const k=node.getAttribute('data-i18n');
    if(TEXT_REGISTRY[k])return;
    const sec=node.closest('section[id]');
    let label='other';
    if(sec)label=sec.id;
    else if(node.closest('#navLinks,#drawer'))label='nav';
    else if(node.closest('.foot'))label='footer';
    else if(node.closest('#newsletter'))label='newsletter';
    TEXT_REGISTRY[k]={defaultEn:node.innerHTML,defaultTh:(I18N.th[k]!==undefined?I18N.th[k]:''),section:label};
  });
  return TEXT_REGISTRY;
}
window.T=function(k){
  const ov=TEXT_OVERRIDES[k];
  if(ov&&ov[lang])return ov[lang];
  return (lang==='th'&&I18N.th[k])?I18N.th[k]:(TX[k]||k);
};
function applyLang(){
  buildTextRegistry();
  document.documentElement.lang=lang;
  document.getElementById('langLabel').textContent=lang==='th'?'EN':'TH';
  document.querySelectorAll('[data-i18n]').forEach(node=>{
    const k=node.getAttribute('data-i18n');
    const reg=TEXT_REGISTRY[k]||{defaultEn:node.innerHTML,defaultTh:''};
    const ov=TEXT_OVERRIDES[k];
    let text;
    if(ov&&ov[lang])text=ov[lang];
    else text=(lang==='th'&&reg.defaultTh)?reg.defaultTh:reg.defaultEn;
    node.innerHTML=text;
    node.style.color=ov&&ov.color?ov.color:'';
    node.style.fontWeight=ov&&ov.weight?ov.weight:'';
    node.style.letterSpacing=ov&&ov.spacing?ov.spacing+'px':'';
  });
  renderTesti();renderFaq();if(typeof renderIP==='function')renderIP();if(typeof updateValueChainStats==='function')updateValueChainStats();
}window.toggleLang=function(){lang=lang==='th'?'en':'th';applyLang();};
/* ============ THEME ============ */
let theme='light';
window.toggleTheme=function(){
  theme=theme==='light'?'dark':'light';
  document.documentElement.setAttribute('data-theme',theme);
  document.getElementById('themeIcon').setAttribute('href',theme==='light'?'#i-moon':'#i-sun');
};

/* ============ HELPERS ============ */
const el=(id)=>document.getElementById(id);
function icon(id){return `<svg class="icon"><use href="#${id}"/></svg>`;}

/* ============ SECTION VISIBILITY ============ */
const SECTIONS=[
  {id:'value-chain',label:'Research value chain',labelTh:'ต้นน้ำ–กลางน้ำ–ปลายน้ำ'},
  {id:'research',label:'Research',labelTh:'งานวิจัย'},
  {id:'pipeline',label:'Pipeline',labelTh:'กระบวนการ'},
  {id:'taxa',label:'Focal taxa',labelTh:'พืชเป้าหมาย'},
  {id:'impact',label:'Lab in figures',labelTh:'ตัวเลขของแล็บ'},
  {id:'awards',label:'Awards & recognition',labelTh:'รางวัลและการยอมรับ'},
  {id:'publications',label:'Publications',labelTh:'ผลงานตีพิมพ์'},
  {id:'ip-portfolio',label:'Intellectual property',labelTh:'สิทธิบัตรและทรัพย์สินทางปัญญา'},
  {id:'facilities',label:'Facilities & timeline',labelTh:'เครื่องมือและไทม์ไลน์'},
  {id:'videos',label:'Videos',labelTh:'วิดีโอ'},
  {id:'innovation',label:'Future innovations',labelTh:'นวัตกรรมในอนาคต'},
  {id:'products',label:'Products',labelTh:'ผลิตภัณฑ์'},
  {id:'team',label:'Programme team',labelTh:'ทีมงานโครงการ'},
{id:'members',label:'Lab members',labelTh:'สมาชิกในแล็บ'},
  {id:'grant-team',label:'Grant proposal team',labelTh:'ทีมวิจัย (ยื่นทุน)'},  {id:'collaborations',label:'Partners',labelTh:'เครือข่ายพันธมิตร'},
  {id:'join',label:'Join the lab',labelTh:'ร่วมงานกับเรา'},
  {id:'news',label:'News',labelTh:'ข่าวสาร'},
  {id:'voices-faq',label:'Voices & FAQ',labelTh:'รีวิวและคำถามที่พบบ่อย'},
  {id:'contact',label:'Contact',labelTh:'ติดต่อเรา'},
  {id:'newsletter',label:'Newsletter strip',labelTh:'แถบสมัครรับข่าว'}
];
function applySectionVisibility(){
  allSectionMetas().forEach(s=>{const node=document.getElementById(s.id);if(node)node.style.display=HIDDEN_SECTIONS.has(s.id)?'none':'';});
}
let SECTION_ORDER=SECTIONS.map(s=>s.id);
let CUSTOM_SECTIONS=[];
function syncBuiltInSectionOrder(){
  const defaults=SECTIONS.map(s=>s.id);
  defaults.forEach((id,idx)=>{
    if(SECTION_ORDER.includes(id))return;
    const next=defaults.slice(idx+1).find(n=>SECTION_ORDER.includes(n));
    if(next)SECTION_ORDER.splice(SECTION_ORDER.indexOf(next),0,id);else SECTION_ORDER.push(id);
  });
}
function customSectionMeta(cs){return {id:cs.id,label:cs.title||'Custom section',labelTh:cs.titleTh||cs.title||'เซกชันที่กำหนดเอง'};}
function allSectionMetas(){return [...SECTIONS,...CUSTOM_SECTIONS.map(customSectionMeta)];}
function applySectionOrder(){
  const main=document.querySelector('main');if(!main)return;
  SECTION_ORDER.forEach(id=>{
    const node=document.getElementById(id);
    if(node&&node.parentNode===main)main.appendChild(node);
  });
}
function sectionLabel(id){return allSectionMetas().find(x=>x.id===id)||{id,label:id,labelTh:id};}
window.admMoveSection=function(id,dir){
  const i=SECTION_ORDER.indexOf(id);if(i<0)return;
  const j=i+dir;if(j<0||j>=SECTION_ORDER.length)return;
  [SECTION_ORDER[i],SECTION_ORDER[j]]=[SECTION_ORDER[j],SECTION_ORDER[i]];
  applySectionOrder();saveStore();renderAdmin('sections');
};

function customSectionHTML(cs){
  const TT=(en,th)=>(lang==='th'&&th)?th:(en||'');
  let body='';
  const items=cs.items||[];
  if(cs.template==='cards'){
    body=`<div class="rgrid">${items.map((it,i)=>`<article class="rcard reveal in"><span class="rcard__no mono">0${i+1}</span><span class="rcard__ic">${icon(it.icon||'i-spark')}</span><h3>${TT(it.title,it.titleTh)}</h3><p>${TT(it.desc,it.descTh)}</p></article>`).join('')}</div>`;
  }else if(cs.template==='stats'){
    body=`<div class="figs">${items.map(it=>{const num=parseFloat(it.value)||0;const suf=(it.value||'').replace(/^[\d.\s]+/,'');return `<div class="fig fig--4 reveal in"><div class="num"><span class="count" data-to="${num}">0</span><small>${suf}</small></div><div class="lab">${TT(it.label,it.labelTh)}</div></div>`;}).join('')}</div>`;
  }else if(cs.template==='timeline'){
    body=`<div class="timeline">${items.map(it=>`<div class="tl reveal in"><div class="yr">${it.yr||''}</div><h4>${TT(it.title,it.titleTh)}</h4><p>${TT(it.desc,it.descTh)}</p></div>`).join('')}</div>`;
  }else{
    body=cs.cta?`<div style="text-align:center;margin-top:8px"><a href="${cs.ctaLink||'#'}" class="btn btn--primary">${TT(cs.cta,cs.ctaTh)} ${icon('i-arrow')}</a></div>`:'';
  }
  return `<div class="wrap"><div class="sec-head${cs.template==='text'?' center':''} reveal in">${cs.eyebrow?`<span class="eyebrow">${TT(cs.eyebrow,cs.eyebrowTh)}</span>`:''}<h2 class="h-sec">${TT(cs.title,cs.titleTh)}</h2>${cs.lede?`<p class="lede">${TT(cs.lede,cs.ledeTh)}</p>`:''}</div>${body}</div>`;
}
function renderCustomSections(){
  const main=document.querySelector('main');if(!main)return;
  CUSTOM_SECTIONS.forEach(cs=>{
    let node=document.getElementById(cs.id);
    if(!node){
      node=document.createElement('section');
      node.id=cs.id;
      node.dataset.custom='1';
      main.appendChild(node);
    }
    node.className='section'+(cs.alt?' section--alt':'');
    node.innerHTML=customSectionHTML(cs);
  });
  document.querySelectorAll('main > section[data-custom="1"]').forEach(node=>{
    if(!CUSTOM_SECTIONS.find(cs=>cs.id===node.id))node.remove();
  });
  try{
    document.querySelectorAll('.count:not([data-observed])').forEach(c=>{c.dataset.observed='1';const p=c.closest('.cell,.fig,.cw-figs')||c;cio.observe(p);});
  }catch(e){/* cio ยังไม่ถูกประกาศตอนโหลดหน้าครั้งแรก — ระบบนับเลขของเว็บที่มีอยู่แล้วจะจับ .count ตัวใหม่ให้เองอัตโนมัติ */}
}
let admCardsSub='themes';
function admCardsList(){
  const TT=(en,th)=>lang==='th'?th:en;
  const tabs=[
    ['themes',TT('Research pillars','เสาหลักงานวิจัย')],
    ['pipe',TT('Pipeline steps','ขั้นตอนกระบวนการ')],
    ['facilities',TT('Facilities','เครื่องมือ')],
    ['timeline',TT('Timeline','เส้นเวลา')],
    ['innov',TT('Innovation cards','การ์ดนวัตกรรม')],
    ['road',TT('Join-the-lab steps','ขั้นตอนสมัคร')]
  ];
  const nav=`<div class="filters" style="margin:0 0 20px">${tabs.map(([id,lab])=>`<button class="filter ${admCardsSub===id?'active':''}" onclick="admCardsSub='${id}';renderAdmin('cards')">${lab}</button>`).join('')}</div>`;
  let body='';
  if(admCardsSub==='themes')body=admThemesBody();
  else if(admCardsSub==='pipe')body=admPipeBody();
  else if(admCardsSub==='facilities')body=admFacilitiesBody();
  else if(admCardsSub==='timeline')body=admTimelineBody();
  else if(admCardsSub==='innov')body=admInnovBody();
  else if(admCardsSub==='road')body=admRoadBody();
  return nav+body;
}

window.admMoveTheme=function(i,dir){const j=i+dir;if(j<0||j>=THEMES.length)return;[THEMES[i],THEMES[j]]=[THEMES[j],THEMES[i]];saveStore();renderThemes();renderAdmin('cards');};
window.admMovePipe=function(i,dir){const j=i+dir;if(j<0||j>=PIPE.length)return;[PIPE[i],PIPE[j]]=[PIPE[j],PIPE[i]];PIPE.forEach((p,k)=>p.no=String(k+1).padStart(2,'0'));saveStore();renderPipe();renderAdmin('cards');};
window.admMoveFacility=function(i,dir){const j=i+dir;if(j<0||j>=FACILITIES.length)return;[FACILITIES[i],FACILITIES[j]]=[FACILITIES[j],FACILITIES[i]];saveStore();renderFacilities();renderAdmin('cards');};
window.admMoveTimeline=function(i,dir){const j=i+dir;if(j<0||j>=TIMELINE.length)return;[TIMELINE[i],TIMELINE[j]]=[TIMELINE[j],TIMELINE[i]];saveStore();renderTimeline();renderAdmin('cards');};
window.admMoveInnov=function(i,dir){const j=i+dir;if(j<0||j>=INNOV.length)return;[INNOV[i],INNOV[j]]=[INNOV[j],INNOV[i]];INNOV.forEach((x,k)=>x.no=String(k+1).padStart(2,'0'));saveStore();renderInnov();renderAdmin('cards');};
window.admMoveRoad=function(i,dir){const j=i+dir;if(j<0||j>=ROAD.length)return;[ROAD[i],ROAD[j]]=[ROAD[j],ROAD[i]];ROAD.forEach((s,k)=>s.no=String(k+1));saveStore();renderRoad();renderAdmin('cards');};

function moveBtns(idx,len,fn){
  return `<div style="display:flex;flex-direction:column;gap:2px">
    <button class="adm-ic" style="width:26px;height:22px" ${idx===0?'disabled':''} onclick="${fn}(${idx},-1)">${icon('i-up')}</button>
    <button class="adm-ic" style="width:26px;height:22px;transform:rotate(180deg)" ${idx===len-1?'disabled':''} onclick="${fn}(${idx},1)">${icon('i-up')}</button>
  </div>`;
}

/* -- การ์ดเสาหลักงานวิจัย (THEMES) -- */
function admThemesBody(){
  return `<div class="adm-section-t">${THEMES.length} ${lang==='th'?'รายการ · คลิกเพื่อแก้ไข':'items · click to edit'}</div>`+
  THEMES.map((t,i)=>`<div class="adm-row">${moveBtns(i,THEMES.length,'admMoveTheme')}<span class="mono-av" style="background:${hue(t.title)}">${icon(t.icon||'i-leaf')}</span><div class="r-main"><h4>${esc(t.title)}</h4><div class="r-sub">${esc((t.desc||'').slice(0,60))}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditTheme(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelTheme(${i})">${icon('i-close')}</button></div></div>`).join('')+
  `<button class="adm-add" onclick="admEditTheme(-1)">${icon('i-plus')} ${lang==='th'?'เพิ่มรายการ':'Add pillar'}</button>`;
}
window.admEditTheme=function(i){editIdx=i;const t=i>=0?THEMES[i]:{icon:'i-leaf',title:'',titleTh:'',desc:'',descTh:'',tags:[]};
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('cards')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-field"><label>Icon</label><select id="th_icon"><option value="i-leaf">Leaf</option><option value="i-flask">Flask</option><option value="i-cell">Cell</option><option value="i-dna">DNA</option><option value="i-scope">Scope</option><option value="i-spark">Spark</option></select></div>
    <div class="adm-2"><div class="adm-field"><label>Title (English)</label><input id="th_title"></div><div class="adm-field"><label>Title (Thai)</label><input id="th_titleth"></div></div>
    <div class="adm-field"><label>Description (English)</label><textarea id="th_desc"></textarea></div>
    <div class="adm-field"><label>Description (Thai)</label><textarea id="th_descth"></textarea></div>
    <div class="adm-field"><label>Tags (comma-separated)</label><input id="th_tags"></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('cards')">Cancel</button><button class="btn btn--primary" onclick="admSaveTheme()">${icon('i-check')} Save</button></div>
  </div>`;
  el('th_icon').value=t.icon||'i-leaf';el('th_title').value=t.title||'';el('th_titleth').value=t.titleTh||'';el('th_desc').value=t.desc||'';el('th_descth').value=t.descTh||'';el('th_tags').value=(t.tags||[]).join(', ');
};
window.admSaveTheme=function(){const title=val('th_title').trim();if(!title){toast(lang==='th'?'ต้องมีชื่อหัวข้อ':'Title required');return;}
  const item={icon:val('th_icon'),title,titleTh:val('th_titleth').trim(),desc:val('th_desc').trim(),descTh:val('th_descth').trim(),tags:val('th_tags').split(',').map(s=>s.trim()).filter(Boolean)};
  if(editIdx>=0)THEMES[editIdx]=item;else THEMES.push(item);
  saveStore();renderThemes();renderAdmin('cards');
};
window.admDelTheme=function(i){if(!confirm((lang==='th'?'ลบ ':'Delete ')+THEMES[i].title+'?'))return;THEMES.splice(i,1);saveStore();renderThemes();renderAdmin('cards');};

/* -- ขั้นตอน Pipeline (PIPE) -- */
function admPipeBody(){
  return `<div class="adm-section-t">${PIPE.length} ${lang==='th'?'ขั้นตอน · คลิกเพื่อแก้ไข':'steps · click to edit'}</div>`+
  PIPE.map((p,i)=>`<div class="adm-row">${moveBtns(i,PIPE.length,'admMovePipe')}<span class="mono-av" style="background:${hue(p.title)}">${icon(p.icon||'i-flask')}</span><div class="r-main"><h4>${esc(p.no||'')} · ${esc(p.title)}</h4><div class="r-sub">${esc((p.desc||'').slice(0,60))}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditPipe(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelPipe(${i})">${icon('i-close')}</button></div></div>`).join('')+
  `<button class="adm-add" onclick="admEditPipe(-1)">${icon('i-plus')} ${lang==='th'?'เพิ่มขั้นตอน':'Add step'}</button>`;
}
window.admEditPipe=function(i){editIdx=i;const p=i>=0?PIPE[i]:{no:String(PIPE.length+1).padStart(2,'0'),icon:'i-flask',title:'',titleTh:'',desc:'',descTh:''};
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('cards')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-2"><div class="adm-field"><label>Step number</label><input id="pi_no"></div><div class="adm-field"><label>Icon</label><select id="pi_icon"><option value="i-plant">Plant</option><option value="i-dna">DNA</option><option value="i-wave">Wave</option><option value="i-flask">Flask</option><option value="i-cell">Cell</option></select></div></div>
    <div class="adm-2"><div class="adm-field"><label>Title (English)</label><input id="pi_title"></div><div class="adm-field"><label>Title (Thai)</label><input id="pi_titleth"></div></div>
    <div class="adm-field"><label>Description (English)</label><textarea id="pi_desc"></textarea></div>
    <div class="adm-field"><label>Description (Thai)</label><textarea id="pi_descth"></textarea></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('cards')">Cancel</button><button class="btn btn--primary" onclick="admSavePipe()">${icon('i-check')} Save</button></div>
  </div>`;
  el('pi_no').value=p.no||'';el('pi_icon').value=p.icon||'i-flask';el('pi_title').value=p.title||'';el('pi_titleth').value=p.titleTh||'';el('pi_desc').value=p.desc||'';el('pi_descth').value=p.descTh||'';
};
window.admSavePipe=function(){const title=val('pi_title').trim();if(!title){toast(lang==='th'?'ต้องมีชื่อขั้นตอน':'Title required');return;}
  const item={no:val('pi_no').trim(),icon:val('pi_icon'),title,titleTh:val('pi_titleth').trim(),desc:val('pi_desc').trim(),descTh:val('pi_descth').trim()};
  if(editIdx>=0)PIPE[editIdx]=item;else PIPE.push(item);
  saveStore();renderPipe();renderAdmin('cards');
};
window.admDelPipe=function(i){if(!confirm((lang==='th'?'ลบขั้นตอน ':'Delete ')+PIPE[i].title+'?'))return;PIPE.splice(i,1);saveStore();renderPipe();renderAdmin('cards');};

/* -- เครื่องมือ/ห้องแล็บ (FACILITIES) -- */
function admFacilitiesBody(){
  return `<div class="adm-section-t">${FACILITIES.length} ${lang==='th'?'รายการ · คลิกเพื่อแก้ไข':'items · click to edit'}</div>`+
  FACILITIES.map((f,i)=>`<div class="adm-row">${moveBtns(i,FACILITIES.length,'admMoveFacility')}<span class="mono-av" style="background:${hue(f.title)}">${icon(f.icon||'i-scope')}</span><div class="r-main"><h4>${esc(f.title)}</h4><div class="r-sub">${esc(f.spec||'')}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditFacility(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelFacility(${i})">${icon('i-close')}</button></div></div>`).join('')+
  `<button class="adm-add" onclick="admEditFacility(-1)">${icon('i-plus')} ${lang==='th'?'เพิ่มรายการ':'Add facility'}</button>`;
}
window.admEditFacility=function(i){editIdx=i;const f=i>=0?FACILITIES[i]:{icon:'i-scope',title:'',titleTh:'',spec:'',specTh:''};
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('cards')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-field"><label>Icon</label><select id="fc_icon"><option value="i-dna">DNA</option><option value="i-flask">Flask</option><option value="i-cell">Cell</option><option value="i-scope">Scope</option></select></div>
    <div class="adm-2"><div class="adm-field"><label>Title (English)</label><input id="fc_title"></div><div class="adm-field"><label>Title (Thai)</label><input id="fc_titleth"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Spec (English)</label><input id="fc_spec"></div><div class="adm-field"><label>Spec (Thai)</label><input id="fc_specth"></div></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('cards')">Cancel</button><button class="btn btn--primary" onclick="admSaveFacility()">${icon('i-check')} Save</button></div>
  </div>`;
  el('fc_icon').value=f.icon||'i-scope';el('fc_title').value=f.title||'';el('fc_titleth').value=f.titleTh||'';el('fc_spec').value=f.spec||'';el('fc_specth').value=f.specTh||'';
};
window.admSaveFacility=function(){const title=val('fc_title').trim();if(!title){toast(lang==='th'?'ต้องมีชื่อ':'Title required');return;}
  const item={icon:val('fc_icon'),title,titleTh:val('fc_titleth').trim(),spec:val('fc_spec').trim(),specTh:val('fc_specth').trim()};
  if(editIdx>=0)FACILITIES[editIdx]=item;else FACILITIES.push(item);
  saveStore();renderFacilities();renderAdmin('cards');
};
window.admDelFacility=function(i){if(!confirm((lang==='th'?'ลบ ':'Delete ')+FACILITIES[i].title+'?'))return;FACILITIES.splice(i,1);saveStore();renderFacilities();renderAdmin('cards');};

/* -- เส้นเวลา (TIMELINE) -- */
function admTimelineBody(){
  return `<div class="adm-section-t">${TIMELINE.length} ${lang==='th'?'เหตุการณ์ · คลิกเพื่อแก้ไข':'milestones · click to edit'}</div>`+
  TIMELINE.map((t,i)=>`<div class="adm-row">${moveBtns(i,TIMELINE.length,'admMoveTimeline')}<span class="mono-av" style="background:${hue(t.title)}">${t.yr||'?'}</span><div class="r-main"><h4>${esc(t.title)}</h4><div class="r-sub">${esc((t.desc||'').replace(/<[^>]+>/g,'').slice(0,60))}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditTimeline(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelTimeline(${i})">${icon('i-close')}</button></div></div>`).join('')+
  `<button class="adm-add" onclick="admEditTimeline(-1)">${icon('i-plus')} ${lang==='th'?'เพิ่มเหตุการณ์':'Add milestone'}</button>`;
}
window.admEditTimeline=function(i){editIdx=i;const t=i>=0?TIMELINE[i]:{yr:'',title:'',titleTh:'',desc:'',descTh:''};
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('cards')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-field"><label>Year</label><input id="tl_yr"></div>
    <div class="adm-2"><div class="adm-field"><label>Title (English)</label><input id="tl_title"></div><div class="adm-field"><label>Title (Thai)</label><input id="tl_titleth"></div></div>
    <div class="adm-field"><label>Description (English, supports &lt;em&gt;)</label><textarea id="tl_desc"></textarea></div>
    <div class="adm-field"><label>Description (Thai)</label><textarea id="tl_descth"></textarea></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('cards')">Cancel</button><button class="btn btn--primary" onclick="admSaveTimeline()">${icon('i-check')} Save</button></div>
  </div>`;
  el('tl_yr').value=t.yr||'';el('tl_title').value=t.title||'';el('tl_titleth').value=t.titleTh||'';el('tl_desc').value=t.desc||'';el('tl_descth').value=t.descTh||'';
};
window.admSaveTimeline=function(){const title=val('tl_title').trim();if(!title){toast(lang==='th'?'ต้องมีชื่อ':'Title required');return;}
  const item={yr:val('tl_yr').trim(),title,titleTh:val('tl_titleth').trim(),desc:val('tl_desc').trim(),descTh:val('tl_descth').trim()};
  if(editIdx>=0)TIMELINE[editIdx]=item;else TIMELINE.unshift(item);
  saveStore();renderTimeline();renderAdmin('cards');
};
window.admDelTimeline=function(i){if(!confirm((lang==='th'?'ลบเหตุการณ์ ':'Delete ')+TIMELINE[i].title+'?'))return;TIMELINE.splice(i,1);saveStore();renderTimeline();renderAdmin('cards');};

/* -- การ์ดนวัตกรรมในอนาคต (INNOV) -- */
function admInnovBody(){
  return `<div class="adm-section-t">${INNOV.length} ${lang==='th'?'รายการ · คลิกเพื่อแก้ไข':'cards · click to edit'}</div>`+
  INNOV.map((x,i)=>`<div class="adm-row">${moveBtns(i,INNOV.length,'admMoveInnov')}<span class="mono-av" style="background:${hue(x.title)}">${icon(x.icon||'i-spark')}</span><div class="r-main"><h4>${esc(x.no||'')} · ${esc(x.title)}</h4><div class="r-sub">${esc((x.desc||'').slice(0,60))}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditInnov(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelInnov(${i})">${icon('i-close')}</button></div></div>`).join('')+
  `<button class="adm-add" onclick="admEditInnov(-1)">${icon('i-plus')} ${lang==='th'?'เพิ่มการ์ด':'Add card'}</button>`;
}
window.admEditInnov=function(i){editIdx=i;const x=i>=0?INNOV[i]:{no:String(INNOV.length+1).padStart(2,'0'),icon:'i-spark',title:'',titleTh:'',desc:'',descTh:''};
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('cards')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-2"><div class="adm-field"><label>Number</label><input id="iv_no"></div><div class="adm-field"><label>Icon</label><select id="iv_icon"><option value="i-dna">DNA</option><option value="i-scholar">Scholar</option><option value="i-spark">Spark</option><option value="i-cell">Cell</option><option value="i-doc">Document</option></select></div></div>
    <div class="adm-2"><div class="adm-field"><label>Title (English)</label><input id="iv_title"></div><div class="adm-field"><label>Title (Thai)</label><input id="iv_titleth"></div></div>
    <div class="adm-field"><label>Description (English)</label><textarea id="iv_desc"></textarea></div>
    <div class="adm-field"><label>Description (Thai)</label><textarea id="iv_descth"></textarea></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('cards')">Cancel</button><button class="btn btn--primary" onclick="admSaveInnov()">${icon('i-check')} Save</button></div>
  </div>`;
  el('iv_no').value=x.no||'';el('iv_icon').value=x.icon||'i-spark';el('iv_title').value=x.title||'';el('iv_titleth').value=x.titleTh||'';el('iv_desc').value=x.desc||'';el('iv_descth').value=x.descTh||'';
};
window.admSaveInnov=function(){const title=val('iv_title').trim();if(!title){toast(lang==='th'?'ต้องมีชื่อ':'Title required');return;}
  const item={no:val('iv_no').trim(),icon:val('iv_icon'),title,titleTh:val('iv_titleth').trim(),desc:val('iv_desc').trim(),descTh:val('iv_descth').trim()};
  if(editIdx>=0)INNOV[editIdx]=item;else INNOV.push(item);
  saveStore();renderInnov();renderAdmin('cards');
};
window.admDelInnov=function(i){if(!confirm((lang==='th'?'ลบการ์ด ':'Delete ')+INNOV[i].title+'?'))return;INNOV.splice(i,1);saveStore();renderInnov();renderAdmin('cards');};

/* -- ขั้นตอนสมัครเข้าแล็บ (ROAD) -- */
function admRoadBody(){
  return `<div class="adm-section-t">${ROAD.length} ${lang==='th'?'ขั้นตอน · คลิกเพื่อแก้ไข':'steps · click to edit'}</div>`+
  ROAD.map((s,i)=>`<div class="adm-row">${moveBtns(i,ROAD.length,'admMoveRoad')}<span class="mono-av" style="background:${hue(s.title)}">${esc(s.no||'')}</span><div class="r-main"><h4>${esc(s.title)}</h4><div class="r-sub">${esc((s.desc||'').slice(0,60))}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditRoad(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelRoad(${i})">${icon('i-close')}</button></div></div>`).join('')+
  `<button class="adm-add" onclick="admEditRoad(-1)">${icon('i-plus')} ${lang==='th'?'เพิ่มขั้นตอน':'Add step'}</button>`;
}
window.admEditRoad=function(i){editIdx=i;const s=i>=0?ROAD[i]:{no:String(ROAD.length+1),title:'',titleTh:'',desc:'',descTh:''};
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('cards')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-field"><label>Step number</label><input id="rd_no"></div>
    <div class="adm-2"><div class="adm-field"><label>Title (English)</label><input id="rd_title"></div><div class="adm-field"><label>Title (Thai)</label><input id="rd_titleth"></div></div>
    <div class="adm-field"><label>Description (English)</label><textarea id="rd_desc"></textarea></div>
    <div class="adm-field"><label>Description (Thai)</label><textarea id="rd_descth"></textarea></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('cards')">Cancel</button><button class="btn btn--primary" onclick="admSaveRoad()">${icon('i-check')} Save</button></div>
  </div>`;
  el('rd_no').value=s.no||'';el('rd_title').value=s.title||'';el('rd_titleth').value=s.titleTh||'';el('rd_desc').value=s.desc||'';el('rd_descth').value=s.descTh||'';
};
window.admSaveRoad=function(){const title=val('rd_title').trim();if(!title){toast(lang==='th'?'ต้องมีชื่อ':'Title required');return;}
  const item={no:val('rd_no').trim(),title,titleTh:val('rd_titleth').trim(),desc:val('rd_desc').trim(),descTh:val('rd_descth').trim()};
  if(editIdx>=0)ROAD[editIdx]=item;else ROAD.push(item);
  saveStore();renderRoad();renderAdmin('cards');
};
window.admDelRoad=function(i){if(!confirm((lang==='th'?'ลบขั้นตอน ':'Delete ')+ROAD[i].title+'?'))return;ROAD.splice(i,1);saveStore();renderRoad();renderAdmin('cards');};

/* ============ AWARDS + EDITABLE VALUE CHAIN ============ */
const AWARD_MEDIA={"taipei1":"assets/media/awards/taipei-bronze.webp","silver1":"assets/media/awards/silver-ceremony.webp","silver2":"assets/media/awards/silver-plaque.webp","gold1":"assets/media/awards/gold-ceremony.webp","gold2":"assets/media/awards/gold-plaque.webp","expo1":"assets/media/awards/research-expo-certificate.webp","expo2":"assets/media/awards/research-expo-event.webp","toray1":"assets/media/awards/toray-grant.webp"};
let AWARDS=[{"id":"taipei-bronze-2015","title":"Bronze Medal Award — 2015 Taipei International Invention Show & Technomart","titleTh":"รางวัล Bronze Medal Award — งาน 2015 Taipei International Invention Show & Technomart","yearBe":"2558","yearCe":"2015","level":"International","levelTh":"นานาชาติ","category":"Innovation award","categoryTh":"รางวัลนวัตกรรม","organization":"TAITRA, ITRI and Taiwan Technology Marketplace Service Center (TWTM)","organizationTh":"Taiwan External Trade Development Council (TAITRA), Industrial Technology Research Institute (ITRI) และ Taiwan Technology Marketplace Service Center (TWTM)","desc":"Bronze Medal Award presented in Taipei, Taiwan, for “Dillenia capsule against Alzheimer’s disease.”","descTh":"รางวัลเหรียญทองแดง ณ เมืองไทเป ประเทศไต้หวัน จากผลงาน “Dillenia capsule against Alzheimer’s disease”","details":"Held in Taipei, Taiwan, 1–3 October 2015. The submitted invention was Dillenia capsule against Alzheimer’s disease.","detailsTh":"จัดขึ้น ณ เมืองไทเป ประเทศไต้หวัน ระหว่างวันที่ 1–3 ตุลาคม 2558 โดยผลงานที่ส่งเข้าประกวดคือ Dillenia capsule against Alzheimer’s disease","images":[{"src":"assets/media/awards/taipei-bronze.webp","caption":"Award ceremony at the 2015 Taipei International Invention Show & Technomart","captionTh":"พิธีรับรางวัลในงาน 2015 Taipei International Invention Show & Technomart"}]},{"id":"sarasin-silver-2558","title":"Sarasin Distinguished and Honorary Researcher Award — Silver Level","titleTh":"รางวัลนักวิจัยดีเด่นและนักวิจัยเกียรติคุณสารสิน ระดับเงิน","yearBe":"2558","yearCe":"2015","level":"University","levelTh":"มหาวิทยาลัย","category":"Research recognition","categoryTh":"เชิดชูเกียรติด้านการวิจัย","organization":"Khon Kaen University","organizationTh":"มหาวิทยาลัยขอนแก่น","desc":"University research recognition at the Silver level.","descTh":"รางวัลเชิดชูเกียรตินักวิจัยระดับเหรียญเงิน ประจำปีพุทธศักราช 2558","details":"The Silver-level researcher recognition was received on 29 February 2016.","detailsTh":"รับรางวัลเชิดชูเกียรติ นักวิจัยระดับเหรียญเงิน ประจำปีพุทธศักราช 2558 เมื่อวันที่ 29 กุมภาพันธ์ 2559","images":[{"src":"assets/media/awards/silver-ceremony.webp","caption":"Silver-level researcher recognition ceremony","captionTh":"พิธีรับรางวัลเชิดชูเกียรตินักวิจัยระดับเหรียญเงิน"},{"src":"assets/media/awards/silver-plaque.webp","caption":"Silver-level award plaque","captionTh":"โล่รางวัลนักวิจัยระดับเหรียญเงิน"}]},{"id":"khon-dee-innovation-2559","title":"Khon Dee Si Champa — Innovation or Invention Development","titleTh":"คนดีศรีจำปา ด้านการพัฒนานวัตกรรม หรือสิ่งประดิษฐ์คิดค้น","yearBe":"2559","yearCe":"2016","level":"University","levelTh":"มหาวิทยาลัย","category":"Innovation recognition","categoryTh":"เชิดชูเกียรติด้านนวัตกรรม","organization":"Khon Kaen University","organizationTh":"มหาวิทยาลัยขอนแก่น","desc":"Recognition in innovation or invention development.","descTh":"รางวัลคนดีศรีจำปา ด้านการพัฒนานวัตกรรม หรือสิ่งประดิษฐ์คิดค้น","details":"Recorded in the laboratory award chronology for Buddhist year 2559.","detailsTh":"บันทึกในลำดับรางวัลของห้องปฏิบัติการ ประจำปีพุทธศักราช 2559","images":[]},{"id":"sarasin-gold-2560","title":"Sarasin Distinguished and Honorary Researcher Award — Gold Level","titleTh":"รางวัลนักวิจัยดีเด่นและนักวิจัยเกียรติคุณสารสิน ระดับทอง","yearBe":"2560","yearCe":"2017","level":"University","levelTh":"มหาวิทยาลัย","category":"Research recognition","categoryTh":"เชิดชูเกียรติด้านการวิจัย","organization":"Khon Kaen University","organizationTh":"มหาวิทยาลัยขอนแก่น","desc":"University research recognition at the Gold level.","descTh":"รางวัลเชิดชูเกียรตินักวิจัยระดับเหรียญทอง ประจำปีพุทธศักราช 2560","details":"The Gold-level researcher recognition was received on 5 June 2018.","detailsTh":"รับรางวัลเชิดชูเกียรตินักวิจัยระดับเหรียญทอง ประจำปีพุทธศักราช 2560 เมื่อวันที่ 5 มิถุนายน 2561","images":[{"src":"assets/media/awards/gold-ceremony.webp","caption":"Gold-level researcher recognition ceremony","captionTh":"พิธีรับรางวัลเชิดชูเกียรตินักวิจัยระดับเหรียญทอง"},{"src":"assets/media/awards/gold-plaque.webp","caption":"Gold-level award plaque","captionTh":"โล่รางวัลนักวิจัยระดับเหรียญทอง"}]},{"id":"research-expo-2020","title":"Higher Education Innovation Awards — Thailand Research Expo 2020","titleTh":"รางวัลผลงานนวัตกรรมสายอุดมศึกษา ในงานมหกรรมวิจัยแห่งชาติ 2563","yearBe":"2563","yearCe":"2020","level":"National","levelTh":"ระดับประเทศ","category":"Four Bronze Medals","categoryTh":"4 รางวัลเหรียญทองแดง","organization":"Thailand Research Expo 2020","organizationTh":"มหกรรมวิจัยแห่งชาติ 2563 (Thailand Research Expo 2020)","desc":"Four innovations received Bronze Medals: Serum for hair roots, Natural shampoo, Amyrin for anti-acne and chronic/inflammatory wound, and Natural Oleamide.","descTh":"ผลงานนวัตกรรม 4 รายการได้รับรางวัลเหรียญทองแดง ได้แก่ ซีรั่มเพื่อเซลล์รากผม แชมพูธรรมชาติ อมายรินรักษาสิวและแผลอักเสบ และโอลีเอไมด์ธรรมชาติ","details":"The competition was held 2–6 July 2020 at Centara Grand and Bangkok Convention Centre, CentralWorld, Bangkok. Bronze Medal projects: (1) Serum for hair roots, (2) Natural shampoo, (3) Amyrin for anti-acne and chronic/inflammatory wound, and (4) Natural Oleamide.","detailsTh":"การประกวดจัดขึ้นวันที่ 2–6 กรกฎาคม 2563 ณ โรงแรมเซนทาราแกรนด์ และบางกอกคอนเวนชั่นเซนเตอร์ เซ็นทรัลเวิลด์ กรุงเทพฯ ผลงานที่ได้รับรางวัลเหรียญทองแดง ได้แก่ 1) ซีรั่มเพื่อเซลล์รากผม 2) แชมพูธรรมชาติ 3) อมายริน รักษาสิวและแผลอักเสบ และ 4) โอลีเอไมด์ธรรมชาติ","images":[{"src":"assets/media/awards/research-expo-certificate.webp","caption":"Certificates and Bronze Medals from Thailand Research Expo 2020","captionTh":"เกียรติบัตรและเหรียญทองแดงจากงานมหกรรมวิจัยแห่งชาติ 2563"},{"src":"assets/media/awards/research-expo-event.webp","caption":"Research team at Thailand Research Expo 2020","captionTh":"ทีมวิจัยในงานมหกรรมวิจัยแห่งชาติ 2563"}]},{"id":"kku-impact-researcher-2565","title":"KKU Personnel Honour — Outstanding Researcher in Community, Social, Industrial and Commercial Utilisation","titleTh":"รางวัลเชิดชูเกียรติบุคลากรมหาวิทยาลัยขอนแก่น ด้านการวิจัยและการใช้ประโยชน์","yearBe":"2565","yearCe":"2022","level":"University","levelTh":"มหาวิทยาลัย","category":"Research utilisation","categoryTh":"การใช้ประโยชน์งานวิจัย","organization":"Khon Kaen University","organizationTh":"มหาวิทยาลัยขอนแก่น","desc":"Recognition for outstanding research utilisation in community and society, industry and commerce.","descTh":"รางวัลเชิดชูเกียรติด้านการวิจัย รางวัลนักวิจัยโดดเด่นด้านการใช้ประโยชน์ในชุมชนและสังคม ด้านอุตสาหกรรมและเชิงพาณิชย์","details":"Recorded in the laboratory award chronology for Buddhist year 2565.","detailsTh":"บันทึกในลำดับรางวัลของห้องปฏิบัติการ ประจำปีพุทธศักราช 2565","images":[]},{"id":"sarasin-diamond-2565","title":"Sarasin Distinguished and Honorary Researcher Award — Diamond Level","titleTh":"รางวัลนักวิจัยดีเด่นและนักวิจัยเกียรติคุณสารสิน ระดับเพชร","yearBe":"2565","yearCe":"2022","level":"University","levelTh":"มหาวิทยาลัย","category":"Research recognition","categoryTh":"เชิดชูเกียรติด้านการวิจัย","organization":"Khon Kaen University","organizationTh":"มหาวิทยาลัยขอนแก่น","desc":"University research recognition at the Diamond level.","descTh":"รางวัลนักวิจัยดีเด่นและนักวิจัยเกียรติคุณสารสิน ระดับเพชร","details":"Recorded in the laboratory award chronology for Buddhist year 2565.","detailsTh":"บันทึกในลำดับรางวัลของห้องปฏิบัติการ ประจำปีพุทธศักราช 2565","images":[]},{"id":"khon-dee-research-2566","title":"Khon Dee Si Champa — Research","titleTh":"รางวัลคนดีศรีจำปา ด้านการวิจัย","yearBe":"2566","yearCe":"2023","level":"University","levelTh":"มหาวิทยาลัย","category":"Research recognition","categoryTh":"เชิดชูเกียรติด้านการวิจัย","organization":"Khon Kaen University","organizationTh":"มหาวิทยาลัยขอนแก่น","desc":"Khon Dee Si Champa recognition in research.","descTh":"รางวัลคนดีศรีจำปา ด้านการวิจัย","details":"Recorded in the laboratory award chronology for Buddhist year 2566.","detailsTh":"บันทึกในลำดับรางวัลของห้องปฏิบัติการ ประจำปีพุทธศักราช 2566","images":[]},{"id":"kku-60-academic-2567","title":"Personnel Honour for Academic Achievement — KKU 60th Anniversary","titleTh":"รางวัลเชิดชูเกียรติบุคลากร ด้านสร้างผลงานวิชาการ ในงาน 60 ปี แห่งการสร้างสรรค์และพัฒนาเพื่อสังคม","yearBe":"2567","yearCe":"2024","level":"University","levelTh":"มหาวิทยาลัย","category":"Academic achievement","categoryTh":"ผลงานวิชาการ","organization":"Khon Kaen University","organizationTh":"มหาวิทยาลัยขอนแก่น","desc":"Personnel recognition for creating academic work during KKU’s 60-year celebration.","descTh":"รางวัลเชิดชูเกียรติบุคลากรด้านสร้างผลงานวิชาการ ในงาน 60 ปี แห่งการสร้างสรรค์และพัฒนาเพื่อสังคม","details":"Recorded in the laboratory award chronology for Buddhist year 2567.","detailsTh":"บันทึกในลำดับรางวัลของห้องปฏิบัติการ ประจำปีพุทธศักราช 2567","images":[]},{"id":"toray-grant-2558","title":"22nd Toray Science and Technology Research Assistance Grant","titleTh":"ทุนช่วยเหลือทางด้านวิจัยวิทยาศาสตร์และเทคโนโลยี มูลนิธิโทเร ครั้งที่ 22","yearBe":"2558","yearCe":"2015","level":"Research support","levelTh":"ทุนสนับสนุนการวิจัย","category":"Research grant","categoryTh":"ทุนวิจัย","organization":"Thailand Toray Science Foundation","organizationTh":"มูลนิธิโทเรเพื่อการส่งเสริมวิทยาศาสตร์ ประเทศไทย","desc":"Research assistance grant from the Thailand Toray Science Foundation.","descTh":"รับทุนช่วยเหลือทางด้านวิจัยวิทยาศาสตร์และเทคโนโลยี มูลนิธิโทเรเพื่อการส่งเสริมวิทยาศาสตร์ ประเทศไทย ครั้งที่ 22","details":"The 2558 grant was received on 11 March 2016 from General Surayud Chulanont, President of the Privy Council.","detailsTh":"ทุนประจำปี 2558 รับเมื่อวันที่ 11 มีนาคม 2559 จาก พลเอก สุรยุทธ์ จุลานนท์ ประธานองคมนตรี","images":[{"src":"assets/media/awards/toray-grant.webp","caption":"Presentation of the Toray research assistance grant","captionTh":"พิธีรับทุนช่วยเหลือทางด้านวิจัยวิทยาศาสตร์และเทคโนโลยี มูลนิธิโทเร"}]}];
let AWARD_OBJECTS=[];
let AWARD_SETTINGS={speed:38,size:210};
let VALUE_CHAIN=[{"key":"up","no":"01","phase":"Upstream","phaseTh":"ต้นน้ำ","icon":"i-plant","title":"Plant discovery & foundational research","titleTh":"การค้นพบพืชและงานวิจัยพื้นฐาน","desc":"Select target plants, document biodiversity, study genomes and chemistry, and test biological activity in the laboratory.","descTh":"คัดเลือกพืชเป้าหมาย บันทึกความหลากหลาย ศึกษาจีโนมและสารพฤกษเคมี พร้อมทดสอบฤทธิ์ทางชีวภาพในห้องปฏิบัติการ","points":["Taxonomy","Genomics","Phytochemistry","Bioactivity"],"pointsTh":["อนุกรมวิธาน","จีโนมิกส์","พฤกษเคมี","ฤทธิ์ทางชีวภาพ"],"cta":"Explore upstream research","ctaTh":"สำรวจงานวิจัยต้นน้ำ","link":"#research","statKind":"taxa","statLabel":"focal plant groups","statLabelTh":"กลุ่มพืชเป้าหมาย","methodTab":"systematics","methodCta":"Open research methods","methodCtaTh":"เปิดแผนผังวิธีวิจัย"},{"key":"mid","no":"02","phase":"Midstream","phaseTh":"กลางน้ำ","icon":"i-doc","title":"Research outputs & intellectual property","titleTh":"ผลงานวิจัยและทรัพย์สินทางปัญญา","desc":"Convert evidence into peer-reviewed publications, patents and petty patents that protect formulas and support technology transfer.","descTh":"เปลี่ยนหลักฐานทางวิทยาศาสตร์เป็นบทความ สิทธิบัตร และอนุสิทธิบัตร เพื่อคุ้มครองสูตรและสนับสนุนการถ่ายทอดเทคโนโลยี","points":["Publications","Patents","Petty patents","Technology transfer"],"pointsTh":["ผลงานตีพิมพ์","สิทธิบัตร","อนุสิทธิบัตร","ถ่ายทอดเทคโนโลยี"],"cta":"View the IP portfolio","ctaTh":"ดูทรัพย์สินทางปัญญา","link":"#ip-portfolio","statKind":"ip","statLabel":"IP records","statLabelTh":"รายการทรัพย์สินทางปัญญา","methodTab":"","methodCta":"","methodCtaTh":""},{"key":"down","no":"03","phase":"Downstream","phaseTh":"ปลายน้ำ","icon":"i-flask","title":"Registered products & market use","titleTh":"ผลิตภัณฑ์ที่ขึ้นทะเบียนและการใช้ประโยชน์","desc":"Develop protected formulas into health, herbal, food and cosmetic products distributed through Sciseeit Co., Ltd.","descTh":"พัฒนาสูตรที่ได้รับการคุ้มครองเป็นผลิตภัณฑ์สุขภาพ สมุนไพร อาหาร และเครื่องสำอางที่จัดจำหน่ายผ่าน Sciseeit Co., Ltd.","points":["Supplements","Cosmetics","Herbal medicine","Food innovation"],"pointsTh":["ผลิตภัณฑ์เสริมอาหาร","เครื่องสำอาง","ยาสมุนไพร","นวัตกรรมอาหาร"],"cta":"See downstream products","ctaTh":"ดูผลิตภัณฑ์ปลายน้ำ","link":"#products","statKind":"products","statLabel":"product entries","statLabelTh":"รายการผลิตภัณฑ์","methodTab":"","methodCta":"","methodCtaTh":""}];

function awardText(a,key){const th=a[key+'Th'];return lang==='th'&&th?th:(a[key]||'');}
function awardStatValue(kind){
  if(kind==='taxa')return Array.isArray(TAXA)?TAXA.length:0;
  if(kind==='ip')return Array.isArray(IP_ASSETS)?IP_ASSETS.length:0;
  if(kind==='products')return Array.isArray(PRODUCTS)?PRODUCTS.length:0;
  if(kind==='publications')return Array.isArray(CPUBS)?CPUBS.length:0;
  return 0;
}
function renderValueChain(){
  const w=el('valueChainCards');if(!w||!Array.isArray(VALUE_CHAIN))return;
  w.innerHTML=VALUE_CHAIN.map((v,i)=>{
    const points=lang==='th'&&Array.isArray(v.pointsTh)&&v.pointsTh.length?v.pointsTh:(v.points||[]);
    const method=v.methodTab?`<button type="button" class="vc-method-link" onclick="openMethodAtlas('${esc(v.methodTab)}')"><span>${esc(lang==='th'?(v.methodCtaTh||v.methodCta):(v.methodCta||''))}</span>${icon('i-up')}</button>`:'';
    return `${i?`<div class="vc-arrow" aria-hidden="true"><span>${icon('i-arrow')}</span></div>`:''}<article class="vc-stage vc-stage--${esc(v.key||'up')}">
      <div class="vc-stage__top"><span class="vc-stage__no">${esc(v.no||String(i+1).padStart(2,'0'))}</span><span class="vc-stage__phase">${esc(lang==='th'?(v.phaseTh||v.phase):v.phase)}</span></div>
      <span class="vc-stage__icon">${icon(v.icon||'i-plant')}</span>
      <h3>${esc(lang==='th'?(v.titleTh||v.title):v.title)}</h3>
      <p>${esc(lang==='th'?(v.descTh||v.desc):v.desc)}</p>
      <div class="vc-points">${points.map(x=>`<span>${esc(x)}</span>`).join('')}</div>
      <div class="vc-stage__foot"><div class="vc-link-stack"><a href="${esc(v.link||'#research')}" class="vc-link nav-scroll"><span>${esc(lang==='th'?(v.ctaTh||v.cta):v.cta)}</span>${icon('i-arrow')}</a>${method}</div>
      <span class="vc-stat"><strong>${awardStatValue(v.statKind)}</strong><span>${esc(lang==='th'?(v.statLabelTh||v.statLabel):v.statLabel)}</span></span></div>
    </article>`;
  }).join('');
}
function renderAwardObjects(){
  const wrap=el('awardMarquee'),track=el('awardMarqueeTrack');if(!wrap||!track)return;
  if(!Array.isArray(AWARD_OBJECTS)||!AWARD_OBJECTS.length){wrap.hidden=true;track.innerHTML='';return;}
  wrap.hidden=false;
  const n=Math.max(1,Math.ceil(6/AWARD_OBJECTS.length));
  const base=Array.from({length:n},()=>AWARD_OBJECTS).flat();
  const group=base.map(o=>`<figure class="award-float" style="--award-size:${Math.max(110,Math.min(360,+AWARD_SETTINGS.size||210))}px"><img src="${o.src||''}" alt="${esc(lang==='th'?(o.altTh||o.alt||o.titleTh||o.title):(o.alt||o.title||''))}" loading="lazy"><figcaption class="award-float__cap">${esc((lang==='th'?(o.titleTh||o.title):o.title)||o.year||'Award')}${o.year?' · '+esc(o.year):''}</figcaption></figure>`).join('');
  track.style.setProperty('--award-speed',Math.max(12,Math.min(120,+AWARD_SETTINGS.speed||38))+'s');
  track.innerHTML=`<div class="award-marquee__group">${group}</div><div class="award-marquee__group" aria-hidden="true">${group}</div>`;
}
function renderAwards(){
  const grid=el('awardGrid'),summary=el('awardSummary');if(!grid||!summary)return;
  const international=AWARDS.filter(a=>(a.level||'').toLowerCase().includes('international')).length;
  const national=AWARDS.filter(a=>(a.level||'').toLowerCase().includes('national')).length;
  const university=AWARDS.filter(a=>(a.level||'').toLowerCase().includes('university')).length;
  const stats=[[AWARDS.length,lang==='th'?'รายการรางวัลและการยอมรับ':'recognitions'],[international,lang==='th'?'ระดับนานาชาติ':'international'],[national,lang==='th'?'ระดับประเทศ':'national'],[university,lang==='th'?'ระดับมหาวิทยาลัย':'university']];
  summary.innerHTML=stats.map(x=>`<div class="award-stat"><strong>${x[0]}</strong><span>${x[1]}</span></div>`).join('');
  grid.innerHTML=AWARDS.map((a,i)=>{
    const imgs=Array.isArray(a.images)?a.images:[];
    const visual=imgs[0]&&imgs[0].src?`<img src="${imgs[0].src}" alt="${esc(awardText(a,'title'))}" loading="lazy">`:`<span class="award-card__placeholder">${icon('i-scholar')}</span>`;
    return `<article class="award-card reveal in" onclick="openAward(${i})" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openAward(${i})}">
      <div class="award-card__visual">${visual}<span class="award-card__year">พ.ศ. ${esc(a.yearBe||'—')} · ${esc(a.yearCe||'—')}</span>${imgs.length>1?`<span class="award-card__count">${imgs.length} photos</span>`:''}</div>
      <div class="award-card__body"><div class="award-card__meta"><span>${esc(awardText(a,'level'))}</span><span>${esc(awardText(a,'category'))}</span></div><h3>${esc(awardText(a,'title'))}</h3><p>${esc(awardText(a,'desc'))}</p><span class="award-card__more">${lang==='th'?'ดูรายละเอียด':'View details'} ${icon('i-arrow')}</span></div>
    </article>`;
  }).join('');
}
window.awardModalSetImage=function(i){
  const thumbs=[...document.querySelectorAll('#awardModalThumbs .award-modal__thumb')];thumbs.forEach((x,j)=>x.classList.toggle('active',i===j));
  const btn=thumbs[i],hero=el('awardModalHero');if(btn&&hero){hero.src=btn.dataset.src;hero.alt=btn.dataset.alt||'';}
};
window.openAward=function(i){
  const a=AWARDS[i];if(!a)return;const imgs=Array.isArray(a.images)?a.images:[];
  el('awardModalChip').textContent=awardText(a,'category');el('awardModalTitle').textContent=awardText(a,'title');el('awardModalDesc').textContent=awardText(a,'desc');
  el('awardYearLabel').textContent=lang==='th'?'ปีที่ได้รับ':'Year';el('awardLevelLabel').textContent=lang==='th'?'ระดับ':'Level';
  el('awardModalYear').textContent=`พ.ศ. ${a.yearBe||'—'} · ${a.yearCe||'—'}`;el('awardModalLevel').textContent=awardText(a,'level');el('awardModalDetails').textContent=awardText(a,'details');el('awardModalOrg').textContent=awardText(a,'organization');
  const media=el('awardModalMedia'),thumbs=el('awardModalThumbs'),hero=el('awardModalHero');
  if(imgs.length){media.style.display='flex';thumbs.innerHTML=imgs.map((im,j)=>`<button class="award-modal__thumb ${j===0?'active':''}" data-src="${im.src}" data-alt="${esc(lang==='th'?(im.captionTh||im.caption):im.caption)}" onclick="awardModalSetImage(${j})"><img src="${im.src}" alt=""></button>`).join('');hero.src=imgs[0].src;hero.alt=lang==='th'?(imgs[0].captionTh||imgs[0].caption):imgs[0].caption;}
  else{media.style.display='none';thumbs.innerHTML='';hero.removeAttribute('src');}
  openModal('awardModal');
};

/* set professor photo everywhere */
document.querySelectorAll('[data-prof]').forEach(i=>{i.src=PROF_IMG;});

/* ============ CMS STORE (localStorage) ============ */
const THEME_PRESETS=[
  {id:'forest',name:'Forest',nameTh:'ป่าเขียว (ค่าเริ่มต้น)',c1:'#2f6b4f',c2:'#f7f6f1'},
  {id:'ocean', name:'Ocean', nameTh:'สีน้ำเงินทะเล',c1:'#1f5fa8',c2:'#f5f7fa'},
  {id:'amber', name:'Amber', nameTh:'อำพัน',c1:'#b1591f',c2:'#faf6ef'},
  {id:'berry', name:'Berry', nameTh:'เบอร์รี่',c1:'#8a2f66',c2:'#f8f5f7'},
  {id:'slate', name:'Slate', nameTh:'สเลท',c1:'#3a4a5c',c2:'#f6f7f8'}
];
let SITE_ACCENT='forest';
let HIDDEN_SECTIONS=new Set();
function applyAccent(id){SITE_ACCENT=id;document.documentElement.setAttribute('data-preset',id);}
const LS_KEY='aclab_cms_v1';
function loadStore(){try{return JSON.parse(localStorage.getItem(LS_KEY))||{};}catch(e){return {};}}
function cmsPayload(){return {members:MEMBERS,news:NEWS,cpubs:CPUBS,ipAssets:IP_ASSETS,products:PRODUCTS,videos:VIDEOS,taxa:TAXA,collabs:COLLABS,testimonials:TESTIMONIALS,banners:BANNERS,events:EVENTS,gallery:GALLERY,resources:RESOURCES,grantTeam:GRANT_TEAM,theme:SITE_ACCENT,hiddenSections:[...HIDDEN_SECTIONS],themes:THEMES,pipe:PIPE,facilities:FACILITIES,timeline:TIMELINE,road:ROAD,innov:INNOV,textOverrides:TEXT_OVERRIDES,sectionOrder:SECTION_ORDER,customSections:CUSTOM_SECTIONS,awards:AWARDS,awardObjects:AWARD_OBJECTS,awardSettings:AWARD_SETTINGS,valueChain:VALUE_CHAIN};}
function applyCMSData(s){
  if(!s||typeof s!=='object')return;
  if(Array.isArray(s.members))MEMBERS=s.members;
  if(Array.isArray(s.news))NEWS=s.news;
  if(Array.isArray(s.cpubs))CPUBS=s.cpubs;
  if(Array.isArray(s.ipAssets))IP_ASSETS=s.ipAssets;
  if(Array.isArray(s.products))PRODUCTS=s.products;
  if(Array.isArray(s.videos))VIDEOS=s.videos;
  if(Array.isArray(s.taxa))TAXA=s.taxa;
  if(Array.isArray(s.collabs))COLLABS=s.collabs;
  if(Array.isArray(s.testimonials))TESTIMONIALS=s.testimonials;
  if(Array.isArray(s.banners))BANNERS=s.banners;
  if(Array.isArray(s.events))EVENTS=s.events;
  if(Array.isArray(s.gallery))GALLERY=s.gallery;
  if(Array.isArray(s.resources))RESOURCES=s.resources;
  if(Array.isArray(s.grantTeam))GRANT_TEAM=s.grantTeam;
  if(Array.isArray(s.themes))THEMES=s.themes;
  if(Array.isArray(s.pipe))PIPE=s.pipe;
  if(Array.isArray(s.facilities))FACILITIES=s.facilities;
  if(Array.isArray(s.timeline))TIMELINE=s.timeline;
  if(Array.isArray(s.road))ROAD=s.road;
  if(Array.isArray(s.innov))INNOV=s.innov;
  if(Array.isArray(s.customSections))CUSTOM_SECTIONS=s.customSections;
  if(Array.isArray(s.awards))AWARDS=s.awards;
  if(Array.isArray(s.awardObjects))AWARD_OBJECTS=s.awardObjects;
  if(Array.isArray(s.valueChain))VALUE_CHAIN=s.valueChain;
  if(s.textOverrides&&typeof s.textOverrides==='object')TEXT_OVERRIDES=s.textOverrides;
  if(Array.isArray(s.sectionOrder)&&s.sectionOrder.length)SECTION_ORDER=s.sectionOrder;
  if(Array.isArray(s.hiddenSections))HIDDEN_SECTIONS=new Set(s.hiddenSections);
  if(s.awardSettings&&typeof s.awardSettings==='object')AWARD_SETTINGS={...AWARD_SETTINGS,...s.awardSettings};
  if(s.theme)SITE_ACCENT=s.theme;
  CUSTOM_SECTIONS.forEach(cs=>{if(cs&&cs.id&&!SECTION_ORDER.includes(cs.id))SECTION_ORDER.push(cs.id);});
  syncBuiltInSectionOrder();
}
function saveStore(silent){try{localStorage.setItem(LS_KEY,JSON.stringify(cmsPayload()));if(!silent)toast(T('saved_toast'));return true;}catch(e){toast('Save failed — storage full');return false;}}
(function(){const st=loadStore();applyCMSData(st);applyAccent(SITE_ACCENT);applySectionVisibility();applySectionOrder();renderValueChain();renderAwards();renderAwardObjects();})();
function renderThemes(){
  el('rgrid').innerHTML=THEMES.map((t,i)=>`
  <article class="rcard reveal in" data-d="${i}"><span class="rcard__no mono">0${i+1}</span><span class="rcard__ic">${icon(t.icon)}</span><h3>${lang==='th'&&t.titleTh?t.titleTh:t.title}</h3><p>${lang==='th'&&t.descTh?t.descTh:t.desc}</p><div class="rcard__tags">${(t.tags||[]).map(x=>`<span class="t">${x}</span>`).join('')}</div></article>`).join('');
}
renderThemes();

function renderPipe(){
  el('pipe').innerHTML=PIPE.map((p,i)=>`
  <div class="pstep reveal in" data-d="${i}"><span class="no">${p.no}</span><div class="ic">${icon(p.icon)}</div><h4>${lang==='th'&&p.titleTh?p.titleTh:p.title}</h4><p>${lang==='th'&&p.descTh?p.descTh:p.desc}</p>${i<PIPE.length-1?`<span class="arr">${icon('i-arrow')}</span>`:''}</div>`).join('');
}
renderPipe();

function renderTaxa(){
  el('taxaGrid').innerHTML=TAXA.map((t,i)=>`
  <article class="taxa reveal in" data-d="${i%3}"><div class="taxa__img"><span class="taxa__acc mono">${t.acc||''}</span><img src="${t.img||''}" alt="${t.sp}" loading="lazy" onerror="this.style.opacity=.2"></div><div class="taxa__body"><h3>${t.sp}</h3><div class="en">${lang==='th'&&t.enTh?t.enTh:t.en}</div><p>${lang==='th'&&t.descTh?t.descTh:t.desc}</p></div></article>`).join('');
}
renderTaxa();

function renderFacilities(){
  el('facGrid').innerHTML=FACILITIES.map(f=>`<div class="fac reveal in"><span class="ic">${icon(f.icon)}</span><h4>${lang==='th'&&f.titleTh?f.titleTh:f.title}</h4><div class="spec">${lang==='th'&&f.specTh?f.specTh:f.spec}</div></div>`).join('');
}
function renderTimeline(){
  el('timeline').innerHTML=TIMELINE.map(t=>`<div class="tl reveal in"><div class="yr">${t.yr}</div><h4>${lang==='th'&&t.titleTh?t.titleTh:t.title}</h4><p>${lang==='th'&&t.descTh?t.descTh:t.desc}</p></div>`).join('');
}
renderFacilities();renderTimeline();
function renderCollabs(){
  el('collabGrid').innerHTML=COLLABS.map((c,i)=>`<article class="collab reveal in" data-d="${i}"><div class="collab__top"><span class="flag"><img src="${c.flag}" alt="${c.cc}" loading="lazy"></span><span class="cc">${c.cc}</span></div><h3>${c.name}</h3><p>${lang==='th'&&c.descTh?c.descTh:c.desc}</p><div class="collab__tags">${(c.tags||[]).map(x=>`<span class="t">${x}</span>`).join('')}</div></article>`).join('');
}
renderCollabs();
function renderRoad(){
  el('road').innerHTML=ROAD.map(s=>`<div class="step"><span class="step__no">${s.no}</span><div class="step__b"><h4>${lang==='th'&&s.titleTh?s.titleTh:s.title}</h4><p>${lang==='th'&&s.descTh?s.descTh:s.desc}</p></div></div>`).join('');
}
renderRoad();function renderResources(){
  const w=el('resList');if(!w)return;
  if(!RESOURCES.length){w.innerHTML=`<p style="font-size:.85rem;color:var(--muted);padding:10px 0">${lang==='th'?'ยังไม่มีเอกสาร':'No resources yet.'}</p>`;return;}
  w.innerHTML=RESOURCES.map(r=>{
    const title=lang==='th'&&r.titleTh?r.titleTh:r.title;
    const meta=lang==='th'&&r.metaTh?r.metaTh:r.meta;
    const hasLink=r.link&&r.link.trim();
    const attrs=hasLink?`href="${esc(r.link)}" target="_blank" rel="noopener"`:`href="#" onclick="toast(T('res_toast'));return false"`;
    return `<a class="res" ${attrs}><span class="ic">${icon(r.icon||'i-doc')}</span><div><h4>${esc(title)}</h4><div class="m">${esc(meta||'')}</div></div><span class="go">${icon('i-arrow')}</span></a>`;
  }).join('');
}
renderResources();function renderGallery(){
  const g=el('gallery');if(!g)return;
  if(!GALLERY.length){g.innerHTML=`<p style="font-size:.8rem;color:var(--muted)">${lang==='th'?'ยังไม่มีรูปภาพ':'No photos yet.'}</p>`;return;}
  g.innerHTML=GALLERY.map(src=>`<div class="g" onclick="openLightbox('${src}')"><img src="${src}" alt="Lab" loading="lazy"></div>`).join('');
}
renderGallery();
function renderEvents(){
  const w=el('eventsList');if(!w)return;
  if(!EVENTS.length){w.innerHTML=`<p style="font-size:.85rem;color:var(--muted);padding:14px 0">${lang==='th'?'ยังไม่มีกิจกรรม':'No upcoming events yet.'}</p>`;return;}
  w.innerHTML=EVENTS.map(ev=>`<div class="event" onclick="toast(T('ev_toast'))"><div class="cal"><span class="mo">${esc(ev.month)}</span><span class="dy">${esc(ev.day)}</span></div><div><h4>${esc(lang==='th'&&ev.titleTh?ev.titleTh:ev.title)}</h4><div class="who">${esc(lang==='th'&&ev.whoTh?ev.whoTh:ev.who)}</div></div></div>`).join('');
}
renderEvents();
function renderNews(){el('newsGrid').innerHTML=NEWS.slice(0,2).map(n=>`<article class="news-card reveal in" onclick="openNews(${n.id})"><div class="news-card__img"><img src="${n.img}" alt="${n.title}" loading="lazy" onerror="this.style.opacity=.15"></div><div class="news-card__b"><div class="news-card__date">${n.date}</div><h4>${n.title}</h4><div class="news-card__more" data-more>Read more ${icon('i-arrow')}</div></div></article>`).join('');}
renderNews();

/* ============ PUBLICATIONS (live from ORCID) ============ */
const ORCID='0000-0002-7466-4243';
let pubYear='all';
let pubExpanded=false;
let ORCID_OK=false;
let DOI_PUBS=[];
let SRC={mode:'load',n:0};
function setSrc(){const t=el('pubSourceTxt'),P=el('pubSource');if(!t)return;P.classList.remove('ok','warn');
  if(SRC.mode==='ok'){t.textContent=(lang==='th'?'ดึงสดจาก ORCID · ':'Live from ORCID · ')+SRC.n+(lang==='th'?' ผลงาน':' works');P.classList.add('ok');}
  else if(SRC.mode==='warn'){t.textContent=(lang==='th'?'แสดงผลงานคัดสรร (เชื่อม ORCID ไม่ได้)':'Showing selected papers (ORCID offline)');P.classList.add('warn');}
  else{t.textContent=(lang==='th'?'กำลังดึงข้อมูลจาก ORCID…':'Loading live from ORCID…');}}
const CURATED=PUBS.slice();               // 4 hand-written papers w/ abstracts (fallback + enrichment)
function activePubs(){
  const base=(ORCID_OK?PUBS:CURATED).concat(CPUBS);
  const knownDoi=new Set(base.map(p=>(p.doi||'').toLowerCase()).filter(Boolean));
  const knownTitle=new Set(base.map(p=>norm(p.title)).filter(Boolean));
  const extra=DOI_PUBS.filter(p=>{
    const doi=(p.doi||'').toLowerCase();
    const t=norm(p.title);
    if(doi && knownDoi.has(doi)) return false;   // ซ้ำ DOI
    if(t && knownTitle.has(t)) return false;      // ซ้ำชื่อเรื่อง (เผื่อ DOI ไม่ตรง/ไม่มี)
    return true;
  });
  return base.concat(extra).slice().sort((a,b)=>(b.year-a.year)||0);
}function enrich(p){ // add abstract from curated match if ORCID lacks one
  if(p.abstract) return p;
  const c=CURATED.find(x=>x.doi&&p.doi&&x.doi.toLowerCase()===p.doi.toLowerCase())||CURATED.find(x=>norm(x.title)===norm(p.title));
  return c?{...p,abstract:p.abstract||c.abstract,authors:p.authors||c.authors}:p;
}
function norm(s){return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,50);} function norm(s){return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,50);}
function safeTitleHTML(s){
  // อนุญาตแค่แท็กเอียง/หนา ที่ใช้จริงในชื่อบทความวิทยาศาสตร์
  return (s||'').replace(/<(?!\/?(i|b|em|sup|sub)\b)[^>]*>/gi,'');
}
function pubCard(p){return `<div class="pub" onclick="openPub(${p.id})"><span class="pub__yr">${p.year||'—'}</span><div class="pub__main"><h4>${p.title}</h4>${p.authors?`<div class="by">${p.authors}</div>`:''}<div class="jr">${p.journal||''}</div></div><span class="pub__go">${icon('i-arrow')}</span></div>`;}
window.setYear=function(y,btn){
  pubYear=y;pubExpanded=false;
  document.querySelectorAll('#pubFilters .pfilter').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');renderPubs();
};function renderYearChips(){
  const years=[...new Set(activePubs().map(p=>p.year).filter(Boolean))].sort((a,b)=>b-a);
  const all=`<button class="pfilter ${pubYear==='all'?'active':''}" onclick="setYear('all',this)" data-i18n="pf_all">${lang==='th'?'ทั้งหมด':'All'}</button>`;
  el('pubFilters').innerHTML=all+years.map(y=>`<button class="pfilter ${pubYear==y?'active':''}" onclick="setYear('${y}',this)">${y}</button>`).join('');
}
window.renderPubs=function(){
  const term=(el('pubSearch').value||'').toLowerCase();
  let items=activePubs();
  if(pubYear!=='all')items=items.filter(p=>String(p.year)===String(pubYear));
  if(term)items=items.filter(p=>((p.title||'')+(p.authors||'')+(p.journal||'')+(p.year||'')).toLowerCase().includes(term));
  const L=el('pubList');
  if(!items.length){L.innerHTML='';el('pubEmpty').style.display='block';el('pubMore').style.display='none';L.classList.remove('pub-list--scroll');return;}
  el('pubEmpty').style.display='none';

  const LIMIT=5;
  const shown=pubExpanded?items:items.slice(0,LIMIT);
  const groups={};shown.forEach(p=>{const y=p.year||'—';(groups[y]=groups[y]||[]).push(p);});
  const years=Object.keys(groups).sort((a,b)=>(b==='—'?-1:(a==='—'?1:b-a)));
  L.innerHTML=years.map(y=>`<div class="pub-year-h"><span>${y}</span><span class="mono">${groups[y].length}</span></div>`+groups[y].map(pubCard).join('')).join('');
  L.classList.remove('pub-list--scroll');

  const remaining=items.length-shown.length;
  const moreBtn=el('pubMore');
  if(items.length>LIMIT){
    moreBtn.style.display='block';
    moreBtn.innerHTML=pubExpanded
      ? `<button class="btn btn--ghost" onclick="togglePubExpand()">${lang==='th'?'ย่อรายการ':'Show less'} <svg class="icon" style="transform:rotate(-90deg)"><use href="#i-arrow"/></svg></button>`
      : `<button class="btn btn--ghost" onclick="togglePubExpand()">${lang==='th'?('ดูอีก '+remaining+' รายการ'):('Show '+remaining+' more')} <svg class="icon" style="transform:rotate(90deg)"><use href="#i-arrow"/></svg></button>`;
  } else {
    moreBtn.style.display='none';
  }
};
window.togglePubExpand=function(){
  pubExpanded=!pubExpanded;renderPubs();
  const card=document.querySelector('.pub-tools');
  if(card)card.scrollIntoView({behavior:'smooth',block:'nearest'});
};

function renderFeature(){
  const list=activePubs();const feat=list.find(p=>p.feat)||list[0];if(!feat){el('pubFeature').innerHTML='';return;}
  const fe=enrich(feat);
  el('pubFeature').innerHTML=`<div class="ring"></div><span class="tag">${lang==='th'?'ผลงานล่าสุด':'Featured paper'} · ${fe.year||''}</span><h3>${fe.title}</h3>${fe.authors?`<div class="by">${fe.authors}</div>`:''}<div class="jr">${fe.journal||''}</div>${fe.abstract?`<p class="abs">${fe.abstract}</p>`:''}<button class="btn btn--primary btn--sm" onclick="openPub(${fe.id})">${lang==='th'?'ดูรายละเอียด':'View details'} ${icon('i-arrow')}</button>`;
}
function renderPubChart(){
  const list=activePubs().filter(p=>p.year);
  const counts={};list.forEach(p=>{counts[p.year]=(counts[p.year]||0)+1;});
  let years=Object.keys(counts).map(Number).sort((a,b)=>a-b);
  if(years.length>12)years=years.slice(years.length-12);
  const max=Math.max(1,...years.map(y=>counts[y]));
  el('pubTotal').textContent=list.length+(lang==='th'?' ชิ้น':' total');
  if(!years.length){el('pubChart').innerHTML='';return;}
  el('pubChart').innerHTML=years.map(y=>{
    const h=Math.round(counts[y]/max*100);
    return `<div class="bar-col" title="${y}: ${counts[y]}"><span class="bar-v">${counts[y]}</span><span class="bar" style="height:${h}%"></span><span class="bar-y">'${String(y).slice(2)}</span></div>`;
  }).join('');
}
function renderPubAll(){renderYearChips();renderPubs();renderFeature();renderPubChart();setSrc();}
renderPubAll();

/* ---- fetch full works from ORCID public API (with CORS-proxy fallbacks) ---- */
async function orcidData(){
  const api=`https://pub.orcid.org/v3.0/${ORCID}/works`;
  const srcs=[
    {u:api,o:{headers:{'Accept':'application/json'}}},
    {u:'https://api.allorigins.win/raw?url='+encodeURIComponent(api),o:{}},
    {u:'https://corsproxy.io/?url='+encodeURIComponent(api),o:{}},
    {u:'https://thingproxy.freeboard.io/fetch/'+api,o:{headers:{'Accept':'application/json'}}}
  ];
  for(const s of srcs){
    try{const r=await fetch(s.u,s.o);if(!r.ok)continue;const j=await r.json();if(j&&j.group)return j;}catch(e){}
  }
  return null;
}
(async function loadOrcid(){
  const data=await orcidData();
  if(data){
    const groups=data.group||[];
    const seen=new Set();const out=[];
    groups.forEach(g=>{
      const ws=(g['work-summary']||[])[0];if(!ws)return;
      const title=ws.title&&ws.title.title&&ws.title.title.value;if(!title)return;
      const key=norm(title);if(seen.has(key))return;seen.add(key);
      const year=ws['publication-date']&&ws['publication-date'].year&&+ws['publication-date'].year.value||'';
      const month=ws['publication-date']&&ws['publication-date'].month&&+ws['publication-date'].month.value||0;
      const journal=(ws['journal-title']&&ws['journal-title'].value)||'';
      const type=(ws.type||'').replace(/-/g,' ');
      let doi='',url=(ws.url&&ws.url.value)||'';
      const ids=(ws['external-ids']&&ws['external-ids']['external-id'])||[];
      ids.forEach(id=>{if((id['external-id-type']||'').toLowerCase()==='doi'){doi=id['external-id-value'];if(id['external-id-url']&&id['external-id-url'].value)url=id['external-id-url'].value;}});
      if(!url&&doi)url='https://doi.org/'+doi;
      if(!url)url='https://orcid.org/'+ORCID;
      out.push({id:ws['put-code'],putcode:ws['put-code'],year:year,month:month,title:title,journal:journal||type,link:url,doi:doi,authors:'',abstract:''});
    });
    out.sort((a,b)=>(b.year-a.year)||(b.month-a.month));
    if(out.length){out[0].feat=true;PUBS=out;ORCID_OK=true;SRC={mode:'ok',n:out.length};}
    else{ORCID_OK=false;SRC={mode:'warn'};}
  } else {ORCID_OK=false;SRC={mode:'warn'};}
  renderPubAll();
})();

(async function loadOrcid(){

  renderPubAll();
})();

/* ---- ดึงผลงานเพิ่มเติมผ่าน DOI จาก Crossref (เติมส่วนที่ ORCID ดึงไม่ครบ) ---- */
function doiId(doi){let h=0;for(let i=0;i<doi.length;i++)h=((h<<5)-h+doi.charCodeAt(i))|0;return 900000000+Math.abs(h)%99999999;}
async function fetchCrossrefWork(doi){
  try{
    const r=await fetch('https://api.crossref.org/works/'+encodeURIComponent(doi)+'?mailto=raccha@kku.ac.th');
    if(!r.ok)return null;
    const w=(await r.json()).message;if(!w)return null;
    const title=(w.title&&w.title[0])||'';if(!title)return null;
    const authors=(w.author||[]).map(a=>[a.given,a.family].filter(Boolean).join(' ')).join(', ');
    const journal=(w['container-title']&&w['container-title'][0])||'';
    const dp=(w.published&&w.published['date-parts'])||(w['published-print']&&w['published-print']['date-parts'])||(w['published-online']&&w['published-online']['date-parts']);
    const year=(dp&&dp[0]&&dp[0][0])||'';
    let abstract=w.abstract||'';if(abstract)abstract=abstract.replace(/<[^>]+>/g,'').trim();
    return {id:doiId(doi),doi,title,authors,journal,year,link:w.URL||('https://doi.org/'+doi),abstract};
  }catch(e){return null;}
}
async function loadDoiPubs(){
  if(!window.supa)return;
  const {data,error}=await supa.from('doi_pubs').select('doi').order('created_at',{ascending:true});
  if(error||!data||!data.length)return;
  const CHUNK=8,out=[];
  for(let i=0;i<data.length;i+=CHUNK){
    const results=await Promise.all(data.slice(i,i+CHUNK).map(r=>fetchCrossrefWork(r.doi)));
    results.forEach(x=>{if(x)out.push(x);});
  }
  DOI_PUBS=out;
  renderPubAll();
}
loadDoiPubs();
/* ============ FUTURE INNOVATIONS ============ */
function renderInnov(){
  el('innovGrid').innerHTML=INNOV.map(x=>`<article class="innov-card"><span class="innov-card__no">${x.no}</span><span class="innov-card__ic">${icon(x.icon)}</span><h3>${lang==='th'?x.titleTh:x.title}</h3><p>${lang==='th'?x.descTh:x.desc}</p></article>`).join('');
}
renderInnov();


/* ============ RESEARCH VALUE CHAIN + METHOD ATLAS + IP PORTFOLIO ============ */
window.switchMethodStage=function(stage,btn){
  const atlas=el('methodAtlas');if(!atlas)return;
  atlas.querySelectorAll('[data-method-tab]').forEach(tab=>{
    const active=tab.getAttribute('data-method-tab')===stage;
    tab.classList.toggle('active',active);
    tab.setAttribute('aria-selected',active?'true':'false');
  });
  atlas.querySelectorAll('[data-method-panel]').forEach(panel=>{
    const active=panel.getAttribute('data-method-panel')===stage;
    panel.classList.toggle('active',active);
    panel.hidden=!active;
  });
  if(btn&&typeof btn.focus==='function')btn.focus({preventScroll:true});
};
window.openMethodAtlas=function(stage){
  const atlas=el('methodAtlas');if(!atlas)return;
  atlas.open=true;
  switchMethodStage(stage||'systematics');
  setTimeout(()=>atlas.scrollIntoView({behavior:'smooth',block:'start'}),40);
};
let ipFilter='all',ipQuery='';
function ipKindLabel(x){
  const th={
    'petty-granted':'อนุสิทธิบัตร',
    'petty-application':'คำขออนุสิทธิบัตร',
    'patent-application':'คำขอสิทธิบัตร'
  };
  const en={
    'petty-granted':'Granted petty patent',
    'petty-application':'Petty-patent application',
    'patent-application':'Patent application'
  };
  return (lang==='th'?th[x.kind]:en[x.kind])||x.kind;
}
function ipIsCommercial(x){
  return !!(x.registration && !/^ดำเนินการ/.test(x.registration));
}
function ipStatusLabel(x){
  if(x.kind==='petty-granted')return lang==='th'?'ได้รับอนุสิทธิบัตร':'Granted';
  return lang==='th'?'อยู่ในขั้นคำขอ':'Application';
}
function updateValueChainStats(){
  const set=(id,v)=>{const n=el(id);if(n)n.textContent=v;};
  set('vcTaxaCount',Array.isArray(TAXA)?TAXA.length:0);
  set('vcIpCount',Array.isArray(IP_ASSETS)?IP_ASSETS.length:0);
  set('vcProductCount',Array.isArray(PRODUCTS)?PRODUCTS.length:0);
}
function setIPFilter(f,btn){
  ipFilter=f;
  document.querySelectorAll('.ip-filter').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  renderIP(false);
}
function renderIP(rebuildFilters=true){
  const grid=el('ipGrid'),summary=el('ipSummary');if(!grid||!summary)return;
  const granted=IP_ASSETS.filter(x=>x.kind==='petty-granted').length;
  const applications=IP_ASSETS.length-granted;
  const commercial=IP_ASSETS.filter(ipIsCommercial).length;
  summary.innerHTML=[
    [IP_ASSETS.length,lang==='th'?'รายการทรัพย์สินทางปัญญา':'IP records'],
    [granted,lang==='th'?'อนุสิทธิบัตรที่ได้รับแล้ว':'Granted petty patents'],
    [applications,lang==='th'?'คำขอสิทธิบัตร/อนุสิทธิบัตร':'Patent / petty-patent applications'],
    [commercial,lang==='th'?'รายการที่มีทะเบียนผลิตภัณฑ์':'Entries with product registration']
  ].map(x=>`<div class="ip-stat"><strong>${x[0]}</strong><span>${x[1]}</span></div>`).join('');
  if(rebuildFilters){
    const filters=[
      ['all',lang==='th'?'ทั้งหมด':'All'],
      ['granted',lang==='th'?'ได้รับแล้ว':'Granted'],
      ['application',lang==='th'?'ขั้นคำขอ':'Applications'],
      ['commercial',lang==='th'?'ต่อยอดผลิตภัณฑ์':'Commercialised']
    ];
    const w=el('ipFilters');
    if(w)w.innerHTML=filters.map(([k,l])=>`<button class="ip-filter ${ipFilter===k?'active':''}" onclick="setIPFilter('${k}',this)">${l}</button>`).join('');
  }
  const q=(ipQuery||'').trim().toLowerCase();
  const data=IP_ASSETS.filter(x=>{
    const filterOK=ipFilter==='all'
      ||(ipFilter==='granted'&&x.kind==='petty-granted')
      ||(ipFilter==='application'&&x.kind!=='petty-granted')
      ||(ipFilter==='commercial'&&ipIsCommercial(x));
    const hay=[x.formula,x.formulaEn,x.number,x.tradeName,x.registration].join(' ').toLowerCase();
    return filterOK&&(!q||hay.includes(q));
  });
  grid.innerHTML=data.length?data.map(x=>{
    const idx=IP_ASSETS.indexOf(x);
    const title=lang==='th'?x.formula:(x.formulaEn||x.formula);
    const app=x.kind!=='petty-granted';
    return `<article class="ip-card reveal in">
      <div class="ip-card__top"><span class="ip-card__no">IP-${x.no}</span><span class="ip-status ${app?'application':''}">${ipStatusLabel(x)}</span></div>
      <h3>${esc(title)}</h3>
      <dl class="ip-id">
        <dt>${lang==='th'?'ประเภท':'Type'}</dt><dd>${esc(ipKindLabel(x))}</dd>
        <dt>${lang==='th'?'เลขที่':'Number'}</dt><dd>${esc(x.number||'—')}</dd>
        <dt>${lang==='th'?'วันที่':'Date'}</dt><dd>${esc(x.date||'—')}</dd>
      </dl>
      ${x.tradeName?`<div class="ip-trade"><span class="ip-trade__mark">${icon('i-flask')}</span><div><small>${lang==='th'?'ชื่อทางการค้า':'Trade name'}</small><b>${esc(x.tradeName)}</b></div></div>`:''}
      <div class="ip-card__foot"><button class="ip-open" onclick="openIP(${idx})">${lang==='th'?'ดูรายละเอียด':'View details'} ${icon('i-arrow')}</button></div>
    </article>`;
  }).join(''):`<div class="ip-empty">${lang==='th'?'ไม่พบรายการที่ตรงกับการค้นหา':'No matching intellectual-property records.'}</div>`;
  const s=el('ipSearch');if(s)s.placeholder=lang==='th'?'ค้นหาสูตร เลขที่ หรือชื่อทางการค้า':'Search formula, number or trade name';
  updateValueChainStats();
}
window.openIP=function(i){
  const x=IP_ASSETS[i];if(!x)return;
  el('ipmKind').textContent=ipKindLabel(x);
  el('ipmFormula').textContent=lang==='th'?x.formula:(x.formulaEn||x.formula);
  el('ipmNumberLabel').textContent=lang==='th'?'เลขคำขอ/เลขอนุสิทธิบัตร':'Application / IP number';
  el('ipmDateLabel').textContent=lang==='th'?'วันที่ตามเอกสาร':'Document date';
  el('ipmTradeLabel').textContent=lang==='th'?'ชื่อทางการค้า':'Trade name';
  el('ipmStageLabel').textContent=lang==='th'?'สถานะการต่อยอด':'Commercial stage';
  el('ipmRegLabel').textContent=lang==='th'?'รายละเอียดการขึ้นทะเบียน':'Registration details';
  el('ipmProductCta').textContent=lang==='th'?'ดูผลิตภัณฑ์ปลายน้ำ':'View downstream products';
  el('ipmNumber').textContent=x.number||'—';el('ipmDate').textContent=x.date||'—';
  el('ipmTrade').textContent=x.tradeName||'—';
  el('ipmStage').textContent=ipIsCommercial(x)?(lang==='th'?'มีเลขทะเบียนผลิตภัณฑ์':'Product registration recorded'):(x.registration?(lang==='th'?'อยู่ระหว่างดำเนินการ':'Registration in progress'):(lang==='th'?'ยังไม่ระบุในเอกสาร':'Not specified in source'));
  el('ipmRegistration').textContent=x.registration|| (lang==='th'?'ยังไม่ระบุในเอกสารต้นฉบับ':'Not specified in the source document');
  openModal('ipModal');
};
renderIP();
updateValueChainStats();


/* ============ PRODUCTS ============ */
function prodVisual(p){
  return p.img?`<img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">`
    :`<span class="prod__glyph">${icon(p.icon||'i-flask')}</span><span class="prod__wm">${(p.name||'').replace(/^Nat\s*/,'')}</span>`;
}
function productCard(p,i){
  const type=lang==='th'?(p.typeTh||p.type):p.type;
  const ben=lang==='th'?(p.benefitTh||p.benefit):p.benefit;
  const shopUrl='shop/index.html?q='+encodeURIComponent(p.name||'');
  return `<article class="prod" onclick="openProduct(${i})">
    <div class="prod__img" style="--c1:${p.c1||'#2f6b4f'};--c2:${p.c2||'#4f9d78'}">${prodVisual(p)}<span class="prod__badge">KKU-SCI</span></div>
    <div class="prod__b">
      <span class="prod__type">${type}</span>
      <h3>${p.name}</h3>${p.nameTh?`<div class="prod__th">${p.nameTh}</div>`:''}
      <p class="prod__benefit">${ben}</p>
      <div class="prod__meta"><span>${p.size||''}</span>${p.price?`<span class="prod__price">${p.price}</span>`:''}</div>
      <a href="${shopUrl}" class="btn btn--primary btn--sm" style="width:100%;justify-content:center;margin-top:12px" onclick="event.stopPropagation()" data-i18n="prod_buy">Buy in our shop <svg class="icon"><use href="#i-ext"/></svg></a>
    </div>
  </article>`;
}function renderProducts(){
  const g=el('prodGrid');if(!g)return;
  g.innerHTML=PRODUCTS.length?PRODUCTS.map(productCard).join(''):`<div class="pub-empty" style="grid-column:1/-1">${lang==='th'?'ยังไม่มีผลิตภัณฑ์ — เพิ่มได้ในระบบหลังบ้าน':'No products yet — add them in the admin panel.'}</div>`;
}
renderProducts();updateValueChainStats();
window.openProduct=function(i){
  const p=PRODUCTS[i];if(!p)return;
  const type=lang==='th'?(p.typeTh||p.type):p.type;
  const ben=lang==='th'?(p.benefitTh||p.benefit):p.benefit;
  const v=el('prodModalVis');
  v.style.setProperty('--c1',p.c1||'#2f6b4f');v.style.setProperty('--c2',p.c2||'#4f9d78');
  v.innerHTML=prodVisual(p);
  el('pmoType').textContent=type;el('pmoName').textContent=p.name;el('pmoTh').textContent=p.nameTh||'';
  el('pmoBenefit').textContent=ben;el('pmoIng').textContent=p.ingredients||'—';el('pmoSize').textContent=p.size||'—';
  el('pmoPrice').textContent=p.price||'—';el('pmoPriceRow').style.display=p.price?'':'none';
  el('pmoShopLink').href='shop/index.html?q='+encodeURIComponent(p.name||'');
  openModal('prodModal');
};

/* ============ VIDEOS ============ */
function ytId(u){
  if(!u)return'';
  u=u.trim();
  if(/^[A-Za-z0-9_-]{11}$/.test(u))return u;
  try{
    const url=new URL(u);
    if(url.hostname.includes('youtu.be'))return url.pathname.slice(1,12);
    if(url.hostname.includes('youtube.com')){
      if(url.searchParams.get('v'))return url.searchParams.get('v');
      const m=url.pathname.match(/\/(embed|shorts|live)\/([A-Za-z0-9_-]{11})/);
      if(m)return m[2];
    }
  }catch(e){}
  const m=u.match(/([A-Za-z0-9_-]{11})(?:[?&]|$)/);
  return m?m[1]:'';
}
function vidThumb(v){
  const id=ytId(v.yt);
  if(id)return `<img src="https://img.youtube.com/vi/${id}/hqdefault.jpg" alt="${v.title}" loading="lazy" onerror="this.style.display='none'">`;
  return `<span class="vid__ph"></span>`;
}
function videoCard(v,i){
  const title=lang==='th'?(v.titleTh||v.title):v.title;
  const desc=lang==='th'?(v.descTh||v.desc):v.desc;
  const catL=v.cat==='intro'?(lang==='th'?'แนะนำแลป':'Lab intro'):(lang==='th'?'บทเรียน':'Tutorial');
  return `<article class="vid" onclick="openVideo(${i})" style="--c1:${v.c1||'#2f6b4f'};--c2:${v.c2||'#4f9d78'}">
    <div class="vid__thumb">${vidThumb(v)}<span class="vid__cat">${catL}</span><span class="vid__play"><svg class="icon"><use href="#i-arrow"/></svg></span></div>
    <div class="vid__b"><h3>${title}</h3><p>${desc}</p></div>
  </article>`;
}
function renderVideos(){
  const w=el('vidWrap');if(!w)return;
  if(!VIDEOS.length){w.innerHTML=`<div class="pub-empty">${lang==='th'?'ยังไม่มีวิดีโอ — เพิ่มได้ในระบบหลังบ้าน':'No videos yet — add them in the admin panel.'}</div>`;return;}
  const groups=[['intro',lang==='th'?'แนะนำแล็บ':'Lab introduction'],['tutorial',lang==='th'?'บทเรียนและการสอน':'Tutorials & teaching']];
  let h='';
  groups.forEach(([key,label])=>{
    const items=VIDEOS.map((v,i)=>[v,i]).filter(x=>x[0].cat===key);
    if(!items.length)return;
    h+=`<div class="rteam-sub"><span class="rteam-sub__l">${label}</span></div><div class="vid-grid">${items.map(x=>videoCard(x[0],x[1])).join('')}</div>`;
  });
  // any videos without a known cat
  const other=VIDEOS.map((v,i)=>[v,i]).filter(x=>x[0].cat!=='intro'&&x[0].cat!=='tutorial');
  if(other.length)h+=`<div class="vid-grid">${other.map(x=>videoCard(x[0],x[1])).join('')}</div>`;
  w.innerHTML=h;
}
renderVideos();
window.openVideo=function(i){
  const v=VIDEOS[i];if(!v)return;
  const id=ytId(v.yt);
  const frame=el('vidFrame');
  el('vmTitle').textContent=lang==='th'?(v.titleTh||v.title):v.title;
  el('vmDesc').textContent=lang==='th'?(v.descTh||v.desc):v.desc;
  if(id){frame.innerHTML=`<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" title="${v.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;frame.classList.remove('vid-modal__frame--empty');}
  else{frame.innerHTML=`<div class="vid-soon">${icon('i-wave')}<span>${lang==='th'?'วิดีโอกำลังจะมา — เพิ่มลิงก์ YouTube ได้ในระบบหลังบ้าน':'Video coming soon — add a YouTube link in the admin panel.'}</span></div>`;frame.classList.add('vid-modal__frame--empty');}
  openModal('videoModal');
};

/* ============ TEAM ROSTER ============ */
const ROLE_EN={lead:'Project leader · PI',co:'Co-Investigator',intl:'International co-researcher',postdoc:'Postdoctoral researcher',phd:'PhD student',master:'Master\u2019s student',intern:'Research intern','alumni-phd':'PhD alumnus/alumna','alumni-master':'Master\u2019s alumnus/alumna'};const ROLE_TH={lead:'หัวหน้าโครงการ',co:'ผู้ร่วมวิจัย',intl:'ผู้ร่วมวิจัย (ต่างประเทศ)',postdoc:'นักวิจัยหลังปริญญาเอก',phd:'นักศึกษาปริญญาเอก',master:'นักศึกษาปริญญาโท',intern:'นักศึกษาฝึกงาน','alumni-phd':'ศิษย์เก่า ปริญญาเอก','alumni-master':'ศิษย์เก่า ปริญญาโท'};function initials(n){return (n||'').replace(/\(.*?\)/g,'').trim().split(/\s+/).filter(w=>!/^(prof|dr|assoc|asst|ms|mr|mrs|professor)\.?$/i.test(w)).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?';}
function hue(n){let h=0;for(let i=0;i<(n||'').length;i++)h=n.charCodeAt(i)+((h<<5)-h);return `hsl(${Math.abs(h)%360},34%,52%)`;}
function avatar(m,big){return m.img?`<img src="${m.img}" alt="${m.en}" loading="lazy" onerror="this.style.display='none';this.parentNode.classList.add('noimg')">`:`<span class="mono-av" style="background:${hue(m.en)}">${initials(m.en)}</span>`;}
function memberAff(m){if(m.institution)return m.country?`${m.institution}, ${m.country}`:m.institution;return m.group==='intl'?(lang==='th'?'สถาบันต่างประเทศ':'International partner'):(lang==='th'?'มหาวิทยาลัยขอนแก่น':'Khon Kaen University');}function contactLinks(m){
  const rows=[];
  if(m&&m.email) rows.push(`<a href="mailto:${esc(m.email)}" onclick="event.stopPropagation()">${icon('i-mail')}<span>${esc(m.email)}</span></a>`);
  if(m&&m.phone) rows.push(`<a href="tel:${esc(m.phone)}" onclick="event.stopPropagation()">${icon('i-phone')}<span>${esc(m.phone)}</span></a>`);
  return rows.join('');
}
function contactBlock(m){const links=contactLinks(m);return links?`<div class="contact-line">${links}</div>`:'';}function memberCard(m){
  const idx=MEMBERS.indexOf(m);
  const role=(lang==='th'?ROLE_TH:ROLE_EN)[m.group]||m.group;
  const leadDesc=lang==='th'?'ควบคุมและดำเนินโครงการวิจัยบูรณาการทั้งหมด ตั้งแต่การวิเคราะห์ ตีพิมพ์ ไปจนถึงการยื่นจดสิทธิบัตร':'Directs the whole integrated programme — from analysis and publication through to patent filing.';
  const click=m.pi?`onclick="openModal('piModal')"`:`onclick="openMember(${idx})"`;
  return `<article class="member ${m.group==='lead'?'lead':''} clickable" ${click}>
    <div class="member__head">
      <div class="member__ph ${m.pi?'pi':''}">${avatar(m)}${m.pi?`<span class="badge">${icon('i-spark')}</span>`:''}</div>
      <div class="member__id"><h4>${m.en}</h4>${m.th?`<div class="th">${m.th}</div>`:''}</div>
    </div>
    <span class="role ${m.group==='intl'?'intl':''}">${m.group==='intl'?icon('i-globe'):''}${role}</span>
${m.group==='lead'?`<p class="member__desc">${leadDesc}</p>`:`<div class="aff">${icon('i-building')}${esc(memberAff(m))}</div>`}    ${contactBlock(m)}
    <div class="tags">${(m.tags||[]).map(t=>`<span class="t">${t}</span>`).join('')}</div>
  </article>`;
}
function renderProjectTeam(){
  const TT=(en,th)=>lang==='th'?th:en;
  const lead=MEMBERS.find(m=>m.group==='lead');
  const co=MEMBERS.filter(m=>m.group==='co');
  const intl=MEMBERS.filter(m=>m.group==='intl');
  const postdoc=MEMBERS.filter(m=>m.group==='postdoc');
  let h='';
  if(lead){
    const idx=MEMBERS.indexOf(lead);
    h+=`<div class="pi-banner">
      <div class="pi-banner__ph" onclick="openModal('piModal')">${avatar(lead)}</div>
      <div class="pi-banner__info">
        <span class="rteam-tag">${TT('Principal investigator','หัวหน้าโครงการ')}</span>
        <h3>${lead.en}</h3>${lead.th?`<div class="th">${lead.th}</div>`:''}
        <p>${TT('Directs the whole integrated programme — from molecular biology and multi-omics through to bioactivity testing and intellectual-property registration.','ควบคุมและดำเนินโครงการวิจัยบูรณาการทั้งหมด ตั้งแต่ชีววิทยาโมเลกุลและมัลติโอมิกส์ ไปจนถึงการทดสอบฤทธิ์ทางชีวภาพและการยื่นจดทรัพย์สินทางปัญญา')}</p>
        ${contactBlock(lead)}
        <div class="tags">${(lead.tags||[]).map(t=>`<span class="t">${t}</span>`).join('')}</div>
        <button class="btn btn--primary btn--sm" onclick="openModal('piModal')">${TT('View full profile','ดูประวัติเต็ม')} ${icon('i-arrow')}</button>
      </div>
    </div>`;
  }
if(co.length)   h+=`<div class="rteam-sub"><span class="rteam-sub__l">${TT('Co-Investigators','ผู้ร่วมวิจัย')}</span></div><div class="team-grid">${co.map(memberCard).join('')}</div>`;
  if(postdoc.length) h+=`<div class="rteam-sub"><span class="rteam-sub__l">${TT('Postdoctoral researchers','นักวิจัยหลังปริญญาเอก')}</span></div><div class="team-grid">${postdoc.map(memberCard).join('')}</div>`;
  if(intl.length) h+=`<div class="rteam-sub"><span class="rteam-sub__l">${TT('International co-researchers','ผู้ร่วมวิจัยต่างประเทศ')}</span></div><div class="team-grid">${intl.map(memberCard).join('')}</div>`;
  el('rteam').innerHTML=h;
}


function grantAvatar(m){return m.img?`<img src="${esc(m.img)}" alt="${esc(m.en)}" loading="lazy" onerror="this.style.display='none'">`:`<span class="mono-av" style="background:${hue(m.en)}">${initials(m.en)}</span>`;}
function grantAff(m){if(m.institution)return m.country?`${m.institution}, ${m.country}`:m.institution;return m.intl?(lang==='th'?'สถาบันต่างประเทศ':'International partner'):(lang==='th'?'มหาวิทยาลัยขอนแก่น':'Khon Kaen University');}

function grantMemberCard(m){
  const role=lang==='th'?(m.roleTh||m.role||''):(m.role||'');
  return `<article class="member clickable" onclick="openGrantMember(${GRANT_TEAM.indexOf(m)})">
    <div class="member__head">
      <div class="member__ph">${grantAvatar(m)}</div>
      <div class="member__id"><h4>${esc(m.en)}</h4>${m.th?`<div class="th">${esc(m.th)}</div>`:''}</div>
    </div>
    ${role?`<span class="role ${m.intl?'intl':''}">${m.intl?icon('i-globe'):''}${esc(role)}</span>`:''}
    <div class="aff">${icon('i-building')}${esc(grantAff(m))}</div>
    ${contactBlock(m)}
    <div class="tags">${(m.tags||[]).map(t=>`<span class="t">${esc(t)}</span>`).join('')}</div>
  </article>`;
}

function renderGrantTeam(){
  const TT=(en,th)=>lang==='th'?th:en;
  const w=el('grantTeam');if(!w)return;
  const thaiCo=GRANT_TEAM.filter(m=>!m.intl);
  const intlCo=GRANT_TEAM.filter(m=>m.intl);
  let h='';
  h+=`<div class="rteam-sub" style="margin-top:0"><span class="rteam-sub__l">${TT('Thai co-researchers','ผู้ร่วมวิจัยชาวไทย')}</span></div>`;
  h+= thaiCo.length ? `<div class="team-grid">${thaiCo.map(grantMemberCard).join('')}</div>` :
    `<p style="font-size:.85rem;color:var(--muted)">${TT('Thai co-researchers will be added soon — use the admin panel.','จะเพิ่มผู้ร่วมวิจัยชาวไทยเร็วๆ นี้ — เพิ่มได้จากระบบหลังบ้าน')}</p>`;
  h+=`<div class="rteam-sub"><span class="rteam-sub__l">${TT('International co-researchers','ผู้ร่วมวิจัยต่างประเทศ')}</span></div>`;
  h+= intlCo.length ? `<div class="team-grid">${intlCo.map(grantMemberCard).join('')}</div>` :
    `<p style="font-size:.85rem;color:var(--muted)">${TT('International co-researchers will be added soon — use the admin panel.','จะเพิ่มผู้ร่วมวิจัยต่างประเทศเร็วๆ นี้ — เพิ่มได้จากระบบหลังบ้าน')}</p>`;
  w.innerHTML=h;
}

window.openGrantMember=function(idx){
  const m=GRANT_TEAM[idx];if(!m)return;
  const role=lang==='th'?(m.roleTh||m.role||''):(m.role||'');
  el('mmPhoto').innerHTML=grantAvatar(m);el('mmPhoto').className='mm-photo'+(m.img?'':' noimg');
  el('mmRole').textContent=role;el('mmRole').className='role'+(m.intl?' intl':'');
  el('mmName').textContent=m.en;el('mmTh').textContent=m.th||'';el('mmTh').style.display=m.th?'block':'none';
el('mmAff').innerHTML=icon('i-building')+esc(grantAff(m));  {const links=contactLinks(m);el('mmContact').innerHTML=links;el('mmContact').style.display=links?'flex':'none';}
  el('mmBio').textContent=m.bio||(lang==='th'?'ยังไม่มีประวัติ':'No bio yet.');
  el('mmTags').innerHTML=(m.tags||[]).map(t=>`<span class="t">${esc(t)}</span>`).join('');
  openModal('memberModal');
};

renderProjectTeam();

renderGrantTeam();

let teamCat='phd';
let alumniSub='alumni-phd';
function renderTeam(cat){
  const g=el('teamGrid');g.style.opacity='0';
  setTimeout(()=>{
    const items=MEMBERS.filter(m=>m.group===cat);
    g.innerHTML=items.length?items.map(memberCard).join(''):`<div class="pub-empty" style="grid-column:1/-1">${lang==='th'?'ยังไม่มีสมาชิกในกลุ่มนี้ — เพิ่มได้ในระบบหลังบ้าน (ปุ่มมุมล่างซ้าย)':'No members in this group yet — add them in the admin panel (gear icon, lower-left).'}</div>`;
    g.style.opacity='1';
  },170);
}
window.filterTeam=function(cat,btn){
  document.querySelectorAll('#filters .filter').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const sub=el('alumniSub');
  if(cat==='alumni'){
    if(sub)sub.style.display='flex';
    teamCat=alumniSub;renderTeam(alumniSub);
  }else{
    if(sub)sub.style.display='none';
    teamCat=cat;renderTeam(cat);
  }
};
window.filterAlumniSub=function(sub,btn){
  alumniSub=sub;teamCat=sub;
  document.querySelectorAll('#alumniSub .filter').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderTeam(sub);
};
renderTeam('phd');window.openMember=function(idx){
  const m=MEMBERS[idx];if(!m)return;
  const role=(lang==='th'?ROLE_TH:ROLE_EN)[m.group]||m.group;
  el('mmPhoto').innerHTML=avatar(m,true);el('mmPhoto').className='mm-photo'+(m.img?'':' noimg');
  el('mmRole').textContent=role;el('mmRole').className='role'+(m.group==='intl'?' intl':'');
  el('mmName').textContent=m.en;el('mmTh').textContent=m.th||'';el('mmTh').style.display=m.th?'block':'none';
el('mmAff').innerHTML=icon('i-building')+esc(memberAff(m));
  {const links=contactLinks(m);el('mmContact').innerHTML=links;el('mmContact').style.display=links?'flex':'none';}
  el('mmBio').textContent=m.bio||BIOS[m.en]||(lang==='th'?'ยังไม่มีประวัติ — เพิ่มได้ในระบบหลังบ้าน':'No bio yet — add one in the admin panel.');  el('mmTags').innerHTML=(m.tags||[]).map(t=>`<span class="t">${t}</span>`).join('');
  openModal('memberModal');
};

/* ============ FAQ ============ */
function renderFaq(){
  el('faq').innerHTML=FAQ[lang].map(f=>`<div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)"><span>${f.q}</span><span class="pm">${icon('i-plus')}</span></button><div class="faq-a"><p>${f.a}</p></div></div>`).join('');
}
window.toggleFaq=function(btn){
  const item=btn.parentElement,ans=item.querySelector('.faq-a'),open=item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(o=>{o.classList.remove('open');o.querySelector('.faq-a').style.maxHeight=null;});
  if(!open){item.classList.add('open');ans.style.maxHeight=ans.scrollHeight+'px';}
};

/* ============ TESTIMONIALS ============ */
let ti=0;
function visibleTesti(){return TESTIMONIALS.filter(t=>!t.hidden);}
function renderTesti(){
  const list=visibleTesti();
  if(!list.length){el('testiQ').textContent='';el('testiName').textContent='';el('testiRole').textContent='';el('testiImg').style.display='none';return;}
  const t=list[((ti%list.length)+list.length)%list.length],q=el('testiQ');
  q.style.opacity='0';
  setTimeout(()=>{
    q.textContent='“'+(lang==='th'&&t.qTh?t.qTh:t.q)+'”';
    el('testiName').textContent=t.name;
    el('testiRole').textContent=(lang==='th'&&t.roleTh?t.roleTh:t.role)||'';
    if(t.img){el('testiImg').src=t.img;el('testiImg').style.display='';}
    else{el('testiImg').style.display='none';}
    q.style.opacity='1';
  },200);
}
window.nextTesti=function(){ti++;renderTesti();};
window.prevTesti=function(){const list=visibleTesti();ti=(ti-1+list.length)%list.length;renderTesti();};
/* ===== banner carousel ===== */
let bannerIdx=0,bannerTimer=null;
function renderBanner(){
  const w=el('bannerWrap');if(!w)return;
  if(!BANNERS.length){w.innerHTML=`<div class="banner-empty">${lang==='th'?'ยังไม่มีแบนเนอร์ — เพิ่มได้ในระบบหลังบ้าน':'No banners yet — add one in the admin panel.'}</div>`;return;}
  bannerIdx=0;
  w.innerHTML=BANNERS.map((b,i)=>`<div class="banner-slide ${i===0?'active':''}" data-i="${i}"><img src="${b.img}" alt=""><div class="grad"></div><div class="cap">${esc(lang==='th'&&b.captionTh?b.captionTh:(b.caption||''))}</div></div>`).join('')+
    `<div class="banner-dots">${BANNERS.map((_,i)=>`<button class="${i===0?'active':''}" data-i="${i}"></button>`).join('')}</div>`;
  w.querySelectorAll('.banner-slide').forEach(s=>{
    const b=BANNERS[+s.dataset.i];
    if(b.link&&b.link.trim()){
      s.style.cursor='pointer';
      s.addEventListener('click',()=>{
        if(b.link.startsWith('#')){const t=document.querySelector(b.link);if(t)t.scrollIntoView({behavior:'smooth'});}
        else window.open(b.link,'_blank');
      });
    }
  });
  w.querySelectorAll('.banner-dots button').forEach(d=>d.addEventListener('click',()=>gotoBanner(+d.dataset.i)));
  clearInterval(bannerTimer);
  if(BANNERS.length>1)bannerTimer=setInterval(()=>gotoBanner((bannerIdx+1)%BANNERS.length),5000);
}
window.gotoBanner=function(i){
  const w=el('bannerWrap');if(!w)return;
  w.querySelectorAll('.banner-slide').forEach((s,idx)=>s.classList.toggle('active',idx===i));
  w.querySelectorAll('.banner-dots button').forEach((d,idx)=>d.classList.toggle('active',idx===i));
  bannerIdx=i;
  clearInterval(bannerTimer);
  if(BANNERS.length>1)bannerTimer=setInterval(()=>gotoBanner((bannerIdx+1)%BANNERS.length),5000);
};
renderBanner();

/* ===== alumni self-submission ===== */
let testiSubmitImg='';
function refreshTestiSubmitPhoto(){
  const w=el('tsSubmitPhotoWrap');if(!w)return;
  const av=testiSubmitImg?`<img class="prev" src="${testiSubmitImg}">`:`<span class="prev" style="display:flex;align-items:center;justify-content:center;color:var(--faint)">${icon('i-users')}</span>`;
  w.innerHTML=`${av}<div><div class="adm-file" onclick="pickImage(function(d){testiSubmitImg=d;refreshTestiSubmitPhoto()})">${icon('i-up')} ${lang==='th'?'อัปโหลดรูป':'Upload photo'}</div>${testiSubmitImg?`<div class="adm-file" style="color:var(--muted);margin-top:5px" onclick="testiSubmitImg='';refreshTestiSubmitPhoto()">${lang==='th'?'ลบรูป':'Remove'}</div>`:''}</div>`;
}
window.openTestiForm=function(){testiSubmitImg='';refreshTestiSubmitPhoto();openModal('testiFormModal');};
window.submitTesti=async function(e){
  e.preventDefault();
  const name=val('ts_name').trim(),role=val('ts_role').trim(),quote=val('ts_quote').trim();
  if(!name||!role||!quote)return;
  if(window.supa){
    const {error}=await supa.from('testimonial_submissions').insert({name,role,quote,img:testiSubmitImg||null,status:'pending'});
    if(error){console.error('testimonial submit error:',error);toast(lang==='th'?'ส่งไม่สำเร็จ ลองใหม่อีกครั้ง':'Could not submit — please try again');return;}
  }
  closeModal('testiFormModal');e.target.reset();testiSubmitImg='';
  toast(lang==='th'?'ขอบคุณ! ทีมงานจะตรวจสอบก่อนเผยแพร่':'Thank you! Our team will review it before it appears.');
};
/* ============ MODALS ============ */
let activePub=null;
window.openModal=function(id){el(id).classList.add('open');document.body.style.overflow='hidden';};
window.closeModal=function(id){if(id==='videoModal'){const f=el('vidFrame');if(f)f.innerHTML='';}el(id).classList.remove('open');document.body.style.overflow='';};
window.openPub=function(id){
  const p=enrich(activePubs().find(x=>x.id===id));if(!p)return;activePub=p;
  el('pubModalTitle').innerHTML=safeTitleHTML(p.title);
  el('pmAuthors').textContent=p.authors||(lang==='th'?'—':'—');
  el('pmJournal').textContent=p.journal||'';el('pmYear').textContent=p.year||'';
  el('pmAbstract').textContent=p.abstract||(lang==='th'?'กำลังโหลดรายละเอียด…':'Loading details…');
  el('pmLink').href=p.link||'#';
  openModal('pubModal');
  // lazy-load abstract + authors from ORCID for this specific work (with proxy fallbacks)
  if(p.putcode&&(!p.authors||!p.abstract)){
    (async()=>{
      const api=`https://pub.orcid.org/v3.0/${ORCID}/work/${p.putcode}`;
      const srcs=[{u:api,o:{headers:{'Accept':'application/json'}}},{u:'https://api.allorigins.win/raw?url='+encodeURIComponent(api),o:{}},{u:'https://corsproxy.io/?url='+encodeURIComponent(api),o:{}}];
      let d=null;
      for(const s of srcs){try{const r=await fetch(s.u,s.o);if(r.ok){d=await r.json();if(d)break;}}catch(e){}}
      if(activePub!==p)return;
      if(!d){if(!p.abstract)el('pmAbstract').textContent=(lang==='th'?'ดูรายละเอียดได้ที่ลิงก์ผลงาน':'See details at the publication link.');return;}
      const desc=d['short-description'];
      const contribs=((d.contributors&&d.contributors.contributor)||[]).map(c=>c['credit-name']&&c['credit-name'].value).filter(Boolean);
      if(contribs.length){p.authors=contribs.join(', ');el('pmAuthors').textContent=p.authors;}
      if(desc){p.abstract=desc;el('pmAbstract').textContent=desc;}
      else if(!p.abstract)el('pmAbstract').textContent=(lang==='th'?'ดูบทคัดย่อฉบับเต็มได้ที่ลิงก์ผลงาน':'See the full abstract at the publication link.');
    })();
  }
};
window.copyCitation=function(){
  if(!activePub)return;const p=activePub;
  const cite=`${p.authors} (${p.year}). ${p.title}. ${p.journal}.`;
  const done=()=>toast(T('cite_toast'));
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(cite).then(done).catch(done);}else{const a=document.createElement('textarea');a.value=cite;document.body.appendChild(a);a.select();try{document.execCommand('copy');}catch(e){}document.body.removeChild(a);done();}
};
window.openNews=function(id){
  const n=NEWS.find(x=>x.id===id);if(!n)return;
  el('nmImg').src=n.img;el('nmTitle').textContent=n.title;el('nmDate').textContent=n.date;el('nmBody').innerHTML=n.body;
  openModal('newsModal');
};
window.openListModal=function(type){
  const title=el('listTitle'),content=el('listContent');
  if(type==='news'){title.textContent=lang==='th'?'ข่าวย้อนหลัง':'News archive';content.innerHTML=NEWS.map(n=>`<div class="list-news" onclick="closeModal('listModal');openNews(${n.id})"><img src="${n.img}" alt=""><div><div class="d mono">${n.date}</div><h4>${n.title}</h4></div></div>`).join('');}
  else{title.textContent=lang==='th'?'ผลงานทั้งหมด':'All publications';const AP=activePubs();const years=[...new Set(AP.map(p=>p.year).filter(Boolean))].sort((a,b)=>b-a);content.innerHTML=years.map(y=>`<div class="list-yr">${y}</div>`+AP.filter(p=>p.year===y).map(p=>`<div class="list-pub" onclick="closeModal('listModal');openPub(${p.id})"><h4>${p.title}</h4><p>${p.authors||p.journal||''}</p></div>`).join('')).join('');}
  openModal('listModal');
};
window.openLightbox=function(src){el('lightboxImg').src=src;el('lightbox').classList.add('open');document.body.style.overflow='hidden';};
window.closeLightbox=function(){el('lightbox').classList.remove('open');document.body.style.overflow='';};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.modal.open').forEach(m=>m.classList.remove('open'));closeLightbox();closeDrawer();document.body.style.overflow='';}});

/* ============ UTILS ============ */
window.toast=function(msg){const t=document.createElement('div');t.className='toast';t.innerHTML=icon('i-check')+'<span>'+msg+'</span>';el('toasts').appendChild(t);requestAnimationFrame(()=>t.classList.add('show'));setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),400);},2600);};
window.copyEmail=function(){const txt='raccha@kku.ac.th';const done=()=>toast(T('email_toast'));if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done).catch(done);}else{const a=document.createElement('textarea');a.value=txt;document.body.appendChild(a);a.select();try{document.execCommand('copy');}catch(e){}document.body.removeChild(a);done();}};
window.submitForm=async function(e){
  e.preventDefault();
  const name=val('cf_name').trim(),email=val('cf_email').trim(),subject=val('cf_subject'),message=val('cf_message').trim();
  if(!name||!email||!message)return;
  if(window.supa){
    const {error}=await supa.from('contact_messages').insert({name,email,subject,message,read:false});
    if(error){console.error('contact form error:',error);toast(lang==='th'?'ส่งไม่สำเร็จ ลองใหม่อีกครั้ง':'Could not send — please try again');return;}
  }
  toast(T('form_toast'));e.target.reset();
};
window.openDrawer=function(){el('drawer').classList.add('open');el('scrim').classList.add('open');};
window.closeDrawer=function(){el('drawer').classList.remove('open');el('scrim').classList.remove('open');};

/* smooth scroll */
document.querySelectorAll('.nav-scroll').forEach(a=>{
  a.addEventListener('click',function(e){
    const href=this.getAttribute('href');if(!href||!href.startsWith('#'))return;
    const target=document.querySelector(href);if(!target)return;
    e.preventDefault();closeDrawer();
    const y=target.getBoundingClientRect().top+window.pageYOffset-68;
    window.scrollTo({top:y,behavior:'smooth'});
  });
});

/* update "Read more" text on lang switch */
function refreshDynamicText(){
  document.querySelectorAll('[data-more]').forEach(n=>{n.innerHTML=(lang==='th'?'อ่านต่อ':'Read more')+' '+icon('i-arrow');});
}
const _applyLang=applyLang;applyLang=function(){_applyLang();refreshDynamicText();renderPubAll();renderInnov();renderProducts();renderVideos();renderProjectTeam();renderGrantTeam();renderTeam(teamCat);renderNews();renderTaxa();renderCollabs();renderBanner();renderEvents();renderGallery();renderResources();renderThemes();renderPipe();renderFacilities();renderTimeline();renderRoad();renderCustomSections();renderValueChain();renderAwards();renderAwardObjects();};const nav=el('nav'),totop=el('totop'),bar=el('progress');
const spy=[...document.querySelectorAll('section[id]')];
const links=[...document.querySelectorAll('#navLinks a')];
window.addEventListener('scroll',()=>{
  const st=window.pageYOffset,sh=document.documentElement.scrollHeight-window.innerHeight;
  nav.classList.toggle('scrolled',st>40);
  totop.classList.toggle('show',st>560);
  if(sh>0)bar.style.width=(st/sh*100)+'%';
  let cur='';for(const s of spy){if(st>=s.offsetTop-140)cur=s.id;}
  links.forEach(l=>l.classList.toggle('active',l.getAttribute('href')==='#'+cur));
},{passive:true});

/* reveal */
const io=new IntersectionObserver((ent)=>{ent.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.1,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal').forEach(r=>io.observe(r));

/* count up */
function countUp(node){
  const to=+node.getAttribute('data-to');
  if(matchMedia('(prefers-reduced-motion:reduce)').matches){node.textContent=to;return;}
  let start=null;const dur=1500;
  function step(ts){if(!start)start=ts;const p=Math.min((ts-start)/dur,1);node.textContent=Math.floor((1-Math.pow(1-p,3))*to);if(p<1)requestAnimationFrame(step);}
  requestAnimationFrame(step);
}
const cio=new IntersectionObserver((ent)=>{ent.forEach(e=>{if(e.isIntersecting){e.target.querySelectorAll('.count').forEach(countUp);cio.unobserve(e.target);}});},{threshold:.4});
document.querySelectorAll('.count').forEach(c=>{const p=c.closest('.cell,.fig,.cw-figs')||c;cio.observe(p);});

/* year */
el('year').textContent=new Date().getFullYear();

/* ============ MINIMAL cpDNA RING (static, single-weight) ============ */
(function(){
  const svg=el('cpRing');if(!svg)return;const NS='http://www.w3.org/2000/svg';
  const cx=40,cy=40;
  function ring(r,w,op){const c=document.createElementNS(NS,'circle');c.setAttribute('cx',cx);c.setAttribute('cy',cy);c.setAttribute('r',r);c.setAttribute('fill','none');c.setAttribute('stroke','var(--accent)');c.setAttribute('stroke-width',w);c.setAttribute('opacity',op);return c;}
  svg.appendChild(ring(30,1,.35));
  // segmented outer ring = quadripartite regions
  const seg=[[0,150],[155,60],[220,45],[270,85]];
  seg.forEach(([start,len])=>{
    const p=document.createElementNS(NS,'path');const r=34;
    const a0=(start-90)*Math.PI/180,a1=(start+len-90)*Math.PI/180;
    const large=len>180?1:0;
    p.setAttribute('d',`M ${cx+r*Math.cos(a0)} ${cy+r*Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${cx+r*Math.cos(a1)} ${cy+r*Math.sin(a1)}`);
    p.setAttribute('fill','none');p.setAttribute('stroke','var(--accent)');p.setAttribute('stroke-width','2.5');p.setAttribute('stroke-linecap','round');
    svg.appendChild(p);
  });
  // tick genes
  for(let i=0;i<28;i++){const a=(i/28*360-90)*Math.PI/180;const l=document.createElementNS(NS,'line');l.setAttribute('x1',cx+26*Math.cos(a));l.setAttribute('y1',cy+26*Math.sin(a));l.setAttribute('x2',cx+29*Math.cos(a));l.setAttribute('y2',cy+29*Math.sin(a));l.setAttribute('stroke','var(--accent)');l.setAttribute('stroke-width','1');l.setAttribute('opacity',.5);svg.appendChild(l);}
  const dot=document.createElementNS(NS,'circle');dot.setAttribute('cx',cx);dot.setAttribute('cy',cy);dot.setAttribute('r',4);dot.setAttribute('fill','var(--accent)');svg.appendChild(dot);
})();

/* preloader off */
window.addEventListener('load',()=>{setTimeout(()=>{const p=el('pre');p.style.opacity='0';setTimeout(()=>p.style.display='none',600);},400);});

/* ============ ADMIN / CMS ============ */

let adminUnlocked=false, adminCurrentTab='team', editIdx=-1, formImg='';
function esc(s){return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function safeImgSrc(s){
     s=(s||'').trim();
     return /^(data:image\/(png|jpe?g|webp|gif);base64,|https:\/\/)/i.test(s)?esc(s):'';
   }
function val(id){const e=el(id);return e?e.value:'';}
window.openAdmin=function(){
  el('admin').classList.add('open');document.body.style.overflow='hidden';
  el('adminLock').style.display=adminUnlocked?'none':'flex';
  el('adminBody').style.display=adminUnlocked?'flex':'none';
  const lb=el('adminLogoutBtn'); if(lb) lb.style.display=adminUnlocked?'inline-flex':'none';
  if(adminUnlocked){renderAdmin(adminCurrentTab);}
  else{
    setTimeout(()=>{
      const em=el('adminEmail');
      if(em){em.focus();}
      else{const p=el('adminPass');if(p)p.focus();}
    },100);
  }
};
window.closeAdmin=function(){el('admin').classList.remove('open');document.body.style.overflow='';};
window.tryUnlock=function(){
  toast(lang==='th'?'ระบบยืนยันตัวตนยังไม่พร้อมใช้งาน กรุณาโหลดหน้าใหม่':'Sign-in is not ready');
};
window.adminTab=function(t,btn){adminCurrentTab=t;document.querySelectorAll('.atab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderAdmin(t);};
window.adminLogout=function(){
  adminUnlocked=false;
  const p=el('adminPass'); if(p) p.value='';
  el('adminLock').style.display='flex';
  el('adminBody').style.display='none';
  const lb=el('adminLogoutBtn'); if(lb) lb.style.display='none';
  const ue=el('adminUserEmail'); if(ue){ue.style.display='none';ue.textContent='';}
  if(window.supa && supa.auth) supa.auth.signOut().catch(()=>{});
  toast(lang==='th'?'ออกจากระบบแล้ว':'Logged out');
};

function blobToDataURL(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);});}
async function uploadCmsBlob(blob,ext){
  const client=window.supa;
  if(client){
    try{
      const {data:{session}}=await client.auth.getSession();
      if(session&&session.user){
        const token=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():Math.random().toString(36).slice(2);
        const day=new Date().toISOString().slice(0,10);
        const path=`${session.user.id}/${day}/${Date.now()}-${token}.${ext}`;
        const {error}=await client.storage.from('site-media').upload(path,blob,{cacheControl:'31536000',upsert:false,contentType:blob.type});
        if(!error){
          const {data}=client.storage.from('site-media').getPublicUrl(path);
          if(data&&data.publicUrl)return data.publicUrl;
        }
        console.error('Supabase Storage upload failed:',error);
        if(typeof toast==='function')toast(lang==='th'?'อัปโหลดคลาวด์ไม่สำเร็จ — ใช้ข้อมูลชั่วคราวในเบราว์เซอร์':'Cloud upload failed — using a browser fallback');
      }
    }catch(err){console.error('Media upload error:',err);}
  }
  return blobToDataURL(blob);
}
function canvasToBlob(canvas,type,quality){return new Promise(resolve=>canvas.toBlob(resolve,type,quality));}
function chooseImageFile(accept,handler){const inp=document.createElement('input');inp.type='file';inp.accept=accept;inp.onchange=()=>{const f=inp.files&&inp.files[0];if(f)handler(f);};inp.click();}
function pickImage(cb){chooseImageFile('image/*',async f=>{const url=URL.createObjectURL(f);const img=new Image();img.onload=async()=>{try{const max=1080,w=img.naturalWidth||img.width,h=img.naturalHeight||img.height,s=Math.min(1,max/Math.max(w,h));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*s));c.height=Math.max(1,Math.round(h*s));c.getContext('2d').drawImage(img,0,0,c.width,c.height);const blob=await canvasToBlob(c,'image/jpeg',.86);if(blob)cb(await uploadCmsBlob(blob,'jpg'));}finally{URL.revokeObjectURL(url);}};img.onerror=()=>URL.revokeObjectURL(url);img.src=url;});}
function pickTransparentImage(cb){chooseImageFile('image/png,image/webp,image/*',async f=>{const url=URL.createObjectURL(f);const img=new Image();img.onload=async()=>{try{const max=1600,w=img.naturalWidth||img.width,h=img.naturalHeight||img.height,s=Math.min(1,max/Math.max(w,h));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*s));c.height=Math.max(1,Math.round(h*s));const ctx=c.getContext('2d',{alpha:true});ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);let blob=await canvasToBlob(c,'image/webp',.9),ext='webp';if(!blob){blob=await canvasToBlob(c,'image/png');ext='png';}if(blob)cb(await uploadCmsBlob(blob,ext));}finally{URL.revokeObjectURL(url);}};img.onerror=()=>URL.revokeObjectURL(url);img.src=url;});}
function photoWidget(name,isNews){let av;if(formImg)av=`<img class="prev" src="${formImg}">`;else if(isNews)av=`<span class="prev" style="display:flex;align-items:center;justify-content:center;color:var(--faint)">${icon('i-scope')}</span>`;else av=`<span class="mono-av" style="background:${hue(name||'?')}">${initials(name||'?')}</span>`;return `${av}<div><div class="adm-file" onclick="pickImage(function(d){formImg=d;refreshPhoto(${isNews?'true':'false'})})">${icon('i-up')} Upload image</div>${formImg?`<div class="adm-file" style="color:var(--muted);margin-top:5px" onclick="formImg='';refreshPhoto(${isNews?'true':'false'})">Remove</div>`:''}</div>`;}
window.refreshPhoto=function(isNews){const w=el(isNews?'n_photowrap':'f_photowrap');if(w)w.innerHTML=photoWidget(isNews?(el('n_title')?el('n_title').value:''):(el('f_en')?el('f_en').value:''),isNews);};


let admAwardMode='records',formAwardImages=[],formAwardObjectImg='';
window.admSetAwardMode=function(mode){admAwardMode=mode;renderAdmin('awards');};
function admAwardsList(){
  const tabs=`<div class="filters" style="margin:0 0 18px"><button class="filter ${admAwardMode==='records'?'active':''}" onclick="admSetAwardMode('records')">${lang==='th'?'รายการรางวัล':'Award records'}</button><button class="filter ${admAwardMode==='objects'?'active':''}" onclick="admSetAwardMode('objects')">${lang==='th'?'โล่เลื่อนอัตโนมัติ':'Moving shields'}</button></div>`;
  if(admAwardMode==='objects'){
    return `<div class="data-card"><h4>${icon('i-spark')} ${lang==='th'?'โล่เจาะพื้นหลังแบบเลื่อนไม่สิ้นสุด':'Infinite transparent-shield marquee'}</h4><p>${lang==='th'?'อัปโหลดไฟล์ PNG หรือ WebP ที่เจาะพื้นหลังแล้ว ระบบจะรักษาความโปร่งใสและทำสำเนาเพื่อให้เลื่อนต่อเนื่องโดยไม่มีรอยต่อ':'Upload transparent PNG or WebP files. Transparency is preserved and the items are duplicated automatically for a seamless loop.'}</p></div>${tabs}
      <div class="adm-2"><div class="adm-field"><label>${lang==='th'?'ความเร็ว (วินาทีต่อรอบ)':'Speed (seconds per loop)'}</label><input type="number" id="ao_speed" min="12" max="120" value="${AWARD_SETTINGS.speed||38}" onchange="admSaveAwardSettings()"></div><div class="adm-field"><label>${lang==='th'?'ขนาดโล่ (px)':'Shield size (px)'}</label><input type="number" id="ao_size" min="110" max="360" value="${AWARD_SETTINGS.size||210}" onchange="admSaveAwardSettings()"></div></div>
      <button class="adm-add" onclick="admEditAwardObject(-1)">${icon('i-plus')} ${lang==='th'?'เพิ่มภาพโล่':'Add moving shield'}</button>
      <div class="adm-section-t">${lang==='th'?'ภาพโล่ทั้งหมด':'All moving shields'}</div>
      ${AWARD_OBJECTS.length?AWARD_OBJECTS.map((o,i)=>`<div class="adm-row"><img class="award-object-admin" src="${o.src||''}" alt=""><div class="r-main"><h4>${esc(lang==='th'?(o.titleTh||o.title):o.title)||'Untitled shield'}</h4><div class="r-sub">${esc(o.year||'')}</div></div><div class="r-act"><button class="adm-ic" onclick="admMoveAwardObject(${i},-1)">${icon('i-up')}</button><button class="adm-ic" style="transform:rotate(180deg)" onclick="admMoveAwardObject(${i},1)">${icon('i-up')}</button><button class="adm-ic" onclick="admEditAwardObject(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelAwardObject(${i})">${icon('i-close')}</button></div></div>`).join(''):`<div class="data-card"><p>${lang==='th'?'ยังไม่มีภาพโล่ในแถบเลื่อน — เพิ่มได้จากปุ่มด้านบน':'The moving lane is empty. Add transparent shield images with the button above.'}</p></div>`}`;
  }
  return `<div class="data-card"><h4>${icon('i-scholar')} ${lang==='th'?'จัดการเซคชันรางวัลและผลงาน':'Awards & recognition section'}</h4><p>${lang==='th'?'แก้ไขชื่อรางวัล ปี ระดับ รายละเอียด และภาพประกอบได้ทั้งหมด ภาพจากเอกสารถูกแยกเป็นไฟล์สื่อขนาดเล็ก และภาพที่อัปโหลดใหม่จะเก็บใน Supabase Storage':'Edit every award title, year, level, description and photo. Source-document photos are stored as separate optimized assets. New uploads are stored in Supabase Storage.'}</p></div>${tabs}<button class="adm-add" onclick="admEditAward(-1)">${icon('i-plus')} ${lang==='th'?'เพิ่มรางวัล/การยอมรับ':'Add award / recognition'}</button><div class="adm-section-t">${lang==='th'?'รายการทั้งหมด':'All records'}</div>${AWARDS.map((a,i)=>`<div class="adm-row">${a.images&&a.images[0]?`<img class="award-admin-thumb" src="${a.images[0].src}" alt="">`:`<span class="award-admin-thumb" style="display:grid;place-items:center;color:var(--accent)">${icon('i-scholar')}</span>`}<div class="r-main"><h4>${esc(awardText(a,'title'))}</h4><div class="r-sub">พ.ศ. ${esc(a.yearBe||'—')} · ${esc(awardText(a,'level'))}</div></div><div class="r-act"><button class="adm-ic" onclick="admMoveAward(${i},-1)">${icon('i-up')}</button><button class="adm-ic" style="transform:rotate(180deg)" onclick="admMoveAward(${i},1)">${icon('i-up')}</button><button class="adm-ic" onclick="admEditAward(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelAward(${i})">${icon('i-close')}</button></div></div>`).join('')}`;
}
window.admMoveAward=function(i,d){const j=i+d;if(j<0||j>=AWARDS.length)return;[AWARDS[i],AWARDS[j]]=[AWARDS[j],AWARDS[i]];saveStore();renderAwards();renderAdmin('awards');};
window.admDelAward=function(i){if(!confirm(lang==='th'?'ลบรางวัลรายการนี้?':'Delete this award record?'))return;AWARDS.splice(i,1);saveStore();renderAwards();renderAdmin('awards');};
window.admEditAward=function(i){
  const a=i>=0?AWARDS[i]:{id:'award-'+Date.now(),title:'',titleTh:'',yearBe:'',yearCe:'',level:'University',levelTh:'มหาวิทยาลัย',category:'Research recognition',categoryTh:'เชิดชูเกียรติด้านการวิจัย',organization:'',organizationTh:'',desc:'',descTh:'',details:'',detailsTh:'',images:[]};formAwardImages=(a.images||[]).map(x=>({...x}));
  el('adminContent').innerHTML=`<div class="adm-section-t">${i>=0?(lang==='th'?'แก้ไขรายการรางวัล':'Edit award record'):(lang==='th'?'เพิ่มรายการรางวัล':'Add award record')}</div>
  <div class="adm-2"><div class="adm-field"><label>Title (EN)</label><input id="aw_title" value="${esc(a.title)}"></div><div class="adm-field"><label>ชื่อรางวัล (TH)</label><input id="aw_titleth" value="${esc(a.titleTh)}"></div></div>
  <div class="adm-2"><div class="adm-field"><label>${lang==='th'?'ปี พ.ศ.':'B.E. year'}</label><input id="aw_be" value="${esc(a.yearBe)}"></div><div class="adm-field"><label>${lang==='th'?'ปี ค.ศ.':'C.E. year'}</label><input id="aw_ce" value="${esc(a.yearCe)}"></div></div>
  <div class="adm-2"><div class="adm-field"><label>Level (EN)</label><input id="aw_level" value="${esc(a.level)}"></div><div class="adm-field"><label>ระดับ (TH)</label><input id="aw_levelth" value="${esc(a.levelTh)}"></div></div>
  <div class="adm-2"><div class="adm-field"><label>Category (EN)</label><input id="aw_cat" value="${esc(a.category)}"></div><div class="adm-field"><label>ประเภท (TH)</label><input id="aw_catth" value="${esc(a.categoryTh)}"></div></div>
  <div class="adm-2"><div class="adm-field"><label>Organisation (EN)</label><input id="aw_org" value="${esc(a.organization)}"></div><div class="adm-field"><label>หน่วยงาน (TH)</label><input id="aw_orgth" value="${esc(a.organizationTh)}"></div></div>
  <div class="adm-2"><div class="adm-field"><label>Short description (EN)</label><textarea id="aw_desc">${esc(a.desc)}</textarea></div><div class="adm-field"><label>คำอธิบายสั้น (TH)</label><textarea id="aw_descth">${esc(a.descTh)}</textarea></div></div>
  <div class="adm-2"><div class="adm-field"><label>Full details (EN)</label><textarea id="aw_details">${esc(a.details)}</textarea></div><div class="adm-field"><label>รายละเอียดเต็ม (TH)</label><textarea id="aw_detailsth">${esc(a.detailsTh)}</textarea></div></div>
  <div class="adm-field"><label>${lang==='th'?'ภาพประกอบ':'Photos'}</label><button class="adm-file" type="button" onclick="pickImage(function(d){formAwardImages.push({src:d,caption:'',captionTh:''});admRefreshAwardImages()})">${icon('i-up')} ${lang==='th'?'เพิ่มภาพ':'Add photo'}</button><div class="award-img-manager" id="aw_images"></div></div>
  <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('awards')">${lang==='th'?'ยกเลิก':'Cancel'}</button><button class="btn btn--primary" onclick="admSaveAward(${i})">${icon('i-check')} ${lang==='th'?'บันทึก':'Save'}</button></div>`;admRefreshAwardImages();
};
window.admRefreshAwardImages=function(){const w=el('aw_images');if(!w)return;w.innerHTML=formAwardImages.length?formAwardImages.map((im,j)=>`<div class="award-img-manager__item"><img src="${im.src}" alt=""><button onclick="formAwardImages.splice(${j},1);admRefreshAwardImages()">${icon('i-close')}</button></div>`).join(''):`<div class="r-sub">${lang==='th'?'ยังไม่มีภาพ':'No photos yet'}</div>`;};
window.admSaveAward=function(i){const title=val('aw_title').trim(),titleTh=val('aw_titleth').trim();if(!title&&!titleTh){toast(lang==='th'?'กรอกชื่อรางวัล':'Enter an award title');return;}const old=i>=0?AWARDS[i]:{};const item={...old,id:old.id||'award-'+Date.now(),title,titleTh,yearBe:val('aw_be').trim(),yearCe:val('aw_ce').trim(),level:val('aw_level').trim(),levelTh:val('aw_levelth').trim(),category:val('aw_cat').trim(),categoryTh:val('aw_catth').trim(),organization:val('aw_org').trim(),organizationTh:val('aw_orgth').trim(),desc:val('aw_desc').trim(),descTh:val('aw_descth').trim(),details:val('aw_details').trim(),detailsTh:val('aw_detailsth').trim(),images:formAwardImages};if(i>=0)AWARDS[i]=item;else AWARDS.push(item);saveStore();renderAwards();renderAdmin('awards');};
window.admSaveAwardSettings=function(){AWARD_SETTINGS.speed=Math.max(12,Math.min(120,+val('ao_speed')||38));AWARD_SETTINGS.size=Math.max(110,Math.min(360,+val('ao_size')||210));saveStore();renderAwardObjects();};
window.admMoveAwardObject=function(i,d){const j=i+d;if(j<0||j>=AWARD_OBJECTS.length)return;[AWARD_OBJECTS[i],AWARD_OBJECTS[j]]=[AWARD_OBJECTS[j],AWARD_OBJECTS[i]];saveStore();renderAwardObjects();renderAdmin('awards');};
window.admDelAwardObject=function(i){if(!confirm(lang==='th'?'ลบภาพโล่นี้?':'Delete this moving shield?'))return;AWARD_OBJECTS.splice(i,1);saveStore();renderAwardObjects();renderAdmin('awards');};
window.admEditAwardObject=function(i){const o=i>=0?AWARD_OBJECTS[i]:{src:'',title:'',titleTh:'',year:'',alt:'',altTh:''};formAwardObjectImg=o.src||'';el('adminContent').innerHTML=`<div class="adm-section-t">${i>=0?(lang==='th'?'แก้ไขภาพโล่':'Edit moving shield'):(lang==='th'?'เพิ่มภาพโล่':'Add moving shield')}</div><div class="adm-photo-row" id="ao_preview">${formAwardObjectImg?`<img class="prev" style="object-fit:contain" src="${formAwardObjectImg}">`:`<span class="prev" style="display:grid;place-items:center;color:var(--faint)">${icon('i-scholar')}</span>`}<div><button class="adm-file" onclick="pickTransparentImage(function(d){formAwardObjectImg=d;admEditAwardObject(${i})})">${icon('i-up')} ${lang==='th'?'อัปโหลด PNG/WebP เจาะพื้นหลัง':'Upload transparent PNG/WebP'}</button></div></div><div class="adm-2"><div class="adm-field"><label>Title (EN)</label><input id="ao_title" value="${esc(o.title)}"></div><div class="adm-field"><label>ชื่อ (TH)</label><input id="ao_titleth" value="${esc(o.titleTh)}"></div></div><div class="adm-2"><div class="adm-field"><label>Year</label><input id="ao_year" value="${esc(o.year)}"></div><div class="adm-field"><label>Alt text</label><input id="ao_alt" value="${esc(o.alt)}"></div></div><div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('awards')">${lang==='th'?'ยกเลิก':'Cancel'}</button><button class="btn btn--primary" onclick="admSaveAwardObject(${i})">${icon('i-check')} ${lang==='th'?'บันทึก':'Save'}</button></div>`;};
window.admSaveAwardObject=function(i){if(!formAwardObjectImg){toast(lang==='th'?'กรุณาอัปโหลดภาพโล่ก่อน':'Upload a shield image first');return;}const old=i>=0?AWARD_OBJECTS[i]:{};const o={...old,src:formAwardObjectImg,title:val('ao_title').trim(),titleTh:val('ao_titleth').trim(),year:val('ao_year').trim(),alt:val('ao_alt').trim(),altTh:''};if(i>=0)AWARD_OBJECTS[i]=o;else AWARD_OBJECTS.push(o);saveStore();renderAwardObjects();admAwardMode='objects';renderAdmin('awards');};

function admValueChainList(){return `<div class="data-card"><h4>${icon('i-wave')} ${lang==='th'?'จัดการต้นน้ำ–กลางน้ำ–ปลายน้ำ':'Research value chain manager'}</h4><p>${lang==='th'?'แก้ไขได้ครบทั้ง 3 ระยะ รวมถึงหัวข้อ คำอธิบาย ป้ายย่อย ลิงก์ ปุ่ม และการเชื่อมไปยังแผนผังวิธีวิจัยของต้นน้ำ':'Edit all three stages, including headings, descriptions, tags, links, CTAs and the upstream method-atlas connection.'}</p></div>${VALUE_CHAIN.map((v,i)=>`<div class="adm-row"><span class="award-object-admin" style="display:grid;place-items:center;color:var(--accent)">${icon(v.icon||'i-wave')}</span><div class="r-main"><h4>${esc(lang==='th'?(v.titleTh||v.title):v.title)}</h4><div class="r-sub">${esc(v.no)} · ${esc(lang==='th'?(v.phaseTh||v.phase):v.phase)} · ${esc(v.link||'')}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditValueChain(${i})">${icon('i-doc')}</button></div></div>`).join('')}`;}
window.admEditValueChain=function(i){const v=VALUE_CHAIN[i];if(!v)return;el('adminContent').innerHTML=`<div class="adm-section-t">${lang==='th'?'แก้ไขระยะ':'Edit stage'} ${esc(v.no)}</div><div class="adm-2"><div class="adm-field"><label>Phase (EN)</label><input id="vc_phase" value="${esc(v.phase)}"></div><div class="adm-field"><label>ระยะ (TH)</label><input id="vc_phaseth" value="${esc(v.phaseTh)}"></div></div><div class="adm-2"><div class="adm-field"><label>Icon ID</label><input id="vc_icon" value="${esc(v.icon)}"></div><div class="adm-field"><label>Link</label><input id="vc_link" value="${esc(v.link)}"></div></div><div class="adm-2"><div class="adm-field"><label>Title (EN)</label><input id="vc_title" value="${esc(v.title)}"></div><div class="adm-field"><label>หัวข้อ (TH)</label><input id="vc_titleth" value="${esc(v.titleTh)}"></div></div><div class="adm-2"><div class="adm-field"><label>Description (EN)</label><textarea id="vc_desc">${esc(v.desc)}</textarea></div><div class="adm-field"><label>คำอธิบาย (TH)</label><textarea id="vc_descth">${esc(v.descTh)}</textarea></div></div><div class="adm-2"><div class="adm-field"><label>Tags EN (use |)</label><input id="vc_points" value="${esc((v.points||[]).join(' | '))}"></div><div class="adm-field"><label>ป้าย TH (คั่นด้วย |)</label><input id="vc_pointsth" value="${esc((v.pointsTh||[]).join(' | '))}"></div></div><div class="adm-2"><div class="adm-field"><label>CTA (EN)</label><input id="vc_cta" value="${esc(v.cta)}"></div><div class="adm-field"><label>ปุ่ม (TH)</label><input id="vc_ctath" value="${esc(v.ctaTh)}"></div></div><div class="adm-2"><div class="adm-field"><label>Stat source</label><select id="vc_stat"><option value="taxa">Taxa</option><option value="ip">IP</option><option value="products">Products</option><option value="publications">Publications</option></select></div><div class="adm-field"><label>Method tab (upstream)</label><select id="vc_method"><option value="">None</option><option value="systematics">Plant systematics</option><option value="preclinical">Preclinical</option><option value="innovation">Product innovation</option><option value="registration">Registration</option></select></div></div><div class="adm-2"><div class="adm-field"><label>Stat label (EN)</label><input id="vc_statlabel" value="${esc(v.statLabel)}"></div><div class="adm-field"><label>ป้ายสถิติ (TH)</label><input id="vc_statlabelth" value="${esc(v.statLabelTh)}"></div></div><div class="adm-2"><div class="adm-field"><label>Method CTA (EN)</label><input id="vc_methodcta" value="${esc(v.methodCta||'')}"></div><div class="adm-field"><label>ปุ่มแผนผัง (TH)</label><input id="vc_methodctath" value="${esc(v.methodCtaTh||'')}"></div></div><div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('valuechain')">${lang==='th'?'ยกเลิก':'Cancel'}</button><button class="btn btn--primary" onclick="admSaveValueChain(${i})">${icon('i-check')} ${lang==='th'?'บันทึก':'Save'}</button></div>`;el('vc_stat').value=v.statKind||'taxa';el('vc_method').value=v.methodTab||'';};
window.admSaveValueChain=function(i){const v=VALUE_CHAIN[i];if(!v)return;Object.assign(v,{phase:val('vc_phase').trim(),phaseTh:val('vc_phaseth').trim(),icon:val('vc_icon').trim()||'i-wave',link:val('vc_link').trim()||'#research',title:val('vc_title').trim(),titleTh:val('vc_titleth').trim(),desc:val('vc_desc').trim(),descTh:val('vc_descth').trim(),points:val('vc_points').split('|').map(x=>x.trim()).filter(Boolean),pointsTh:val('vc_pointsth').split('|').map(x=>x.trim()).filter(Boolean),cta:val('vc_cta').trim(),ctaTh:val('vc_ctath').trim(),statKind:val('vc_stat'),statLabel:val('vc_statlabel').trim(),statLabelTh:val('vc_statlabelth').trim(),methodTab:val('vc_method'),methodCta:val('vc_methodcta').trim(),methodCtaTh:val('vc_methodctath').trim()});saveStore();renderValueChain();renderAdmin('valuechain');};

function renderAdmin(tab){adminCurrentTab=tab;const c=el('adminContent');
  if(tab==='team')c.innerHTML=admTeamList();
  else if(tab==='news')c.innerHTML=admNewsList();
  else if(tab==='awards')c.innerHTML=admAwardsList();
  else if(tab==='pubs')c.innerHTML=admPubList();
  else if(tab==='ip')c.innerHTML=admIPList();
  else if(tab==='products')c.innerHTML=admProdList();
  else if(tab==='videos')c.innerHTML=admVidList();
  else if(tab==='taxa')c.innerHTML=admTaxaList();
else if(tab==='collabs')c.innerHTML=admCollabList();
  else if(tab==='grantteam')c.innerHTML=admGrantList();else if(tab==='voices')admVoicesList();
  else if(tab==='messages')admMessagesList();
  else if(tab==='banner')c.innerHTML=admBannerList();
  else if(tab==='events')c.innerHTML=admEventsList();
  else if(tab==='gallery')c.innerHTML=admGalleryList();
  else if(tab==='resources')c.innerHTML=admResourcesList();
    else if(tab==='theme')c.innerHTML=admThemeList();
else if(tab==='sections')c.innerHTML=admSectionsList();
  else if(tab==='text')c.innerHTML=admTextList();
  else if(tab==='valuechain')c.innerHTML=admValueChainList();
  else if(tab==='cards')c.innerHTML=admCardsList();
  else c.innerHTML=admData();
}function admThemeList(){
  return `<div class="data-card"><h4>${icon('i-spark')} Site theme</h4><p>${lang==='th'?'เลือกโทนสีของทั้งเว็บไซต์ ใช้กับผู้เข้าชมทุกคน (บันทึกขึ้นคลาวด์) แยกจากปุ่มมืด/สว่างที่แต่ละคนเลือกเองได้':'Pick a color theme for the whole site — applied for every visitor (saved to the cloud), separate from each visitor\u2019s own light/dark switch.'}</p></div>
  <div class="adm-section-t">${lang==='th'?'เลือกธีม':'Choose a theme'}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
  ${THEME_PRESETS.map(p=>`
    <div class="adm-row" style="cursor:pointer;${SITE_ACCENT===p.id?'box-shadow:inset 0 0 0 2px var(--accent)':''}" onclick="admSetTheme('${p.id}')">
      <span style="width:44px;height:44px;border-radius:10px;flex:none;background:linear-gradient(135deg,${p.c1},${p.c2});box-shadow:inset 0 0 0 1px var(--line)"></span>
      <div class="r-main"><h4>${lang==='th'?p.nameTh:p.name}</h4><div class="r-sub">${SITE_ACCENT===p.id?(lang==='th'?'กำลังใช้งานอยู่':'Currently active'):(lang==='th'?'คลิกเพื่อใช้':'Click to apply')}</div></div>
    </div>`).join('')}
  </div>`;
}
window.admSetTheme=function(id){
  applyAccent(id);
  saveStore();
  renderAdmin('theme');
  toast(lang==='th'?'เปลี่ยนธีมแล้ว':'Theme updated');
};
function admSectionsList(){
  const order=SECTION_ORDER;
  const rows=order.map((id,i)=>{
    const meta=sectionLabel(id);
    const label=lang==='th'?meta.labelTh:meta.label;
    const hidden=HIDDEN_SECTIONS.has(id);
    const isCustom=CUSTOM_SECTIONS.some(cs=>cs.id===id);
    return `<div class="adm-row">
      <div class="r-act" style="flex-direction:column;gap:2px">
        <button class="adm-ic" style="width:26px;height:22px" ${i===0?'disabled':''} onclick="admMoveSection('${id}',-1)">${icon('i-up')}</button>
        <button class="adm-ic" style="width:26px;height:22px;transform:rotate(180deg)" ${i===order.length-1?'disabled':''} onclick="admMoveSection('${id}',1)">${icon('i-up')}</button>
      </div>
      <div class="r-main"><h4>${label}${isCustom?` <span class="mono" style="font-size:9px;color:var(--accent)">CUSTOM</span>`:''}</h4><div class="r-sub">#${id}${hidden?(lang==='th'?' · ซ่อนอยู่':' · hidden'):''}</div></div>
      <div class="r-act">
        ${isCustom?`<button class="adm-ic" onclick="admEditCustomSection('${id}')">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelCustomSection('${id}')">${icon('i-close')}</button>`:''}
        <div class="tgl ${hidden?'':'on'}" onclick="admToggleSection('${id}')"></div>
      </div>
    </div>`;
  }).join('');
  return `<div class="data-card"><h4>${icon('i-spark')} ${lang==='th'?'ลำดับและการมองเห็นของเซกชัน':'Sections — order & visibility'}</h4><p>${lang==='th'?'ใช้ลูกศรขึ้น/ลงเพื่อสลับตำแหน่งเซกชันบนหน้าเว็บ และปิดสวิตช์เพื่อซ่อนเซกชันนั้น':'Use the arrows to move a section up or down the page, and use the switch to hide it.'}</p></div>
  <button class="adm-add" onclick="admNewSectionPicker()">${icon('i-plus')} ${lang==='th'?'เพิ่มเซกชันใหม่':'Add new section'}</button>
  <div class="adm-section-t" style="margin-top:18px">${lang==='th'?'เซกชันทั้งหมด':'All sections'}</div>
  ${rows}`;
}
window.admToggleSection=function(id){
  if(HIDDEN_SECTIONS.has(id))HIDDEN_SECTIONS.delete(id);else HIDDEN_SECTIONS.add(id);
  applySectionVisibility();
  saveStore();
  renderAdmin('sections');
};

function admNewSectionPicker(){
  const TT=(en,th)=>lang==='th'?th:en;
  const templates=[
    {id:'cards',icon:'i-spark',name:TT('Card grid','การ์ดหลายใบ'),desc:TT('Icon + title + description cards in a grid — like "What we study".','การ์ดไอคอน+หัวข้อ+คำอธิบาย เรียงเป็นกริด')},
    {id:'stats',icon:'i-scholar',name:TT('Stat / figures','ตัวเลขสถิติ'),desc:TT('Big animated numbers with labels — like "The lab in figures".','ตัวเลขขนาดใหญ่พร้อมคำอธิบาย')},
    {id:'timeline',icon:'i-cal',name:TT('Timeline','เส้นเวลา'),desc:TT('A vertical list of dated milestones — like "How we got here".','รายการเหตุการณ์เรียงตามเวลา')},
    {id:'text',icon:'i-doc',name:TT('Text / call-to-action','ข้อความ/ปุ่มเรียกร้อง'),desc:TT('A simple centered heading, paragraph and optional button.','หัวข้อ ย่อหน้า และปุ่มเรียกร้อง')}
  ];
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('sections')">${icon('i-arrow')} Back</span>
  <div class="data-card"><h4>${icon('i-spark')} ${TT('Choose a layout','เลือกรูปแบบ')}</h4><p>${TT('Pick a starting layout — you can fully edit the text and items afterward.','เลือกรูปแบบเริ่มต้น — แก้ไขได้เต็มที่ภายหลัง')}</p></div>
  ${templates.map(t=>`<div class="adm-row" style="cursor:pointer" onclick="admCreateSection('${t.id}')"><span class="mono-av" style="background:var(--accent)">${icon(t.icon)}</span><div class="r-main"><h4>${t.name}</h4><div class="r-sub">${t.desc}</div></div><span class="go">${icon('i-arrow')}</span></div>`).join('')}
  `;
}
window.admCreateSection=function(template){
  const id='custom-'+Date.now().toString(36);
  const cs={id,template,eyebrow:'',eyebrowTh:'',title:'',titleTh:'',lede:'',ledeTh:'',alt:false,items:[],cta:'',ctaTh:'',ctaLink:''};
  CUSTOM_SECTIONS.push(cs);
  SECTION_ORDER.push(id);
  renderCustomSections();applySectionVisibility();applySectionOrder();saveStore();
  admEditCustomSection(id);
};

window.admEditCustomSection=function(id){
  const cs=CUSTOM_SECTIONS.find(x=>x.id===id);if(!cs)return;
  const TT=(en,th)=>lang==='th'?th:en;
  const itemsLabel={cards:TT('Cards','การ์ด'),stats:TT('Stats','ตัวเลข'),timeline:TT('Milestones','เหตุการณ์'),text:''}[cs.template];
  let itemsHtml='';
  if(cs.template!=='text'){
    itemsHtml=`<div class="adm-section-t">${itemsLabel} (${(cs.items||[]).length})</div>`+
      (cs.items||[]).map((it,i)=>`<div class="adm-row"><div class="r-main"><h4>${esc(it.title||it.label||it.yr||('#'+(i+1)))}</h4></div><div class="r-act"><button class="adm-ic" onclick="admEditSectionItem('${id}',${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelSectionItem('${id}',${i})">${icon('i-close')}</button></div></div>`).join('')+
      `<button class="adm-add" onclick="admEditSectionItem('${id}',-1)">${icon('i-plus')} ${TT('Add item','เพิ่มรายการ')}</button>`;
  }
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('sections')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-2"><div class="adm-field"><label>Eyebrow (English)</label><input id="cs_eye"></div><div class="adm-field"><label>Eyebrow (Thai)</label><input id="cs_eyeth"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Title (English)</label><input id="cs_title"></div><div class="adm-field"><label>Title (Thai)</label><input id="cs_titleth"></div></div>
    <div class="adm-field"><label>Lede (English)</label><textarea id="cs_lede"></textarea></div>
    <div class="adm-field"><label>Lede (Thai)</label><textarea id="cs_ledeth"></textarea></div>
    ${cs.template==='text'?`
    <div class="adm-2"><div class="adm-field"><label>Button text (English)</label><input id="cs_cta"></div><div class="adm-field"><label>Button text (Thai)</label><input id="cs_ctath"></div></div>
    <div class="adm-field"><label>Button link</label><input id="cs_ctalink" placeholder="#join or https://..."></div>`:''}
    <div class="adm-row"><div class="r-main"><h4>${TT('Alternate background','พื้นหลังสลับสี')}</h4></div><div class="tgl ${cs.alt?'on':''}" onclick="this.classList.toggle('on')" id="cs_alt"></div></div>
    <div class="adm-actions"><button class="btn btn--primary" onclick="admSaveSectionMeta('${id}')">${icon('i-check')} Save</button></div>
  </div>
  ${itemsHtml}`;
  el('cs_eye').value=cs.eyebrow||'';el('cs_eyeth').value=cs.eyebrowTh||'';el('cs_title').value=cs.title||'';el('cs_titleth').value=cs.titleTh||'';el('cs_lede').value=cs.lede||'';el('cs_ledeth').value=cs.ledeTh||'';
  if(cs.template==='text'){el('cs_cta').value=cs.cta||'';el('cs_ctath').value=cs.ctaTh||'';el('cs_ctalink').value=cs.ctaLink||'';}
};
window.admSaveSectionMeta=function(id){
  const cs=CUSTOM_SECTIONS.find(x=>x.id===id);if(!cs)return;
  cs.eyebrow=val('cs_eye').trim();cs.eyebrowTh=val('cs_eyeth').trim();
  cs.title=val('cs_title').trim();cs.titleTh=val('cs_titleth').trim();
  cs.lede=val('cs_lede').trim();cs.ledeTh=val('cs_ledeth').trim();
  cs.alt=el('cs_alt').classList.contains('on');
  if(cs.template==='text'){cs.cta=val('cs_cta').trim();cs.ctaTh=val('cs_ctath').trim();cs.ctaLink=val('cs_ctalink').trim();}
  if(!cs.title){toast(lang==='th'?'ต้องมีหัวข้อ':'Title required');return;}
  renderCustomSections();saveStore();toast(T('saved_toast'));admEditCustomSection(id);
};
window.admDelCustomSection=function(id){
  if(!confirm(lang==='th'?'ลบเซกชันนี้ทั้งหมด?':'Delete this whole section?'))return;
  CUSTOM_SECTIONS=CUSTOM_SECTIONS.filter(x=>x.id!==id);
  SECTION_ORDER=SECTION_ORDER.filter(x=>x!==id);
  HIDDEN_SECTIONS.delete(id);
  const node=document.getElementById(id);if(node)node.remove();
  saveStore();renderAdmin('sections');
};

window.admEditSectionItem=function(secId,idx){
  const cs=CUSTOM_SECTIONS.find(x=>x.id===secId);if(!cs)return;
  const it=idx>=0?cs.items[idx]:{};
  let fields='';
  if(cs.template==='cards'){
    fields=`<div class="adm-field"><label>Icon</label><select id="it_icon"><option value="i-spark">Spark</option><option value="i-leaf">Leaf</option><option value="i-flask">Flask</option><option value="i-cell">Cell</option><option value="i-dna">DNA</option><option value="i-scope">Scope</option><option value="i-doc">Document</option></select></div>
    <div class="adm-2"><div class="adm-field"><label>Title (English)</label><input id="it_title"></div><div class="adm-field"><label>Title (Thai)</label><input id="it_titleth"></div></div>
    <div class="adm-field"><label>Description (English)</label><textarea id="it_desc"></textarea></div>
    <div class="adm-field"><label>Description (Thai)</label><textarea id="it_descth"></textarea></div>`;
  }else if(cs.template==='stats'){
    fields=`<div class="adm-field"><label>Value (e.g. "50+", "14")</label><input id="it_value"></div>
    <div class="adm-2"><div class="adm-field"><label>Label (English)</label><input id="it_label"></div><div class="adm-field"><label>Label (Thai)</label><input id="it_labelth"></div></div>`;
  }else if(cs.template==='timeline'){
    fields=`<div class="adm-field"><label>Year / date</label><input id="it_yr"></div>
    <div class="adm-2"><div class="adm-field"><label>Title (English)</label><input id="it_title"></div><div class="adm-field"><label>Title (Thai)</label><input id="it_titleth"></div></div>
    <div class="adm-field"><label>Description (English)</label><textarea id="it_desc"></textarea></div>
    <div class="adm-field"><label>Description (Thai)</label><textarea id="it_descth"></textarea></div>`;
  }
  el('adminContent').innerHTML=`<span class="adm-back" onclick="admEditCustomSection('${secId}')">${icon('i-arrow')} Back</span>
  <div class="adm-form">${fields}
    <div class="adm-actions"><button class="btn btn--ghost" onclick="admEditCustomSection('${secId}')">Cancel</button><button class="btn btn--primary" onclick="admSaveSectionItem('${secId}',${idx})">${icon('i-check')} Save</button></div>
  </div>`;
  if(cs.template==='cards'){el('it_icon').value=it.icon||'i-spark';el('it_title').value=it.title||'';el('it_titleth').value=it.titleTh||'';el('it_desc').value=it.desc||'';el('it_descth').value=it.descTh||'';}
  else if(cs.template==='stats'){el('it_value').value=it.value||'';el('it_label').value=it.label||'';el('it_labelth').value=it.labelTh||'';}
  else if(cs.template==='timeline'){el('it_yr').value=it.yr||'';el('it_title').value=it.title||'';el('it_titleth').value=it.titleTh||'';el('it_desc').value=it.desc||'';el('it_descth').value=it.descTh||'';}
};
window.admSaveSectionItem=function(secId,idx){
  const cs=CUSTOM_SECTIONS.find(x=>x.id===secId);if(!cs)return;
  let item={};
  if(cs.template==='cards'){item={icon:val('it_icon'),title:val('it_title').trim(),titleTh:val('it_titleth').trim(),desc:val('it_desc').trim(),descTh:val('it_descth').trim()};if(!item.title){toast('Title required');return;}}
  else if(cs.template==='stats'){item={value:val('it_value').trim(),label:val('it_label').trim(),labelTh:val('it_labelth').trim()};if(!item.value){toast('Value required');return;}}
  else if(cs.template==='timeline'){item={yr:val('it_yr').trim(),title:val('it_title').trim(),titleTh:val('it_titleth').trim(),desc:val('it_desc').trim(),descTh:val('it_descth').trim()};if(!item.title){toast('Title required');return;}}
  if(!cs.items)cs.items=[];
  if(idx>=0)cs.items[idx]=item;else cs.items.push(item);
  renderCustomSections();saveStore();admEditCustomSection(secId);
};
window.admDelSectionItem=function(secId,idx){
  const cs=CUSTOM_SECTIONS.find(x=>x.id===secId);if(!cs)return;
  if(!confirm(lang==='th'?'ลบรายการนี้?':'Delete this item?'))return;
  cs.items.splice(idx,1);renderCustomSections();saveStore();admEditCustomSection(secId);
};/* --- TAXA admin --- */
function admTaxaList(){return `<div class="adm-section-t">${TAXA.length} plants · click to edit</div>`+
  TAXA.map((t,i)=>`<div class="adm-row">${t.img?`<img class="thumb" src="${t.img}">`:`<span class="mono-av" style="background:${hue(t.sp)}">${icon('i-leaf')}</span>`}<div class="r-main"><h4>${esc(t.sp)}</h4><div class="r-sub">${esc(t.en||'')}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditTaxa(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelTaxa(${i})">${icon('i-close')}</button></div></div>`).join('')+
  `<button class="adm-add" onclick="admEditTaxa(-1)">${icon('i-plus')} Add plant</button>`;}
window.admEditTaxa=function(i){editIdx=i;const t=i>=0?TAXA[i]:{sp:'',en:'',enTh:'',acc:'',img:'',desc:'',descTh:''};formImg=t.img||'';
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('taxa')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-field"><label>Photo</label><div class="adm-photo-row" id="n_photowrap"></div></div>
    <div class="adm-field"><label>Species name (italic)</label><input id="tx_sp" placeholder="Cratoxylum formosum"></div>
    <div class="adm-2"><div class="adm-field"><label>Tagline (English)</label><input id="tx_en" placeholder="Hypericaceae · resveratrol source"></div><div class="adm-field"><label>Tagline (Thai)</label><input id="tx_enth"></div></div>
    <div class="adm-field"><label>Accession label</label><input id="tx_acc" placeholder="CP · 157,204 bp"></div>
    <div class="adm-field"><label>Description (English)</label><textarea id="tx_desc"></textarea></div>
    <div class="adm-field"><label>Description (Thai)</label><textarea id="tx_descth"></textarea></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('taxa')">Cancel</button><button class="btn btn--primary" onclick="admSaveTaxa()">${icon('i-check')} Save</button></div>
  </div>`;
  el('tx_sp').value=t.sp||'';el('tx_en').value=t.en||'';el('tx_enth').value=t.enTh||'';el('tx_acc').value=t.acc||'';el('tx_desc').value=t.desc||'';el('tx_descth').value=t.descTh||'';
  refreshPhoto(true);};
window.admSaveTaxa=function(){const sp=val('tx_sp').trim();if(!sp){toast(lang==='th'?'ต้องมีชื่อพืช':'Species name required');return;}
  const item={sp,en:val('tx_en').trim(),enTh:val('tx_enth').trim(),acc:val('tx_acc').trim(),desc:val('tx_desc').trim(),descTh:val('tx_descth').trim(),img:formImg};
  if(editIdx>=0)TAXA[editIdx]=item;else TAXA.push(item);
  saveStore();renderTaxa();renderAdmin('taxa');};
window.admDelTaxa=function(i){if(!confirm((lang==='th'?'ลบ ':'Delete ')+TAXA[i].sp+'?'))return;TAXA.splice(i,1);saveStore();renderTaxa();renderAdmin('taxa');};

/* --- PARTNERS/COLLABS admin --- */
function admCollabList(){return `<div class="adm-section-t">${COLLABS.length} partners · click to edit</div>`+
  COLLABS.map((c,i)=>`<div class="adm-row"><span class="flag" style="width:44px;height:44px;border-radius:10px;overflow:hidden"><img src="${c.flag}" style="width:100%;height:100%;object-fit:cover"></span><div class="r-main"><h4>${esc(c.name)}</h4><div class="r-sub">${esc(c.cc)}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditCollab(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelCollab(${i})">${icon('i-close')}</button></div></div>`).join('')+
  `<button class="adm-add" onclick="admEditCollab(-1)">${icon('i-plus')} Add partner</button>`;}
window.admEditCollab=function(i){editIdx=i;const c=i>=0?COLLABS[i]:{flag:'',cc:'',name:'',desc:'',descTh:'',tags:[]};
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('collabs')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-2"><div class="adm-field"><label>Country</label><input id="cl_cc" placeholder="USA"></div><div class="adm-field"><label>Flag image URL</label><input id="cl_flag" placeholder="https://flagcdn.com/w160/us.png"></div></div>
    <div class="adm-field"><label>Institution name</label><input id="cl_name"></div>
    <div class="adm-field"><label>Description (English)</label><textarea id="cl_desc"></textarea></div>
    <div class="adm-field"><label>Description (Thai)</label><textarea id="cl_descth"></textarea></div>
    <div class="adm-field"><label>Tags (comma-separated)</label><input id="cl_tags"></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('collabs')">Cancel</button><button class="btn btn--primary" onclick="admSaveCollab()">${icon('i-check')} Save</button></div>
  </div>`;
  el('cl_cc').value=c.cc||'';el('cl_flag').value=c.flag||'';el('cl_name').value=c.name||'';el('cl_desc').value=c.desc||'';el('cl_descth').value=c.descTh||'';el('cl_tags').value=(c.tags||[]).join(', ');};
window.admSaveCollab=function(){const name=val('cl_name').trim();if(!name){toast(lang==='th'?'ต้องมีชื่อสถาบัน':'Institution name required');return;}
  const item={cc:val('cl_cc').trim(),flag:val('cl_flag').trim(),name,desc:val('cl_desc').trim(),descTh:val('cl_descth').trim(),tags:val('cl_tags').split(',').map(s=>s.trim()).filter(Boolean)};
  if(editIdx>=0)COLLABS[editIdx]=item;else COLLABS.push(item);
  saveStore();renderCollabs();renderAdmin('collabs');};
window.admDelCollab=function(i){if(!confirm((lang==='th'?'ลบ ':'Delete ')+COLLABS[i].name+'?'))return;COLLABS.splice(i,1);saveStore();renderCollabs();renderAdmin('collabs');};

/* --- BANNER admin --- */
function admBannerList(){return `<div class="adm-section-t">${BANNERS.length} banners · shown in rotation, ~5s each</div>`+
  BANNERS.map((b,i)=>`<div class="adm-row"><img class="thumb" src="${b.img}"><div class="r-main"><h4>${esc(b.caption||'(no caption)')}</h4><div class="r-sub">${esc(b.link||'')}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditBanner(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelBanner(${i})">${icon('i-close')}</button></div></div>`).join('')+
  `<button class="adm-add" onclick="admEditBanner(-1)">${icon('i-plus')} Add banner</button>`;}
window.admEditBanner=function(i){editIdx=i;const b=i>=0?BANNERS[i]:{img:'',caption:'',captionTh:'',link:''};formImg=b.img||'';
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('banner')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-field"><label>Image</label><div class="adm-photo-row" id="n_photowrap"></div></div>
    <div class="adm-field"><label>Caption (English)</label><input id="bn_cap" placeholder="Now accepting applications for 2026"></div>
    <div class="adm-field"><label>Caption (Thai)</label><input id="bn_capth"></div>
    <div class="adm-field"><label>Link (optional — e.g. #join or https://...)</label><input id="bn_link" placeholder="#join"></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('banner')">Cancel</button><button class="btn btn--primary" onclick="admSaveBanner()">${icon('i-check')} Save</button></div>
  </div>`;
  el('bn_cap').value=b.caption||'';el('bn_capth').value=b.captionTh||'';el('bn_link').value=b.link||'';
  refreshPhoto(true);};
window.admSaveBanner=function(){if(!formImg){toast(lang==='th'?'ต้องมีรูปภาพ':'Image required');return;}
  const item={img:formImg,caption:val('bn_cap').trim(),captionTh:val('bn_capth').trim(),link:val('bn_link').trim()};
  if(editIdx>=0)BANNERS[editIdx]=item;else BANNERS.push(item);
  saveStore();renderBanner();renderAdmin('banner');};
window.admDelBanner=function(i){if(!confirm(lang==='th'?'ลบแบนเนอร์นี้?':'Delete this banner?'))return;BANNERS.splice(i,1);saveStore();renderBanner();renderAdmin('banner');};

/* --- EVENTS admin --- */
function admEventsList(){return `<div class="adm-section-t">${EVENTS.length} upcoming events · click to edit</div>`+
  EVENTS.map((e,i)=>`<div class="adm-row"><span class="mono-av" style="background:${hue(e.title)}">${esc(e.day||'?')}</span><div class="r-main"><h4>${esc(e.title)}</h4><div class="r-sub">${esc(e.month)} ${esc(e.day)} · ${esc(e.who||'')}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditEvent(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelEvent(${i})">${icon('i-close')}</button></div></div>`).join('')+
  `<button class="adm-add" onclick="admEditEvent(-1)">${icon('i-plus')} Add event</button>`;}
window.admEditEvent=function(i){editIdx=i;const e=i>=0?EVENTS[i]:{month:'',day:'',title:'',titleTh:'',who:'',whoTh:''};
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('events')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-2"><div class="adm-field"><label>Month (e.g. Feb)</label><input id="ev_month"></div><div class="adm-field"><label>Day (e.g. 14)</label><input id="ev_day"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Title (English)</label><input id="ev_title"></div><div class="adm-field"><label>Title (Thai)</label><input id="ev_titleth"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Details (English)</label><input id="ev_who" placeholder="Room, time, presenter…"></div><div class="adm-field"><label>Details (Thai)</label><input id="ev_whoth"></div></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('events')">Cancel</button><button class="btn btn--primary" onclick="admSaveEvent()">${icon('i-check')} Save</button></div>
  </div>`;
  el('ev_month').value=e.month||'';el('ev_day').value=e.day||'';el('ev_title').value=e.title||'';el('ev_titleth').value=e.titleTh||'';el('ev_who').value=e.who||'';el('ev_whoth').value=e.whoTh||'';};
window.admSaveEvent=function(){const t=val('ev_title').trim();if(!t){toast(lang==='th'?'ต้องมีชื่อกิจกรรม':'Title required');return;}
  const item={month:val('ev_month').trim(),day:val('ev_day').trim(),title:t,titleTh:val('ev_titleth').trim(),who:val('ev_who').trim(),whoTh:val('ev_whoth').trim()};
  if(editIdx>=0)EVENTS[editIdx]=item;else EVENTS.push(item);
  saveStore();renderEvents();renderAdmin('events');};
window.admDelEvent=function(i){if(!confirm((lang==='th'?'ลบกิจกรรม ':'Delete ')+EVENTS[i].title+'?'))return;EVENTS.splice(i,1);saveStore();renderEvents();renderAdmin('events');};

/* --- GALLERY admin --- */
function admGalleryList(){return `<div class="adm-section-t">${GALLERY.length} photos · click to edit</div>`+
  GALLERY.map((src,i)=>`<div class="adm-row"><img class="thumb" src="${src}"><div class="r-main"><h4>Photo ${i+1}</h4></div><div class="r-act"><button class="adm-ic" onclick="admEditGalleryPhoto(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelGalleryPhoto(${i})">${icon('i-close')}</button></div></div>`).join('')+
  `<button class="adm-add" onclick="admEditGalleryPhoto(-1)">${icon('i-plus')} Add photo</button>`;}
window.admEditGalleryPhoto=function(i){editIdx=i;formImg=i>=0?GALLERY[i]:'';
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('gallery')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-field"><label>Photo</label><div class="adm-photo-row" id="n_photowrap"></div></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('gallery')">Cancel</button><button class="btn btn--primary" onclick="admSaveGalleryPhoto()">${icon('i-check')} Save</button></div>
  </div>`;
  refreshPhoto(true);};
window.admSaveGalleryPhoto=function(){if(!formImg){toast(lang==='th'?'ต้องมีรูปภาพ':'Image required');return;}
  if(editIdx>=0)GALLERY[editIdx]=formImg;else GALLERY.push(formImg);
  saveStore();renderGallery();renderAdmin('gallery');};
/* --- STUDENT RESOURCES admin --- */
function admResourcesList(){return `<div class="adm-section-t">${RESOURCES.length} resources · click to edit</div>`+
  RESOURCES.map((r,i)=>`<div class="adm-row"><span class="mono-av" style="background:${hue(r.title)}">${icon(r.icon||'i-doc')}</span><div class="r-main"><h4>${esc(r.title)}</h4><div class="r-sub">${esc(r.meta||'')}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditResource(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelResource(${i})">${icon('i-close')}</button></div></div>`).join('')+
  `<button class="adm-add" onclick="admEditResource(-1)">${icon('i-plus')} Add resource</button>`;}
window.admEditResource=function(i){editIdx=i;const r=i>=0?RESOURCES[i]:{icon:'i-doc',title:'',titleTh:'',meta:'',metaTh:'',link:''};
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('resources')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-2"><div class="adm-field"><label>Title (English)</label><input id="rs_title"></div><div class="adm-field"><label>Title (Thai)</label><input id="rs_titleth"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Meta / file info (English)</label><input id="rs_meta" placeholder="Updated 2024 · PDF"></div><div class="adm-field"><label>Meta / file info (Thai)</label><input id="rs_metath"></div></div>
    <div class="adm-field"><label>File link (Google Drive / PDF URL — leave empty for "coming soon")</label><input id="rs_link" placeholder="https://..."></div>
    <div class="adm-field"><label>Icon</label><select id="rs_icon"><option value="i-doc">Document</option><option value="i-book">Book</option></select></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('resources')">Cancel</button><button class="btn btn--primary" onclick="admSaveResource()">${icon('i-check')} Save</button></div>
  </div>`;
  el('rs_title').value=r.title||'';el('rs_titleth').value=r.titleTh||'';el('rs_meta').value=r.meta||'';el('rs_metath').value=r.metaTh||'';el('rs_link').value=r.link||'';el('rs_icon').value=r.icon||'i-doc';};
window.admSaveResource=function(){const t=val('rs_title').trim();if(!t){toast(lang==='th'?'ต้องมีชื่อเอกสาร':'Title required');return;}
  const item={title:t,titleTh:val('rs_titleth').trim(),meta:val('rs_meta').trim(),metaTh:val('rs_metath').trim(),link:val('rs_link').trim(),icon:val('rs_icon')};
  if(editIdx>=0)RESOURCES[editIdx]=item;else RESOURCES.push(item);
  saveStore();renderResources();renderAdmin('resources');};

window.admDelResource=function(i){if(!confirm((lang==='th'?'ลบเอกสาร ':'Delete ')+RESOURCES[i].title+'?'))return;RESOURCES.splice(i,1);saveStore();renderResources();renderAdmin('resources');};

/* --- GRANT PROPOSAL TEAM admin --- */
function admGrantList(){return `<div class="data-card"><h4>${icon('i-spark')} About this team</h4><p>${lang==='th'?'ทีมนี้แยกจาก "ทีมงานโครงการ" ด้านบน ใช้ยื่นข้อเสนอทุนวิจัยโดยเฉพาะ นำโดย ศ.ดร.อรุณรัตน์ (ดูประวัติเต็มด้านบนแล้ว) เพิ่มผู้ร่วมวิจัยไทย/ต่างประเทศได้ด้านล่าง':'This team is separate from the "Programme team" above — used for grant proposals. It\'s led by Prof. Dr. Arunrat (her full profile is already shown above). Add Thai or international co-researchers below.'}</p></div>`+
  `<div class="adm-section-t">${GRANT_TEAM.length} co-researcher(s) · click to edit</div>`+
  GRANT_TEAM.map((m,i)=>`<div class="adm-row">${m.img?`<img class="thumb" src="${m.img}">`:`<span class="mono-av" style="background:${hue(m.en)}">${initials(m.en)}</span>`}<div class="r-main"><h4>${esc(m.en)}</h4><div class="r-sub">${esc(m.role||'')}${m.intl?(lang==='th'?' · ต่างประเทศ':' · International'):''}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditGrant(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelGrant(${i})">${icon('i-close')}</button></div></div>`).join('')+
  `<button class="adm-add" onclick="admEditGrant(-1)">${icon('i-plus')} Add co-researcher</button>`;}
window.admEditGrant=function(i){editIdx=i;const m=i>=0?GRANT_TEAM[i]:{en:'',th:'',role:'Co-researcher',roleTh:'ผู้ร่วมวิจัย',tags:[],bio:'',intl:false,phone:'',email:'',institution:'',country:''};formImg=m.img||'';
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('grantteam')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-field"><label>Photo</label><div class="adm-photo-row" id="f_photowrap"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Name (English)</label><input id="f_en"></div><div class="adm-field"><label>Name (Thai)</label><input id="f_th"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Role (English)</label><input id="g_role" placeholder="Co-researcher"></div><div class="adm-field"><label>Role (Thai)</label><input id="g_roleth" placeholder="ผู้ร่วมวิจัย"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Institution / University</label><input id="g_inst" placeholder="Khon Kaen University"></div><div class="adm-field"><label>Country</label><input id="g_country" placeholder="Thailand"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Phone</label><input id="g_phone" placeholder="+66 8x xxx xxxx"></div><div class="adm-field"><label>Email</label><input id="g_email" placeholder="name@kku.ac.th"></div></div>
    <div class="adm-row"><div class="r-main"><h4>${lang==='th'?'ผู้ร่วมวิจัยต่างประเทศ':'International co-researcher'}</h4></div><div class="tgl ${m.intl?'on':''}" id="g_intl" onclick="this.classList.toggle('on')"></div></div>
    <div class="adm-field"><label>Tags (comma-separated)</label><input id="g_tags"></div>
    <div class="adm-field"><label>Bio</label><textarea id="g_bio"></textarea></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('grantteam')">Cancel</button><button class="btn btn--primary" onclick="admSaveGrant()">${icon('i-check')} Save</button></div>
  </div>`;
  el('f_en').value=m.en||'';el('f_th').value=m.th||'';el('g_role').value=m.role||'';el('g_roleth').value=m.roleTh||'';el('g_inst').value=m.institution||'';el('g_country').value=m.country||'';el('g_phone').value=m.phone||'';el('g_email').value=m.email||'';el('g_tags').value=(m.tags||[]).join(', ');el('g_bio').value=m.bio||'';
  refreshPhoto(false);el('f_en').addEventListener('input',()=>{if(!formImg)refreshPhoto(false);});
};window.admSaveGrant=function(){
  const en=val('f_en').trim();
  if(!en){toast(lang==='th'?'ต้องมีชื่อ':'Name required');return;}
  const item={en,th:val('f_th').trim(),role:val('g_role').trim(),roleTh:val('g_roleth').trim(),institution:val('g_inst').trim(),country:val('g_country').trim(),phone:val('g_phone').trim(),email:val('g_email').trim(),intl:el('g_intl').classList.contains('on'),tags:val('g_tags').split(',').map(s=>s.trim()).filter(Boolean),bio:val('g_bio').trim(),img:formImg};
  if(editIdx>=0)GRANT_TEAM[editIdx]=item;else GRANT_TEAM.push(item);
  saveStore();renderGrantTeam();renderAdmin('grantteam');
};
window.admDelGrant=function(i){if(!confirm((lang==='th'?'ลบ ':'Delete ')+GRANT_TEAM[i].en+'?'))return;GRANT_TEAM.splice(i,1);saveStore();renderGrantTeam();renderAdmin('grantteam');};let PENDING_TESTI=[];
async function admVoicesList(){
  const c=el('adminContent');
  c.innerHTML=`<div class="adm-section-t">${lang==='th'?'รอตรวจสอบ':'Pending submissions'}</div><div id="admPendingWrap"><p style="font-size:.85rem;color:var(--muted)">Loading…</p></div>
  <div class="adm-section-t" style="margin-top:22px">${TESTIMONIALS.length} ${lang==='th'?'รีวิวที่เผยแพร่แล้ว · คลิกเพื่อแก้ไข':'published voices · click to edit'}</div>
  <div id="admTestiWrap">${TESTIMONIALS.map((t,i)=>admTestiRow(t,i)).join('')}
  <button class="adm-add" onclick="admEditTesti(-1)">${icon('i-plus')} Add voice</button></div>`;
  if(window.supa){
    const {data,error}=await supa.from('testimonial_submissions').select('*').eq('status','pending').order('created_at',{ascending:false});
    const pw=el('admPendingWrap');
    if(error){pw.innerHTML=`<p style="font-size:.85rem;color:var(--muted)">Could not load submissions.</p>`;return;}
    PENDING_TESTI=data||[];
    if(!PENDING_TESTI.length){pw.innerHTML=`<p style="font-size:.85rem;color:var(--muted)">${lang==='th'?'ไม่มีรีวิวรอตรวจสอบ':'No pending submissions.'}</p>`;return;}
    pw.innerHTML=PENDING_TESTI.map((s,i)=>`<div class="adm-row">${s.img?`<img class="thumb"src="${safeImgSrc(s.img)}">`:`<span class="mono-av" style="background:${hue(s.name)}">${initials(s.name)}</span>`}<div class="r-main"><h4>${esc(s.name)}</h4><div class="r-sub">${esc(s.role||'')} · ${esc((s.quote||'').slice(0,60))}${(s.quote||'').length>60?'…':''}</div></div><div class="r-act"><button class="adm-ic" title="${lang==='th'?'อนุมัติ':'Approve'}" onclick="admApproveTesti(${i})">${icon('i-check')}</button><button class="adm-ic del" title="${lang==='th'?'ปฏิเสธ':'Reject'}" onclick="admRejectTesti(${i})">${icon('i-close')}</button></div></div>`).join('');
  } else {
    el('admPendingWrap').innerHTML=`<p style="font-size:.85rem;color:var(--muted)">Connect Supabase to receive public submissions.</p>`;
  }
}
function admTestiRow(t,i){
  return `<div class="adm-row" style="${t.hidden?'opacity:.5':''}">${t.img?`<img class="thumb" src="${t.img}">`:`<span class="mono-av" style="background:${hue(t.name)}">${initials(t.name)}</span>`}<div class="r-main"><h4>${esc(t.name)}</h4><div class="r-sub">${esc(t.role||'')}${t.hidden?(lang==='th'?' · ซ่อนอยู่':' · hidden'):''}</div></div><div class="r-act"><button class="adm-ic" title="${t.hidden?(lang==='th'?'แสดง':'Show'):(lang==='th'?'ซ่อน':'Hide')}" onclick="admToggleHideTesti(${i})">${icon(t.hidden?'i-sun':'i-moon')}</button><button class="adm-ic" onclick="admEditTesti(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelTesti(${i})">${icon('i-close')}</button></div></div>`;
}
window.admToggleHideTesti=function(i){
  TESTIMONIALS[i].hidden=!TESTIMONIALS[i].hidden;
  saveStore();renderTesti();renderAdmin('voices');
};
window.admApproveTesti=function(i){
  const s=PENDING_TESTI[i];if(!s)return;
  TESTIMONIALS.push({q:s.quote,name:s.name,role:s.role,img:s.img||''});
  saveStore();renderTesti();
  if(window.supa)supa.from('testimonial_submissions').update({status:'approved'}).eq('id',s.id).then(()=>{renderAdmin('voices');toast(lang==='th'?'อนุมัติแล้ว':'Approved');});
  else renderAdmin('voices');
};
window.admRejectTesti=function(i){
  const s=PENDING_TESTI[i];if(!s)return;
  if(!confirm(lang==='th'?'ปฏิเสธรีวิวนี้?':'Reject this submission?'))return;
  if(window.supa)supa.from('testimonial_submissions').update({status:'rejected'}).eq('id',s.id).then(()=>{renderAdmin('voices');toast(lang==='th'?'ปฏิเสธแล้ว':'Rejected');});
};
window.admEditTesti=function(i){editIdx=i;const t=i>=0?TESTIMONIALS[i]:{q:'',qTh:'',name:'',role:'',roleTh:'',img:''};formImg=t.img||'';
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('voices')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-field"><label>Photo</label><div class="adm-photo-row" id="n_photowrap"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Name</label><input id="ts_e_name"></div><div class="adm-field"><label>Role</label><input id="ts_e_role"></div></div>
    <div class="adm-field"><label>Role (Thai, optional)</label><input id="ts_e_roleth"></div>
    <div class="adm-field"><label>Quote (English)</label><textarea id="ts_e_q"></textarea></div>
    <div class="adm-field"><label>Quote (Thai, optional)</label><textarea id="ts_e_qth"></textarea></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('voices')">Cancel</button><button class="btn btn--primary" onclick="admSaveTesti()">${icon('i-check')} Save</button></div>
  </div>`;
  el('ts_e_name').value=t.name||'';el('ts_e_role').value=t.role||'';el('ts_e_roleth').value=t.roleTh||'';el('ts_e_q').value=t.q||'';el('ts_e_qth').value=t.qTh||'';
  refreshPhoto(false);};
window.admSaveTesti=function(){const name=val('ts_e_name').trim();const q=val('ts_e_q').trim();if(!name||!q){toast(lang==='th'?'ต้องมีชื่อและข้อความ':'Name and quote required');return;}
  const prev=editIdx>=0?TESTIMONIALS[editIdx]:{};
  const item={name,role:val('ts_e_role').trim(),roleTh:val('ts_e_roleth').trim(),q,qTh:val('ts_e_qth').trim(),img:formImg,hidden:!!prev.hidden};
  if(editIdx>=0)TESTIMONIALS[editIdx]=item;else TESTIMONIALS.push(item);
  saveStore();renderTesti();renderAdmin('voices');};
window.admDelTesti=function(i){if(!confirm((lang==='th'?'ลบรีวิวของ ':'Delete ')+TESTIMONIALS[i].name+'?'))return;TESTIMONIALS.splice(i,1);saveStore();renderTesti();renderAdmin('voices');};

/* --- CONTACT MESSAGES admin --- */
let CONTACT_MSGS=[];
async function admMessagesList(){
  const c=el('adminContent');
  c.innerHTML=`<div class="adm-section-t">${lang==='th'?'ข้อความที่ส่งเข้ามา':'Incoming messages'}</div><div id="admMsgWrap"><p style="font-size:.85rem;color:var(--muted)">Loading…</p></div>`;
  if(!window.supa){el('admMsgWrap').innerHTML=`<p style="font-size:.85rem;color:var(--muted)">Supabase is not connected.</p>`;return;}
  const {data,error}=await supa.from('contact_messages').select('*').order('created_at',{ascending:false});
  const w=el('admMsgWrap');
  if(error){w.innerHTML=`<p style="font-size:.85rem;color:#c0392b">Error: ${esc(error.message)}<br><span style="color:var(--muted)">Have you run the SQL to create the contact_messages table, and are you signed in?</span></p>`;return;}
  CONTACT_MSGS=data||[];
  if(!CONTACT_MSGS.length){w.innerHTML=`<p style="font-size:.85rem;color:var(--muted)">${lang==='th'?'ยังไม่มีข้อความ':'No messages yet.'}</p>`;return;}
  w.innerHTML=CONTACT_MSGS.map((m,i)=>`<div class="adm-row" style="align-items:flex-start;${m.read?'opacity:.6':''}">
    <span class="mono-av" style="background:${hue(m.name)}">${initials(m.name)}</span>
    <div class="r-main">
      <h4>${esc(m.name)} ${m.read?'':`<span style="color:var(--accent);font-size:10px;margin-left:6px">${lang==='th'?'ใหม่':'NEW'}</span>`}</h4>
      <div class="r-sub">${esc(m.email)} · ${esc(m.subject||'')}</div>
      <div class="r-sub" style="margin-top:6px;color:var(--ink);white-space:pre-wrap">${esc(m.message)}</div>
      <div class="r-sub" style="margin-top:6px">${new Date(m.created_at).toLocaleString()}</div>
    </div>
    <div class="r-act">
      ${m.read?'':`<button class="adm-ic" title="Mark read" onclick="admMarkMsgRead(${i})">${icon('i-check')}</button>`}
      <button class="adm-ic del" onclick="admDelMsg(${i})">${icon('i-close')}</button>
    </div>
  </div>`).join('');
}
window.admMarkMsgRead=function(i){const m=CONTACT_MSGS[i];if(!m)return;supa.from('contact_messages').update({read:true}).eq('id',m.id).then(()=>renderAdmin('messages'));};
window.admDelMsg=function(i){const m=CONTACT_MSGS[i];if(!m)return;if(!confirm(lang==='th'?'ลบข้อความนี้?':'Delete this message?'))return;supa.from('contact_messages').delete().eq('id',m.id).then(()=>renderAdmin('messages'));};

/* --- TEAM --- */
/* --- TEAM --- */
function admTeamList(){return `<div class="adm-section-t">${MEMBERS.length} members · click to edit</div>`+
  MEMBERS.map((m,i)=>`<div class="adm-row">${m.img?`<img class="thumb" src="${m.img}">`:`<span class="mono-av" style="background:${hue(m.en)}">${initials(m.en)}</span>`}<div class="r-main"><h4>${esc(m.en)}</h4><div class="r-sub">${ROLE_EN[m.group]||m.group}${m.pi?' · locked photo':''}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditMember(${i})">${icon('i-doc')}</button>${m.pi?'':`<button class="adm-ic del" onclick="admDelMember(${i})">${icon('i-close')}</button>`}</div></div>`).join('')+
  `<button class="adm-add" onclick="admEditMember(-1)">${icon('i-plus')} Add member</button>`;}
window.admEditMember=function(i){editIdx=i;const m=i>=0?MEMBERS[i]:{group:'phd',tags:[],en:'',th:'',bio:'',phone:'',email:'',institution:'',country:''};formImg=m.img||'';
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('team')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-field"><label>Photo</label><div class="adm-photo-row" id="f_photowrap"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Name (English)</label><input id="f_en"></div><div class="adm-field"><label>Name (Thai)</label><input id="f_th"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Group</label><select id="f_group">${['lead','co','intl','postdoc','phd','master','intern','alumni-phd','alumni-master'].map(g=>`<option value="${g}">${ROLE_EN[g]}</option>`).join('')}</select></div><div class="adm-field"><label>Tags (comma-separated)</label><input id="f_tags"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Institution / University</label><input id="f_inst" placeholder="Khon Kaen University"></div><div class="adm-field"><label>Country</label><input id="f_country" placeholder="Thailand"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Phone</label><input id="f_phone" placeholder="+66 8x xxx xxxx"></div><div class="adm-field"><label>Email</label><input id="f_email" placeholder="name@kku.ac.th"></div></div>
    <div class="adm-field"><label>Bio</label><textarea id="f_bio"></textarea></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('team')">Cancel</button><button class="btn btn--primary" onclick="admSaveMember()">${icon('i-check')} Save</button></div>
  </div>`;
  el('f_en').value=m.en||'';el('f_th').value=m.th||'';el('f_group').value=m.group||'phd';el('f_tags').value=(m.tags||[]).join(', ');el('f_inst').value=m.institution||'';el('f_country').value=m.country||'';el('f_phone').value=m.phone||'';el('f_email').value=m.email||'';el('f_bio').value=m.bio||BIOS[m.en]||'';
  refreshPhoto(false);el('f_en').addEventListener('input',()=>{if(!formImg)refreshPhoto(false);});
};
window.admSaveMember=function(){const en=val('f_en').trim();if(!en){toast(lang==='th'?'ต้องมีชื่อ':'Name required');return;}
  const m={group:val('f_group'),en:en,th:val('f_th').trim(),tags:val('f_tags').split(',').map(s=>s.trim()).filter(Boolean),institution:val('f_inst').trim(),country:val('f_country').trim(),phone:val('f_phone').trim(),email:val('f_email').trim(),bio:val('f_bio').trim(),img:formImg};
  if(editIdx>=0){if(MEMBERS[editIdx].pi)m.pi=true;MEMBERS[editIdx]=m;}else MEMBERS.push(m);
  saveStore();renderProjectTeam();renderTeam(teamCat);renderAdmin('team');};/* --- NEWS --- */
function admNewsList(){return `<div class="adm-section-t">${NEWS.length} news items</div>`+
  NEWS.map((n,i)=>`<div class="adm-row">${n.img?`<img class="thumb" src="${n.img}">`:`<span class="mono-av" style="background:${hue(n.title)}">${initials(n.title)}</span>`}<div class="r-main"><h4>${esc(n.title)}</h4><div class="r-sub">${esc(n.date)}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditNews(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelNews(${i})">${icon('i-close')}</button></div></div>`).join('')+
  `<button class="adm-add" onclick="admEditNews(-1)">${icon('i-plus')} Add news</button>`;}
window.admEditNews=function(i){editIdx=i;const n=i>=0?NEWS[i]:{title:'',date:'',body:'',img:''};formImg=n.img||'';
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('news')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-field"><label>Cover image</label><div class="adm-photo-row" id="n_photowrap"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Title</label><input id="n_title"></div><div class="adm-field"><label>Date (e.g. 15 Jan 2024)</label><input id="n_date"></div></div>
    <div class="adm-field"><label>Body (plain text or HTML)</label><textarea id="n_body" style="min-height:130px"></textarea></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('news')">Cancel</button><button class="btn btn--primary" onclick="admSaveNews()">${icon('i-check')} Save</button></div>
  </div>`;
  el('n_title').value=n.title||'';el('n_date').value=n.date||'';el('n_body').value=(n.body||'').replace(/<\/?p>/g,'').trim();refreshPhoto(true);};
window.admSaveNews=function(){const t=val('n_title').trim();if(!t){toast(lang==='th'?'ต้องมีหัวข้อ':'Title required');return;}
  let body=val('n_body').trim();if(body&&body.indexOf('<')<0)body='<p>'+body.replace(/\n{2,}/g,'</p><p>').replace(/\n/g,'<br>')+'</p>';
  const item={id:editIdx>=0?NEWS[editIdx].id:(Math.max(0,...NEWS.map(n=>n.id))+1),title:t,date:val('n_date').trim(),img:formImg,body:body};
  if(editIdx>=0)NEWS[editIdx]=item;else NEWS.unshift(item);
  saveStore();renderNews();renderAdmin('news');};
window.admDelNews=function(i){if(!confirm((lang==='th'?'ลบข่าว ':'Delete ')+NEWS[i].title+'?'))return;NEWS.splice(i,1);saveStore();renderNews();renderAdmin('news');};
/* --- PUBS (extra curated; ORCID loads automatically) --- */
function admPubList(){return `<div class="data-card"><h4>${icon('i-scholar')} ORCID feed</h4><p>${activePubs().length} papers currently shown. Papers under ORCID ${ORCID} load automatically and cannot be edited here. Add extra items (e.g. in-press, books) below.</p></div>`+
  `<div class="adm-section-t">${CPUBS.length} manual item(s)</div>`+
  CPUBS.map((p,i)=>`<div class="adm-row"><span class="mono-av" style="background:${hue(p.title)}">${icon('i-book')}</span><div class="r-main"><h4>${esc(p.title)}</h4><div class="r-sub">${esc(String(p.year||''))} · ${esc(p.journal||'')}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditPub(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelPub(${i})">${icon('i-close')}</button></div></div>`).join('')+
  `<button class="adm-add" onclick="admEditPub(-1)">${icon('i-plus')} Add publication</button>`;}
window.admEditPub=function(i){editIdx=i;const p=i>=0?CPUBS[i]:{title:'',authors:'',year:'',journal:'',link:'',abstract:''};
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('pubs')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-field"><label>Title</label><input id="p_title"></div>
    <div class="adm-field"><label>Authors</label><input id="p_authors"></div>
    <div class="adm-2"><div class="adm-field"><label>Year</label><input id="p_year"></div><div class="adm-field"><label>Journal</label><input id="p_journal"></div></div>
    <div class="adm-field"><label>Link / DOI URL</label><input id="p_link"></div>
    <div class="adm-field"><label>Abstract</label><textarea id="p_abstract"></textarea></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('pubs')">Cancel</button><button class="btn btn--primary" onclick="admSavePub()">${icon('i-check')} Save</button></div>
  </div>`;
  el('p_title').value=p.title||'';el('p_authors').value=p.authors||'';el('p_year').value=p.year||'';el('p_journal').value=p.journal||'';el('p_link').value=p.link||'';el('p_abstract').value=p.abstract||'';};
window.admSavePub=function(){const t=val('p_title').trim();if(!t){toast(lang==='th'?'ต้องมีชื่อผลงาน':'Title required');return;}
  const item={id:editIdx>=0?CPUBS[editIdx].id:-(Date.now()),title:t,authors:val('p_authors').trim(),year:+val('p_year')||val('p_year').trim(),journal:val('p_journal').trim(),link:val('p_link').trim()||'#',abstract:val('p_abstract').trim()};
  if(editIdx>=0)CPUBS[editIdx]=item;else CPUBS.push(item);
  saveStore();renderPubAll();renderAdmin('pubs');};
window.admDelPub=function(i){if(!confirm('Delete this publication?'))return;CPUBS.splice(i,1);saveStore();renderPubAll();renderAdmin('pubs');};

/* --- INTELLECTUAL PROPERTY --- */
function admIPList(){
  return `<div class="data-card"><h4>${icon('i-doc')} ${lang==='th'?'สิทธิบัตรและอนุสิทธิบัตร':'Patents & petty patents'}</h4><p>${lang==='th'?'รายการนี้แสดงในช่วงกลางน้ำ และบันทึกพร้อมข้อมูลเว็บไซต์ขึ้น Supabase':'These records appear in the midstream portfolio and are saved with the website content in Supabase.'}</p></div>
  <div class="adm-section-t">${IP_ASSETS.length} ${lang==='th'?'รายการ · คลิกเพื่อแก้ไข':'records · click to edit'}</div>`+
  IP_ASSETS.map((x,i)=>`<div class="adm-row"><span class="mono-av" style="background:${x.kind==='petty-granted'?'var(--accent)':'var(--ochre)'}">${esc(x.no)}</span><div class="r-main"><h4>${esc(x.formula)}</h4><div class="r-sub">${esc(ipKindLabel(x))} · ${esc(x.number||'—')}${x.tradeName?' · '+esc(x.tradeName):''}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditIP(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelIP(${i})">${icon('i-close')}</button></div></div>`).join('')+
  `<button class="adm-add" onclick="admEditIP(-1)">${icon('i-plus')} ${lang==='th'?'เพิ่มรายการทรัพย์สินทางปัญญา':'Add IP record'}</button>`;
}
window.admEditIP=function(i){
  editIdx=i;
  const x=i>=0?IP_ASSETS[i]:{no:String(IP_ASSETS.length+1).padStart(2,'0'),formula:'',formulaEn:'',kind:'petty-application',number:'',date:'',tradeName:'',registration:''};
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('ip')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-2"><div class="adm-field"><label>ชื่อสูตร / นวัตกรรม (ไทย)</label><input id="ip_formula"></div><div class="adm-field"><label>Formula / innovation (English)</label><input id="ip_formulaen"></div></div>
    <div class="adm-field"><label>${lang==='th'?'ประเภททรัพย์สินทางปัญญา':'IP type'}</label><select id="ip_kind"><option value="petty-granted">Granted petty patent / อนุสิทธิบัตร</option><option value="petty-application">Petty-patent application / คำขออนุสิทธิบัตร</option><option value="patent-application">Patent application / คำขอสิทธิบัตร</option></select></div>
    <div class="adm-2"><div class="adm-field"><label>${lang==='th'?'เลขคำขอ/เลขที่':'Application / IP number'}</label><input id="ip_number"></div><div class="adm-field"><label>${lang==='th'?'วันที่':'Date'}</label><input id="ip_date"></div></div>
    <div class="adm-field"><label>${lang==='th'?'ชื่อทางการค้า':'Trade name'}</label><input id="ip_trade"></div>
    <div class="adm-field"><label>${lang==='th'?'เลขทะเบียนและรายละเอียด':'Registration details'}</label><textarea id="ip_reg"></textarea></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('ip')">Cancel</button><button class="btn btn--primary" onclick="admSaveIP()">${icon('i-check')} Save</button></div>
  </div>`;
  el('ip_formula').value=x.formula||'';el('ip_formulaen').value=x.formulaEn||'';el('ip_kind').value=x.kind||'petty-application';el('ip_number').value=x.number||'';el('ip_date').value=x.date||'';el('ip_trade').value=x.tradeName||'';el('ip_reg').value=x.registration||'';
};
window.admSaveIP=function(){
  const formula=val('ip_formula').trim();if(!formula){toast(lang==='th'?'ต้องมีชื่อสูตร':'Formula title required');return;}
  const base=editIdx>=0?IP_ASSETS[editIdx]:{no:String(IP_ASSETS.length+1).padStart(2,'0')};
  const item=Object.assign({},base,{formula,formulaEn:val('ip_formulaen').trim(),kind:val('ip_kind'),number:val('ip_number').trim(),date:val('ip_date').trim(),tradeName:val('ip_trade').trim(),registration:val('ip_reg').trim()});
  if(editIdx>=0)IP_ASSETS[editIdx]=item;else IP_ASSETS.push(item);
  IP_ASSETS.forEach((x,k)=>x.no=String(k+1).padStart(2,'0'));
  saveStore();renderIP();renderAdmin('ip');
};
window.admDelIP=function(i){
  if(!confirm((lang==='th'?'ลบรายการ ':'Delete ')+(IP_ASSETS[i].formula||'')+'?'))return;
  IP_ASSETS.splice(i,1);IP_ASSETS.forEach((x,k)=>x.no=String(k+1).padStart(2,'0'));
  saveStore();renderIP();renderAdmin('ip');
};


/* --- PRODUCTS --- */
function admProdList(){return `<div class="adm-section-t">${PRODUCTS.length} products · click to edit</div>`+
  PRODUCTS.map((p,i)=>`<div class="adm-row">${p.img?`<img class="thumb" src="${p.img}">`:`<span class="mono-av" style="background:linear-gradient(135deg,${p.c1||'#2f6b4f'},${p.c2||'#4f9d78'})">${icon(p.icon||'i-flask')}</span>`}<div class="r-main"><h4>${esc(p.name)}</h4><div class="r-sub">${esc(p.type||'')}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditProduct(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelProduct(${i})">${icon('i-close')}</button></div></div>`).join('')+
  `<button class="adm-add" onclick="admEditProduct(-1)">${icon('i-plus')} Add product</button>`;}
window.admEditProduct=function(i){editIdx=i;const p=i>=0?PRODUCTS[i]:{name:'',nameTh:'',type:'',typeTh:'',benefit:'',benefitTh:'',ingredients:'',size:'',price:'',c1:'#2f6b4f',c2:'#4f9d78',icon:'i-flask',img:''};formImg=p.img||'';
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('products')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-field"><label>Product image (optional)</label><div class="adm-photo-row" id="n_photowrap"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Name (English)</label><input id="pr_name"></div><div class="adm-field"><label>Name (Thai)</label><input id="pr_nameth"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Type / tag (English)</label><input id="pr_type"></div><div class="adm-field"><label>Type / tag (Thai)</label><input id="pr_typeth"></div></div>
    <div class="adm-field"><label>Benefit (English)</label><textarea id="pr_ben"></textarea></div>
    <div class="adm-field"><label>Benefit (Thai)</label><textarea id="pr_benth"></textarea></div>
    <div class="adm-field"><label>Key ingredients</label><input id="pr_ing"></div>
    <div class="adm-2"><div class="adm-field"><label>Size</label><input id="pr_size"></div><div class="adm-field"><label>Price (optional)</label><input id="pr_price"></div></div>
    <div class="adm-2"><div class="adm-field"><label>Colour top</label><input id="pr_c1" type="color"></div><div class="adm-field"><label>Colour bottom</label><input id="pr_c2" type="color"></div></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('products')">Cancel</button><button class="btn btn--primary" onclick="admSaveProduct()">${icon('i-check')} Save</button></div>
  </div>`;
  el('pr_name').value=p.name||'';el('pr_nameth').value=p.nameTh||'';el('pr_type').value=p.type||'';el('pr_typeth').value=p.typeTh||'';el('pr_ben').value=p.benefit||'';el('pr_benth').value=p.benefitTh||'';el('pr_ing').value=p.ingredients||'';el('pr_size').value=p.size||'';el('pr_price').value=p.price||'';el('pr_c1').value=p.c1||'#2f6b4f';el('pr_c2').value=p.c2||'#4f9d78';
  refreshPhoto(true);};
window.admSaveProduct=function(){const n=val('pr_name').trim();if(!n){toast(lang==='th'?'ต้องมีชื่อ':'Name required');return;}
  const base=editIdx>=0?PRODUCTS[editIdx]:{icon:'i-flask'};
  const item=Object.assign({},base,{name:n,nameTh:val('pr_nameth').trim(),type:val('pr_type').trim(),typeTh:val('pr_typeth').trim(),benefit:val('pr_ben').trim(),benefitTh:val('pr_benth').trim(),ingredients:val('pr_ing').trim(),size:val('pr_size').trim(),price:val('pr_price').trim(),c1:val('pr_c1')||'#2f6b4f',c2:val('pr_c2')||'#4f9d78',img:formImg});
  if(editIdx>=0)PRODUCTS[editIdx]=item;else PRODUCTS.push(item);
  saveStore();renderProducts();renderAdmin('products');};
window.admDelProduct=function(i){if(!confirm((lang==='th'?'ลบผลิตภัณฑ์ ':'Delete ')+PRODUCTS[i].name+'?'))return;PRODUCTS.splice(i,1);saveStore();renderProducts();renderAdmin('products');};
/* --- VIDEOS --- */
function admVidList(){return `<div class="data-card"><h4>${icon('i-wave')} How videos work</h4><p>Paste any YouTube link (watch, youtu.be, or Shorts). The thumbnail and player are built automatically. Leave the link empty to show a “coming soon” placeholder.</p></div>`+
  `<div class="adm-section-t">${VIDEOS.length} videos · click to edit</div>`+
  VIDEOS.map((v,i)=>{const id=ytId(v.yt);return `<div class="adm-row">${id?`<img class="thumb" src="https://img.youtube.com/vi/${id}/default.jpg">`:`<span class="mono-av" style="background:linear-gradient(135deg,${v.c1||'#2f6b4f'},${v.c2||'#4f9d78'})">${icon('i-arrow')}</span>`}<div class="r-main"><h4>${esc(v.title)}</h4><div class="r-sub">${v.cat==='intro'?'Lab intro':'Tutorial'}${id?'':' · no link yet'}</div></div><div class="r-act"><button class="adm-ic" onclick="admEditVideo(${i})">${icon('i-doc')}</button><button class="adm-ic del" onclick="admDelVideo(${i})">${icon('i-close')}</button></div></div>`;}).join('')+
  `<button class="adm-add" onclick="admEditVideo(-1)">${icon('i-plus')} Add video</button>`;}
window.admEditVideo=function(i){editIdx=i;const v=i>=0?VIDEOS[i]:{cat:'tutorial',title:'',titleTh:'',desc:'',descTh:'',yt:'',c1:'#2f6b4f',c2:'#4f9d78'};
  el('adminContent').innerHTML=`<span class="adm-back" onclick="renderAdmin('videos')">${icon('i-arrow')} Back</span>
  <div class="adm-form">
    <div class="adm-field"><label>YouTube link</label><input id="v_yt" placeholder="https://youtu.be/..." oninput="admPreviewYt()"></div>
    <div id="v_ytPreview" style="font-family:var(--mono);font-size:11px;color:var(--muted);margin-top:-8px"></div>
    <div class="adm-field"><label>Category</label><select id="v_cat"><option value="intro">Lab intro</option><option value="tutorial">Tutorial / teaching</option></select></div>
    <div class="adm-2"><div class="adm-field"><label>Title (English)</label><input id="v_title"></div><div class="adm-field"><label>Title (Thai)</label><input id="v_titleth"></div></div>
    <div class="adm-field"><label>Description (English)</label><textarea id="v_desc"></textarea></div>
    <div class="adm-field"><label>Description (Thai)</label><textarea id="v_descth"></textarea></div>
    <div class="adm-actions"><button class="btn btn--ghost" onclick="renderAdmin('videos')">Cancel</button><button class="btn btn--primary" onclick="admSaveVideo()">${icon('i-check')} Save</button></div>
  </div>`;
  el('v_yt').value=v.yt||'';el('v_cat').value=v.cat||'tutorial';el('v_title').value=v.title||'';el('v_titleth').value=v.titleTh||'';el('v_desc').value=v.desc||'';el('v_descth').value=v.descTh||'';
  admPreviewYt();};
window.admPreviewYt=function(){
  const w=el('v_ytPreview');if(!w)return;
  const link=val('v_yt').trim();const id=ytId(link);
  w.innerHTML=id?`✅ ${lang==='th'?'อ่านลิงก์สำเร็จ':'Link recognized'}<img src="https://img.youtube.com/vi/${id}/mqdefault.jpg" style="width:160px;border-radius:8px;margin-top:6px;display:block">`:(link?`⚠️ ${lang==='th'?'ยังจับรหัสวิดีโอไม่ได้ ลองวางลิงก์แบบเต็มจาก YouTube อีกครั้ง':'Could not read a video ID — try pasting the full YouTube link again'}`:'');
};window.admSaveVideo=function(){const t=val('v_title').trim();if(!t){toast(lang==='th'?'ต้องมีชื่อ':'Title required');return;}
  const base=editIdx>=0?VIDEOS[editIdx]:{c1:'#2f6b4f',c2:'#4f9d78'};
  const item=Object.assign({},base,{cat:val('v_cat'),title:t,titleTh:val('v_titleth').trim(),desc:val('v_desc').trim(),descTh:val('v_descth').trim(),yt:val('v_yt').trim()});
  if(editIdx>=0)VIDEOS[editIdx]=item;else VIDEOS.push(item);
  saveStore();renderVideos();renderAdmin('videos');};
window.admDelVideo=function(i){if(!confirm((lang==='th'?'ลบวิดีโอ ':'Delete ')+VIDEOS[i].title+'?'))return;VIDEOS.splice(i,1);saveStore();renderVideos();renderAdmin('videos');};
/* --- DATA --- */
function admData(){return `
  <div class="data-card"><h4>${icon('i-doc')} Export content</h4><p>Download everything you've edited (team, news, publications, intellectual property and products) as a JSON backup. Keep it safe, or paste it back into the file's code to make changes permanent for all visitors.</p><button class="btn btn--primary" onclick="admExport()">${icon('i-up')} Download JSON</button></div>
  <div class="data-card"><h4>${icon('i-plus')} Import content</h4><p>Load a JSON backup. This replaces the current editable website content in this browser.</p><button class="btn btn--ghost" onclick="admImport()">${icon('i-doc')} Choose file…</button></div>
  <div class="data-card danger"><h4>${icon('i-close')} Reset</h4><p>Remove all saved edits from this browser and restore the original built-in content.</p><button class="btn btn--ghost" onclick="admReset()">Reset to defaults</button></div>
  <div class="data-card"><h4>${icon('i-spark')} How this works</h4><p>Edits are saved in this browser's local storage — they persist for you here, but other visitors won't see them until you export the JSON and paste it into the site's source, or host the edited file. Change the passcode by editing <code>ADMIN_PASS</code> in the code.</p></div>`;}
function download(name,text){const b=new Blob([text],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1200);}
window.admExport=function(){download('ac-lab-content.json',JSON.stringify(cmsPayload(),null,2));toast(lang==='th'?'ดาวน์โหลดแล้ว':'Downloaded');};
window.admImport=function(){const inp=document.createElement('input');inp.type='file';inp.accept='application/json,.json';inp.onchange=()=>{const f=inp.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{applyCMSData(JSON.parse(rd.result));applyAccent(SITE_ACCENT);saveStore(true);applySectionVisibility();applySectionOrder();renderProjectTeam();renderGrantTeam();renderTeam(teamCat);renderNews();renderIP();renderProducts();renderVideos();renderPubAll();renderTaxa();renderCollabs();renderTesti();renderBanner();renderEvents();renderGallery();renderResources();renderThemes();renderPipe();renderFacilities();renderTimeline();renderRoad();renderInnov();renderValueChain();renderAwards();renderAwardObjects();applyLang();renderAdmin('data');toast(lang==='th'?'นำเข้าแล้ว':'Imported');}catch(e){console.error(e);toast('Invalid file');}};rd.readAsText(f);};inp.click();};
window.admReset=function(){if(!confirm(lang==='th'?'ลบข้อมูลที่บันทึกไว้ทั้งหมด?':'Remove all saved edits and restore defaults?'))return;try{localStorage.removeItem(LS_KEY);}catch(e){}location.reload();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&el('admin').classList.contains('open'))closeAdmin();});
if(location.hash==='#admin')setTimeout(openAdmin,300);
window.addEventListener('hashchange',()=>{if(location.hash==='#admin')openAdmin();});

/* init */
refreshDynamicText();renderTesti();renderFaq();renderValueChain();renderAwards();renderAwardObjects();
/* ===== Turnstile bot-check ===== */
let turnstileToken = '';
window.onTurnstileSuccess = function(token){ turnstileToken = token; };
const TURNSTILE_VERIFY_URL = 'https://turnstile-verify.suthawarin-ksw19.workers.dev'; // แก้เป็น URL Worker จริงของคุณ
   /* ===== Supabase cloud sync ===== */
const SUPA_URL   = 'https://nmzwvxdegtfartbhoixx.supabase.co';
const SUPA_KEY   = 'sb_publishable_EsNS8St8xkIZgSqEGxp4yQ_y1BmeTDh';
// รองรับแอดมินหลายบัญชี — แต่ละคนล็อกอินด้วยอีเมล/รหัสผ่านของตัวเอง
// (สร้างบัญชีเพิ่มได้ที่ Supabase Dashboard → Authentication → Users)
// ตัวแปรนี้เหลือไว้เผื่ออ้างอิง ไม่ได้ใช้จำกัดสิทธิ์แล้ว
const ADMIN_EMAIL= 'suthawarin.ksw19@gmail.com';

if (SUPA_URL.indexOf('xxxxx') < 0 && window.supabase) {
const supa = window.supabase.createClient(SUPA_URL, SUPA_KEY, {
  auth: { persistSession: false }
});
  window.supa = supa;
  window.supa = supa;
  loadDoiPubs();

  // (1) โหลดเนื้อหาจากคลาวด์แล้ว refresh หน้า

  // (1) โหลดเนื้อหาจากคลาวด์แล้ว refresh หน้า
  supa.from('site_content').select('data').eq('id',1).single().then(({data,error})=>{
    if (error || !data || !data.data) return;
    const s = data.data;
    applyCMSData(s);
    applyAccent(SITE_ACCENT);applySectionVisibility();applySectionOrder();
    renderProjectTeam();renderGrantTeam();renderTeam(typeof teamCat !== 'undefined' ? teamCat : 'all');renderNews();renderIP();renderProducts();renderVideos();renderPubAll();renderTaxa();renderCollabs();renderTesti();renderBanner();renderEvents();renderGallery();renderResources();renderThemes();renderPipe();renderFacilities();renderTimeline();renderRoad();renderInnov();renderCustomSections();renderValueChain();renderAwards();renderAwardObjects();applyLang();
  });

  // (2) ทุกครั้งที่กด Save ในหลังบ้าน ให้เขียนขึ้นคลาวด์ด้วย
if(typeof saveStore !== 'undefined') {
    const _saveStore = saveStore;
    saveStore = function(silent){
      const ok = _saveStore(true);
      supa.from('site_content').update({
data:cmsPayload(),        updated_at: new Date()      }).eq('id',1).then(({error})=>{
        if(!silent){
          if(error && typeof toast === 'function'){toast('⚠️ Cloud save FAILED — เช็คว่าล็อกอินอยู่ไหม');console.error('Supabase save error:',error);}
          else if(typeof toast === 'function'){toast('✅ Saved to cloud — ผู้เข้าชมทุกคนจะเห็นการเปลี่ยนแปลง');}
        }
      });
      return ok;
    };
  }
// (3) ใช้บัญชี Supabase ล็อกอิน — รองรับแอดมินหลายบัญชี (คนละอีเมล/รหัสผ่าน)
window.tryUnlock = async function(){
    const emailVal = document.getElementById('adminEmail') ? document.getElementById('adminEmail').value.trim() : '';
    const passVal  = typeof val === 'function' ? val('adminPass') : document.getElementById('adminPass').value;

    if (!emailVal || !passVal){
      if(typeof toast === 'function') toast(typeof lang !== 'undefined' && lang==='th'?'กรอกอีเมลและรหัสผ่าน':'Enter email and password');
      return;
    }
    if (!turnstileToken){
      if(typeof toast === 'function') toast(typeof lang !== 'undefined' && lang==='th'?'กรุณาติ๊กยืนยันตัวตนก่อน':'Please complete the verification check above');
      return;
    }

    // 1) เช็ค token กับ Worker ก่อน
    let verified = false;
    try{
      const r = await fetch(TURNSTILE_VERIFY_URL, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ token: turnstileToken })
      });
      const j = await r.json();
      verified = j && j.ok === true;
    }catch(e){
      console.error('Turnstile verify request failed:', e);
    }
    if (!verified){
      if(typeof toast === 'function') toast(typeof lang !== 'undefined' && lang==='th'?'ยืนยันตัวตนไม่ผ่าน ลองใหม่':'Verification failed — please try again');
      if (window.turnstile) window.turnstile.reset();
      turnstileToken = '';
      return;
    }

    // 2) ผ่านแล้วค่อยล็อกอินจริงกับ Supabase
    supa.auth.signInWithPassword({ email: emailVal, password: passVal }).then(({error})=>{
      if (error){
        if(typeof toast === 'function') toast(error.message);
        console.error('Admin login error:', error);
        if (window.turnstile) window.turnstile.reset();
        turnstileToken = '';
        return;
      }
      if(typeof adminUnlocked !== 'undefined') adminUnlocked = true;
      document.getElementById('adminLock').style.display = 'none';
      document.getElementById('adminBody').style.display = 'flex';
      const lb = document.getElementById('adminLogoutBtn');
      if(lb) lb.style.display = 'inline-flex';
      if(typeof renderAdmin === 'function') renderAdmin('team');
    });
};
   
supa.auth.getSession().then(({data})=>{ 
    if(data && data.session){
      if(typeof adminUnlocked !== 'undefined') adminUnlocked = true;
      const lb=document.getElementById('adminLogoutBtn'); if(lb) lb.style.display='inline-flex';
      const ue=document.getElementById('adminUserEmail');
      if(ue && data.session.user){ue.textContent=data.session.user.email;ue.style.display='inline';}
    }
  });
}

/* Dedicated manager URL support */
window.addEventListener('DOMContentLoaded',()=>{
  if(location.hash==='#manager'){
    setTimeout(()=>{if(typeof window.openAdmin==='function')window.openAdmin();},120);
  }
});
