(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const loading = window.ACLoader.run;
  const drafts = new Map();
  const expanded = new Set();
  const labels = {
    branding:'โลโก้และไอคอนเว็บไซต์',
    seo:'SEO และการค้นหา', slug:'Slug ของหน้า', canonical:'Canonical URL',
    indexable:'อนุญาตให้จัดทำดัชนี', verified:'ตรวจยืนยันข้อมูลบุคลากรแล้ว',
    alternateNames:'ชื่อทางเลือกที่ใช้จริง', verifiedTitle:'ตำแหน่งที่ตรวจยืนยันแล้ว',
    verifiedAffiliation:'สังกัดที่ตรวจยืนยันแล้ว', verificationSource:'ลิงก์แหล่งอ้างอิงข้อมูลบุคลากร',
    brandName:'ชื่อหลักของแล็บ', searchConsoleToken:'Google Search Console verification code',
    alt:'คำอธิบายภาพ', imageAlt:'คำอธิบายภาพ', kicker:'ข้อความนำ', eyebrow:'ข้อความนำ',
    title:'หัวข้อ', name:'ชื่อ', subtitle:'หัวข้อรอง', description:'รายละเอียด', summary:'ข้อความสรุป',
    body:'เนื้อหา', paragraph:'ย่อหน้า', paragraphs:'ย่อหน้า', heading:'หัวข้อย่อย', sections:'เซกชันเนื้อหา',
    status:'สถานะ', visible:'แสดงบนเว็บ', enabled:'เปิดเมนู', featured:'ปักเป็นรายการเด่น', sample:'เป็นข้อมูลตัวอย่าง',
    id:'รหัสรายการ', kind:'ประเภท', group:'กลุ่ม', category:'หมวดหมู่', topics:'หัวข้อวิจัย', tags:'แท็ก',
    label:'ชื่อที่แสดง', route:'หน้าเป้าหมาย', position:'ตำแหน่ง / จุดโฟกัสภาพ', photoPosition:'จุดโฟกัสภาพ',
    image:'ภาพ', photo:'รูปภาพ', photoZoom:'ขยายภาพ', cover:'ภาพปก',
    coverPosition:'จุดโฟกัสภาพปก', linkLabel:'ข้อความบนปุ่ม', cta:'ข้อความบนปุ่ม', url:'ลิงก์',
    path:'พาธ', sourceUrl:'แหล่งอ้างอิง', sources:'แหล่งอ้างอิง', email:'อีเมล', contactEmail:'อีเมลกลาง',
    address:'ที่อยู่', mapLink:'ลิงก์เปิดแผนที่', mapEmbed:'ลิงก์ฝังแผนที่', academicTitle:'ตำแหน่งวิชาการ',
    expertise:'ความเชี่ยวชาญ', affiliation:'สังกัด', bio:'ประวัติ', authors:'ผู้เขียน', authorId:'รหัสผู้เขียน',
    journal:'วารสาร', reference:'ข้อมูลอ้างอิง', year:'ปี ค.ศ.', date:'วันที่ (YYYY-MM-DD)',
    grant:'ชื่อทุน', project:'ชื่อโครงการ', funder:'แหล่งทุน', fiscalYear:'ปีงบประมาณ',
    leaderId:'รหัสหัวหน้าโครงการ', leaderName:'ชื่อหัวหน้าโครงการ', recipients:'ผู้รับรางวัล',
    memberId:'รหัสสมาชิก', gallery:'ภาพประกอบ', role:'บทบาท', level:'ระดับรางวัล', type:'ประเภทรางวัล',
    number:'เลขที่เอกสาร', tradeName:'ชื่อการค้า', nodes:'จุดในเครือข่าย', edges:'เส้นเชื่อม',
    from:'จากจุด', to:'ไปยังจุด', conditional:'เงื่อนไข', desktop:'ตำแหน่งบนเดสก์ท็อป',
    mobile:'ตำแหน่งบนมือถือ', context:'ข้อความประกอบ', caption:'คำบรรยาย', after:'วางต่อจาก',
    mode:'รูปแบบแบนเนอร์', heroHeading:'หัวข้อแบนเนอร์', heroLede:'ข้อความแบนเนอร์', lede:'ข้อความเกริ่นนำ',
    intro:'ข้อความแนะนำ', action:'ข้อความปุ่มหลัก', note:'หมายเหตุ', scroll:'ข้อความชวนเลื่อน',
    heroTitle:'หัวข้อแบนเนอร์', heroEyebrow:'ข้อความนำบนแบนเนอร์', ready:'ข้อความเมื่อประกอบครบ',
    showComplete:'ปุ่มดูวงที่ประกอบครบ', start:'คำชวนเริ่มประกอบ', assembling:'คำแนะนำระหว่างประกอบ',
    introLine1:'หัวข้อแนะนำบรรทัดแรก', introLine2:'หัวข้อแนะนำบรรทัดสอง',
    newsTitle:'หัวข้อข่าว', newsLede:'ข้อความเกริ่นข่าว', findTitle:'หัวข้อช่องทางติดต่อ',
    slideInterval:'เวลาสลับสไลด์ (มิลลิวินาที)', doi:'DOI', pmid:'PMID', pmcid:'PMCID', pdf:'ลิงก์ PDF',
  };
  const enums = {
    group: [['pi','หัวหน้าห้องปฏิบัติการ'],['collaboration','ผู้ร่วมวิจัย'],['researcher','นักวิจัย'],['student','นักศึกษา']],
    status: [['draft','ฉบับร่าง'],['published','เผยแพร่']],
    mode: [['mosaic','หลายภาพ'],['image','ภาพเดียว']],
    level: [['international','นานาชาติ'],['national','ระดับชาติ'],['university','มหาวิทยาลัย'],['institutional','สถาบัน'],['other','อื่น ๆ']],
    role: [['student','นักศึกษา'],['researcher','นักวิจัย'],['faculty','อาจารย์'],['alumni','ศิษย์เก่า'],['team','ทีม'],['other','อื่น ๆ']],
  };
  const patentKinds = [['patent-granted','สิทธิบัตร'],['patent-application','คำขอสิทธิบัตร'],
    ['petty-granted','อนุสิทธิบัตร'],['petty-application','คำขออนุสิทธิบัตร']];
  const mainKinds = [['lab','แนะนำแล็บ'],['methods','เครือข่ายวิธีวิจัย'],['genomics','จีโนมพืช'],
    ['chemistry','พฤกษเคมี'],['bio','ชีวการแพทย์']];
  const local = value => typeof value === 'string' ? value : value?.th || value?.en || '';
  const pair = () => ({ th: '', en: '' });
  let pages = [];
  let active = null;
  let mode = 'settings';
  let group = '';
  let signedIn = false;
  let opening = 0;
  let nextID = 0;
  let previewSelection;
  const label = key => labels[key] || key.replace(/([a-z])([A-Z])/g, '$1 $2');
  const activeDraft = () => active && drafts.get(active.id);
  const clone = value => structuredClone(value);
  const own = (object, key) => Object.hasOwn(object, key);

  function element(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  }

  function action(text, callback, className = 'button quiet tiny') {
    const button = element('button', className, text);
    button.type = 'button';
    button.addEventListener('click', callback);
    return button;
  }

  function say(text, error = false, id = 'workspace-notice') {
    const status = $(id);
    status.textContent = text;
    status.classList.toggle('error', error);
  }

  function showLogin(message) {
    signedIn = false;
    opening++;
    window.ACLabLivePreview.reset();
    $('studio').hidden = true;
    $('top-actions').hidden = true;
    $('login-screen').hidden = false;
    $('login-button').disabled = false;
    say(message, true, 'login-status');
    $('email').focus();
  }

  async function request(path, body) {
    try {
      return await window.ACLabManager.request(path, body);
    } catch (error) {
      if (signedIn && path !== 'login' && [401, 403].includes(error.status)) showLogin(error.message);
      throw error;
    }
  }

  function navigation() {
    $('page-nav').replaceChildren(...pages.map((page, index) => {
      const button = action('', () => openPage(page), 'page-tab');
      button.dataset.page = page.id;
      button.setAttribute('aria-current', page.id === active?.id ? 'page' : 'false');
      button.classList.toggle('is-dirty', Boolean(drafts.get(page.id)?.dirty));
      const text = element('span');
      text.append(element('strong', '', page.label.th), element('small', '', page.label.en));
      button.append(element('span', 'page-index', String(index + 1).padStart(2, '0')), text);
      return button;
    }));
  }

  function updateStatus() {
    const entry = activeDraft();
    const status = $('draft-status');
    status.textContent = !entry ? 'กำลังโหลด' : entry.saving ? 'กำลังบันทึก'
      : entry.dirty ? 'มีฉบับร่าง' : entry.saved.version === 0 ? 'ข้อมูลตั้งต้น' : 'เผยแพร่แล้ว';
    status.classList.toggle('is-dirty', Boolean(entry?.dirty));
    $('save-page').disabled = !entry || entry.saving || (!entry.dirty && entry.saved.version !== 0);
    $('restore-page').disabled = !entry?.dirty || entry.saving;
  }

  function updatePreview(options) {
    const entry = activeDraft();
    if (entry) window.ACLabLivePreview.update({
      page: active, group, label: $('section-title').textContent,
      draft: entry.draft, dirty: entry.dirty, changes: entry.changes, selection: previewSelection,
    }, options);
  }

  function selectPreview(selection) {
    previewSelection = selection;
    updatePreview({ focus: true });
  }

  function fieldPreview(path, scope, title) {
    const nested = scope.split('/').slice(3);
    if (mode === 'blocks') return { path: ['blocks', ...nested], label: title };
    const area = mode === 'settings' ? 'settings' : 'copy';
    return { path: [area, path[0], ...nested], label: title };
  }

  function mark(refresh = true) {
    const entry = activeDraft();
    entry.dirty = true;
    entry.changes++;
    const pageButton = [...$('page-nav').children].find(button => button.dataset.page === active.id);
    pageButton?.classList.add('is-dirty');
    updateStatus();
    if (refresh) updatePreview();
  }

  function entryFor(state) {
    return { saved: state, draft: clone(state), dirty: false, changes: 0, saving: false };
  }

  async function openPage(page) {
    if (active?.id === page.id && activeDraft()) return;
    const token = ++opening;
    window.ACLabLivePreview.reset();
    active = page;
    mode = 'settings';
    group = page.id === 'main' ? 'heroSlides' : Object.keys(page.groups)[0];
    $('section-search').value = '';
    $('page-number').textContent = String(pages.indexOf(page) + 1).padStart(2, '0');
    $('page-title').textContent = page.label.th;
    $('page-subtitle').textContent = page.label.en + ' · จัดการเนื้อหาไทยและอังกฤษ';
    $('page-preview').href = new URL('../' + page.path + '?lang=th', location.href).href;
    $('editor').hidden = true;
    navigation();
    updateStatus();
    say('');
    try {
      if (!drafts.has(page.id)) {
        const state = await loading('กำลังโหลดหน้า ' + page.label.en + '…', () => request('site/page/' + page.id));
        if (!drafts.has(page.id)) drafts.set(page.id, entryFor(state));
      }
      if (token !== opening) return;
      $('editor').hidden = false;
      render();
    } catch (error) {
      if (token === opening) say(error.message, true);
    }
  }

  function editGroups() {
    const draft = activeDraft().draft;
    if (mode === 'settings') return Object.entries(active.groups);
    if (mode === 'blocks') return [['blocks', 'จัดการเซกชัน']];
    const groups = Object.entries(draft.copyGroups).map(([key, name]) => ['copy:' + key, name]);
    const areas = new Set(Object.values(draft.staticFields).map(field => field.group));
    for (const area of areas) groups.push(['static:' + area, area]);
    return groups;
  }

  function render(options) {
    previewSelection = undefined;
    const groups = editGroups();
    if (!groups.some(([key]) => key === group)) group = groups[0]?.[0] || '';
    for (const button of $('mode-bar').children) button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    $('group-nav').replaceChildren(...groups.map(([key, name]) => {
      const button = action(name, () => { group = key; $('section-search').value = ''; render(); }, '');
      button.setAttribute('aria-pressed', String(key === group));
      return button;
    }));
    $('section-title').textContent = groups.find(([key]) => key === group)?.[1] || 'ข้อความ';
    $('section-help').textContent = mode === 'blocks' ? 'เพิ่มหัวข้อ เนื้อหา ภาพ และปุ่ม แล้วเลือกตำแหน่งที่จะแสดง'
      : mode === 'text' ? 'ปรับหัวข้อ ข้อความ ปุ่ม และคำอธิบายที่แสดงบนหน้า'
      : 'เปิดรายการที่ต้องการแก้ไข หรือเพิ่มและจัดลำดับรายการในส่วนนี้';
    renderFields();
    updateStatus();
    updatePreview(options);
  }

  function searchText(value) {
    if (value === null || value === undefined) return '';
    return typeof value === 'object' ? Object.values(value).map(searchText).join(' ') : String(value);
  }

  function searchable(value, term, text = '') {
    return !term || (text + ' ' + searchText(value)).toLowerCase().includes(term);
  }

  function itemTitle(value, index) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return local(value.title || value.name || value.heading || value.grant || value.label)
        || value.id || 'รายการ ' + (index + 1);
    }
    return (Array.isArray(value) ? value.join(', ') : String(value ?? '')) || 'รายการ ' + (index + 1);
  }

  function choices(key, value) {
    const draft = activeDraft().draft;
    let options = enums[key];
    if (key === 'after' && mode === 'blocks') options = [['end','ท้ายหน้า'],
      ...Object.entries(active.anchors).map(([id, item]) => [id, 'หลัง ' + item.label])];
    else if (key === 'kind') options = active.id === 'patents' ? patentKinds : active.id === 'main' ? mainKinds : null;
    else if (key === 'category' && active.id === 'blog') options = [['','เลือกหมวดหมู่'],
      ...draft.settings.categories.map(item => [item.id, local(item.name)])];
    else if (key === 'authorId' && active.id === 'blog') options = [['','ผู้เขียนของแล็บ'],
      ...Object.entries(draft.settings.authors).map(([id, author]) => [id, local(author.name)])];
    else if (key === 'route' && active.id === 'main') options = Object.entries(draft.settings.routes)
      .map(([id, route]) => [id, local(route.label)]);
    if (options && !options.some(([id]) => id === value)) return [[value, value || 'เลือก'], ...options];
    return options;
  }

  function inputField(title, key, value, setter, locale = false, selection) {
    const wrapper = element('label', 'field' + (typeof value === 'boolean' ? ' checkbox' : ''));
    wrapper.append(element('span', locale ? 'locale-label' : '', title));
    const options = typeof value === 'string' && !locale ? choices(key, value) : null;
    let input;
    if (options) {
      input = element('select');
      for (const [id, text] of options) {
        const option = element('option', '', text);
        option.value = id;
        input.append(option);
      }
      input.value = value;
    } else if (typeof value === 'boolean') {
      input = element('input');
      input.type = 'checkbox';
      input.checked = value;
    } else if (typeof value === 'number') {
      input = element('input');
      input.type = 'number';
      input.step = Number.isInteger(value) && !['desktop','mobile','photoZoom'].includes(key) ? '1' : 'any';
      input.value = value;
    } else if (Array.isArray(value) || (typeof value === 'string' && (value.includes('\n') || value.length > 80 ||
      ['body','bio','description','summary','address','lede','introduction'].includes(key)))) {
      input = element('textarea');
      input.rows = Array.isArray(value) ? 4 : 3;
      input.value = Array.isArray(value) ? value.join('\n') : value;
      if (Array.isArray(value)) input.placeholder = 'หนึ่งรายการต่อบรรทัด';
    } else {
      input = element('input');
      input.type = 'text';
      input.value = value ?? '';
      if (value === null) input.placeholder = 'เว้นว่างได้';
    }
    if (input.type === 'text' || input.tagName === 'TEXTAREA') input.maxLength = 80000;
    if (selection) input.addEventListener('focus', () => selectPreview(selection));
    input.addEventListener(options || typeof value === 'boolean' ? 'change' : 'input', () => {
      if (typeof value === 'number' && !Number.isFinite(input.valueAsNumber)) return;
      const next = typeof value === 'boolean' ? input.checked : typeof value === 'number' ? input.valueAsNumber
        : Array.isArray(value) ? input.value.split(/\r?\n/).map(line => line.trim()).filter(Boolean) : input.value;
      setter(next);
      mark();
    });
    wrapper.append(input);
    return wrapper;
  }

  function imageField(title, value, setter, selection, libraryEntry) {
    const wrapper = element('div', 'image-field');
    const field = element('label', 'field');
    const input = element('input');
    input.type = 'text';
    input.inputMode = 'url';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = 'https://…';
    input.value = value ?? '';
    field.append(element('span', '', title), input);
    wrapper.append(field);

    const media = activeDraft().draft.settings.media ?? {};
    const assets = libraryEntry ? [] : Object.keys(media);
    let library;
    if (assets.length) {
      library = element('select');
      library.setAttribute('aria-label', 'เลือกจากคลังภาพ · ' + title);
      const placeholder = element('option', '', 'เลือกจากคลังภาพ');
      placeholder.value = '';
      library.append(placeholder);
      for (const key of assets) {
        const option = element('option', '', key);
        option.value = key;
        library.append(option);
      }
      library.value = own(media, input.value) ? input.value : '';
      library.addEventListener('focus', () => selectPreview(selection));
      library.addEventListener('change', () => {
        if (!library.value) return;
        input.value = library.value;
        edit();
      });
      wrapper.append(library);
    }

    const base = new URL(active.path, window.ACLabData.root);
    const photo = element('img', 'image-thumbnail');
    photo.alt = 'ตัวอย่าง' + title;
    photo.loading = 'lazy';
    photo.referrerPolicy = 'no-referrer';
    const status = element('small', 'image-status');
    status.setAttribute('role', 'status');
    status.hidden = true;
    wrapper.append(element('small', 'editor-hint', 'วางลิงก์ภาพ หรือคัดลอกลิงก์ไฟล์จาก Google Drive'), photo, status);
    let timer;

    function showImage() {
      const text = input.value.trim();
      const source = !libraryEntry && own(media, text) ? media[text] : text;
      const url = window.ACLabManager.imageURL(source, base);
      if (url === photo.getAttribute('src')) return;
      photo.hidden = !url;
      status.textContent = 'กรุณาใช้ลิงก์ไฟล์ภาพที่เปิดดูได้';
      status.hidden = !text || Boolean(url) || /^aclab-media:/.test(text);
      if (url) photo.src = url;
      else photo.removeAttribute('src');
    }

    function edit() {
      setter(input.value.trim());
      if (library) library.value = own(media, input.value.trim()) ? input.value.trim() : '';
      mark();
      clearTimeout(timer);
      timer = setTimeout(() => { if (wrapper.isConnected) showImage(); }, 180);
    }

    photo.addEventListener('error', () => {
      photo.hidden = true;
      status.textContent = 'โหลดภาพไม่ได้ กรุณาตรวจลิงก์หรือสิทธิ์แชร์ไฟล์';
      status.hidden = false;
    });
    input.addEventListener('focus', () => selectPreview(selection));
    input.addEventListener('input', edit);
    showImage();
    return wrapper;
  }

  function isPair(value) {
    return value && typeof value === 'object' && !Array.isArray(value)
      && Object.keys(value).length === 2 && own(value,'th') && own(value,'en')
      && ['th','en'].every(lang => typeof value[lang] === 'string' || Array.isArray(value[lang]));
  }

  function localizedField(value, title, key, selection) {
    const box = element('fieldset', 'localized');
    box.append(element('legend', '', title));
    for (const [lang, name] of [['th','ไทย'],['en','English']]) {
      box.append(inputField(name, key, value[lang], next => { value[lang] = next; }, true, {
        ...selection, path: [...selection.path, lang], lang,
      }));
    }
    return box;
  }

  function uniqueID(prefix) {
    nextID++;
    return prefix + '-' + Date.now().toString(36) + '-' + nextID.toString(36);
  }

  function newItem(path, rows) {
    const key = path.at(-1);
    if (mode === 'blocks') return { id: uniqueID('block'), after:'end', visible:false, kicker:pair(),
      title:pair(), body:pair(), linkLabel:pair(), url:'', image:'', imageAlt:pair() };
    const template = active.templates[path.join('/')];
    let value = template === undefined ? '' : clone(template);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
    const defaults = {
      id: uniqueID('item'), group:'researcher', status:'draft', fiscalYear:new Date().getFullYear()+543,
      year:new Date().getFullYear(), kind:active.id === 'patents' ? 'patent-application' : 'methods',
      level:'university', role:'researcher', route:'about', photoPosition:'50% 25%', photoZoom:1,
      position:'50% 50%', coverPosition:'50% 50%', imagePosition:'50% 50%', order:rows.length,
    };
    for (const [field, content] of Object.entries(defaults)) if (own(value,field)) value[field] = content;
    if (key === 'introSlides' || key === 'heroSlides') value.image = Object.keys(activeDraft().draft.settings.media)[0] || '';
    if (key === 'stages') {
      value.nodes = [newItem([...path,'nodes'], [])];
      value.edges = [];
    }
    if (key === "members") value.seo = window.ACLabSEO.personDefaults(value);
    if (key === "posts") value.seo = window.ACLabSEO.postDefaults(value);
    return value;
  }

  function arrayField(list, title, path, scope, term) {
    const container = element('div', 'record-list');
    let shown = 0;
    list.forEach((value, index) => {
      const titleText = itemTitle(value, index);
      if (!searchable(value, term, titleText)) return;
      shown++;
      const row = element('details', 'record');
      const identity = scope + '/' + (value?.id || index);
      row.dataset.rowKey = identity;
      const summary = element('summary');
      summary.append(element('span', 'page-index', String(index+1).padStart(2,'0')),
        element('span', '', titleText));
      summary.addEventListener('focus', () => selectPreview(fieldPreview(path, identity, titleText)));
      const published = mode === 'blocks' ? value.visible
        : value?.status === 'draft' || value?.status === 'published' ? value.status === 'published' : null;
      if (published !== null) summary.append(element('span',
        'record-state status-chip' + (published ? '' : ' is-dirty'), published ? 'เผยแพร่' : 'ฉบับร่าง'));
      row.append(summary);
      function fill() {
        if (row.children.length > 1) return;
        const body = element('div', 'record-body');
        body.append(renderValue(value, title, path, identity, next => { list[index] = next; }));
        const controls = element('div','record-controls');
        function move(change) {
          const next = index + change;
          [list[next],list[index]] = [list[index],list[next]];
          mark();
          renderFields();
        }
        const up = action('↑ ขึ้น', () => move(-1));
        const down = action('↓ ลง', () => move(1));
        up.disabled = index === 0;
        down.disabled = index === list.length - 1;
        controls.append(up, down, action('ลบรายการ', () => {
          list.splice(index,1);
          expanded.delete(identity);
          mark();
          renderFields();
        }, 'button quiet tiny danger'));
        body.append(controls);
        row.append(body);
      }
      row.open = expanded.has(identity);
      if (row.open) fill();
      row.addEventListener('toggle', () => {
        if (row.open) { expanded.add(identity); fill(); }
        else expanded.delete(identity);
      });
      container.append(row);
    });
    if (!shown) container.append(element('p','empty', term ? 'ไม่พบรายการที่ตรงกับคำค้น' : 'ยังไม่มีรายการในส่วนนี้'));
    const postList = active.id === 'blog' && path.length === 1 && path[0] === 'posts';
    const add = action(mode === 'blocks' ? '+ เพิ่มเซกชัน' : postList ? '+ เพิ่มบทความ' : '+ เพิ่มรายการ', () => {
      const value = newItem(path,list);
      const identity = scope + '/' + (value?.id || list.length);
      expanded.add(identity);
      list.push(value);
      $('section-search').value = '';
      mark();
      renderFields();
      const record = [...$('editor-fields').querySelectorAll('[data-row-key]')]
        .find(row => row.dataset.rowKey === identity);
      record?.querySelector('summary')?.focus();
    }, path.length === 1 ? 'button primary' : 'button quiet tiny');
    const actions = element('div','add-row');
    actions.append(add);
    if (path.length === 1) container.prepend(actions);
    else container.append(actions);
    return container;
  }

  function mapField(value, title, path, scope, term) {
    const box = element('div','object-fields');
    for (const [key, item] of Object.entries(value)) {
      if (!searchable(item, term, key)) continue;
      const card = element('div','object-card');
      card.append(renderValue(item, key, [...path,key], scope+'/'+key, next => { value[key] = next; }));
      card.append(action('ลบ ' + key, () => { delete value[key]; mark(); renderFields(); }, 'button quiet tiny danger'));
      box.append(card);
    }
    const tools = element('div','add-row');
    const input = element('input');
    input.placeholder = 'รหัสภาษาอังกฤษ';
    input.setAttribute('aria-label','รหัส' + title);
    tools.append(input, action('+ เพิ่ม' + title, () => {
      const key = input.value.trim();
      if (!/^[a-zA-Z0-9_-]{1,80}$/.test(key) || own(value,key) || ['constructor','prototype','__proto__'].includes(key)) {
        say('กรุณาใช้รหัสภาษาอังกฤษหรือตัวเลขที่ไม่ซ้ำ', true);
        input.focus();
        return;
      }
      value[key] = path.at(-1) === 'authors' ? { name:pair(), photo:'' } : '';
      mark();
      renderFields();
    }));
    box.append(tools);
    return box;
  }

  function articleWriter(post, scope) {
    const launch = element('div', 'writer-launch');
    const selection = fieldPreview(['posts'], scope + '/richBody', 'เนื้อหาบทความ');
    launch.append(action('เขียนเนื้อหาบทความ', async () => {
      const entry = activeDraft();
      try {
        await window.ACLabBlogEditor.open({
          post, title: local(post.title), media: entry.draft.settings.media ?? {},
          current: () => activeDraft() === entry && launch.isConnected,
          change(language, document) {
            post.richBody ??= {};
            post.richBody[language] = document;
            mark(false);
          },
          done(language) {
            selectPreview({ ...selection, path: [...selection.path, language], lang: language });
          },
        });
      } catch (error) { say(error.message, true); }
    }, 'button primary'), element('small', 'editor-hint', 'จัดข้อความ แทรกรูปและตาราง แยกไทย–อังกฤษ'));
    return launch;
  }

  function renderValue(value, title, path, scope, setter, term = '') {
    const key = path.at(-1) || title;
    if (mode === 'settings' && active.id === 'main' && key === 'branding') {
      const entry = activeDraft();
      return window.ACLabLogoEditor.controls({ value,
        current: () => activeDraft() === entry && group === 'branding',
        upload: image => request('upload', { image }),
        change() {
          mark();
          selectPreview({ path: ['settings', 'branding', 'logo'], label: 'โลโก้ในส่วนหัวเว็บไซต์' });
        },
      });
    }
    if (isPair(value)) return localizedField(value,title,key,fieldPreview(path, scope, title));
    if (Array.isArray(value)) {
      if (['desktop','mobile'].includes(key)) {
        const box = element('div','object-fields');
        box.append(element('h3','',title));
        value.forEach((number, i) => box.append(inputField(i === 0 ? 'X' : 'Y',key,number,next=>{value[i]=next;},
          false, fieldPreview(path, scope + '/' + i, title))));
        return box;
      }
      return arrayField(value,title,path,scope,term);
    }
    if (value && typeof value === 'object') {
      if (mode === 'settings' && ['authors','media'].includes(key)) return mapField(value,title,path,scope,term);
      const fields = element('div','object-fields');
      const post = active.id === 'blog' && path.length === 1 && key === 'posts';
      if (post) fields.append(articleWriter(value, scope));
      for (const [child, item] of Object.entries(value)) {
        if (child === 'order' && active.id === 'team') continue;
        if (post && ['sections', 'richBody'].includes(child)) continue;
        if (!searchable(item, term, label(child))) continue;
        const card = renderValue(item,label(child),[...path,child],scope+'/'+child,next=>{value[child]=next;});
        if (item && typeof item === 'object' && !isPair(item)) {
          const wrap = element('div','object-card');
          wrap.append(element('h3','',label(child)),card);
          fields.append(wrap);
        } else fields.append(card);
      }
      if (key === 'seo') fields.append(window.ACLabSEOManager.preview(active, activeDraft().draft, scope));
      if (!fields.children.length) fields.append(element('p','empty','ไม่พบข้อมูลที่ตรงกับคำค้น'));
      return fields;
    }
    const selection = fieldPreview(path, scope, title);
    const libraryEntry = mode === 'settings' && path[0] === 'media';
    if (libraryEntry || window.ACLabData.isImageField(key)) return imageField(title, value, setter, selection, libraryEntry);
    return inputField(title,key,value,setter,false,selection);
  }

  function renderFields() {
    const draft = activeDraft()?.draft;
    if (!draft) return;
    const fields = $('editor-fields');
    fields.replaceChildren();
    const term = $('section-search').value.trim().toLowerCase();
    const scope = active.id + '/' + mode + '/' + group;
    if (mode === 'settings') {
      fields.append(renderValue(draft.settings[group],active.groups[group],[group],scope,
        next=>{draft.settings[group]=next;},term));
      if (active.id === 'main' && group === 'routes') fields.append(element('p','editor-hint','อีเมล ที่อยู่ และแผนที่แก้ได้ในหน้า Contact'));
      if (active.id === 'team' && group === 'members') {
        fields.append(element('p','editor-hint','ตำแหน่งและสังกัดบนเว็บใช้ช่องที่ตรวจสอบแล้วใน SEO ของแต่ละคน พร้อมแหล่งอ้างอิง'));
        const link = element('a','button quiet','อัปโหลดรูปใน Team Manager');
        link.href = '../team/manager.html';
        link.target = '_blank';
        link.rel = 'noopener';
        fields.append(link);
      }
    } else if (mode === 'blocks') {
      fields.append(arrayField(draft.blocks,'เซกชัน',['blocks'],scope,term));
    } else if (group.startsWith('copy:')) {
      const key = group.slice(5);
      fields.append(renderValue(draft.copy[key],draft.copyGroups[key],[key],scope,
        next=>{draft.copy[key]=next;},term));
    } else {
      for (const [key, field] of Object.entries(draft.staticFields)) {
        if (field.group !== group.slice(7) || !searchable(draft.static[key],term,field.label)) continue;
        fields.append(localizedField(draft.static[key],field.label,'text',{path:['static',key],label:field.label}));
      }
      if (!fields.children.length) fields.append(element('p','empty','ไม่พบข้อความที่ตรงกับคำค้น'));
    }
  }

  async function save() {
    const page = active;
    const entry = activeDraft();
    if (!entry || entry.saving || (!entry.dirty && entry.saved.version !== 0)) return;
    const draft = clone(entry.draft);
    const changes = entry.changes;
    entry.saving = true;
    updateStatus();
    say('กำลังบันทึก…');
    try {
      const saved = await loading('กำลังบันทึกและเผยแพร่…', () => request('site/page/'+page.id, {
        version:draft.version, settings:draft.settings, copy:draft.copy, static:draft.static, blocks:draft.blocks,
      }));
      entry.saved = saved;
      window.ACLabSEOManager.saved();
      if (entry.changes === changes) {
        entry.draft = clone(saved);
        entry.dirty = false;
        if (active === page) renderFields();
      } else entry.draft.version = saved.version;
      if (active === page) {
        updatePreview({ reload: true });
        say(entry.dirty ? 'บันทึกแล้ว ยังมีการแก้ไขใหม่ในฉบับร่าง' : 'บันทึกและเผยแพร่หน้านี้แล้ว');
      }
    } catch (error) {
      if (active === page) say(error.message,true);
    } finally {
      entry.saving = false;
      navigation();
      updateStatus();
    }
  }

  async function restore() {
    const page = active;
    const entry = activeDraft();
    const changes = entry.changes;
    entry.saving = true;
    updateStatus();
    try {
      const state = await loading('กำลังโหลดข้อมูลที่บันทึกล่าสุด…', () => request('site/page/'+page.id));
      if (entry.changes !== changes) {
        if (active === page) say('พบการแก้ไขใหม่ จึงเก็บฉบับร่างปัจจุบันไว้');
        return;
      }
      drafts.set(page.id,entryFor(state));
      navigation();
      if (active === page) { render({ reload: true }); say('โหลดเนื้อหาที่บันทึกล่าสุดแล้ว'); }
    } catch (error) { if (active === page) say(error.message,true); }
    finally { entry.saving = false; updateStatus(); }
  }

  async function enter(session) {
    signedIn = true;
    pages = (await request('site/catalog')).pages;
    $('manager-account').textContent = session.email;
    $('manager-account').title = session.email;
    $('login-screen').hidden = true;
    $('studio').hidden = false;
    $('top-actions').hidden = false;
    const page = pages.find(item => item.id === active?.id) ?? pages[0];
    active = null;
    await openPage(page);
  }

  $('login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const submit = $('login-button');
    submit.disabled = true;
    say('กำลังเข้าสู่ระบบ…',false,'login-status');
    try {
      await loading('กำลังเข้าสู่ระบบ…', async () => {
        const result = await request('login', { email: $('email').value.trim(), password: $('password').value });
        await enter(result);
      });
    } catch (error) { say(error.message,true,'login-status'); }
    finally { $('password').value = ''; submit.disabled = false; }
  });
  $('logout').addEventListener('click', async () => {
    if ([...drafts.values()].some(entry=>entry.dirty)) {
      say('ยังมีฉบับร่าง กรุณาบันทึกหรือคืนค่าก่อนออกจากระบบ',true);
      return;
    }
    try {
      await loading('กำลังออกจากระบบ…', () => request('logout',{}));
      location.reload();
    } catch (error) { say(error.message,true); }
  });
  for (const control of $('mode-bar').children) control.addEventListener('click', () => {
    mode = control.dataset.mode;
    group = '';
    $('section-search').value = '';
    render();
  });
  $('section-search').addEventListener('input',renderFields);
  $('export-website').addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    say('กำลังส่งออกเว็บไซต์…');
    try {
      await loading('กำลังส่งออกเว็บไซต์…', () => window.ACLabExportWebsite());
      say('ส่งออกเว็บไซต์แล้ว');
    } catch (error) {
      say(error.message, true);
    } finally {
      button.disabled = false;
    }
  });
  $('save-page').addEventListener('click',save);
  $('restore-page').addEventListener('click',restore);
  $('download-draft').addEventListener('click', () => {
    const { id, settings, copy, static: staticFields, blocks } = activeDraft().draft;
    const url = URL.createObjectURL(new Blob([JSON.stringify({id,settings,copy,static:staticFields,blocks},null,2)],
      { type:'application/json' }));
    const link = element('a');
    link.href = url;
    link.download = id + '-content.json';
    link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  window.addEventListener('beforeunload', event => {
    if ([...drafts.values()].some(entry=>entry.dirty)) {
      event.preventDefault();
      event.returnValue = '';
    }
  });

  const securePage = location.protocol === 'https:' || (location.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname));
  if (!securePage) {
    say('เปิด Manager จาก GitHub Pages หรือเว็บไซต์ HTTPS', true, 'login-status');
    return;
  }
  loading('กำลังตรวจสถานะ Manager…', async () => {
    const status = await request('status');
    if (status.authenticated) await enter(status);
    else if (status.configured) {
      $('login-button').disabled = false;
      say('', false, 'login-status');
    } else say('ตรวจ assets/supabase-config.js และรัน SQL ตาม README_MANAGER_TH.md', true, 'login-status');
  }).catch(error => {
    $('login-button').disabled = false;
    say(error.message, true, 'login-status');
  });
})();
