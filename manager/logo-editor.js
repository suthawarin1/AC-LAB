(() => {
  'use strict';
  const SEO = window.ACLabSEO, SVG = window.ACLabSVGLogo;
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  function controls({ value, change, current, upload }) {
    const box = node('section', 'logo-editor');
    const note = node('p', 'editor-hint', 'เปลี่ยนโลโก้จากจุดนี้ใช้กับทุกหน้า อัปโหลด PNG, JPEG, WebP หรือ SVG เพื่อสร้างโลโก้และไอคอนให้ครบ');
    const status = node('p', 'logo-editor-status'); status.setAttribute('role', 'status');
    const previews = node('div', 'logo-previews');
    const header = node('div', 'logo-preview-card logo-preview-header');
    const mark = node('img'); mark.alt = 'ตัวอย่างโลโก้'; mark.width = 52; mark.height = 52;
    const label = node('span'); label.append(node('strong', '', 'The AC Lab'), node('small', '', 'Khon Kaen University'));
    header.append(mark, label);
    const icon = node('div', 'logo-preview-card logo-preview-icon');
    const tab = node('img'); tab.width = 24; tab.height = 24; tab.alt = 'ตัวอย่างไอคอนแท็บ';
    icon.append(tab, node('span', '', 'The AC Lab · ไอคอนแท็บ'));
    previews.append(header, icon);
    const fields = {}, buttons = [];
    let busy = false;
    const say = (text, error = false) => { status.textContent = text; status.classList.toggle('error', error); };
    const resolved = field => window.ACLabManager.imageURL(value[field] || SEO.brandingDefaults()[field]);
    function preview() {
      mark.src = value.logoSvg ? SVG.dataURL(value.logoSvg) : resolved('logo');
      tab.src = resolved('favicon');
      const draft = { main: { content: { branding: { ...value, logo: resolved('logo') } } } };
      SEO.addLogo(document, draft);
    }
    function update() {
      for (const [key, input] of Object.entries(fields)) {
        const uploaded = /^aclab-media:/.test(value[key] || '');
        input.value = uploaded ? '' : value[key] || '';
        input.placeholder = uploaded ? 'อัปโหลดแล้ว · วางลิงก์ใหม่เพื่อเปลี่ยนภาพ' : 'https://… หรือเลือกไฟล์ด้านบน';
      }
      preview();
    }
    function button(text, task, primary = false) {
      const element = node('button', primary ? 'button primary' : 'button quiet', text); element.type = 'button';
      element.addEventListener('click', task); buttons.push(element); return element;
    }
    async function apply(source, svg) {
      if (busy) return;
      clearTimeout(timer);
      busy = true; box.setAttribute('aria-busy', 'true'); buttons.forEach(button => { button.disabled = true; }); file.disabled = true;
      say('กำลังเตรียมโลโก้และไอคอน…');
      try {
        await window.ACLoader.run('กำลังเตรียมโลโก้…', async () => {
          const clean = svg ? SVG.sanitize(source) : '';
          const images = await SVG.pngs(svg ? clean : source, svg);
          const refs = {};
          for (const [key, image] of Object.entries(images)) refs[key] = (await upload(image)).url;
          if (!current()) return;
          Object.assign(value, refs, { logoSvg: clean }); svgInput.value = clean;
          svgPreview.hidden = !clean;
          if (clean) svgPreview.src = SVG.dataURL(clean);
          update(); change(); say('เตรียมโลโก้แล้ว กด “บันทึกและเผยแพร่” เพื่อนำขึ้นเว็บไซต์');
        });
      } catch (error) { say(error.message, true); }
      finally { busy = false; box.removeAttribute('aria-busy'); buttons.forEach(button => { button.disabled = false; }); file.disabled = false; }
    }
    const fileLabel = node('label', 'logo-file-label', 'เลือกไฟล์โลโก้');
    const file = node('input'); file.type = 'file'; file.accept = '.png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml';
    fileLabel.append(file);
    file.addEventListener('change', async () => {
      const selected = file.files?.[0]; if (!selected) return;
      try {
        const svg = /\.svg$/i.test(selected.name) || selected.type === 'image/svg+xml';
        if (selected.size > (svg ? SVG.maxBytes : 4500000)) throw new Error(svg ? 'ใช้ SVG ขนาดไม่เกิน 256 KB' : 'ใช้ภาพขนาดไม่เกิน 4.5 MB');
        const source = svg ? await selected.text() : await new Promise((resolve, reject) => {
          const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ')); reader.readAsDataURL(selected);
        });
        await apply(source, svg);
      } catch (error) { say(error.message, true); }
      finally { file.value = ''; }
    });
    const urlFields = node('div', 'logo-url-fields');
    for (const [key, title] of [['logo', 'ลิงก์โลโก้ในส่วนหัว (รองรับ SVG)'], ['favicon', 'ลิงก์ไอคอนแท็บ'],
      ['appleTouchIcon', 'ลิงก์ไอคอนมือถือ (PNG / JPEG / WebP)'], ['socialImage', 'ลิงก์ภาพแชร์ (PNG / JPEG / WebP)']]) {
      const label = node('label', '', title), input = node('input'); input.type = 'text'; input.maxLength = 2000;
      input.placeholder = 'https://… หรือเลือกไฟล์ด้านบน'; fields[key] = input;
      input.addEventListener('input', () => {
        value[key] = input.value.trim();
        input.placeholder = 'https://… หรือเลือกไฟล์ด้านบน';
        if (key === 'logo') { value.logoSvg = ''; svgInput.value = ''; svgPreview.hidden = true; }
        preview(); change();
      });
      label.append(input); urlFields.append(label);
    }
    const svgLabel = node('label', 'logo-svg-label', 'โค้ด SVG');
    const svgInput = node('textarea', 'logo-svg-input'); svgInput.rows = 8; svgInput.maxLength = SVG.maxBytes;
    svgInput.spellcheck = false; svgInput.placeholder = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">…</svg>';
    svgInput.value = value.logoSvg || ''; svgLabel.append(svgInput);
    const svgPreview = node('img', 'logo-svg-preview'); svgPreview.alt = 'พรีวิวโค้ด SVG'; svgPreview.width = 130; svgPreview.height = 130;
    svgPreview.hidden = !value.logoSvg;
    if (value.logoSvg) svgPreview.src = SVG.dataURL(value.logoSvg);
    let timer;
    svgInput.addEventListener('input', () => {
      clearTimeout(timer); timer = setTimeout(() => {
        if (!box.isConnected || busy) return;
        try {
          if (!svgInput.value.trim()) { svgPreview.hidden = true; say(''); return; }
          const clean = SVG.sanitize(svgInput.value); svgPreview.src = SVG.dataURL(clean); svgPreview.hidden = false;
          say('พรีวิว SVG พร้อมแล้ว กด “ใช้ SVG นี้” เพื่อนำไปใช้กับโลโก้');
        } catch (error) { svgPreview.hidden = true; say(error.message, true); }
      }, 220);
    });
    const tools = node('div', 'logo-tools');
    tools.append(button('ใช้ SVG นี้', () => apply(svgInput.value, true), true),
      button('ดาวน์โหลด SVG ปัจจุบัน', () => {
        try {
          const clean = SVG.sanitize(value.logoSvg || svgInput.value);
          const url = URL.createObjectURL(new Blob([clean], { type: 'image/svg+xml' }));
          const link = node('a'); link.href = url; link.download = 'The-AC-Lab-logo.svg'; link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) { say(error.message, true); }
      }), button('กลับไปใช้โลโก้เริ่มต้น', () => {
        Object.assign(value, SEO.brandingDefaults()); svgInput.value = ''; svgPreview.hidden = true; update(); change();
        say('เลือกโลโก้เริ่มต้นแล้ว กดบันทึกและเผยแพร่เพื่อนำไปใช้');
      }));
    box.append(note, previews, fileLabel, urlFields, svgLabel, svgPreview, tools,
      node('p', 'editor-hint', 'SVG เก็บเป็นเวกเตอร์ในโลโก้ ระบบสร้าง PNG สำหรับไอคอนและภาพแชร์ หากใช้ฟอนต์เฉพาะควรแปลงตัวอักษรเป็น Path ก่อน'), status);
    update();
    return box;
  }
  window.ACLabLogoEditor = { controls };
  const start = () => window.ACLabData.read().then(rows => SEO.addLogo(document, rows)).catch(() => {});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
