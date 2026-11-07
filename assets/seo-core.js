(() => {
  'use strict';
  const origin = 'https://theaclab.in.th';
  const languages = ['th', 'en'];
  const pages = {
    main: ['index.html', '', 'The AC Lab', 'The AC Lab'],
    about: ['about/index.html', 'about', 'เกี่ยวกับแล็บ', 'About the lab'],
    team: ['team/index.html', 'team', 'ทีมวิจัย', 'Research team'],
    publication: ['publication/index.html', 'publications', 'ผลงานตีพิมพ์', 'Publications'],
    blog: ['blog/index.html', 'lab-blog', 'บทความจากแล็บ', 'Lab Blog'],
    funding: ['reward/funding/index.html', 'research-funding', 'ทุนและโครงการวิจัย', 'Research funding and projects'],
    awards: ['reward/awards/index.html', 'awards', 'รางวัลและความสำเร็จ', 'Awards and recognition'],
    patents: ['reward/patents/index.html', 'patents', 'สิทธิบัตรและอนุสิทธิบัตร', 'Patents and petty patents'],
    contact: ['contact/index.html', 'contact', 'ติดต่อและการเดินทาง', 'Contact and directions'],
  };
  const descriptions = {
    main: ['The AC Lab (TheACLab) ห้องปฏิบัติการวิจัย มหาวิทยาลัยขอนแก่น ศึกษาจีโนมพืช พฤกษเคมี และงานวิจัยชีวการแพทย์',
      'The AC Lab (TheACLab) at Khon Kaen University. Explore our research in plant genomics, phytochemistry and biomedical science.'],
    about: ['รู้จัก The AC Lab มหาวิทยาลัยขอนแก่น แนวทางวิจัยจีโนมพืช สารจากธรรมชาติ และเครือข่ายวิธีวิจัยของห้องปฏิบัติการ',
      'Discover The AC Lab at Khon Kaen University, its research areas and the method network connecting plant genomics, natural products and bioactivity.'],
    team: ['รู้จักบุคลากร หัวหน้าห้องปฏิบัติการ ผู้ร่วมวิจัย นักวิจัย และนักศึกษาของ The AC Lab พร้อมความเชี่ยวชาญและช่องทางติดต่อ',
      'Meet the principal investigators, collaborators, researchers and students of The AC Lab, with research interests and contact information.'],
    publication: ['ผลงานตีพิมพ์ของ The AC Lab ค้นหาตามปีและหัวข้องานวิจัย พร้อมรายชื่อผู้เขียน วารสาร DOI และลิงก์ต้นฉบับ',
      'Browse publications from The AC Lab by year and research topic, with authors, journal details, DOI identifiers and original sources.'],
    blog: ['อ่านบทความจากสมาชิก The AC Lab เกี่ยวกับงานวิจัย วิธีทดลอง และประสบการณ์ในห้องปฏิบัติการ เลือกอ่านตามหมวดหมู่และแท็ก',
      'Read articles from The AC Lab about research, methods and laboratory experience. Explore stories by category, topic and author.'],
    funding: ['สำรวจทุนและโครงการวิจัยของ The AC Lab พร้อมชื่อโครงการ ปีงบประมาณ แหล่งทุน และหัวหน้าโครงการ',
      'Explore research funding and projects at The AC Lab, with project titles, fiscal years, funding sources and project leaders.'],
    awards: ['รางวัลและความสำเร็จของสมาชิก The AC Lab พร้อมผู้ได้รับรางวัล ปีที่ได้รับ และรายละเอียดจากห้องปฏิบัติการ',
      'Explore awards and recognition received by members of The AC Lab, including recipients, years and supporting details.'],
    patents: ['ผลงานสิทธิบัตรและอนุสิทธิบัตรของ The AC Lab พร้อมประเภท เลขที่เอกสาร และรายละเอียดผลงาน',
      'Browse patents and petty patents from The AC Lab, with document types, registration details and descriptions of the work.'],
    contact: ['ติดต่อ The AC Lab คณะวิทยาศาสตร์ มหาวิทยาลัยขอนแก่น ดูอีเมล ที่ตั้งห้องปฏิบัติการ และเส้นทางการเดินทาง',
      'Contact The AC Lab, Faculty of Science, Khon Kaen University. Find the laboratory email, location and directions.'],
  };
  const verified = {
    arunrat: { name: ['อรุณรัตน์ ฉวีราช', 'Arunrat Chaveerach'],
      title: ['ศาสตราจารย์', 'Professor'],
      affiliation: ['สาขาวิชาชีววิทยา คณะวิทยาศาสตร์ มหาวิทยาลัยขอนแก่น',
        'Department of Biology, Faculty of Science, Khon Kaen University'],
      source: 'https://bio.kku.net/showteacher.php?id=arunrat' },
    runglawan: { name: ['รุ่งลาวัลย์ สุดมูล', 'Runglawan Sudmoon'],
      source: 'https://pubmed.ncbi.nlm.nih.gov/35956463/' },
    tawatchai: { name: ['ธวัดชัย ธานี', 'Tawatchai Tanee'],
      source: 'https://pubmed.ncbi.nlm.nih.gov/35956463/' },
    yannick: { name: ['', 'Yannick D. Benoit'], source: 'https://www.uottawa.ca/faculty-medicine/directory/dr-yannick-benoit' },
    'shiou-yih': { name: ['', 'Shiou Yih Lee'], source: 'https://leeshiouyih.owlstown.net/' },
    nisachon: { name: ['นิศาชล แจ้งพรมมา', 'Nisachon Jangpromma'],
      source: 'https://pubmed.ncbi.nlm.nih.gov/38467647/' },
    sakda: { name: ['ศักดา ดาดวง', 'Sakda Daduang'],
      source: 'https://pubmed.ncbi.nlm.nih.gov/40553907/' },
  };
  const pair = (th = '', en = '') => ({ th, en });
  const clean = value => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const local = (value, lang) => clean(typeof value === 'string' ? value : value?.[lang] || value?.en || value?.th);
  const explicit = (value, lang) => clean(typeof value === 'string' ? value : value?.[lang]);
  const list = value => Array.isArray(value) ? value : [];
  const normalized = value => clean(value).normalize('NFKC').toLowerCase().replace(/[.,]/g, '');
  const slug = value => clean(value).normalize('NFKC').toLowerCase().replace(/[^a-z0-9\u0e00-\u0e7f-]+/g, '-')
    .replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
  const absolute = value => new URL(value || '/', origin).href;
  const encoded = value => JSON.stringify(value).replaceAll('<', '\\u003c');
  const date = value => /^\d{4}-\d{2}-\d{2}(?:T[\d:.]+(?:Z|[+-]\d{2}:\d{2}))?$/.test(value || '') && !Number.isNaN(Date.parse(value)) ? value : undefined;

  function defaults(page) {
    const entry = pages[page];
    const seo = {
      title: pair(page === 'main' ? 'The AC Lab (TheACLab) | มหาวิทยาลัยขอนแก่น' : entry[2] + ' | The AC Lab',
        page === 'main' ? 'The AC Lab (TheACLab) | Khon Kaen University' : entry[3] + ' | The AC Lab'),
      description: pair(...descriptions[page]), slug: entry[1], canonical: pair(), indexable: true,
    };
    if (page === 'main') Object.assign(seo, { brandName: 'The AC Lab', alternateNames: ['TheACLab'], searchConsoleToken: '' });
    return seo;
  }

  function personDefaults(member) {
    const source = verified[member.id];
    const matches = source && normalized(member.name?.en) === normalized(source.name[1]);
    return {
      slug: slug(member.name?.en) || slug(member.id), canonical: pair(), indexable: Boolean(matches),
      verified: Boolean(matches), alternateNames: [],
      verifiedTitle: matches && source.title ? pair(...source.title) : pair(),
      verifiedAffiliation: matches && source.affiliation ? pair(...source.affiliation) : pair(),
      verificationSource: matches ? source.source : '',
      title: pair(), description: pair(),
    };
  }

  function postDefaults(post) {
    return { slug: slug(post.title?.en) || slug(post.id), canonical: pair(), indexable: !post.sample,
      title: pair(), description: pair() };
  }

  function merge(defaultValue, value) {
    if (!defaultValue || typeof defaultValue !== 'object' || Array.isArray(defaultValue))
      return value === undefined ? defaultValue : value;
    return { ...defaultValue, ...value, ...Object.fromEntries(Object.entries(defaultValue)
      .filter(([, item]) => item && typeof item === 'object' && !Array.isArray(item))
      .map(([key, item]) => [key, merge(item, value?.[key])])) };
  }

  function settings(page, content) { return merge(defaults(page), content?.seo); }
  function person(member) { return merge(personDefaults(member), member.seo); }
  function postSEO(post) { return merge(postDefaults(post), post.seo); }
  function content(rows, page) { return rows[page]?.content || {}; }
  function brand(rows) { return clean(settings('main', content(rows, 'main')).brandName) || 'The AC Lab'; }
  function personReady(member) {
    const seo = person(member);
    const name = local(member.name, 'en');
    return member.visible !== false && seo.verified === true && name.split(/\s+/).length >= 2 &&
      name !== 'Researcher 03' && /^https:\/\//.test(seo.verificationSource || '');
  }

  function canonical(raw, lang) {
    if (!raw) return '';
    let url;
    try { url = new URL(raw, origin); } catch { throw new Error('Canonical URL ไม่ถูกต้อง'); }
    if (url.origin !== origin || url.search || url.hash || url.username || url.password ||
        !url.pathname.startsWith('/' + lang + '/') || !url.pathname.endsWith('/') ||
        /[\\\u0000-\u0020]/.test(raw)) throw new Error('Canonical ต้องเป็น URL ภาษาเดียวกันบน theaclab.in.th และลงท้ายด้วย /');
    return url.href;
  }

  function pageURL(rows, page, lang) {
    const seo = settings(page, content(rows, page));
    const custom = canonical(seo.canonical?.[lang], lang);
    return custom || absolute('/' + lang + '/' + (slug(seo.slug) ? encodeURIComponent(slug(seo.slug)) + '/' : ''));
  }

  function personURL(rows, member, lang) {
    const seo = person(member);
    return canonical(seo.canonical?.[lang], lang) || absolute('/' + lang + '/people/' + encodeURIComponent(slug(seo.slug) || slug(member.id)) + '/');
  }

  function postURL(rows, post, lang) {
    const seo = postSEO(post);
    return canonical(seo.canonical?.[lang], lang) || new URL(encodeURIComponent(slug(seo.slug) || slug(post.id)) + '/', pageURL(rows, 'blog', lang)).href;
  }

  function translated(post, lang) {
    if (!explicit(post.title, lang)) return false;
    const hasBody = node => Boolean(node && (clean(node.text) || node.type === 'image' && node.attrs?.image || list(node.content).some(hasBody)));
    if (hasBody(post.richBody?.[lang])) return true;
    return list(post.sections).some(section => explicit(section.heading, lang) ||
      list(section.paragraphs).some(paragraph => explicit(paragraph, lang)));
  }

  function people(rows) { return list(content(rows, 'team').members).filter(personReady); }
  function articles(rows) { return list(content(rows, 'blog').posts).filter(post => post.status === 'published' && !post.sample); }
  function papersFor(rows, member) {
    const names = new Set([member.name?.en, member.name?.th, ...list(person(member).alternateNames)].map(normalized).filter(Boolean));
    return list(content(rows, 'publication').papers).filter(paper => list(paper.authors)
      .some(author => names.has(normalized(typeof author === 'string' ? author : author.name))));
  }

  function descriptor(rows, page, lang, record, root = false) {
    const name = brand(rows);
    const seo = settings(page, content(rows, page));
    let title = explicit(seo.title, lang);
    let description = explicit(seo.description, lang);
    let url = pageURL(rows, page, lang);
    let indexable = seo.indexable !== false;
    let image = absolute('/assets/aclab-logo-512.png');
    let available = languages;
    let type = 'page';
    if (record && page === 'team') {
      const member = list(content(rows, 'team').members).find(item => item.id === record);
      if (!member || !personReady(member)) return null;
      const profile = person(member);
      title = explicit(profile.title, lang) || local(member.name, lang) + ' | ' + name;
      const expertise = local(member.expertise, lang);
      description = explicit(profile.description, lang) ||
        (lang === 'th' ? 'ข้อมูลและผลงานวิจัยของ ' : 'Profile and research publications of ') +
        local(member.name, lang) + ' · ' + name + (expertise ? ' · ' + expertise : '');
      url = personURL(rows, member, lang);
      indexable = profile.indexable !== false;
      available = languages.filter(code => explicit(member.name, code));
      type = 'person';
      image = resolveImage(member.photo, content(rows, 'team').media, 'team/') || image;
    }
    if (record && page === 'blog') {
      const post = list(content(rows, 'blog').posts).find(item => item.id === record && item.status === 'published');
      if (!post) return null;
      const options = postSEO(post);
      title = explicit(options.title, lang) || local(post.title, lang) + ' | ' + name;
      description = explicit(options.description, lang) || local(post.summary, lang);
      url = postURL(rows, post, lang);
      indexable = indexable && options.indexable !== false && !post.sample && translated(post, lang);
      available = languages.filter(code => translated(post, code));
      type = 'article';
      image = resolveImage(post.cover, content(rows, 'blog').media, 'blog/') || image;
    }
    if (root) {
      url = origin + '/';
      title = 'Welcome to ' + name + ' | Khon Kaen University';
      description = 'Choose Thai or English to explore The AC Lab at Khon Kaen University.';
    }
    return { page, lang, record: record || '', type, root, title: clean(title), description: clean(description),
      canonical: url, indexable, image, languages: available };
  }

  function resolveImage(value, media, sourcePath) {
    const source = media?.[value] || value;
    if (!source || typeof source !== 'string' || source.startsWith('aclab-media:')) return '';
    try {
      const raw = window.ACLabData?.imageSource ? window.ACLabData.imageSource(source) : source;
      const url = new URL(raw, origin + '/' + sourcePath);
      return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
    } catch { return ''; }
  }

  function entries(rows) {
    const result = [];
    for (const page of Object.keys(pages)) for (const lang of languages) result.push(descriptor(rows, page, lang));
    for (const member of people(rows)) for (const lang of languages) {
      if (explicit(member.name, lang)) result.push(descriptor(rows, 'team', lang, member.id));
    }
    for (const post of articles(rows)) for (const lang of languages) {
      if (translated(post, lang)) result.push(descriptor(rows, 'blog', lang, post.id));
    }
    result.push(descriptor(rows, 'main', 'en', '', true));
    return result.filter(Boolean);
  }

  function validate(rows) {
    const seen = new Map();
    const titles = new Map();
    const descriptions = new Map();
    const issues = [];
    for (const page of Object.keys(pages)) {
      const seo = settings(page, content(rows, page));
      if ((page !== 'main' && !slug(seo.slug)) || clean(seo.slug) !== slug(seo.slug))
        issues.push(pages[page][3] + ' มี Slug ไม่ถูกต้อง');
    }
    for (const item of [...people(rows), ...articles(rows)]) {
      const value = item.name ? person(item) : postSEO(item);
      if (!slug(value.slug) || clean(value.slug) !== slug(value.slug)) issues.push(item.id + ' มี Slug ไม่ถูกต้อง');
    }
    for (const entry of entries(rows)) {
      const identity = entry.page + (entry.record ? '/' + entry.record : '') + ' (' + entry.lang + ')';
      if (seen.has(entry.canonical)) issues.push(identity + ' ใช้ Canonical ซ้ำกับ ' + seen.get(entry.canonical));
      seen.set(entry.canonical, identity);
      if (!entry.indexable) continue;
      if (!entry.title || !entry.description) issues.push(identity + ' ขาด Title หรือ Description');
      if (entry.title.length > 240 || entry.description.length > 600) issues.push(identity + ' มี Metadata ยาวเกินกำหนด');
      for (const [field, map] of [['title', titles], ['description', descriptions]]) {
        const key = entry.lang + ':' + normalized(entry[field]);
        if (map.has(key)) issues.push(identity + ' มี ' + field + ' ซ้ำกับ ' + map.get(key));
        map.set(key, identity);
      }
    }
    return issues;
  }

  function graph(rows, meta) {
    const lab = origin + '/#lab';
    const website = origin + '/#website';
    const main = content(rows, 'main');
    const options = settings('main', main);
    const organization = { '@type': ['Organization', 'ResearchOrganization'], '@id': lab,
      name: brand(rows), alternateName: list(options.alternateNames).map(clean).filter(Boolean), url: origin + '/',
      logo: { '@type': 'ImageObject', url: absolute('/assets/aclab-logo-512.png'), width: 512, height: 512 },
      parentOrganization: { '@type': 'CollegeOrUniversity', name: 'Khon Kaen University', url: 'https://www.kku.ac.th/' } };
    const contact = content(rows, 'contact').contact;
    if (contact?.email) organization.email = clean(contact.email);
    const research = list(content(rows, 'about').researchAreas).map(area => local(area.title, 'en')).filter(Boolean);
    if (research.length) organization.knowsAbout = research;
    const nodes = [organization, { '@type': 'WebSite', '@id': website, name: brand(rows), alternateName: organization.alternateName,
      url: origin + '/', publisher: { '@id': lab }, inLanguage: languages }];
    const webpage = { '@type': meta.type === 'person' ? 'ProfilePage' : meta.page === 'about' ? 'AboutPage' : meta.page === 'contact' ? 'ContactPage' : 'WebPage',
      '@id': meta.canonical + '#webpage', url: meta.canonical, name: meta.title, description: meta.description,
      inLanguage: meta.lang, isPartOf: { '@id': website }, about: { '@id': lab } };
    const crumbs = [{ '@type': 'ListItem', position: 1, name: brand(rows), item: pageURL(rows, 'main', meta.lang) }];
    if (meta.page !== 'main') crumbs.push({ '@type': 'ListItem', position: 2,
      name: pages[meta.page][meta.lang === 'th' ? 2 : 3], item: pageURL(rows, meta.page, meta.lang) });
    if (meta.type === 'person') {
      const member = people(rows).find(person => person.id === meta.record);
      const seo = person(member);
      const id = origin + '/#person-' + member.id;
      const personNode = { '@type': 'Person', '@id': id, name: local(member.name, meta.lang),
        alternateName: [...new Set([...Object.values(member.name), ...list(seo.alternateNames)].map(clean).filter(Boolean))],
        url: meta.canonical, description: local(member.position, meta.lang) + ' · ' + brand(rows) };
      if (member.group !== 'collaboration') personNode.memberOf = { '@id': lab };
      if (seo.verificationSource.includes('pubmed.ncbi.nlm.nih.gov/'))
        personNode.subjectOf = { '@type': 'ScholarlyArticle', url: seo.verificationSource };
      else personNode.sameAs = [seo.verificationSource];
      if (local(seo.verifiedTitle, meta.lang)) personNode.jobTitle = local(seo.verifiedTitle, meta.lang);
      if (local(seo.verifiedAffiliation, meta.lang))
        personNode.affiliation = { '@type': 'Organization', name: local(seo.verifiedAffiliation, meta.lang) };
      if (meta.image) personNode.image = meta.image;
      nodes.push(personNode);
      webpage.mainEntity = { '@id': id };
      crumbs.push({ '@type': 'ListItem', position: 3, name: personNode.name, item: meta.canonical });
    }
    if (meta.type === 'article' && meta.indexable) {
      const post = articles(rows).find(item => item.id === meta.record);
      const author = content(rows, 'blog').authors?.[post.authorId] ||
        people(rows).find(member => member.id === post.authorId);
      const personAuthor = people(rows).find(member => member.id === post.authorId);
      const byline = author && local(author.name, meta.lang) ? { '@type': 'Person', name: local(author.name, meta.lang) } : { '@id': lab };
      if (personAuthor) byline.url = personURL(rows, personAuthor, meta.lang);
      nodes.push({ '@type': ['Article', 'BlogPosting'], '@id': meta.canonical + '#article', headline: local(post.title, meta.lang),
        description: meta.description, mainEntityOfPage: { '@id': webpage['@id'] }, image: [meta.image],
        author: byline, publisher: { '@id': lab }, inLanguage: meta.lang,
        ...(date(post.date) ? { datePublished: post.date } : {}),
        ...(date(post.updatedAt) ? { dateModified: post.updatedAt } : {}) });
      crumbs.push({ '@type': 'ListItem', position: 3, name: local(post.title, meta.lang), item: meta.canonical });
    }
    if (meta.page === 'publication') {
      const papers = list(content(rows, 'publication').papers).filter(paper => !paper.sample && paper.title && paper.doi);
      nodes.push(...papers.map(paper => ({ '@type': 'ScholarlyArticle',
        '@id': 'https://doi.org/' + String(paper.doi).replace(/^https?:\/\/(?:dx\.)?doi\.org\//, ''),
        name: local(paper.title, meta.lang), identifier: paper.doi,
        author: list(paper.authors).map(author => ({ '@type': 'Person', name: clean(typeof author === 'string' ? author : author.name) })) })));
    }
    nodes.push(webpage, { '@type': 'BreadcrumbList', itemListElement: crumbs });
    return { '@context': 'https://schema.org', '@graph': nodes };
  }

  function snapshot(rows) {
    function compact(value, key) {
      if (typeof value === 'string' && value.startsWith('data:image/')) return '';
      if (Array.isArray(value)) return value.map(item => compact(item));
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, compact(item, name)]));
      return value;
    }
    return compact(rows);
  }

  function sitemap(rows, entries) {
    const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
    const urls = entries.filter(entry => entry.indexable).map(entry => {
      const published = rows[entry.page]?.published_at;
      return '<url><loc>' + escape(entry.canonical) + '</loc>' +
        (published && !Number.isNaN(Date.parse(published)) ? '<lastmod>' + escape(new Date(published).toISOString()) + '</lastmod>' : '') + '</url>';
    });
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.join('') + '</urlset>\n';
  }

  window.ACLabSEO = { origin, languages, pages, verified, pair, clean, local, explicit, list, slug, encoded, absolute,
    defaults, personDefaults, postDefaults, merge, settings, person, postSEO, content, brand, personReady,
    canonical, pageURL, personURL, postURL, translated, people, articles, papersFor,
    descriptor, resolveImage, entries, validate, graph, sitemap, snapshot };
})();
