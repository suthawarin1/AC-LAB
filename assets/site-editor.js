(() => {
  'use strict';
  const loader = document.currentScript;
  const root = new URL('../', loader.src);
  const page = loader.dataset.page;
  const embedded = document.getElementById('aclab-editor-snapshot');
  let payload = JSON.parse(embedded.textContent);
  const ready = window.ACLabData.editor(page)
    .then(result => { if (result?.anchors) payload = result; })
    .catch(() => {});

  function merge(base, changed) {
    if (base && typeof base === 'object' && !Array.isArray(base) && changed && typeof changed === 'object') {
      return Object.fromEntries(Object.entries(base).map(([key, value]) =>
        [key, Object.hasOwn(changed, key) ? merge(value, changed[key]) : value]));
    }
    return changed;
  }

  function copy(key, defaults, localeFirst = false) {
    const changed = payload.copy?.[key];
    if (!changed) return defaults;
    if (!localeFirst) return merge(defaults, changed);
    return Object.fromEntries(Object.entries(defaults).map(([language, values]) =>
      [language, Object.fromEntries(Object.entries(values).map(([field, value]) =>
        [field, changed[field]?.[language] ?? value]))]));
  }

  function local(pair) {
    const language = document.documentElement.lang === 'th' ? 'th' : 'en';
    return pair?.[language] || pair?.en || pair?.th || '';
  }

  function setText(node, value) {
    if (node.textContent !== value) node.textContent = value;
  }

  function updateLabels() {
    const language = document.documentElement.lang === 'th' ? 'th' : 'en';
    for (const attr of ['text', 'aria-label', 'alt', 'placeholder']) {
      for (const node of document.querySelectorAll('[data-aclab-' + attr + ']')) {
        const changed = payload.static?.[node.getAttribute('data-aclab-' + attr)];
        const value = changed?.[language];
        if (value === undefined) {
          if (node.aclabOriginal && node.aclabOriginal[attr] !== undefined) {
            const original = node.aclabOriginal[attr];
            if (attr === 'text') setText(node, original);
            else node.setAttribute(attr, original);
          }
          continue;
        }
        node.aclabOriginal ??= {};
        node.aclabOriginal[attr] ??= attr === 'text' ? node.textContent : node.getAttribute(attr);
        if (attr === 'text') setText(node, value);
        else node.setAttribute(attr, value);
      }
    }
  }

  function linkTo(value, image = false) {
    if (!value) return '';
    try {
      const url = new URL(value, value.startsWith('#') ? location.href : root);
      if (image && /^data:image\/(?:png|jpeg|webp|gif);base64,/.test(value)) return value;
      return ['https:', 'http:', 'file:'].includes(url.protocol) ? url.href : '';
    } catch (_) {
      return '';
    }
  }

  function node(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value) element.textContent = value;
    return element;
  }

  function createBlock(block) {
    const section = node('section', 'aclab-custom-block');
    section.id = 'section-' + block.id;
    const content = node('div', 'aclab-custom-inner');
    const text = node('div', 'aclab-custom-copy');
    if (local(block.kicker)) text.append(node('p', 'eyebrow', local(block.kicker)));
    const heading = node('h2', 'display', local(block.title));
    heading.id = section.id + '-title';
    section.setAttribute('aria-labelledby', heading.id);
    text.append(heading);
    if (local(block.body)) text.append(node('p', 'aclab-custom-body', local(block.body)));
    const href = linkTo(block.url);
    if (href && local(block.linkLabel)) {
      const link = node('a', 'aclab-custom-link', local(block.linkLabel));
      link.href = href;
      text.append(link);
    }
    content.append(text);
    const imageURL = linkTo(block.image, true);
    if (imageURL) {
      content.classList.add('has-image');
      const image = node('img');
      image.src = imageURL;
      image.alt = local(block.imageAlt) || '';
      image.loading = 'lazy';
      content.append(image);
    }
    section.append(content);
    return section;
  }

  function updateBlocks() {
    document.querySelectorAll('.aclab-custom-block').forEach(node => node.remove());
    const main = document.querySelector('main');
    if (!main || !payload.blocks?.length) return;
    const tails = new Map();
    for (const block of payload.blocks) {
      const selector = payload.anchors?.[block.after];
      const anchor = tails.get(block.after) || (selector ? main.querySelector(selector) : null);
      const section = createBlock(block);
      if (anchor) anchor.after(section);
      else main.append(section);
      tails.set(block.after, section);
    }
  }

  function refresh() {
    updateLabels();
    updateBlocks();
  }

  window.ACLabEditor = { ready, copy };
  document.addEventListener('DOMContentLoaded', () => {
    ready.then(refresh);
    new MutationObserver(() => ready.then(refresh)).observe(document.documentElement, {
      attributes: true, attributeFilter: ['lang'],
    });
  });
})();
