(() => {
  'use strict';
  const SEO = window.ACLabSEO;
  const views = new Set();
  let rows;
  let pending;
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  function preview(page, draft, scope) {
    const box = node('section', 'seo-search-preview');
    box.setAttribute('aria-label', 'ตัวอย่างผลการค้นหา');
    const record = ['posts', 'members'].includes(scope.split('/')[2]) ? scope.split('/')[3] : '';
    const view = { box, page, draft, record };
    views.add(view);
    draw(view);
    pending ||= window.ACLabData.read(true).then(value => { rows = value; return value; }).catch(() => ({}));
    pending.then(() => { if (box.isConnected) draw(view); });
    return box;
  }

  function draw(view) {
    const { box, page, draft, record } = view;
    const published = structuredClone({ ...rows, [page.id]: { content: draft.settings } });
    const post = record && page.id === 'blog' ? published.blog.content.posts.find(post => post.id === record) : null;
    if (post) post.status = 'published';
    box.replaceChildren(node('p', 'eyebrow', 'GOOGLE SEARCH PREVIEW'));
    const issues = [];
    for (const lang of ['th', 'en']) {
      try {
        let meta = SEO.descriptor(published, page.id, lang, record);
        if (!meta && record && page.id === 'team') {
          const member = draft.settings.members.find(member => member.id === record);
          const options = member && SEO.person(member);
          meta = options && { title: SEO.explicit(options.title, lang) || SEO.local(member.name, lang) + ' | The AC Lab',
            description: SEO.explicit(options.description, lang), canonical: SEO.personURL(published, member, lang) };
          issues.push('โปรไฟล์บุคลากรจะเข้ารายการค้นหาเมื่อยืนยันข้อมูลและใส่แหล่งอ้างอิงแล้ว');
        }
        if (!meta) continue;
        const snippet = node('div');
        snippet.lang = lang;
        snippet.append(node('small', 'seo-counts', lang === 'th' ? 'ภาษาไทย' : 'English'),
          node('p', 'seo-snippet-url', meta.canonical), node('h3', '', meta.title),
          node('p', '', meta.description || 'กรอกคำอธิบายหรือเติมข้อมูลของรายการนี้'),
          node('small', 'seo-counts', 'Title ' + meta.title.length + ' · Description ' + meta.description.length + ' ตัวอักษร'));
        box.append(snippet);
      } catch (error) { issues.push(error.message); }
    }
    try { issues.push(...SEO.validate(published)); }
    catch (error) { issues.push(error.message); }
    if (post && draft.settings.posts.find(item => item.id === record)?.status === 'draft')
      issues.push('บทความนี้เป็นฉบับร่าง จะแสดงบนเว็บเมื่อเลือกสถานะเผยแพร่และบันทึกแล้ว');
    const audit = node('ul', 'seo-audit');
    for (const text of [...new Set(issues)].slice(0, 8)) audit.append(node('li', '', text));
    if (!issues.length) audit.append(node('li', '', 'มี Title, Description และ Canonical ครบ และ URL ไม่ซ้ำกับหน้าอื่น'));
    box.append(audit, node('p', 'editor-hint',
      'ตัวอย่างนี้เป็นแนวทาง Google อาจเลือกข้อความต่างออกไป หน้า HTML และ sitemap จะอัปเดตเมื่อสร้างเว็บผ่าน workflow หรือส่งออกเว็บ SEO'));
  }

  function refresh() {
    for (const view of views) {
      if (!view.box.isConnected) views.delete(view);
      else draw(view);
    }
  }
  document.addEventListener('input', () => queueMicrotask(refresh));
  document.addEventListener('change', () => queueMicrotask(refresh));
  window.ACLabSEOManager = {
    preview,
    saved() { rows = undefined; pending = undefined; },
  };
})();
