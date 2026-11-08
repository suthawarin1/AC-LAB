(() => {
  'use strict';
  const { root, config, imageSource, isImageField } = window.ACLabData;
  const auth = { storageKey: 'aclab-cms:' + root.pathname, detectSessionInUrl: false };
  const client = config?.url && config?.key && window.supabase?.createClient(config.url, config.key, { auth });
  const mediaPattern = /^aclab-media:([a-f0-9-]{36}\.(?:jpg|png|webp))$/;
  const dataImagePattern = /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/;
  const draftBucket = 'aclab-cms-drafts';
  const publicBucket = 'aclab-cms-public';
  const previewURLs = new Map();
  let user;
  let catalog;

  function fail(message, status = 400) {
    throw Object.assign(new Error(message), { status });
  }

  function result(response) {
    const { error, data } = response;
    if (!error) return data;
    if (error.code === 'PT409' || response.status === 409)
      fail('มีการแก้หน้านี้จากที่อื่นแล้ว กรุณาดาวน์โหลดฉบับร่างและโหลดข้อมูลล่าสุด', 409);
    if (error.code === '42501' || response.status === 403) fail('บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลเว็บไซต์', 403);
    if (response.status === 401) fail('กรุณาเข้าสู่ระบบ Manager อีกครั้ง', 401);
    if (/^(?:PGRST20[245]|42P01|42883)$/.test(error.code || ''))
      fail('กรุณารัน The_AC_Lab_Supabase.sql ในโปรเจกต์ Supabase ก่อน', 503);
    if (error.code === '23514') fail('ข้อมูลไม่ตรงกับโครงสร้าง หรือมีรายการฉบับร่างอยู่ในข้อมูลที่จะเผยแพร่');
    fail('เชื่อมต่อหรือบันทึกข้อมูลกับ Supabase ไม่สำเร็จ กรุณาลองอีกครั้ง', 503);
  }

  async function adminAccess() {
    return result(await client.rpc('aclab_cms_is_admin')) === true;
  }

  async function startSession(account) {
    if (!await adminAccess()) {
      user = undefined;
      await client.auth.signOut({ scope: 'local' });
      fail('บัญชีนี้ยังไม่มีสิทธิ์ผู้ดูแล กรุณาเพิ่มบัญชีใน cms_admin_users', 403);
    }
    user = account;
    return { configured: true, authenticated: true, email: account.email };
  }

  async function status() {
    if (!client) return { configured: false, authenticated: false };
    const { data, error } = await client.auth.getUser();
    if (error && error.name !== 'AuthSessionMissingError' && ![401, 403].includes(error.status))
      fail('ตรวจเซสชัน Supabase ไม่สำเร็จ กรุณาลองเข้าสู่ระบบอีกครั้ง', 503);
    if (!data?.user) return { configured: true, authenticated: false };
    return startSession(data.user);
  }

  async function getCatalog() {
    if (!catalog) {
      const response = await fetch(new URL('manager/catalog.json', root));
      if (!response.ok) fail('โหลดรายการหน้าที่แก้ไขได้ไม่สำเร็จ', 503);
      catalog = await response.json();
    }
    return catalog;
  }

  function seoDocument(page, document, previous) {
    const result = structuredClone(document);
    const SEO = window.ACLabSEO;
    const settings = result.settings;
    settings.seo = SEO.merge(SEO.merge(SEO.defaults(page.id), previous?.settings?.seo), settings.seo);
    if (page.id === 'main') settings.branding = SEO.merge(
      SEO.merge(SEO.brandingDefaults(), previous?.settings?.branding), settings.branding);
    const records = page.id === 'team' ? 'members' : page.id === 'blog' ? 'posts' : '';
    for (const record of records ? settings[records] : []) {
      const saved = previous?.settings?.[records]?.find(item => item.id === record.id);
      const defaults = page.id === 'team' ? SEO.personDefaults(record) : SEO.postDefaults(record);
      record.seo = SEO.merge(SEO.merge(defaults, saved?.seo), record.seo);
    }
    return result;
  }

  async function latest(page) {
    const value = result(await client.from('aclab_cms_versions')
      .select('revision,document').eq('page_id', page.id).order('revision', { ascending: false }).limit(1).maybeSingle());
    if (value) return { ...value, document: seoDocument(page, value.document) };
    if (!await adminAccess()) fail('บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลเว็บไซต์', 403);

    // Use the same defaults as the public page until an editor publishes revision one.
    const url = new URL('site.json', new URL(page.path, root));
    const response = await fetch(url);
    if (!response.ok) fail('โหลดข้อมูลตั้งต้นของหน้า ' + page.label.en + ' ไม่สำเร็จ', 503);
    const settings = await response.json();
    const defaults = fields => Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value]));
    return { revision: 0, document: seoDocument(page, { settings, copy: defaults(page.copy), static: defaults(page.static), blocks: [] }) };
  }

  function editorState(page, row) {
    return {
      id: page.id, version: row.revision, ...row.document,
      copyGroups: Object.fromEntries(Object.entries(page.copy).map(([key, value]) => [key, value.label])),
      staticFields: Object.fromEntries(Object.entries(page.static).map(([key, { value, ...field }]) => [key, field])),
    };
  }

  const kind = value => Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
  function sameFields(a, b) {
    return kind(b) === 'object' && Object.keys(a).length === Object.keys(b).length &&
      Object.keys(a).every(key => Object.hasOwn(b, key));
  }

  function difference(base, value) {
    if (kind(base) !== kind(value)) fail('ประเภทข้อมูลไม่ตรงกับข้อมูลของหน้าเว็บ');
    if (kind(base) === 'object') {
      if (!sameFields(base, value)) fail('โครงข้อความไม่ตรงกับข้อมูลของหน้าเว็บ');
      const entries = Object.keys(base).flatMap(key => {
        const edited = difference(base[key], value[key]);
        return edited === undefined ? [] : [[key, edited]];
      });
      return entries.length ? Object.fromEntries(entries) : undefined;
    }
    return JSON.stringify(base) === JSON.stringify(value) ? undefined : value;
  }

  const urlKeys = new Set(['url', 'path', 'href', 'pdf', 'sourceUrl', 'mapLink', 'mapEmbed', 'verificationSource']);
  function validateURL(value, image) {
    if (image) value = value.trim();
    if (!value || (image && (mediaPattern.test(value) || dataImagePattern.test(value)))) return;
    if (/[\u0000-\u0020\\]/.test(value) || value.startsWith('//')) fail('ลิงก์มีอักขระที่ใช้ไม่ได้');
    let url;
    try { url = new URL(value, root); }
    catch { fail('รูปแบบลิงก์ไม่ถูกต้อง'); }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) fail('กรุณาใช้ลิงก์ HTTP หรือ HTTPS');
    if (image && !imageSource(value)) fail('กรุณาวางลิงก์ของไฟล์ภาพจาก Google Drive');
  }

  function imageURL(value, base = root) {
    const source = previewURLs.get(value) || imageSource(value);
    if (!source || dataImagePattern.test(source)) return source;
    try {
      const url = new URL(source, base);
      if (!url.username && !url.password &&
          (url.protocol === 'https:' || (url.protocol === 'http:' && url.origin === root.origin))) return url.href;
    } catch {}
    return '';
  }

  function validateTree(value, key = '', inMedia = false, depth = 0, maxDepth = 16) {
    if (depth > maxDepth) fail('ข้อมูลซ้อนกันลึกเกินกำหนด');
    if (Array.isArray(value)) {
      if (value.length > 2000) fail('จำนวนรายการเกินกำหนด');
      for (const item of value) validateTree(item, key, inMedia, depth + 1, maxDepth);
    } else if (kind(value) === 'object') {
      for (const [name, item] of Object.entries(value)) {
        if (['__proto__', 'constructor', 'prototype'].includes(name)) fail('รหัสช่องข้อมูลไม่ถูกต้อง');
        validateTree(item, name, key === 'media', depth + 1, name === 'richBody' ? 64 : maxDepth);
      }
    } else if (typeof value === 'string') {
      if (value.includes('\0')) fail('พบอักขระที่ใช้ไม่ได้');
      const image = inMedia || isImageField(key);
      if (image || urlKeys.has(key)) validateURL(value, image);
    }
  }

  function checkRecords(page, settings) {
    const groups = {
      main: ['news'], about: ['stages'], team: ['members'], publication: ['topics', 'papers'],
      blog: ['categories', 'tags', 'posts'], funding: ['grants'], awards: ['awards'], patents: ['records'],
    };
    for (const key of groups[page.id] || []) {
      const ids = settings[key].map(record => record?.id);
      if (ids.some(id => typeof id !== 'string' || !/^[\w-]{1,80}$/.test(id)) || new Set(ids).size !== ids.length)
        fail('กรุณาใช้รหัสรายการที่ไม่ซ้ำกัน');
    }
    if (page.id === 'main' && (!settings.heroSlides.length || !settings.introSlides.length ||
        settings.slideInterval < 3000 || settings.slideInterval > 120000))
      fail('กรุณาใส่ภาพเปิดเว็บและกำหนดเวลาสไลด์ 3000–120000 มิลลิวินาที');
    if (page.id === 'about') {
      if (!settings.stages.length) fail('กรุณาเพิ่มช่วงการวิจัยอย่างน้อยหนึ่งช่วง');
      for (const stage of settings.stages) {
        const nodes = new Set(stage.nodes.map(node => node.id));
        if (!nodes.size || nodes.size !== stage.nodes.length || stage.edges.some(edge => !nodes.has(edge.from) || !nodes.has(edge.to)))
          fail('กรุณาตรวจจุดและเส้นเชื่อมของเครือข่ายวิธีวิจัย');
      }
    }
    if (page.id === 'team') {
      if (settings.members.length > 200) fail('รองรับสมาชิกไม่เกิน 200 คน');
      for (const [order, member] of settings.members.entries()) {
        if (!member.name?.en?.trim() && !member.name?.th?.trim()) fail('กรุณากรอกชื่อสมาชิกอย่างน้อยหนึ่งภาษา');
        if (!['pi', 'collaboration', 'researcher', 'student'].includes(member.group))
          fail('กรุณาเลือกกลุ่มสมาชิก');
        member.order = order;
      }
      if (settings.hero.mode === 'image' && !settings.hero.image) fail('กรุณาเลือกภาพรวมทีม');
    }
    if (page.id === 'blog' && settings.posts.some(post => !['draft', 'published'].includes(post.status)))
      fail('กรุณาเลือกสถานะบทความ');
  }

  function articleImages(value) {
    if (!value || typeof value !== 'object') return [];
    return Object.entries(value).flatMap(([key, item]) =>
      key === 'image' && typeof item === 'string' ? [item] : articleImages(item));
  }

  function publicContent(page, settings) {
    if (page === 'team') {
      const members = settings.members.filter(member => member.visible !== false)
        .map(({ sourceUrl, ...member }) => member);
      const used = new Set(['researchScene', 'studentScene', settings.hero.image, ...members.map(member => member.photo)]);
      return { ...settings, members, media: Object.fromEntries(Object.entries(settings.media).filter(([key]) => used.has(key))) };
    }
    if (page === 'blog') {
      const posts = settings.posts.filter(post => post.status === 'published');
      const credited = new Set(posts.map(post => post.authorId));
      const authors = Object.fromEntries(Object.entries(settings.authors).filter(([key]) => credited.has(key))
        .map(([key, { name, photo, photoPosition, photoZoom }]) => [key, { name, photo, photoPosition, photoZoom }]));
      const used = new Set([settings.hero.image, ...posts.map(post => post.cover),
        ...posts.flatMap(post => articleImages(post.richBody)), ...Object.values(authors).map(author => author.photo)]);
      return { ...settings, posts, authors, media: Object.fromEntries(Object.entries(settings.media).filter(([key]) => used.has(key))) };
    }
    return settings;
  }

  function references(value) {
    if (typeof value === 'string') return mediaPattern.test(value) ? [value] : [];
    return value && typeof value === 'object' ? Object.values(value).flatMap(references) : [];
  }

  async function signedPreviews(value) {
    const paths = [...new Set(references(value))].filter(ref => !previewURLs.has(ref));
    if (!paths.length) return;
    const { data, error } = await client.storage.from(draftBucket).createSignedUrls(
      paths.map(ref => mediaPattern.exec(ref)[1]), 3600);
    if (error) return;
    for (const item of data || []) if (item.signedUrl) previewURLs.set('aclab-media:' + item.path, item.signedUrl);
  }

  function replaceMedia(value, urls) {
    if (typeof value === 'string') return urls.get(value) || value;
    if (Array.isArray(value)) return value.map(item => replaceMedia(item, urls));
    if (value && typeof value === 'object')
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceMedia(item, urls)]));
    return value;
  }

  async function publishMedia(value) {
    const published = new Map();
    for (const ref of new Set(references(value))) {
      const path = mediaPattern.exec(ref)[1];
      const { error } = await client.storage.from(draftBucket).copy(path, path, { destinationBucket: publicBucket });
      if (error && ![409, '409'].includes(error.statusCode) && error.error !== 'Duplicate')
        fail('เผยแพร่ภาพไม่สำเร็จ กรุณาตรวจพื้นที่ Storage แล้วลองอีกครั้ง', 503);
      published.set(ref, client.storage.from(publicBucket).getPublicUrl(path).data.publicUrl);
    }
    return replaceMedia(value, published);
  }

  function publicationFor(page, { settings, copy, static: fields, blocks }) {
    const changes = (base, value) => difference(Object.fromEntries(Object.entries(base)
      .map(([key, definition]) => [key, definition.value])), value) || {};
    return {
      content: publicContent(page.id, settings),
      editor: {
        copy: changes(page.copy, copy), static: changes(page.static, fields),
        blocks: blocks.filter(block => block.visible),
        anchors: Object.fromEntries(Object.entries(page.anchors).map(([key, anchor]) => [key, anchor.selector])),
      },
    };
  }

  async function previewPage(pageId, payload, reveal) {
    if (!user) fail('กรุณาเข้าสู่ระบบ Manager', 401);
    const page = (await getCatalog()).find(item => item.id === pageId);
    if (!page) fail('ไม่พบหน้าเว็บ', 404);
    const { settings, copy, static: fields, blocks } = seoDocument(page, payload);
    const draft = { settings, copy, static: fields, blocks };
    validateTree(draft);
    if (reveal) {
      const rows = reveal.group === 'blocks' ? blocks : settings[reveal.group];
      const item = Array.isArray(rows) ? rows.find(row => row.id === reveal.id) : null;
      if (item && (reveal.group === 'blocks' || (pageId === 'team' && reveal.group === 'members')))
        item.visible = true;
      if (item && pageId === 'blog' && reveal.group === 'posts') item.status = 'published';
    }
    const publication = publicationFor(page, draft);
    await signedPreviews(publication);
    return replaceMedia(publication, previewURLs);
  }

  async function savePage(page, row, payload) {
    if (payload.version !== row.revision) fail('มีการแก้หน้านี้จากที่อื่นแล้ว กรุณาดาวน์โหลดฉบับร่างและโหลดข้อมูลล่าสุด', 409);
    const { settings, copy, static: fields, blocks } = seoDocument(page, payload, row.document);
    if (!sameFields(row.document.settings, settings) ||
        Object.keys(settings).some(key => kind(settings[key]) !== kind(row.document.settings[key])))
      fail('โครงข้อมูลของหน้าเว็บไม่ตรงกับข้อมูลเดิม');
    if (!Array.isArray(blocks) || blocks.length > 50) fail('เพิ่มเซกชันได้ไม่เกิน 50 รายการ');
    for (const block of blocks) {
      if (!block || !/^[\w-]{1,80}$/.test(block.id) || (block.after !== 'end' && !Object.hasOwn(page.anchors, block.after)) ||
          typeof block.visible !== 'boolean' || (block.visible && !block.title?.th?.trim() && !block.title?.en?.trim()))
        fail('กรุณาตรวจหัวข้อและตำแหน่งของเซกชัน');
    }
    if (new Set(blocks.map(block => block.id)).size !== blocks.length) fail('รหัสเซกชันต้องไม่ซ้ำกัน');
    const document = { settings, copy, static: fields, blocks };
    if (page.id === 'main') {
      if (typeof settings.branding.logoSvg !== 'string') fail('กรุณาตรวจโค้ด SVG ของโลโก้');
      if (settings.branding.logoSvg.trim()) {
        if (!window.ACLabSVGLogo) fail('โหลดเครื่องมือ SVG ไม่สำเร็จ กรุณาโหลดหน้า Manager อีกครั้ง', 503);
        settings.branding.logoSvg = window.ACLabSVGLogo.sanitize(settings.branding.logoSvg);
      }
      for (const key of ['logo', 'favicon', 'appleTouchIcon', 'socialImage']) {
        if (typeof settings.branding[key] !== 'string') fail('กรุณาตรวจลิงก์โลโก้และไอคอน');
        validateURL(settings.branding[key], true);
      }
      if (['appleTouchIcon', 'socialImage'].some(key => /\.svg(?:$|[?#])/i.test(settings.branding[key])))
        fail('ไอคอนมือถือและภาพแชร์ต้องเป็น PNG, JPEG หรือ WebP กรุณาใช้ปุ่มอัปโหลด SVG เพื่อสร้างภาพให้');
    }
    validateTree(document);
    checkRecords(page, settings);
    if (page.id === 'team') settings.revision = row.revision + 1;
    const projection = publicationFor(page, document);
    let publicRows;
    try { publicRows = await window.ACLabData.read(true); }
    catch { fail('โหลดข้อมูลสำหรับตรวจ SEO ไม่สำเร็จ กรุณาลองบันทึกอีกครั้ง', 503); }
    const issues = window.ACLabSEO.validate({
      ...publicRows, [page.id]: { ...publicRows[page.id], content: projection.content },
    });
    if (issues.length) fail(issues[0]);
    const publication = await publishMedia(projection);
    const revision = result(await client.rpc('aclab_cms_save_page', {
      p_page_id: page.id, p_expected_revision: row.revision, p_document: document,
      p_public_content: publication.content, p_public_editor: publication.editor,
    }));
    return editorState(page, { revision, document });
  }

  async function upload(image) {
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(image || '');
    if (!match || match[2].length > 6000000) fail('ใช้ภาพ JPEG, PNG หรือ WebP ขนาดไม่เกิน 4.5 MB');
    const bytes = Uint8Array.from(atob(match[2]), char => char.charCodeAt(0));
    const path = crypto.randomUUID() + '.' + (match[1] === 'jpeg' ? 'jpg' : match[1]);
    const { error } = await client.storage.from(draftBucket).upload(path, bytes, { contentType: 'image/' + match[1] });
    if (error) fail('อัปโหลดภาพไม่สำเร็จ กรุณาตรวจสิทธิ์ Storage', 503);
    const url = 'aclab-media:' + path;
    previewURLs.set(url, image);
    return { url };
  }

  async function request(action, body) {
    if (action === 'status') return status();
    if (!client) fail('กรุณาตั้งค่า Supabase ใน assets/supabase-config.js', 503);
    if (action === 'login') {
      const { data, error } = await client.auth.signInWithPassword(body);
      if (error || !data.user) fail('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจอีเมลและรหัสผ่าน Supabase', 401);
      return startSession(data.user);
    }
    if (action === 'logout') {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) fail('ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง', 503);
      user = undefined;
      previewURLs.clear();
      return { authenticated: false };
    }
    if (!user) fail('กรุณาเข้าสู่ระบบ Manager', 401);
    const pages = await getCatalog();
    if (action === 'site/catalog') return { pages: pages.map(({ copy, static: fields, ...page }) => page) };
    if (action === 'upload') return upload(body.image);
    const teamAction = ['content', 'save'].includes(action);
    const page = pages.find(page => page.id === (teamAction ? 'team' : action.replace(/^site\/page\//, '')));
    if (!page) fail('ไม่พบหน้าเว็บ', 404);
    const row = await latest(page);
    if (teamAction) {
      if (action === 'content') {
        await signedPreviews(row.document.settings);
        return { ...row.document.settings, revision: row.revision };
      }
      const saved = await savePage(page, row, {
        ...row.document, settings: body.content, version: body.expectedRevision,
      });
      return { saved: true, content: saved.settings, revision: saved.version };
    }
    if (body) return savePage(page, row, body);
    await signedPreviews(row.document);
    return editorState(page, row);
  }

  window.ACLabManager = { request, previewPage, imageURL };
})();
