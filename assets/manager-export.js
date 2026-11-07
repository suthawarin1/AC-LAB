(() => {
  'use strict';
  const { root, read, materialize } = window.ACLabData;
  const encoded = value => JSON.stringify(value).replaceAll('<', '\\u003c');
  const snapshotIds = {
    main: 'site-config', about: 'about-config', team: 'team-config', publication: 'publication-config',
    blog: 'blog-config', funding: 'funding-config', awards: 'awards-config',
    patents: 'patents-config', contact: 'contact-config',
  };

  function jsonBlock(html, id) {
    return html.match(new RegExp('(<script id="' + id + '" type="application/json">)([\\s\\S]*?)(</script>)'));
  }

  function patch(html, id, value, offline = false) {
    const block = jsonBlock(html, id);
    if (!block) throw new Error('ไม่พบส่วนข้อมูลของหน้า ' + id);
    const opening = offline ? block[1].slice(0, -1) + ' data-offline>' : block[1];
    return html.slice(0, block.index) + opening + '\n' + encoded(value) + '\n' + block[3] +
      html.slice(block.index + block[0].length);
  }

  async function fetchFile(path) {
    const response = await fetch(new URL(path, root));
    if (!response.ok) throw new Error('ดาวน์โหลดไฟล์เว็บไซต์ไม่สำเร็จ');
    return response;
  }

  async function exportWebsite() {
    const [rows, manifest] = await Promise.all([
      read(true), fetchFile('manager/public-files.json').then(response => response.json()),
    ]);
    const zip = new window.JSZip();
    const archive = zip.folder('The_AC_Lab_Public');
    const pageByPath = Object.fromEntries(manifest.pages.map(page => [page.path, page.id]));
    const routes = rows.main?.content?.routes;
    for (const path of manifest.files) {
      const response = await fetchFile(path);
      const id = pageByPath[path];
      if (!id) {
        archive.file(path, await response.arrayBuffer());
        continue;
      }
      let html = await response.text();
      const block = jsonBlock(html, snapshotIds[id]);
      if (!block || !rows[id]?.editor) throw new Error('กรุณาตรวจข้อมูลที่เผยแพร่ของหน้า ' + id);
      const embedded = JSON.parse(block[2]);
      const live = materialize(rows, id);
      const merged = { ...embedded, ...live };
      if (!['team', 'blog'].includes(id)) merged.media = { ...embedded.media, ...live.media };
      if (['main', 'about'].includes(id)) merged.routes = routes;
      html = patch(html, snapshotIds[id], merged);
      if (jsonBlock(html, 'editorial-routes')) html = patch(html, 'editorial-routes', routes);
      if (id === 'team') html = html.replace(/const routes=\{.*?\};/, () => 'const routes=' + encoded(routes) + ';');
      html = patch(html, 'aclab-editor-snapshot', rows[id].editor, true);
      archive.file(path, html);
    }
    const file = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'The_AC_Lab_Public.zip';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  window.ACLabExportWebsite = exportWebsite;
})();
