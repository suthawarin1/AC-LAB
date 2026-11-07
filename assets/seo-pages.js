(() => {
  'use strict';
  const S = window.ACLabSEO;
  const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const ids = { main: 'site-config', about: 'about-config', team: 'team-config', publication: 'publication-config', blog: 'blog-config',
    funding: 'funding-config', awards: 'awards-config', patents: 'patents-config', contact: 'contact-config' };
  function block(doc, id, value) {
    let element = doc.getElementById(id);
    if (!element) { element = doc.createElement('script'); element.id = id; element.type = 'application/json'; doc.head.append(element); }
    element.textContent = S.encoded(value);
    return element;
  }
  function prepare(doc, rows, meta, offline = false) {
    const path = S.pages[meta.page][0];
    let base = doc.querySelector('base');
    if (!base) { base = doc.createElement('base'); doc.head.prepend(base); }
    base.href = S.origin + '/' + path;
    const context = { page: meta.page, sourcePath: path, lang: meta.lang, record: meta.record, root: meta.root, static: true };
    block(doc, 'aclab-seo-context', context);
    block(doc, 'aclab-public-snapshot', S.snapshot(rows));
    if (meta.type !== 'person') {
      const element = doc.getElementById(ids[meta.page]);
      if (element) {
        const embedded = JSON.parse(element.textContent);
        const live = window.ACLabData.materialize(rows, meta.page);
        const merged = { ...embedded, ...live };
        if (!['team', 'blog'].includes(meta.page)) merged.media = { ...embedded.media, ...live.media };
        if (['main', 'about'].includes(meta.page)) merged.routes = rows.main?.content?.routes || embedded.routes;
        block(doc, ids[meta.page], merged);
      }
      if (doc.getElementById('editorial-routes')) block(doc, 'editorial-routes', rows.main?.content?.routes || {});
      const editor = block(doc, 'aclab-editor-snapshot', rows[meta.page]?.editor || {});
      if (offline) editor.setAttribute('data-offline', ''); else editor.removeAttribute('data-offline');
    }
    doc.querySelectorAll('[data-aclab-preview-highlight]').forEach(node => node.removeAttribute('data-aclab-preview-highlight'));
    doc.getElementById('aclab-preview-style')?.remove();
    doc.getElementById('aclab-export-data')?.remove();
    doc.getElementById('aclab-export-ready')?.remove();
    for (const link of doc.querySelectorAll('link[data-aclab-export-media]')) {
      const media = link.getAttribute('data-aclab-export-media');
      if (media) link.setAttribute('media', media); else link.removeAttribute('media');
      link.removeAttribute('data-aclab-export-media');
    }
    S.applyHead(doc, rows, meta);
    S.addLogo(doc, rows);
    S.rewriteLinks(doc, rows, meta);
    if (meta.root) for (const button of doc.querySelectorAll('button[data-enter]')) {
      const link = doc.createElement('a');
      for (const attribute of button.attributes) if (attribute.name !== 'type') link.setAttribute(attribute.name, attribute.value);
      link.href = S.pageURL(rows, 'main', button.dataset.enter);
      link.append(...button.childNodes);
      button.replaceWith(link);
    }
    return doc;
  }
  function profile(rows, meta) {
    const member = S.people(rows).find(item => item.id === meta.record);
    const settings = S.person(member);
    const th = meta.lang === 'th';
    const name = S.local(member.name, meta.lang);
    const interests = member.expertise?.[meta.lang] || member.expertise?.en || [];
    const rawPhoto = S.content(rows, 'team').media?.[member.photo] || member.photo;
    const photo = /^data:image\/(png|jpeg|webp);base64,/.test(rawPhoto || '') ? rawPhoto : S.resolveImage(member.photo, S.content(rows, 'team').media, 'team/');
    const papers = S.papersFor(rows, member);
    const posts = S.articles(rows).filter(post => post.authorId === member.id && S.translated(post, meta.lang));
    const text = (th, en) => meta.lang === 'th' ? th : en;
    const nav = ['about', 'team', 'publication', 'blog', 'funding', 'contact'].map(page =>
      `<a href="${escape(S.pageURL(rows, page, meta.lang))}">${escape(S.pages[page][th ? 2 : 3])}</a>`).join('');
    const alternatives = meta.languages.map(lang => `<a href="${escape(S.personURL(rows, member, lang))}" lang="${lang}" hreflang="${lang}">${lang === 'th' ? 'ไทย' : 'English'}</a>`).join(' · ');
    const detail = [S.local(settings.verifiedTitle, meta.lang), S.local(settings.verifiedAffiliation, meta.lang)].filter(Boolean);
    return `<!doctype html><html lang="${meta.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <link rel="stylesheet" href="${S.origin}/about/fonts/fonts.css"><link rel="stylesheet" href="${S.origin}/assets/seo.css">
      <link rel="stylesheet" href="${S.origin}/assets/researcher.css"><title>${escape(meta.title)}</title>
      <script id="aclab-seo-context" type="application/json">${S.encoded({ page: 'team', lang: meta.lang, record: member.id, static: true })}</script>
      <script>window.ACLabSEOContext=JSON.parse(document.getElementById('aclab-seo-context').textContent)</script>
      <script src="${S.origin}/assets/supabase-config.js"></script><script src="${S.origin}/assets/site-data.js"></script>
      <script src="${S.origin}/assets/seo-core.js"></script><script defer src="${S.origin}/assets/seo.js"></script></head><body>
      <a class="skip" href="#profile">${text('ข้ามไปยังเนื้อหา', 'Skip to content')}</a>
      <header><a class="brand" href="${S.pageURL(rows, 'main', meta.lang)}"><strong>The AC Lab</strong><small>Khon Kaen University</small></a><nav aria-label="${text('เมนูหลัก', 'Main navigation')}">${nav}</nav><div class="languages">${alternatives}</div></header>
      <main id="profile"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${S.pageURL(rows, 'main', meta.lang)}">The AC Lab</a><span>/</span><a href="${S.pageURL(rows, 'team', meta.lang)}">${text('ทีมวิจัย', 'The Team')}</a><span>/</span><span>${escape(name)}</span></nav>
      <section class="profile-hero">${photo ? `<img class="portrait" src="${escape(photo)}" alt="${escape(name)}" width="360" height="360">` : `<div class="portrait monogram" aria-hidden="true">${escape(name.slice(0, 1))}</div>`}
      <div><p class="eyebrow">THE AC LAB · ${escape(S.local(member.position, meta.lang) || text('ทีมวิจัย', 'Research team'))}</p><h1>${escape(name)}</h1>
      ${Object.entries(member.name).filter(([lang, value]) => lang !== meta.lang && value).map(([lang, value]) => `<p class="other-name" lang="${lang}">${escape(value)}</p>`).join('')}
      ${detail.map(value => `<p>${escape(value)}</p>`).join('')}<a class="source-link" href="${escape(settings.verificationSource)}" target="_blank" rel="noopener">${text('แหล่งข้อมูลอ้างอิง', 'Reference source')} ↗</a></div></section>
      <section class="profile-grid"><article class="research-card"><p class="eyebrow">RESEARCH INTERESTS</p><h2>${text('ความสนใจในการวิจัย', 'Research interests')}</h2>
      ${S.local(member.bio, meta.lang) ? `<p>${escape(S.local(member.bio, meta.lang))}</p>` : ''}<ul class="interests">${(Array.isArray(interests) ? interests : [interests]).filter(Boolean).map(item => `<li>${escape(item)}</li>`).join('')}</ul></article>
      <article class="contact-card"><p class="eyebrow">CONNECT</p><h2>${text('ติดต่อและร่วมวิจัย', 'Contact and collaborate')}</h2>
      ${member.email ? `<a href="mailto:${escape(member.email)}">${escape(member.email)}</a>` : `<a href="${S.pageURL(rows, 'contact', meta.lang)}">${text('ติดต่อผ่านห้องปฏิบัติการ', 'Contact the laboratory')}</a>`}
      <p>The AC Lab · Khon Kaen University</p></article></section>
      <section class="profile-publications"><p class="eyebrow">SELECTED PUBLICATIONS</p><h2>${text('ผลงานที่เผยแพร่บนเว็บไซต์', 'Publications on this website')}</h2>
      ${papers.length ? `<ol class="paper-list">${papers.map(paper => `<li><h3>${escape(S.local(paper.title, meta.lang))}</h3><p>${escape(paper.journal || '')}${paper.year ? ' · ' + escape(paper.year) : ''}</p>${paper.doi ? `<a href="https://doi.org/${escape(String(paper.doi).replace(/^https?:\/\/(?:dx\.)?doi\.org\//, ''))}" rel="noopener">DOI ↗</a>` : ''}</li>`).join('')}</ol>` : `<p>${text('ดูผลงานวิจัยทั้งหมดของห้องปฏิบัติการในหน้า Publications', 'Explore the laboratory publication collection.')}</p>`}
      <a class="button-link" href="${S.pageURL(rows, 'publication', meta.lang)}">${text('ผลงานวิจัยทั้งหมด', 'All publications')} ↗</a></section>
      ${posts.length ? `<section><h2>${text('บทความจากผู้เขียน', 'From the author')}</h2><ul>${posts.map(post => `<li><a href="${S.postURL(rows, post, meta.lang)}">${escape(S.local(post.title, meta.lang))}</a></li>`).join('')}</ul></section>` : ''}</main>
      <footer><a href="${S.pageURL(rows, 'contact', meta.lang)}">${text('มาเจอเราที่ห้องแล็บ', 'Come and find us')} ↗</a></footer></body></html>`;
  }
  function redirect(rows, page) {
    const targets = Object.fromEntries(S.languages.map(lang => [lang, S.pageURL(rows, page, lang)]));
    const posts = page === 'blog' ? Object.fromEntries(S.articles(rows).map(post => [post.id,
      Object.fromEntries(S.languages.filter(lang => S.translated(post, lang)).map(lang => [lang, S.postURL(rows, post, lang)]))])) : {};
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The AC Lab</title><link rel="canonical" href="${targets.en}"></head><body><p><a href="${targets.en}">Continue to The AC Lab</a> · <a href="${targets.th}" lang="th">เข้าสู่เว็บไซต์ภาษาไทย</a></p><script>(()=>{const targets=${S.encoded(targets)},posts=${S.encoded(posts)};const query=new URLSearchParams(location.search),lang=query.get('lang')==='th'?'th':'en',post=query.get('post');const found=posts[post]?.[lang];const next=new URL(found||targets[lang]);query.delete('lang');query.delete('view');if(found)query.delete('post');next.search=query.toString();next.hash=location.hash;location.replace(next.href)})()</script></body></html>`;
  }
  S.prepareDocument = prepare;
  S.snapshotIds = ids;
  S.profileHTML = profile;
  S.redirectHTML = redirect;
})();
