import fs from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await fs.readFile(resolve(root,'seo/build-manifest.json'),'utf8'));
const errors=[];const pages=new Map();
const allowedTypes=new Set(['Organization','ResearchOrganization','CollegeOrUniversity','ImageObject','WebSite','WebPage','AboutPage','ContactPage','ProfilePage','BreadcrumbList','ListItem','Person','Article','BlogPosting','ScholarlyArticle','ItemList']);
const titleMap=new Set(),descriptionMap=new Set();
for(const entry of manifest.entries){
 const path=resolve(root,'dist',decodeURIComponent(new URL(entry.canonical).pathname).slice(1),'index.html');
 const dom=new JSDOM(await fs.readFile(path,'utf8'),{url:entry.canonical});const d=dom.window.document;
 pages.set(entry.canonical,{entry,alternates:[...d.querySelectorAll('link[hreflang]')].map(link=>({href:link.href,hreflang:link.hreflang})),links:[...d.querySelectorAll('a[href]')].map(link=>link.href)});
 const label=entry.canonical;
 for(const [selector,attribute,expected]of [['link[rel="canonical"]','href',entry.canonical],['meta[name="description"]','content',entry.description],['meta[property="og:url"]','content',entry.canonical],['meta[property="og:title"]','content',entry.title],['meta[name="twitter:title"]','content',entry.title]]){
  if(d.querySelectorAll(selector).length!==1||d.querySelector(selector)?.getAttribute(attribute)!==expected)errors.push(label+' incorrect '+selector);
 }
 if(d.title!==entry.title||d.documentElement.lang!==entry.lang)errors.push(label+' title/language mismatch');
 const marker=d.querySelector('meta[name="robots"]')?.content||'';
 if(entry.indexable ? marker.includes('noindex') : !marker.includes('noindex'))errors.push(label+' robots mismatch');
 const visibleH1=[...d.querySelectorAll('h1')].filter(e=>!e.closest('[hidden]')&&!e.closest('[aria-hidden="true"]')&&e.textContent.trim());
 if(!visibleH1.length)errors.push(label+' missing substantive H1');
 if(!d.querySelector('main')||d.querySelector('main').textContent.replace(/\s/g,'').length<50)errors.push(label+' missing static content');
 if(!d.querySelector('.aclab-logo'))errors.push(label+' missing logo');
 for(const [name,seen,value]of [['title',titleMap,entry.title],['description',descriptionMap,entry.description]]){
  if(!entry.indexable)continue;const key=entry.lang+':'+value.toLowerCase();if(seen.has(key))errors.push(label+' duplicate '+name);seen.add(key);
 }
 const walk=value=>{if(!value||typeof value!=='object')return;const types=value['@type'];for(const type of Array.isArray(types)?types:types?[types]:[])if(!allowedTypes.has(type))errors.push(label+' unexpected schema type '+type);for(const item of Object.values(value))if(item&&typeof item==='object')Array.isArray(item)?item.forEach(walk):walk(item)};
 try{const data=JSON.parse(d.getElementById('aclab-structured-data').textContent);if(data['@context']!=='https://schema.org')throw Error('context');walk(data);if(entry.type==='person'&&!data['@graph'].some(n=>n['@type']==='Person'))throw Error('Person missing');if(entry.type==='article'&&entry.indexable&&!data['@graph'].some(n=>Array.isArray(n['@type'])&&n['@type'].includes('Article')))throw Error('Article missing');}catch(e){errors.push(label+' JSON-LD: '+e.message)}
 dom.window.close();
}
for(const[url,{alternates,links,entry}]of pages){
 for(const alternate of alternates){
  const target=pages.get(alternate.href);if(!target){errors.push(url+' missing alternate '+alternate.href);continue;}
  if(alternate.hreflang==='x-default')continue;
  if(target.entry.lang!==alternate.hreflang)errors.push(url+' hreflang mismatch');
  const back=target.alternates.some(link=>link.href===url || entry.root&&link.hreflang==='x-default'&&link.href===url);
  if(!back)errors.push(url+' nonreciprocal alternate '+alternate.href);
 }
 for(const href of links){
  const u=new URL(href);if(u.origin!=='https://theaclab.in.th'||!/^\/(th|en)\//.test(u.pathname))continue;
  u.hash='';u.search='';if(!pages.has(u.href))errors.push(url+' broken internal canonical link '+u.href);
 }
}
const xml=new JSDOM(await fs.readFile(resolve(root,'dist/sitemap.xml'),'utf8'),{contentType:'application/xml'});
const urls=[...xml.window.document.querySelectorAll('loc')].map(e=>e.textContent);
const expected=manifest.entries.filter(e=>e.indexable).map(e=>e.canonical);
if(new Set(urls).size!==urls.length||urls.length!==expected.length||expected.some(u=>!urls.includes(u)))errors.push('Sitemap does not match published indexable routes');
for(const url of urls)if(/manager|Researcher.?03|sample-editor/i.test(url))errors.push('Excluded content in sitemap '+url);
for(const path of ['manager/index.html','manager.html','team/manager.html']){const text=await fs.readFile(resolve(root,'dist',path),'utf8');if(!/name=["']robots["'][^>]*noindex/.test(text))errors.push(path+' missing noindex');}
xml.window.close();
if(errors.length){console.error([...new Set(errors)].join('\n'));process.exitCode=1;}else console.log('PASS: '+pages.size+' static pages, '+urls.length+' sitemap URLs; metadata, JSON-LD, reciprocal hreflang, internal links, logos and admin noindex.');
