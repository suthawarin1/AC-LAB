(() => {
  'use strict';
  const S = window.ACLabSEO;
  const {root,read} = window.ACLabData;
  async function fetchFile(path) {
    const response = await fetch(new URL(path,root));
    if(!response.ok)throw new Error('ดาวน์โหลดไฟล์เว็บไซต์ไม่สำเร็จ: '+path);
    return response;
  }
  async function renderFrame(rows,meta) {
    let template = new DOMParser().parseFromString(await (await fetchFile(S.pages[meta.page][0])).text(), 'text/html');
    if (!template.getElementById(S.snapshotIds[meta.page])) {
      const previous = template.querySelector('link[rel="canonical"]')?.href || S.pageURL(rows, meta.page, 'en');
      template = new DOMParser().parseFromString(await (await fetchFile(new URL(previous).pathname.slice(1))).text(), 'text/html');
    }
    S.prepareDocument(template, rows, meta);
    for (const link of template.querySelectorAll('link[rel="stylesheet"]')) {
      const url = new URL(link.getAttribute('href'), template.querySelector('base').href);
      if (url.origin !== location.origin) {
        link.setAttribute('data-aclab-export-media', link.getAttribute('media') || '');
        link.media = 'not all';
      }
    }
    return new Promise((resolve,reject)=>{
      const token=crypto.randomUUID();
      const frame=document.createElement('iframe');
      frame.title='กำลังจัดเตรียมเว็บไซต์';
      frame.style.cssText='position:fixed;left:-16000px;top:0;width:1440px;height:1000px;visibility:hidden;pointer-events:none';
      const url=new URL(S.pages[meta.page][0],root);
      url.searchParams.set('aclab-preview',token);url.searchParams.set('lang',meta.lang);
      if(meta.root)url.searchParams.set('welcome','1');
      if(meta.page==='main'&&!meta.root)url.searchParams.set('view','main');
      if(meta.record)url.searchParams.set('post',meta.record);
      let settling;
      function cleanup(){clearTimeout(timeout);clearTimeout(settling);window.removeEventListener('message',receive);frame.remove();}
      function complete(){
        try{
          const copy=frame.contentDocument.cloneNode(true);
          S.prepareDocument(copy,rows,meta);
          const result='<!doctype html>\n'+copy.documentElement.outerHTML;
          cleanup();resolve(result);
        }catch(error){cleanup();reject(error);}
      }
      function receive(event){
        if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.token!==token)return;
        if(event.data.type==='aclab-preview-request')event.source.postMessage({type:'aclab-preview-data',token,rows},location.origin);
        if(event.data.type==='aclab-preview-rendered'){
          clearTimeout(settling);
          settling=setTimeout(complete,450);
        }
      }
      const timeout=setTimeout(()=>{cleanup();reject(new Error('สร้างหน้า '+meta.page+' ไม่สำเร็จ กรุณาลองอีกครั้ง'));},18000);
      const data=template.createElement('script');
      url.searchParams.delete('aclab-preview');
      data.id='aclab-export-data';data.textContent='window.ACLabSEOExport='+S.encoded({rows,url:url.href})+';';
      template.head.querySelector('base').after(data);
      const ready=template.createElement('script');ready.id='aclab-export-ready';
      ready.textContent='document.addEventListener("DOMContentLoaded",()=>Promise.resolve(window.ACLabEditor?.ready).then(()=>setTimeout(()=>parent.postMessage('+S.encoded({type:'aclab-preview-rendered',token})+','+S.encoded(location.origin)+'),100)),{once:true});';
      template.body.append(ready);
      window.addEventListener('message',receive);frame.srcdoc='<!doctype html>\n'+template.documentElement.outerHTML;document.body.append(frame);
    });
  }
  async function exportWebsite() {
    const[rows,manifest]=await Promise.all([read(true),fetchFile('manager/public-files.json').then(r=>r.json())]);
    for (const [page, [path]] of Object.entries(S.pages)) if (!rows[page]?.content) {
      let doc = new DOMParser().parseFromString(await (await fetchFile(path)).text(), 'text/html');
      if (!doc.getElementById(S.snapshotIds[page])) {
        const relative = new URL(S.pageURL(rows, page, 'en')).pathname.slice(1);
        doc = new DOMParser().parseFromString(await (await fetchFile(relative)).text(), 'text/html');
      }
      const content = doc.getElementById(S.snapshotIds[page]);
      const editor = doc.getElementById('aclab-editor-snapshot');
      if (!content || !editor) throw new Error('ไม่พบข้อมูลตั้งต้นของหน้า ' + page);
      rows[page] = { page_id: page, content: JSON.parse(content.textContent), editor: JSON.parse(editor.textContent) };
    }
    const issues=S.validate(rows);if(issues.length)throw new Error(issues[0]);
    const zip=new window.JSZip(),archive=zip.folder('The_AC_Lab_Public');
    const sourcePages=new Set(manifest.pages.map(page=>page.path));
    for(const path of manifest.files){
      if(sourcePages.has(path))continue;
      if(path==='.nojekyll'){archive.file(path,'');continue;}
      const response=await fetchFile(path);archive.file(path,await response.arrayBuffer());
    }
    const entries=S.entries(rows);
    for(const meta of entries){
      let html;
      if(meta.type==='person'){
        const doc=new DOMParser().parseFromString(S.profileHTML(rows,meta),'text/html');
        S.prepareDocument(doc,rows,meta);html='<!doctype html>\n'+doc.documentElement.outerHTML;
      }else html=await renderFrame(rows,meta);
      archive.file(decodeURIComponent(new URL(meta.canonical).pathname).slice(1)+'index.html',html);
    }
    for(const[page,[path]]of Object.entries(S.pages))if(page!=='main')archive.file(path,S.redirectHTML(rows,page));
    archive.file('sitemap.xml',S.sitemap(rows,entries));
    archive.file('robots.txt','User-agent: *\nAllow: /\nSitemap: https://theaclab.in.th/sitemap.xml\n');
    archive.file('CNAME','theaclab.in.th\n');
    archive.file('README_SEO_TH.txt','ไฟล์นี้มีเฉพาะเว็บสาธารณะจากข้อมูลที่เผยแพร่ ไม่รวม Manager หรือรหัสผ่าน\nอัปโหลดเนื้อหาในโฟลเดอร์นี้ทับเว็บสาธารณะ และคงโฟลเดอร์ manager เดิมไว้\nเมื่อเพิ่มบทความหรือเปลี่ยน slug ให้สร้างเว็บไซต์ใหม่ด้วย GitHub Actions หรือส่งออกอีกครั้ง\n');
    const file=await zip.generateAsync({type:'blob',compression:'DEFLATE'});
    const url=URL.createObjectURL(file),link=document.createElement('a');
    link.href=url;link.download='The_AC_Lab_SEO_Public.zip';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  window.ACLabExportWebsite=exportWebsite;
})();
