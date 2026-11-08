(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const panel = $('live-preview');
  const viewport = $('preview-viewport');
  const toggle = $('preview-toggle');
  const locateButton = $('preview-locate');
  const wide = matchMedia('(min-width: 1100px)');
  const anchorByGroup = {
    main: { introSlides: '#welcome', heroSlides: '#hero', slideInterval: '#hero', bento: '#lab-bento', news: '#news', routes: '.site-header' },
    about: { copy: '.about-hero', visuals: '#about-story', researchAreas: '#research', stages: '#method-panel',
      email: '.closing', genomeLabels: '#barleria-genome', genomeSpecies: '#barleria-genome', genomeGeneNames: '#barleria-genome' },
    team: { hero: '.hero', members: '.people-section', contactEmail: '.closing' },
    publication: { hero: '#cover', topics: '#research-scope', papers: '#publications', publicationCopy: '#publications' },
    blog: { hero: '#cover', posts: '#posts', categories: '#posts', tags: '#posts', authors: '#posts', blogCopy: '#posts' },
    funding: { hero: '#cover', grants: '#grants', fundingCopy: '#grants' },
    awards: { hero: '#cover', awards: '#awards', awardCopy: '#awards', awardRoles: '#awards', awardLevels: '#awards' },
    patents: { hero: '#cover', records: '#portfolio', patentCopy: '#portfolio', patentKinds: '#portfolio' },
    contact: { hero: '#cover', contact: '#visit', contactCopy: '#visit', contactTopics: '#contact-form' },
  };
  const token = crypto.randomUUID();
  let open = wide.matches;
  let context;
  let language = 'th';
  let width = 390;
  let baseRows;
  let sourceVersion = 0;
  let visible;
  let pending;

  function lookup(value, path) {
    for (const key of path) {
      if (Array.isArray(value)) value = value.find(row => row?.id === key) ?? value[Number(key)];
      else value = value && Object.hasOwn(value, key) ? value[key] : undefined;
    }
    return value;
  }

  function position(state) {
    const { page, draft, selection } = state;
    const path = selection?.path || [];
    const [area, group] = path;
    const collection = area === 'blocks' ? draft.blocks : area === 'settings' ? draft.settings[group] : null;
    const record = area === 'blocks' ? lookup(draft, path.slice(0, 2)) : Array.isArray(collection)
      ? lookup(draft, path.slice(0, 3)) : null;
    const id = typeof record?.id === 'string' ? record.id : '';
    const index = Array.isArray(collection) ? collection.indexOf(record) : -1;
    const field = ['th', 'en'].includes(path.at(-1)) ? path.at(-2) : path.at(-1);
    const groupKey = state.group.replace(/^copy:/, '');
    const intro = page.id === 'main' && (groupKey === 'introSlides' ||
      (area === 'static' && draft.staticFields?.[group]?.group === 'หน้าต้อนรับ') ||
      (area === 'copy' && /^(welcome|enter)/i.test(field || '')));
    const article = page.id === 'blog' && group === 'posts' && id &&
      ['sections', 'sources', 'richBody'].some(key => path.includes(key)) ? id : '';
    const reveal = id && (record?.visible === false || (page.id === 'blog' && record?.status === 'draft'))
      ? { id, group: area === 'blocks' ? 'blocks' : group } : null;
    const section = intro ? '#welcome' : article ? '#article-view'
      : page.id === 'team' && group === 'members' && page.anchors[record?.group]
        ? page.anchors[record.group].selector
        : anchorByGroup[page.id]?.[groupKey] || page.anchors[groupKey]?.selector || 'main';
    return {
      path, field, value: lookup(draft, path), section, intro, article, reveal, id, index,
      label: selection?.label || state.label, record,
    };
  }

  function plan(state) {
    const where = position(state);
    const root = window.ACLabData.root;
    const url = new URL(state.page.path, root);
    if (url.origin !== location.origin || !url.href.startsWith(root.href)) throw new Error('เปิดตัวอย่างหน้าเว็บนี้ไม่ได้');
    url.searchParams.set('lang', language);
    url.searchParams.set('aclab-preview', token);
    if (where.intro) url.searchParams.set('welcome', '1');
    if (where.article) url.searchParams.set('post', where.article);
    const key = JSON.stringify([url.href, state.draft.version, state.changes, state.dirty, where.reveal, sourceVersion]);
    return { url, key, where, state };
  }

  function cancel() {
    if (!pending) return;
    clearTimeout(pending.delay);
    clearTimeout(pending.timeout);
    pending.frame?.remove();
    pending = undefined;
  }

  function clear() {
    cancel();
    visible?.frame.remove();
    visible = undefined;
  }

  function status(text, note = 'ฉบับร่างจะแสดงในกรอบนี้จนกว่าจะกดเผยแพร่') {
    $('preview-status').textContent = text;
    $('preview-note').textContent = note;
  }

  function fit() {
    const scale = Math.min(1, viewport.clientWidth / width);
    if (!scale) return;
    for (const frame of viewport.querySelectorAll('iframe')) {
      frame.style.width = width + 'px';
      frame.style.height = Math.round(viewport.clientHeight / scale) + 'px';
      frame.style.transform = `translateX(-50%) scale(${scale})`;
    }
  }
  new ResizeObserver(fit).observe(viewport);

  const showing = node => node?.getClientRects().length && !node.closest('[hidden], [inert], [aria-hidden="true"]');
  const normalized = value => typeof value === 'string' ? value.normalize('NFKC').replace(/\s+/g, ' ').trim() : '';
  const localized = value => typeof value === 'string' ? value : value?.[language] || value?.en || value?.th;
  function matchText(scope, value) {
    const text = normalized(localized(value));
    if (text.length < 2) return null;
    const items = scope.querySelectorAll('h1,h2,h3,h4,h5,p,span,em,strong,a,button,dd,dt,li,label');
    return [...items].find(node => showing(node) && normalized(node.textContent) === text);
  }

  function findRecord(doc, where) {
    if (!where.id) return null;
    const id = CSS.escape(where.id);
    return [...doc.querySelectorAll(`[data-aclab-record="${id}"], [data-member="${id}"], #paper-${id}, #section-${id}`)]
      .find(showing);
  }

  function revealRecord(doc, where, group) {
    const search = doc.getElementById(group === 'papers' ? 'paper-search' : group === 'posts' ? 'post-search' : '');
    const query = where.record?.doi || localized(where.record?.title);
    if (!search || !query || !where.id) return null;
    search.value = query;
    search.dispatchEvent(new doc.defaultView.Event('input', { bubbles: true }));
    return findRecord(doc, where);
  }

  function highlight() {
    const doc = visible?.frame.contentDocument;
    if (!doc || visible.page !== context?.page.id) return;
    const where = position(context);
    const [area, group] = where.path;
    doc.querySelector('[data-aclab-preview-highlight]')?.removeAttribute('data-aclab-preview-highlight');

    let target;
    if (area === 'static') {
      const key = CSS.escape(group);
      target = [...doc.querySelectorAll(['text', 'alt', 'aria-label', 'placeholder']
        .map(attr => `[data-aclab-${attr}="${key}"]`).join(','))].find(showing);
    }
    if (group === 'stages' && where.id) {
      const tab = doc.getElementById('tab-' + where.id);
      if (tab && tab.getAttribute('aria-selected') !== 'true') {
        const field = document.activeElement;
        tab.click();
        if (field !== visible.frame && document.activeElement === visible.frame)
          field?.focus({ preventScroll: true });
      }
    }
    if (where.index >= 0 && ['introSlides', 'heroSlides'].includes(group)) {
      const name = group === 'introSlides' ? 'intro' : 'hero';
      const controls = doc.querySelector(`[data-controls="${name}"]`);
      controls?.querySelectorAll('.carousel-dot')[where.index]?.click();
      const pause = controls?.querySelector('.pause-button');
      if (pause?.getAttribute('aria-pressed') === 'false') pause.click();
      const slides = doc.querySelectorAll(name === 'intro' ? '#welcome-media img' : '#hero-slides .hero-slide');
      const slide = slides[where.index];
      const field = { title: '.hero-title', eyebrow: '.eyebrow', description: '.hero-desc',
        image: '.hero-image', alt: '.hero-image', position: '.hero-image' }[where.field];
      if (showing(slide)) target = (field && slide.querySelector(field)) || matchText(slide, where.value) || slide;
    }
    const section = [...doc.querySelectorAll(where.section)].find(showing) || doc.querySelector('main') || doc.body;
    const record = findRecord(doc, where) || revealRecord(doc, where, group) ||
      (where.index >= 0 && ['bento', 'researchAreas', 'topics'].includes(group)
      ? [...section.querySelectorAll('.bento-card, .research-topic, .scope-card')][where.index] : null);
    const scope = record || section;
    if (group === 'branding') {
      doc.getElementById('main-site')?.classList.add('nav-visible');
      target = [...doc.querySelectorAll('.site-header .aclab-logo, .aclab-logo')].find(showing);
    }
    if (group === 'posts' && where.field === 'richBody') target = scope.querySelector('#article-prose');
    if (!target && area === 'copy' && where.field) {
      const key = CSS.escape(where.field);
      target = [...doc.querySelectorAll(`[data-i18n="${key}"], [data-i18n-aria="${key}"], [data-genome-copy="${key}"]`)]
        .find(showing);
    }
    if (!target) target = matchText(scope, where.value);
    if (!target && /^(image|imageAlt|photo|cover|photoPosition|photoZoom|position)$/.test(where.field || ''))
      target = [...scope.querySelectorAll('img')].find(showing);
    if (!target) target = record || matchText(scope, where.record?.title || where.record?.name || where.record?.project);
    const approximate = !target;
    target ||= section;
    if (!target) return;
    target.setAttribute('data-aclab-preview-highlight', '');
    const view = visible.frame.contentWindow;
    const rect = target.getBoundingClientRect();
    const offset = Math.max(68, (view.innerHeight - Math.min(rect.height, view.innerHeight * .64)) / 2);
    view.scrollTo({ top: Math.max(0, view.scrollY + rect.top - offset), behavior: 'instant' });
    locateButton.disabled = false;
    $('preview-location').textContent = where.label + (approximate && where.field ? ' · ส่วนที่เกี่ยวข้อง' : '');
  }

  function failed(job, message) {
    if (pending !== job) return;
    cancel();
    status('พรีวิวอัปเดตไม่ได้', message);
    locateButton.disabled = false;
    locateButton.textContent = 'ลองอีกครั้ง';
  }

  async function stage(job, view) {
    try {
      const { state, where, url } = view;
      baseRows ||= window.ACLabData.read(true).catch(() => ({}));
      const published = await baseRows;
      if (pending !== job) return;
      const needsDraft = state.dirty || where.reveal || !published[state.page.id];
      const draft = needsDraft
        ? await window.ACLabManager.previewPage(state.page.id, state.draft, where.reveal)
        : published[state.page.id];
      if (pending !== job) return;
      job.rows = { ...published, [state.page.id]: draft };
      job.status = needsDraft ? 'ฉบับร่าง' : 'ข้อมูลเผยแพร่';
      const frame = document.createElement('iframe');
      frame.className = 'preview-frame is-staged';
      frame.title = 'ตัวอย่างหน้าเว็บ · ' + state.page.label.th;
      frame.tabIndex = -1;
      frame.setAttribute('aria-hidden', 'true');
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      frame.src = url.href;
      job.frame = frame;
      job.timeout = setTimeout(() => failed(job, 'โหลดหน้าเว็บตัวอย่างไม่สำเร็จ กรุณาลองอีกครั้ง'), 8500);
      viewport.append(frame);
      fit();
    } catch (error) {
      failed(job, error.message || 'โหลดข้อมูลหน้าเว็บไม่สำเร็จ');
    }
  }

  function refresh(immediate = false) {
    if (!open || !context) return;
    const view = plan(context);
    $('preview-location').textContent = view.where.label;
    if (visible?.key === view.key) {
      cancel();
      status(visible.status);
      highlight();
      return;
    }
    if (pending?.key === view.key) return;
    cancel();
    status(visible ? 'กำลังอัปเดต' : 'กำลังโหลด');
    locateButton.textContent = 'ไปยังจุดที่แก้';
    locateButton.disabled = true;
    const job = { key: view.key, page: context.page.id };
    pending = job;
    job.delay = setTimeout(() => stage(job, view), immediate ? 0 : 240);
  }

  window.addEventListener('message', event => {
    const job = pending;
    if (event.origin !== location.origin || !job?.frame ||
        event.source !== job.frame.contentWindow || event.data?.token !== token) return;
    if (event.data.type === 'aclab-preview-request') {
      event.source.postMessage({ type: 'aclab-preview-data', token, rows: job.rows }, location.origin);
      return;
    }
    if (event.data.type !== 'aclab-preview-rendered') return;
    clearTimeout(job.timeout);
    pending = undefined;
    visible?.frame.remove();
    visible = job;
    const style = job.frame.contentDocument.createElement('style');
    style.textContent = '[data-aclab-preview-highlight]{outline:3px solid #008f81 !important;outline-offset:-2px !important}';
    job.frame.contentDocument.head.append(style);
    job.frame.classList.remove('is-staged');
    job.frame.removeAttribute('aria-hidden');
    job.frame.removeAttribute('tabindex');
    status(job.status);
    highlight();
  });

  function panelState() {
    panel.hidden = !open || !context;
    toggle.disabled = !context;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
    toggle.textContent = panel.hidden ? 'พรีวิวสด' : 'ปิดพรีวิว';
  }

  toggle.addEventListener('click', () => {
    open = !open;
    panelState();
    if (open) {
      refresh(true);
      if (!wide.matches) panel.scrollIntoView({ block: 'start' });
    } else clear();
  });
  locateButton.addEventListener('click', () => {
    if (locateButton.textContent === 'ลองอีกครั้ง') {
      baseRows = undefined;
      sourceVersion++;
      refresh(true);
    } else highlight();
  });
  for (const button of panel.querySelectorAll('[data-preview-width]')) {
    button.addEventListener('click', () => {
      width = Number(button.dataset.previewWidth);
      for (const option of panel.querySelectorAll('[data-preview-width]'))
        option.setAttribute('aria-pressed', String(option === button));
      fit();
      highlight();
    });
  }
  function selectLanguage(lang) {
    language = lang;
    for (const button of panel.querySelectorAll('[data-preview-lang]'))
      button.setAttribute('aria-pressed', String(button.dataset.previewLang === lang));
  }
  for (const button of panel.querySelectorAll('[data-preview-lang]')) {
    button.addEventListener('click', () => { selectLanguage(button.dataset.previewLang); refresh(true); });
  }

  window.ACLabLivePreview = {
    update(state, { focus = false, reload = false } = {}) {
      const changedPage = context?.page.id !== state.page.id;
      if (changedPage) clear();
      if (changedPage || reload) {
        baseRows = undefined;
        sourceVersion++;
      }
      context = state;
      if (focus && state.selection?.lang) selectLanguage(state.selection.lang);
      panelState();
      refresh(changedPage || reload || focus);
    },
    reset() {
      context = undefined;
      baseRows = undefined;
      clear();
      panelState();
    },
  };
})();
