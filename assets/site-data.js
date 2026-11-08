(() => {
  'use strict';
  const root = new URL('../', document.currentScript.src);
  const config = window.ACLabSupabase;
  const pageIds = ['main', 'about', 'team', 'publication', 'blog', 'funding', 'awards', 'patents', 'contact'];
  const pageKey = path => path.replace(/^api\//, '') === 'site' ? 'main' : path.replace(/^api\//, '');
  const list = value => Array.isArray(value) ? value : [];
  const imageFields = new Set(['image', 'photo', 'cover', 'gallery', 'logo', 'favicon', 'appleTouchIcon', 'socialImage']);
  let pending;

  function imageSource(value) {
    const source = typeof value === 'string' ? value.trim() : '';
    if (!/^https?:\/\/(?:drive\.google\.com|drive\.usercontent\.google\.com)(?:\/|$)/i.test(source)) return source;
    const url = new URL(source);
    const path = url.pathname.replace(/^\/a\/[^/]+\//, '/');
    const file = /^\/file\/(?:u\/\d+\/)?d\/([\w-]+)(?:\/|$)/.exec(path);
    const id = file?.[1] || (/^\/(?:open|uc|thumbnail|download)\/?$/.test(path) ? url.searchParams.get('id') : '');
    if (!id || !/^[\w-]{8,200}$/.test(id)) return '';
    const image = new URL('https://drive.google.com/thumbnail');
    image.searchParams.set('id', id);
    image.searchParams.set('sz', url.searchParams.get('sz') || 'w1600');
    const resourceKey = url.searchParams.get('resourcekey');
    if (resourceKey) image.searchParams.set('resourcekey', resourceKey);
    return image.href;
  }

  function resolveImages(value, field = '') {
    if (Array.isArray(value)) return value.map(item => resolveImages(item, field));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
      .map(([key, item]) => [key, resolveImages(item, field === 'media' ? 'image' : key)]));
    return typeof value === 'string' && imageFields.has(field) ? imageSource(value) : value;
  }

  function previewRows() {
    if (!window.parent || window.parent === window) return null;
    const token = new URLSearchParams(location.search).get('aclab-preview');
    if (!token || !/^[a-f0-9-]{36}$/.test(token)) return null;
    const origin = location.origin;
    const send = type => window.parent.postMessage({ type, token }, origin);

    // The preview renders the site but keeps visitors inside the preview frame.
    document.addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    document.addEventListener('click', event => {
      const link = event.target.closest?.('a[href]');
      if (!link) return;
      const url = new URL(link.href, location.href);
      if (url.origin === origin && url.pathname === location.pathname && url.search === location.search && url.hash) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    return new Promise(resolve => {
      function receive(event) {
        if (event.origin !== origin || event.source !== window.parent ||
            event.data?.type !== 'aclab-preview-data' || event.data.token !== token ||
            !event.data.rows || typeof event.data.rows !== 'object') return;
        clearTimeout(timeout);
        window.removeEventListener('message', receive);
        resolve(resolveImages(event.data.rows));
        const rendered = () => setTimeout(() => send('aclab-preview-rendered'), 32);
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rendered, { once: true });
        else rendered();
      }
      const timeout = setTimeout(() => {
        window.removeEventListener('message', receive);
        resolve(null);
      }, 2400);
      window.addEventListener('message', receive);
      send('aclab-preview-request');
    });
  }

  const draftPreview = previewRows();

  async function read(fresh = false) {
    if (window.ACLabSEOExport?.rows) return resolveImages(window.ACLabSEOExport.rows);
    if (draftPreview) {
      const rows = await draftPreview;
      if (rows) return rows;
    }
    if (document.querySelector('#aclab-editor-snapshot[data-offline]') ||
        !['http:', 'https:'].includes(location.protocol) || !config?.url || !config?.key) {
      throw new Error('Using the embedded website snapshot');
    }
    if (fresh) pending = undefined;
    if (!pending) {
      const url = new URL('/rest/v1/aclab_cms_public_pages', config.url);
      url.search = new URLSearchParams({
        select: 'page_id,revision,content,editor',
        page_id: 'in.(' + pageIds.join(',') + ')',
      });
      const headers = { apikey: config.key, Accept: 'application/json' };
      if (config.key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + config.key;
      pending = fetch(url, { headers, cache: 'no-store', signal: AbortSignal.timeout(2500) })
        .then(async response => {
          if (!response.ok) throw new Error('Supabase website content is unavailable');
          return Object.fromEntries((await response.json()).map(row => [row.page_id, resolveImages(row)]));
        }).catch(error => { pending = undefined; throw error; });
    }
    return pending;
  }

  function profileNames(value) {
    return (typeof value === 'string' ? [value] : Object.values(value ?? {}))
      .filter(name => typeof name === 'string' && name.trim())
      .map(name => name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase());
  }

  function findMember(team, id, name) {
    const members = list(team?.members);
    if (id) return members.find(member => member.id === id);
    const names = profileNames(name);
    const matches = members.filter(member => profileNames(member.name).some(item => names.includes(item)));
    return matches.length === 1 ? matches[0] : undefined;
  }

  function portrait(team, member, prefix) {
    const source = team.media?.[member.photo] || member.photo || '';
    const photo = source && !/^(?:[a-z][\w+.-]*:|\/)/i.test(source) ? prefix + source : source;
    return { name: member.name, photo, photoPosition: member.photoPosition || 'center', photoZoom: member.photoZoom || 1 };
  }

  function year(value) {
    const number = Number(value);
    return Number.isInteger(number) ? number - (number >= 2400 ? 543 : 0) : 0;
  }

  function cover(post, media) {
    const source = media?.[post.cover] || post.cover;
    if (typeof source !== 'string' || !source) return 'botanical';
    if (/^https:\/\/|^data:image\//i.test(source)) return source;
    const target = new URL(source, new URL('blog/', root));
    return target.href.startsWith(root.href) ? target.href.slice(root.href.length) : 'botanical';
  }

  function updates(rows) {
    const announcements = [];
    const priority = (a, b) => Number(Boolean(a.sample)) - Number(Boolean(b.sample));
    const items = [
      ['funding', 'grants', 'fiscalYear', 'grant', 'project', 'laboratory'],
      ['awards', 'awards', 'year', 'title', 'description', 'discovery'],
    ];
    for (const [route, key, date, title, summary, image] of items) {
      const recent = list(rows[route]?.content?.[key]).filter(item => item[title] && year(item[date]) > 0)
        .sort((a, b) => priority(a, b) || year(b[date]) - year(a[date]))[0];
      if (recent) {
        const currentYear = year(recent[date]);
        announcements.push({
          route, params: {year: currentYear}, image, year: currentYear, sample: Boolean(recent.sample),
          title: recent[title], summary: recent[summary],
        });
      }
    }
    const blog = rows.blog?.content ?? {};
    const posts = list(blog.posts).filter(post => post.id && post.title && post.status === 'published')
      .sort((a, b) => priority(a, b) || String(b.date || '').localeCompare(String(a.date || '')));
    for (const post of posts.slice(0, 4)) announcements.push({
      route: 'blog', params: {post: post.id}, image: cover(post, blog.media), position: post.coverPosition,
      date: post.date, sample: Boolean(post.sample), title: post.title, summary: post.summary,
    });
    return announcements;
  }

  function materialize(rows, page) {
    const content = rows[page]?.content;
    if (!content) throw new Error('No published content for ' + page);
    const team = rows.team?.content;
    if (page === 'team' && window.ACLabSEO) return {
      ...content, members: list(content.members).map(member => {
        const seo = window.ACLabSEO.person(member);
        return { ...member, academicTitle: seo.verified ? seo.verifiedTitle : { th: '', en: '' },
          affiliation: seo.verified ? seo.verifiedAffiliation : { th: '', en: '' } };
      }),
    };
    if (page === 'main') return { ...content, contact: rows.contact?.content?.contact ?? content.contact, updates: updates(rows) };
    if (page === 'funding' && team) return {
      ...content,
      grants: list(content.grants).map(grant => {
        const leader = findMember(team, grant.leaderId, grant.leaderName);
        return leader ? { ...grant, leader: portrait(team, leader, '../../team/') } : grant;
      }),
    };
    if (page === 'awards' && team) return {
      ...content,
      awards: list(content.awards).map(award => ({
        ...award,
        recipients: list(award.recipients).map(person => {
          const member = findMember(team, person.memberId, person.name);
          if (!member) return person;
          const profile = portrait(team, member, '../../team/');
          const roles = { pi: 'faculty', collaboration: 'collaborator' };
          return { ...person, ...profile, photo: profile.photo || person.photo, role: person.role || roles[member.group] || member.group };
        }).filter(person => profileNames(person.name).length),
      })),
    };
    if (page === 'blog' && team) {
      const authors = { ...content.authors };
      for (const post of list(content.posts)) {
        if (!post.authorId || Object.hasOwn(authors, post.authorId)) continue;
        const member = findMember(team, post.authorId);
        if (member) Object.defineProperty(authors, post.authorId, { value: portrait(team, member, '../team/'), enumerable: true });
      }
      return { ...content, authors };
    }
    return content;
  }

  window.ACLabData = {
    root, config, pageIds, read, materialize, imageSource, isImageField: key => imageFields.has(key),
    load: async path => materialize(await read(), pageKey(path)),
    editor: async page => (await read())[page]?.editor,
  };
})();
