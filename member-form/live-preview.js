/* The AC Lab · live public-profile preview (draft only; never writes to Supabase).
   Mirrors the public The Team card and profile dialog fields and fallbacks.
   The real site may apply final Manager edits / image cropping on publication. */
(function () {
  'use strict';
  const form = document.getElementById('member-form');
  const panel = document.getElementById('site-preview-panel');
  const dialog = document.getElementById('site-preview-dialog');
  if (!form || !panel || !dialog) return;

  const hosts = [...document.querySelectorAll('[data-site-preview-host]')];
  const portraitInput = document.getElementById('portrait');
  const state = { lang: 'en', mode: 'card', device: 'desktop' };
  const copy = {
    en: {
      page: 'The Team.', kicker: 'OUR PEOPLE', subtitle: 'Meet the people behind our work.',
      pi: 'Principal Investigators', collaboration: 'Collaboration', researcher: 'Researchers',
      student: 'Students', internship: 'Internship Students',
      piDescription: 'The minds behind our work.',
      collaborationDescription: 'Shared perspectives across disciplines and institutions.',
      researcherDescription: 'The people connecting questions, experiments and evidence.',
      studentDescription: 'Learning through curiosity and research.',
      internshipDescription: 'Hands-on research experience and mentorship.',
      unnamed: 'Your full name', role: 'Your position', academic: 'Academic title',
      affiliation: 'Affiliation', expertise: 'Expertise', email: 'Email',
      notProvided: 'Details to be updated', viaLab: 'Contact via the lab',
      profile: 'View profile', previewOnly: 'Your draft profile',
      photoPending: 'PORTRAIT TO FOLLOW', photoConsent: 'Photo shown for preview only — photo consent is required before publication.',
      internshipInstitution: 'Home institution', internshipProgram: 'Study programme',
      internshipSupervisor: 'Lab supervisor', internshipPeriod: 'Internship period',
      internshipProject: 'Internship project', biography: 'Biography',
      about: 'About', team: 'The Team', publication: 'Publication', blog: 'Lab Blog',
      incomplete: 'Fill in your details to see how your profile will look.',
      onlyDraft: 'Preview only · not published'
    },
    th: {
      page: 'ทีมวิจัย', kicker: 'บุคลากรในห้องปฏิบัติการ', subtitle: 'ทำความรู้จักทีมวิจัยของเรา',
      pi: 'หัวหน้าห้องปฏิบัติการ', collaboration: 'ผู้ร่วมวิจัย', researcher: 'นักวิจัย',
      student: 'นักศึกษา', internship: 'นักศึกษาฝึกงาน',
      piDescription: 'ผู้ขับเคลื่อนงานวิจัยของเรา',
      collaborationDescription: 'การทำงานร่วมกันระหว่างสาขาและสถาบัน',
      researcherDescription: 'เชื่อมคำถามทางวิทยาศาสตร์กับการทดลอง',
      studentDescription: 'เรียนรู้ผ่านการค้นคว้าและการวิจัย',
      internshipDescription: 'เรียนรู้และฝึกประสบการณ์วิจัยในห้องปฏิบัติการ',
      unnamed: 'ชื่อ–นามสกุลของคุณ', role: 'ตำแหน่งของคุณ', academic: 'ตำแหน่งทางวิชาการ',
      affiliation: 'สังกัด', expertise: 'ความเชี่ยวชาญ', email: 'อีเมล',
      notProvided: 'กำลังรอข้อมูล', viaLab: 'ติดต่อผ่านห้องปฏิบัติการ',
      profile: 'ดูประวัติ', previewOnly: 'ตัวอย่างโปรไฟล์ของคุณ',
      photoPending: 'รอรูปโปรไฟล์', photoConsent: 'รูปนี้แสดงเพื่อดูตัวอย่างเท่านั้น ต้องยินยอมก่อนเผยแพร่จริง',
      internshipInstitution: 'สถาบันต้นสังกัด', internshipProgram: 'หลักสูตร',
      internshipSupervisor: 'อาจารย์หรือผู้ดูแล', internshipPeriod: 'ช่วงเวลาฝึกงาน',
      internshipProject: 'โครงการฝึกงาน', biography: 'ประวัติโดยย่อ',
      about: 'เกี่ยวกับเรา', team: 'ทีมวิจัย', publication: 'ผลงานตีพิมพ์', blog: 'บล็อกแล็บ',
      incomplete: 'เริ่มกรอกข้อมูลเพื่อดูตัวอย่างโปรไฟล์บนเว็บไซต์',
      onlyDraft: 'แสดงตัวอย่างเท่านั้น · ยังไม่เผยแพร่'
    }
  };

  function node(tag, klass, value) {
    const n = document.createElement(tag);
    if (klass) n.className = klass;
    if (value !== undefined) n.textContent = value;
    return n;
  }
  function currentCopy(key) { return copy[state.lang][key]; }
  function get(name) { const control = form.elements.namedItem(name); return control && 'value' in control ? String(control.value).trim() : ''; }
  function checked(name) { const control = form.elements.namedItem(name); return Boolean(control && control.checked); }
  function localized(english, thai) { return (state.lang === 'th' ? get(thai) || get(english) : get(english) || get(thai)); }
  function safeImageURL(raw) {
    if (!raw) return '';
    try {
      const url = new URL(raw);
      return (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) ? url.href : '';
    } catch (_) { return ''; }
  }
  function data() {
    const group = get('group');
    const expertise = localized('expertiseEN', 'expertiseTH').split(',').map(s => s.trim()).filter(Boolean).slice(0, 12);
    // This is the SAME public-field mapping used by Manager approval; private input is never displayed.
    let picture = '';
    if (portraitInput?.files.length) {
      picture = document.querySelector('#portrait-preview img')?.src || '';
    } else picture = safeImageURL(get('photoURL'));
    return {
      group, name: localized('nameEN', 'nameTH') || currentCopy('unnamed'),
      role: localized('positionEN', 'positionTH') || copy[state.lang][group] || currentCopy('role'),
      academic: localized('academicTitleEN', 'academicTitleTH'),
      affiliation: localized('affiliationEN', 'affiliationTH'),
      expertise, bio: localized('bioEN', 'bioTH'), picture,
      publicEmail: (checked('showPublicEmail') && get('publicEmail')) ? get('publicEmail') : '',
      consentPhoto: checked('consentPhoto'),
      internship: group === 'internship' ? {
        institution: get('internshipInstitutionEN'), program: get('internshipProgramEN'),
        supervisor: get('internshipSupervisorEN'),
        period: [get('internshipStart'), get('internshipEnd')].filter(Boolean).join(' – '),
        project: get('internshipProjectEN')
      } : null
    };
  }

  function portrait(d, isProfile) {
    const fig = node('figure', 'site-person-portrait' + (isProfile ? ' is-profile' : ''));
    if (d.picture) {
      const img = node('img');
      img.src = d.picture; img.alt = d.name;
      img.decoding = 'async';
      img.loading = 'eager';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => {
        fig.replaceChildren(); fig.classList.add('is-placeholder');
        fig.append(...initials(d));
      }, {once: true});
      fig.append(img);
    } else { fig.classList.add('is-placeholder'); fig.append(...initials(d)); }
    return fig;
  }
  function initials(d) {
    const letters = get('nameEN').split(/\s+/).filter(Boolean).slice(0,2).map(w => w.charAt(0).toUpperCase()).join('') || 'AC';
    return [node('span','site-person-initials', letters), node('span','site-photo-pending',currentCopy('photoPending'))];
  }
  function expertise(d) {
    const wrap = node('div','site-person-tags');
    (d.expertise.length ? d.expertise : [currentCopy('notProvided')]).forEach(v => wrap.append(node('span','',v)));
    return wrap;
  }
  function contact(d) {
    // Never use the PRIVATE contactEmail field, even if the user typed it.
    const box = node('div','site-person-contact');
    const icon = node('span','site-person-contact-icon','✉');icon.setAttribute('aria-hidden','true');
    box.append(icon,node('span','',d.publicEmail || currentCopy('viaLab')));
    return box;
  }
  function card(d) {
    const article = node('article','site-person-card' + (d.group === 'pi' ? ' is-featured' : d.group === 'collaboration' ? ' is-wide' : ''));
    const body = node('div','site-person-body');
    body.append(node('p','site-person-role',d.role), node('h3','site-person-name',d.name));
    if (d.academic) body.append(node('p','site-person-academic',d.academic));
    body.append(expertise(d),node('p','site-person-affiliation',d.affiliation || currentCopy('notProvided')));
    const footer = node('div','site-person-footer');
    const open = node('button','site-person-open','↗');
    open.type='button'; open.setAttribute('aria-label',currentCopy('profile'));
    open.addEventListener('click',()=>{state.mode='profile';render();});
    footer.append(contact(d),open);body.append(footer);
    article.append(portrait(d,false),body);
    return article;
  }
  function detail(d) {
    const layout = node('article','site-person-detail');
    const content = node('div','site-person-detail-body');
    content.append(node('p','site-person-role',d.role),node('h3','site-person-detail-name',d.name),node('p','site-person-academic',d.academic || currentCopy('notProvided')));
    const list=node('dl','site-person-data');
    function add(label, contentOrText) {
      list.append(node('dt','',label));
      const value = node('dd');
      if (typeof contentOrText === 'string') value.textContent = contentOrText;
      else value.append(contentOrText);
      list.append(value);
    }
    add(currentCopy('expertise'),expertise(d));
    add(currentCopy('affiliation'),d.affiliation||currentCopy('notProvided'));
    add(currentCopy('email'),contact(d));
    if(d.internship){
      [['internshipInstitution','institution'],['internshipProgram','program'],['internshipSupervisor','supervisor'],['internshipPeriod','period'],['internshipProject','project']].forEach(([label,k])=>{
        if(d.internship[k])add(currentCopy(label),d.internship[k]);
      });
    }
    content.append(list);
    if (d.bio) content.append(node('p','site-person-bio',d.bio));
    layout.append(portrait(d,true),content);
    return layout;
  }
  function website(host, d) {
    const view = node('div','site-preview-site');
    const header=node('header','site-preview-site-header');
    const brand=node('div','site-preview-brand');
    brand.append(node('span','site-preview-brand-icon','AC'));
    const names=node('div','site-preview-brand-names');
    names.append(node('strong','', 'The AC Lab'),node('small','', 'Khon Kaen University'));
    brand.append(names);
    const nav=node('nav','site-preview-site-nav');
    nav.setAttribute('aria-label',state.lang === 'th' ? 'ตัวอย่างเมนู' : 'Sample site navigation');
    for(const key of ['about','team','publication','blog']){
      nav.append(node('span',key==='team'?'is-active':'',currentCopy(key)));
    }
    header.append(brand,nav);
    const main=node('div','site-preview-site-main');
    main.append(node('p','site-preview-kicker',currentCopy('kicker')),
      node('h2','site-preview-page-title',currentCopy('page')),
      node('p','site-preview-page-description',currentCopy('subtitle')));
    const section=node('section','site-preview-directory');
    const group=d.group || 'student';
    section.append(node('p','site-preview-kicker','01 — '+currentCopy(group)),
      node('h3','site-preview-section-title',currentCopy(group)+'.'),
      node('p','site-preview-section-intro',currentCopy(group+'Description')));
    section.append(state.mode==='profile'?detail(d):card(d));
    if(d.picture&&!d.consentPhoto)section.append(node('p','site-photo-consent-note',currentCopy('photoConsent')));
    const footer=node('div','site-preview-site-footer');footer.append(node('strong','','THE AC LAB'),node('span','',currentCopy('onlyDraft')));
    main.append(section);view.append(header,main,footer);
    return view;
  }
  function syncControls() {
    document.querySelectorAll('[data-site-preview-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sitePreviewLang===state.lang)));
    document.querySelectorAll('[data-site-preview-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sitePreviewMode===state.mode)));
    document.querySelectorAll('[data-site-preview-device]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sitePreviewDevice===state.device)));
    document.getElementById('site-preview-current-role').textContent=copy[state.lang][get('group')]||copy[state.lang].student;
  }
  let raf = 0;
  function render() {
    cancelAnimationFrame(raf);
    raf=0;
    const d=data();syncControls();
    for(const host of hosts){
      const prevScroll=host.scrollTop;
      host.dataset.language=state.lang;
      host.dataset.device=host.dataset.sitePreviewHost==='modal'?state.device:'sidebar';
      host.dataset.mode=state.mode;
      host.replaceChildren(website(host,d));
      host.scrollTop=prevScroll;
    }
  }
  function requestRender(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;render();});}
  form.addEventListener('input',requestRender);
  form.addEventListener('change',requestRender);
  // Form.reset happens before native controls are reset, so repaint in the next animation frame.
  form.addEventListener('reset',()=>requestAnimationFrame(requestRender));
  document.querySelectorAll('[data-site-preview-lang]').forEach(b=>b.addEventListener('click',()=>{state.lang=b.dataset.sitePreviewLang;render();}));
  document.querySelectorAll('[data-site-preview-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.sitePreviewMode;render();}));
  document.querySelectorAll('[data-site-preview-device]').forEach(b=>b.addEventListener('click',()=>{state.device=b.dataset.sitePreviewDevice;render();}));
  function open(){render();if(!dialog.open)dialog.showModal();}
  function close(){if(dialog.open)dialog.close();}
  document.getElementById('expand-site-preview').addEventListener('click',open);
  document.getElementById('open-site-preview').addEventListener('click',open);
  document.getElementById('close-site-preview').addEventListener('click',close);
  dialog.addEventListener('click',(e)=>{if(e.target===dialog)close();});
  render();
})();
