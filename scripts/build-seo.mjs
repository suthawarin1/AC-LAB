import fs from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { prerender } from './prerender.mjs';
const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(sourceRoot, 'dist');
const offline = process.argv.includes('--offline') || process.env.ACLAB_SEO_OFFLINE === '1';
const context = { window: {}, URL }; vm.createContext(context);
vm.runInContext(await fs.readFile(resolve(sourceRoot, 'assets/seo-core.js'), 'utf8'), context);
vm.runInContext(await fs.readFile(resolve(sourceRoot, 'assets/seo-pages.js'), 'utf8'), context);
const S = context.window.ACLabSEO;
const manifest = JSON.parse(await fs.readFile(resolve(sourceRoot, 'manager/public-files.json'), 'utf8'));
const config = {window:{}};
vm.runInNewContext(await fs.readFile(resolve(sourceRoot, 'assets/supabase-config.js'), 'utf8'), config);
const names = { main: 'site-config', about: 'about-config', team: 'team-config', publication: 'publication-config', blog: 'blog-config', funding: 'funding-config', awards: 'awards-config', patents: 'patents-config', contact: 'contact-config' };
async function embeddedPage(page) {
  const dom = new JSDOM(await fs.readFile(resolve(sourceRoot, S.pages[page][0]), 'utf8'));
  const row = { page_id: page, content: JSON.parse(dom.window.document.getElementById(names[page]).textContent),
    editor: JSON.parse(dom.window.document.getElementById('aclab-editor-snapshot').textContent) };
  dom.window.close(); return row;
}
let rows;
const fallbackPages = [];
if (offline) {
  rows = {};
  for (const page of Object.keys(S.pages)) rows[page] = await embeddedPage(page);
  // These are explicitly labelled sample snapshots, not a successful production sync.
  console.log('OFFLINE: using embedded snapshots. Run the online build before production deployment.');
} else if (process.env.ACLAB_SEO_ROWS) {
  rows = JSON.parse(await fs.readFile(resolve(process.env.ACLAB_SEO_ROWS), 'utf8'));
} else {
  const {url,key} = config.window.ACLabSupabase;
  const request = new URL('/rest/v1/aclab_cms_public_pages',url);
  request.searchParams.set('select','page_id,revision,content,editor');
  const headers = {apikey:key,Accept:'application/json'};
  if(key.startsWith('eyJ')) headers.Authorization='Bearer '+key;
  const response = await fetch(request,{headers,signal:AbortSignal.timeout(20000)});
  if(!response.ok) throw new Error('Public CMS read failed (HTTP '+response.status+'). Existing deployment has not been replaced.');
  rows=Object.fromEntries((await response.json()).map(row=>[row.page_id,row]));
}
for (const page of Object.keys(S.pages)) if (!rows[page]?.content || !rows[page]?.editor) {
  if (rows[page]) throw new Error('Invalid public CMS content: ' + page);
  rows[page] = await embeddedPage(page); fallbackPages.push(page);
}
if (fallbackPages.length) console.log('Existing static pages used until first CMS publish: '+fallbackPages.join(', '));
const issues = S.validate(rows);
if(issues.length) throw new Error('SEO validation failed:\n'+issues.join('\n'));
await fs.rm(output,{recursive:true,force:true});
await fs.mkdir(output,{recursive:true});
const publicFiles = new Set([...manifest.files,'manager.html','CNAME','404.html']);
for(const path of publicFiles){
  const file=resolve(sourceRoot,path);
  if(!file.startsWith(sourceRoot+sep))throw new Error('Invalid public path');
  try{await fs.mkdir(dirname(resolve(output,path)),{recursive:true});await fs.copyFile(file,resolve(output,path));}
  catch(error){if(error.code!=='ENOENT')throw error;}
}
for(const folder of ['assets','manager','req-manager']) await fs.cp(resolve(sourceRoot,folder),resolve(output,folder),{recursive:true});
for(const path of ['team/manager.html']){await fs.mkdir(dirname(resolve(output,path)),{recursive:true});await fs.copyFile(resolve(sourceRoot,path),resolve(output,path));}
const entries=S.entries(rows);
for(const meta of entries){
  let dom;
  if(meta.type==='person') {
    dom=new JSDOM(S.profileHTML(rows,meta),{url:meta.canonical,runScripts:'outside-only'});
    dom.window.eval(await fs.readFile(resolve(sourceRoot,'assets/seo-core.js'),'utf8'));
    dom.window.__ACLAB_SSG=true;
    dom.window.eval(await fs.readFile(resolve(sourceRoot,'assets/seo.js'),'utf8'));
    dom.window.eval(await fs.readFile(resolve(sourceRoot,'assets/seo-pages.js'),'utf8'));
  } else ({dom}=await prerender(sourceRoot,S.pages[meta.page][0],rows,meta.lang,meta.record,meta.root));
  if(!dom.window.ACLabSEO.prepareDocument) dom.window.eval(await fs.readFile(resolve(sourceRoot,'assets/seo-pages.js'),'utf8'));
  dom.window.ACLabSEO.prepareDocument(dom.window.document,rows,meta);
  const pathname=decodeURIComponent(new URL(meta.canonical).pathname).slice(1);
  const target=resolve(output,pathname,'index.html');
  if(!target.startsWith(output+sep))throw new Error('Invalid canonical output');
  await fs.mkdir(dirname(target),{recursive:true});
  await fs.writeFile(target,dom.serialize());
  dom.window.close();
}
for(const [page,[path]] of Object.entries(S.pages)){
  if(page==='main')continue;
  await fs.writeFile(resolve(output,path),S.redirectHTML(rows,page));
}
await fs.writeFile(resolve(output,'sitemap.xml'),S.sitemap(rows,entries));
await fs.writeFile(resolve(output,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: https://theaclab.in.th/sitemap.xml\n');
await fs.writeFile(resolve(output,'.nojekyll'),'');
const report={mode:offline?'offline-snapshot':process.env.ACLAB_SEO_ROWS?'captured-public-supabase':'published-supabase',fallbackPages,entries:JSON.parse(JSON.stringify(entries)),profiles:S.people(rows).map(p=>({id:p.id,name:p.name,source:S.person(p).verificationSource})),articles:S.articles(rows).map(p=>p.id)};
await fs.mkdir(resolve(sourceRoot,'seo'),{recursive:true});
await fs.writeFile(resolve(sourceRoot,'seo/build-manifest.json'),JSON.stringify(report,null,2)+'\n');
console.log('Generated '+entries.length+' pages; '+report.profiles.length+' verified-name profiles; '+report.articles.length+' published, non-sample articles.');
