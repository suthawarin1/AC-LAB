(() => {
  'use strict';
  const SEO = window.ACLabSEO;
  const source = document.currentScript;
  const context = window.ACLabSEOContext || { page: source?.dataset.page || 'main' };
  let builtSnapshot;
  let builtURLs;
  try {
    builtSnapshot = JSON.parse(document.getElementById('aclab-public-snapshot')?.textContent || 'null');
    if (builtSnapshot) builtURLs = new Set(SEO.entries(builtSnapshot).map(entry => entry.canonical));
  } catch {}
  const built = url => window.__ACLAB_SSG || context.manager || !builtURLs || builtURLs.has(url);

  function setMeta(doc, name, value, property = false) {
    const attribute = property ? 'property' : 'name';
    let meta = doc.head.querySelector('meta[' + attribute + '="' + name + '"]');
    if (!meta) {
      meta = doc.createElement('meta');
      meta.setAttribute(attribute, name);
      doc.head.append(meta);
    }
    meta.content = value;
  }

  function applyHead(doc, rows, meta) {
    if (!meta) {
      setMeta(doc, 'robots', 'noindex,follow');
      return;
    }
    if (doc.title !== meta.title) doc.title = meta.title;
    if (doc.documentElement.lang !== meta.lang) doc.documentElement.lang = meta.lang;
    setMeta(doc, 'description', meta.description);
    setMeta(doc, 'robots', meta.indexable ? 'index,follow,max-image-preview:large' : 'noindex,follow');
    doc.head.querySelectorAll('link[rel="canonical"],link[hreflang]').forEach(node => node.remove());
    const canonical = doc.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = meta.canonical;
    doc.head.append(canonical);
    for (const lang of meta.languages) {
      const entry = SEO.descriptor(rows, meta.page, lang, meta.record);
      if (!entry) continue;
      const alternate = doc.createElement('link');
      alternate.rel = 'alternate';
      alternate.hreflang = lang;
      alternate.href = entry.canonical;
      doc.head.append(alternate);
    }
    if (meta.page === 'main' && !meta.record) {
      const alternate = doc.createElement('link');
      alternate.rel = 'alternate';
      alternate.hreflang = 'x-default';
      alternate.href = SEO.origin + '/';
      doc.head.append(alternate);
    }
    const social = {
      'og:title': meta.title, 'og:description': meta.description, 'og:url': meta.canonical,
      'og:type': meta.type === 'article' ? 'article' : 'website', 'og:site_name': SEO.brand(rows),
      'og:locale': meta.lang === 'th' ? 'th_TH' : 'en_US', 'og:image': meta.image,
      'og:image:alt': meta.type === 'person' ? meta.title : SEO.brand(rows),
    };
    for (const [name, value] of Object.entries(social)) setMeta(doc, name, value, true);
    for (const [name, value] of Object.entries({
      'twitter:card': meta.image === SEO.brandImage(rows, 'socialImage') ? 'summary' : 'summary_large_image',
      'twitter:title': meta.title, 'twitter:description': meta.description, 'twitter:image': meta.image,
    })) setMeta(doc, name, value);
    let structured = doc.getElementById('aclab-structured-data');
    if (!structured) {
      structured = doc.createElement('script');
      structured.id = 'aclab-structured-data';
      structured.type = 'application/ld+json';
      doc.head.append(structured);
    }
    structured.textContent = SEO.encoded(SEO.graph(rows, meta));
    for (const icon of doc.head.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"]')) icon.remove();
    for (const [rel, size, field] of [['icon', 64, 'favicon'], ['apple-touch-icon', 180, 'appleTouchIcon']]) {
      const icon = doc.createElement('link');
      icon.rel = rel;
      icon.href = SEO.brandImage(rows, field);
      const svg = /\.svg(?:$|[?#])/i.test(icon.href);
      icon.type = svg ? 'image/svg+xml' : /\.jpe?g(?:$|[?#])/i.test(icon.href) ? 'image/jpeg' : /\.webp(?:$|[?#])/i.test(icon.href) ? 'image/webp' : 'image/png';
      icon.sizes = svg ? 'any' : size + 'x' + size;
      doc.head.append(icon);
    }
    const token = SEO.settings('main', SEO.content(rows, 'main')).searchConsoleToken;
    if (token) setMeta(doc, 'google-site-verification', SEO.clean(token));
  }

  function logo(doc, rows) {
    const selected = SEO.brandImage(rows);
    for (const brand of doc.querySelectorAll('a.brand, .wordmark')) {
      const existing = brand.querySelector('.aclab-logo');
      if (existing) {
        if (existing.getAttribute('src') !== selected) existing.src = selected;
        continue;
      }
      const copy = doc.createElement('span');
      copy.className = 'aclab-brand-copy';
      copy.append(...brand.childNodes);
      const image = doc.createElement('img');
      image.className = 'aclab-logo';
      image.src = selected;
      image.alt = '';
      image.width = 46;
      image.height = 46;
      image.decoding = 'async';
      brand.classList.add('aclab-brand');
      brand.append(image, copy);
    }
    const footer = doc.querySelector('footer, .site-footer');
    if (footer && !footer.querySelector('.seo-brand-note')) {
      const note = doc.createElement('p');
      note.className = 'seo-brand-note';
      note.textContent = SEO.brand(rows) + ' (TheACLab) · Khon Kaen University';
      footer.append(note);
    }
  }

  function destination(rows, raw, base, lang, current) {
    if (!raw || /^(?:mailto:|tel:|data:|javascript:)/i.test(raw)) return raw;
    if (raw.startsWith('#')) return (current?.canonical || base) + raw;
    let url;
    try { url = new URL(raw, base); } catch { return raw; }
    if (url.origin !== SEO.origin) return raw;
    const page = Object.entries(SEO.pages).find(([, entry]) =>
      url.pathname === '/' + entry[0] || url.pathname === '/' + entry[0].replace(/index\.html$/, ''));
    if (!page) return raw;
    const language = SEO.languages.includes(url.searchParams.get('lang')) ? url.searchParams.get('lang') : lang;
    const id = page[0];
    const post = id === 'blog' && url.searchParams.get('post');
    const found = post && SEO.articles(rows).find(item => item.id === post && SEO.translated(item, language));
    const target = new URL(found ? SEO.postURL(rows, found, language) : SEO.pageURL(rows, id, language));
    // A just-published record keeps its working legacy route until the static build exists.
    if (!built(target.href)) return url.href;
    for (const [key, value] of url.searchParams) {
      if (key !== 'lang' && (key !== 'post' || !found)) target.searchParams.set(key, value);
    }
    if (id === 'main') target.searchParams.delete('view');
    target.hash = url.hash;
    return target.href;
  }

  function links(doc, rows, meta) {
    const base = new URL(SEO.pages[meta.page][0], SEO.origin + '/').href;
    for (const link of doc.querySelectorAll('a[href]')) {
      const target = destination(rows, link.getAttribute('href'), base, meta.lang, meta);
      if (target && link.getAttribute('href') !== target) link.href = target;
    }
    const back = doc.getElementById('article-back');
    if (back && meta.record) back.href = SEO.pageURL(rows, 'blog', meta.lang) + '#posts';
    for (const member of SEO.people(rows)) {
      const card = [...doc.querySelectorAll('[data-member]')].find(node => node.dataset.member === member.id);
      if (!card || card.querySelector('.seo-profile-link')) continue;
      const language = SEO.explicit(member.name, meta.lang) ? meta.lang : 'en';
      if (!built(SEO.personURL(rows, member, language))) continue;
      const link = doc.createElement('a');
      link.className = 'seo-profile-link';
      link.href = SEO.personURL(rows, member, language);
      link.textContent = meta.lang === 'th' ? 'โปรไฟล์และผลงานวิจัย' : 'Profile and publications';
      (card.querySelector('.person-body') || card).append(link);
    }
    for (const byline of doc.querySelectorAll('.author-name')) {
      const name = SEO.clean(byline.textContent).toLowerCase();
      const member = SEO.people(rows).find(item => Object.values(item.name).some(value => SEO.clean(value).toLowerCase() === name));
      if (!member || byline.querySelector('a')) continue;
      if (!built(SEO.personURL(rows, member, SEO.explicit(member.name, meta.lang) ? meta.lang : 'en'))) continue;
      const link = doc.createElement('a');
      link.href = SEO.personURL(rows, member, SEO.explicit(member.name, meta.lang) ? meta.lang : 'en');
      link.textContent = byline.textContent;
      byline.replaceChildren(link);
    }
  }

  SEO.applyHead = applyHead;
  SEO.addLogo = logo;
  SEO.rewriteLinks = links;
  SEO.destination = destination;
  if (window.__ACLAB_SSG || context.manager) return;
  let snapshot;
  try { snapshot = JSON.parse(document.getElementById('aclab-public-snapshot')?.textContent || 'null'); } catch {}
  const embeddedSnapshot = snapshot;
  let refreshing = false;
  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    try {
      if (!snapshot) {
        try { snapshot = await window.ACLabData.read(); }
        catch { snapshot = JSON.parse(document.getElementById('aclab-public-snapshot')?.textContent || 'null'); }
      }
      if (!snapshot) return;
      const query = new URLSearchParams(location.search);
      const lang = SEO.languages.includes(query.get('lang')) ? query.get('lang') :
        SEO.languages.includes(document.documentElement.lang) ? document.documentElement.lang : context.lang || 'en';
      const record = query.get('post') || context.record || '';
      const meta = SEO.descriptor(snapshot, context.page, lang, record, context.root);
      if (meta && query.has('aclab-preview')) meta.indexable = false;
      applyHead(document, snapshot, meta);
      logo(document, snapshot);
      if (meta) links(document, snapshot, meta);
    } catch {
      // The static document remains readable if live data is temporarily unavailable.
    } finally { refreshing = false; }
  }
  function start() {
    refresh();
    window.ACLabData.read().then(rows => { snapshot = { ...embeddedSnapshot, ...rows }; refresh(); }).catch(() => {});
    let timer;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 100);
    }).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', event => {
      if (!context.static || !snapshot || event.defaultPrevented) return;
      const control = event.target.closest('[data-language],[data-enter]');
      const lang = control?.dataset.language || control?.dataset.enter;
      if (!SEO.languages.includes(lang)) return;
      let target = SEO.descriptor(snapshot, context.page, lang, context.record);
      if (!target || !target.languages.includes(lang)) return;
      if (!built(target.canonical)) target = SEO.descriptor(builtSnapshot, context.page, lang, context.record);
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const url = new URL(target.canonical);
      for (const [name, value] of new URLSearchParams(location.search)) if (!['lang', 'post'].includes(name)) url.searchParams.set(name, value);
      location.assign(url.href);
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
