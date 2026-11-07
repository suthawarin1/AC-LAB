import { readFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

export async function prerender(sourceRoot, sourcePath, rows, language, record = '', root = false) {
  const file = resolve(sourceRoot, sourcePath);
  const html = await readFile(file, 'utf8');
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => {
    if (!error.message.startsWith('Not implemented:')) errors.push(error.message);
  });
  const url = new URL(sourcePath, 'https://theaclab.in.th/');
  url.searchParams.set('lang', language);
  if (root) url.searchParams.set('welcome', '1');
  if (sourcePath === 'index.html' && !root) url.searchParams.set('view', 'main');
  if (record) url.searchParams.set('post', record);
  const dom = new JSDOM(html, { url: url.href, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: console });
  const { window } = dom;
  window.__ACLAB_SSG = true;
  window.matchMedia = media => ({ media, matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  window.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; }
    observe(target) { queueMicrotask(() => this.callback([{ target, isIntersecting: true, intersectionRatio: 1 }], this)); }
    unobserve() {}
    disconnect() {}
  };
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.HTMLElement.prototype.scrollTo = () => {};
  window.setInterval = () => 0;
  let frames = 0;
  window.requestAnimationFrame = callback => frames++ < 30 ? window.setTimeout(() => callback(window.performance.now() + 3000), 0) : 0;
  window.cancelAnimationFrame = id => window.clearTimeout(id);
  window.CSS ||= {};
  window.CSS.escape ||= value => String(value).replace(/[^\w-]/g, '\\$&');
  window.AbortSignal = AbortSignal;
  window.fetch = async input => {
    const request = new URL(input, url);
    if (request.pathname === '/rest/v1/aclab_cms_public_pages') return Response.json(Object.values(rows));
    if (request.origin !== url.origin) return new Response('', { status: 404 });
    const target = resolve(sourceRoot, decodeURIComponent(request.pathname.slice(1)));
    if (target !== resolve(sourceRoot) && !target.startsWith(resolve(sourceRoot) + sep)) return new Response('', { status: 404 });
    try { return new Response(await readFile(target)); }
    catch { return new Response('', { status: 404 }); }
  };
  let currentScript;
  Object.defineProperty(window.document, 'currentScript', { configurable: true, get: () => currentScript });
  try {
    for (const script of window.document.querySelectorAll('script')) {
      if (script.type && !['text/javascript', 'application/javascript'].includes(script.type)) continue;
      currentScript = script;
      let code = script.textContent;
      if (script.src) {
        const resource = new URL(script.src, url);
        if (resource.origin !== url.origin) continue;
        const path = resolve(sourceRoot, decodeURIComponent(resource.pathname.slice(1)));
        if (!path.startsWith(resolve(sourceRoot) + sep)) throw new Error('Invalid script path ' + relative(sourceRoot, path));
        code = await readFile(path, 'utf8');
      }
      const result = window.eval(code);
      if (result && typeof result.then === 'function') await result;
    }
    currentScript = null;
    window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
    if (window.ACLabEditor?.ready) await window.ACLabEditor.ready;
    await new Promise(resolve => setTimeout(resolve, 80));
    if (errors.length) throw new Error(sourcePath + ': ' + [...new Set(errors)].join(' | '));
    const head = window.document.head;
    const base = window.document.querySelector('base') || window.document.createElement('base');
    base.href = new URL(sourcePath, 'https://theaclab.in.th/').href;
    if (!base.isConnected) head.prepend(base);
    return { dom, html: dom.serialize() };
  } catch (error) {
    window.close();
    throw error;
  }
}
