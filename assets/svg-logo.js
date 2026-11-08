(() => {
  'use strict';
  const ns = 'http://www.w3.org/2000/svg';
  const maxBytes = 262144;
  const rasterData = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
  const local = /^#[\w.:-]+$/;
  function cssSafe(value) {
    value = value.replace(/\/\*[\s\S]*?\*\//g, '');
    if (/[\\@<>]/.test(value) || /expression\s*\(/i.test(value)) return false;
    if (/(?:https?|file|data|javascript|vbscript):|\/\//i.test(value) ||
        /(?:image-set|cross-fade|paint|src|image)\s*\(/i.test(value)) return false;
    let valid = true;
    value.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (_, quote, target) => { if (!local.test(target.trim())) valid = false; return ''; });
    return valid;
  }
  function parse(value) {
    const doc = new DOMParser().parseFromString(value, 'image/svg+xml');
    if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg')
      throw new Error('โค้ด SVG ไม่สมบูรณ์ กรุณาตรวจแท็กเปิดและปิด');
    return doc;
  }
  function length(value) {
    const match = /^([\d.]+)\s*(px|pt|pc|mm|cm|in)?$/.exec(value || '');
    if (!match) return 0;
    const scale = { px: 1, pt: 96 / 72, pc: 16, mm: 96 / 25.4, cm: 96 / 2.54, in: 96 };
    return Number(match[1]) * (scale[match[2]] || 1);
  }
  function sanitize(value) {
    if (typeof value !== 'string' || new TextEncoder().encode(value).length > maxBytes)
      throw new Error('ใช้ไฟล์ SVG ขนาดไม่เกิน 256 KB');
    if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(value)) throw new Error('SVG นี้มีการอ้างอิงภายนอก กรุณาส่งออกเป็น SVG แบบมาตรฐาน');
    parse(value);
    if (!window.DOMPurify?.isSupported) throw new Error('โหลดเครื่องมือ SVG ไม่สำเร็จ กรุณาโหลดหน้าใหม่');
    const cleaned = window.DOMPurify.sanitize(value, {
      USE_PROFILES: { svg: true, svgFilters: true }, ADD_TAGS: ['style', 'use'],
      FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'object', 'embed', 'audio', 'video', 'a',
        'animate', 'animateMotion', 'animateTransform', 'set', 'mpath', 'discard'],
      FORBID_ATTR: ['xml:base'], KEEP_CONTENT: true,
    });
    const doc = parse(cleaned), root = doc.documentElement;
    if (root.namespaceURI && root.namespaceURI !== ns) throw new Error('ใช้ SVG ที่มี namespace มาตรฐาน');
    root.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', ns);
    for (const element of [root, ...root.querySelectorAll('*')]) {
      for (const attribute of [...element.attributes]) {
        const key = attribute.localName.toLowerCase(), value = attribute.value.trim();
        if (key.startsWith('on') || key === 'base') element.removeAttributeNode(attribute);
        else if (['href', 'src'].includes(key) && !local.test(value) &&
            !(['image', 'feImage'].includes(element.localName) && rasterData.test(value)))
          throw new Error('SVG อ้างอิงรูปหรือสัญลักษณ์ภายนอก กรุณาฝังไว้ในไฟล์ก่อน');
        else if ((['style', 'fill', 'stroke', 'filter', 'clip-path', 'mask', 'cursor', 'marker-start', 'marker-mid', 'marker-end'].includes(key) || /url\s*\(/i.test(value)) && !cssSafe(value))
          throw new Error('SVG มีรูปหรือสไตล์ที่อ้างอิงภายนอก กรุณาฝังไฟล์ใน SVG ก่อน');
      }
      if (element.localName === 'style' && !cssSafe(element.textContent))
        throw new Error('SVG มีสไตล์ที่อ้างอิงภายนอก กรุณาใช้สีและฟอนต์ที่ฝังในไฟล์');
    }
    if (!root.hasAttribute('viewBox')) {
      const width = length(root.getAttribute('width')), height = length(root.getAttribute('height'));
      if (!(width > 0 && height > 0)) throw new Error('SVG ต้องมี viewBox หรือกำหนด width และ height');
      root.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    }
    const box = root.getAttribute('viewBox').trim().split(/[\s,]+/).map(Number);
    if (box.length !== 4 || box.some(value => !Number.isFinite(value) || Math.abs(value) > 1000000000) || box[2] <= 0 || box[3] <= 0)
      throw new Error('ขนาด viewBox ของ SVG ไม่ถูกต้อง');
    const result = new XMLSerializer().serializeToString(root);
    if (new TextEncoder().encode(result).length > maxBytes) throw new Error('ใช้ SVG ขนาดไม่เกิน 256 KB');
    return result;
  }
  const dataURL = value => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(value);
  function image(source) {
    return new Promise((resolve, reject) => {
      const item = new Image();
      const timer = setTimeout(() => { item.src = ''; reject(new Error('โหลดภาพโลโก้ไม่สำเร็จ')); }, 10000);
      item.onload = () => { clearTimeout(timer); resolve(item); };
      item.onerror = () => { clearTimeout(timer); reject(new Error('อ่านภาพไม่ได้ กรุณาใช้ไฟล์ PNG, JPEG, WebP หรือ SVG ที่สมบูรณ์')); };
      item.src = source;
    });
  }
  async function pngs(source, svg = false) {
    if (svg) {
      const doc = parse(sanitize(source));
      doc.documentElement.setAttribute('width', '512'); doc.documentElement.setAttribute('height', '512');
      source = dataURL(new XMLSerializer().serializeToString(doc.documentElement));
    } else if (!rasterData.test(source)) throw new Error('ใช้ภาพ PNG, JPEG หรือ WebP');
    const picture = await image(source);
    if (!picture.naturalWidth || !picture.naturalHeight || picture.naturalWidth * picture.naturalHeight > 32000000)
      throw new Error('ภาพโลโก้ใหญ่เกินไป กรุณาย่อขนาดภาพก่อน');
    const result = {};
    for (const [field, size] of [['logo', 256], ['favicon', 64], ['appleTouchIcon', 180], ['socialImage', 512]]) {
      const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
      const context = canvas.getContext('2d');
      const ratio = Math.min(size / picture.naturalWidth, size / picture.naturalHeight);
      const width = picture.naturalWidth * ratio, height = picture.naturalHeight * ratio;
      context.drawImage(picture, (size - width) / 2, (size - height) / 2, width, height);
      result[field] = canvas.toDataURL('image/png');
    }
    return result;
  }
  window.ACLabSVGLogo = { sanitize, dataURL, pngs, maxBytes };
})();
