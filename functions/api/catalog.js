/**
 * Cloudflare Pages Function: /api/catalog
 * Commercial-Safe WatchPulse Backend ($0/Month, 100,000 req/day free)
 * - TV Series: TVmaze API (CC BY-SA — Commercial AdSense Allowed, Zero API Key)
 * - Universal Movie Search & Rich Details: Wikipedia API (CC BY-SA) + Wikidata API (CC0 Public Domain)
 *   Returns posters, full plots, directors, full cast, genres, runtimes, release dates, IMDb IDs, and official YouTube trailer IDs (P1651)!
 * - Enforces explicit action allowlist + Cloudflare Edge caching
 */

const USER_AGENT = 'WatchPulse/2.1 (https://watchpulse.online; contact@watchpulse.online)';

const FILM_INSTANCE_IDS = new Set([
  'Q11424',    // film
  'Q24869',    // feature film
  'Q202866',   // animated film
  'Q29168811', // animated feature film
  'Q506240',   // television film
  'Q93204',    // documentary film
  'Q24862',    // short film
  'Q226730',   // silent film
  'Q52162262', // film remake
  'Q229390'    // 3D film
]);

const NON_FILM_TITLE_RE = /\b(in film|filmography|discography|soundtrack|list of|disambiguation|franchise|character|comics|video game|fictional|actress|actor|politician|singer|musician|director|producer|cricketer|journalist|biography)\b/i;
const PERSON_DESC_RE = /\b(actress|actor|politician|singer|musician|filmmaker|screenwriter|journalist|socialite|cricketer|born \d{4}|is a pakistani|is an indian|is an american|is a british)\b/i;

function jsonResponse(status, body, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': status === 200
      ? 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400'
      : 'no-store',
    ...extraHeaders
  };
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers });
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    cf: { cacheTtl: 3600, cacheEverything: true }
  });
  if (!res.ok) throw new Error(`Upstream HTTP ${res.status}`);
  return res.json();
}

function getClaimEntityIds(claims, prop, limit = 10) {
  const arr = (claims && claims[prop]) || [];
  const ids = [];
  for (const c of arr) {
    const id = c && c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value && c.mainsnak.datavalue.value.id;
    if (id && !ids.includes(id)) {
      ids.push(id);
      if (ids.length >= limit) break;
    }
  }
  return ids;
}

function getClaimString(claims, prop) {
  const arr = (claims && claims[prop]) || [];
  for (const c of arr) {
    const val = c && c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value;
    if (typeof val === 'string' && val.trim()) return val.trim();
  }
  return '';
}

function getClaimYear(claims, prop = 'P577') {
  const arr = (claims && claims[prop]) || [];
  for (const c of arr) {
    const t = c && c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value && c.mainsnak.datavalue.value.time;
    const m = typeof t === 'string' ? t.match(/\+?(\d{4})/) : null;
    if (m) return m[1];
  }
  return '';
}

function getClaimRuntime(claims) {
  const arr = (claims && claims.P2047) || [];
  for (const c of arr) {
    const amt = c && c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value && c.mainsnak.datavalue.value.amount;
    if (amt) {
      const n = Math.round(Math.abs(parseFloat(amt)));
      if (n >= 20 && n <= 480) return n;
    }
  }
  return 0;
}

async function handleWikiSearch(q) {
  const fetchPages = async (term) => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(term + ' film')}&gsrlimit=10&prop=pageimages|extracts|pageprops&piprop=thumbnail&pithumbsize=500&pilicense=any&exintro=1&explaintext=1&exsentences=4&format=json&origin=*`;
    const data = await fetchJson(url);
    return (data && data.query && data.query.pages) ? Object.values(data.query.pages) : [];
  };

  let pages = await fetchPages(q);
  let usedSuggestion = '';

  if (!pages.length) {
    // Check Wikipedia spelling suggestion
    try {
      const sugUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q + ' film')}&srlimit=1&format=json&origin=*`;
      const sugData = await fetchJson(sugUrl);
      const sug = sugData && sugData.query && sugData.query.searchinfo && sugData.query.searchinfo.suggestion;
      if (sug) {
        usedSuggestion = sug.replace(/\s+film$/i, '').trim();
        pages = await fetchPages(usedSuggestion);
      }
    } catch (_) {}
  }

  // Sort by Wikipedia search index & filter out non-film list/franchise pages
  pages = pages
    .filter(p => p && p.title && !NON_FILM_TITLE_RE.test(p.title))
    .sort((a, b) => (a.index || 99) - (b.index || 99))
    .slice(0, 8);

  // Batch fetch Wikidata claims (CC0 Public Domain) for all returned QIDs in 1 hop
  const qids = pages.map(p => p.pageprops && p.pageprops.wikibase_item).filter(Boolean);
  let entities = {};
  if (qids.length) {
    try {
      const wdUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(qids.join('|'))}&props=claims|descriptions&languages=en&format=json`;
      const wdData = await fetchJson(wdUrl);
      entities = (wdData && wdData.entities) || {};
    } catch (_) {}
  }

  const results = [];
  for (const p of pages) {
    const qid = (p.pageprops && p.pageprops.wikibase_item) || '';
    const ent = qid ? entities[qid] : null;
    const claims = (ent && ent.claims) || {};
    const desc = (ent && ent.descriptions && ent.descriptions.en && ent.descriptions.en.value) || '';
    const instanceIds = getClaimEntityIds(claims, 'P31', 5);
    const isFilmEntity = instanceIds.some(id => FILM_INSTANCE_IDS.has(id)) || /\bfilm\b/i.test(desc) || /\bfilm\b/i.test(p.title);

    // Exclude pages that Wikidata confirms are NOT films (e.g. characters, comics, actors)
    if (instanceIds.length && !isFilmEntity) continue;

    const cleanTitle = p.title.replace(/\s*\([^)]*film[^)]*\)/i, '').trim();
    const yearFromWd = getClaimYear(claims, 'P577');
    const yearFromText = ((p.title || '') + ' ' + desc + ' ' + (p.extract || '')).match(/\b(19\d{2}|20\d{2})\b/);
    const year = yearFromWd || (yearFromText ? yearFromText[1] : 'Film');
    const runtime = getClaimRuntime(claims);
    const trailerId = getClaimString(claims, 'P1651');
    const imdbId = getClaimString(claims, 'P345');
    const wikiThumb = (p.thumbnail && p.thumbnail.source) ? p.thumbnail.source.split('?')[0] : '';
    const ytThumb = trailerId ? `https://i.ytimg.com/vi/${trailerId}/hqdefault.jpg` : '';
    const directorMatch = desc.match(/directed by ([^,;]+)/i);

    results.push({
      pageid: p.pageid,
      qid,
      wikiTitle: p.title,
      title: cleanTitle,
      year,
      runtime,
      director: directorMatch ? directorMatch[1].trim() : '',
      description: desc,
      overview: (p.extract || desc || 'Open film reference via Wikipedia & Wikidata.').trim(),
      poster: wikiThumb || ytThumb,
      backdrop: ytThumb || wikiThumb,
      trailer_id: trailerId,
      imdb_id: imdbId,
      officialUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`
    });
  }

  return jsonResponse(200, { results: results.slice(0, 6), suggestion: usedSuggestion }, { 'X-WatchPulse-Edge': 'Cloudflare-Pages' });
}

const DISCOVER_GENRE_TERMS = {
  all: { term: '2025 2026 release', label: 'Drama', id: 18 },
  '28': { term: 'action', label: 'Action', id: 28 },
  '878': { term: 'science fiction', label: 'Sci-Fi', id: 878 },
  '18': { term: 'drama', label: 'Drama', id: 18 },
  '35': { term: 'comedy', label: 'Comedy', id: 35 },
  '27': { term: 'horror', label: 'Horror', id: 27 },
  '53': { term: 'thriller', label: 'Thriller', id: 53 },
  '16': { term: 'animated', label: 'Animation', id: 16 },
  '10749': { term: 'romantic', label: 'Romance', id: 10749 }
};

const DISCOVER_LANG_TERMS = {
  all: { term: '', label: 'English', code: 'en' },
  en: { term: '(American OR British)', label: 'English', code: 'en' },
  ko: { term: '(Korean OR "South Korean")', label: 'Korean', code: 'ko' },
  hi: { term: '(Hindi OR Bollywood)', label: 'Hindi', code: 'hi' },
  ur: { term: '(Pakistani OR Urdu)', label: 'Urdu', code: 'ur' },
  ja: { term: 'Japanese', label: 'Japanese', code: 'ja' },
  tr: { term: 'Turkish', label: 'Turkish', code: 'tr' },
  ta: { term: 'Tamil', label: 'Tamil', code: 'ta' },
  ml: { term: 'Malayalam', label: 'Malayalam', code: 'ml' },
  de: { term: 'German', label: 'German', code: 'de' },
  es: { term: '(Spanish OR Mexican)', label: 'Spanish', code: 'es' },
  fr: { term: 'French', label: 'French', code: 'fr' },
  ar: { term: '(Arabic OR Egyptian OR Lebanese)', label: 'Arabic', code: 'ar' },
  it: { term: 'Italian', label: 'Italian', code: 'it' },
  zh: { term: '(Chinese OR Mandarin OR Cantonese)', label: 'Chinese', code: 'zh' }
};

const DISCOVER_PLATFORM_TERMS = {
  all: { term: '', label: 'Prime Video' },
  '8': { term: 'Netflix', label: 'Netflix' },
  '9': { term: 'Amazon Prime Video', label: 'Prime Video' },
  '337': { term: 'Disney', label: 'Disney+' },
  '350': { term: 'Apple TV+', label: 'Apple TV+' },
  '1899': { term: 'HBO Max Warner Bros', label: 'HBO Max' }
};

async function verifyYoutubeThumbUrl(vid) {
  if (!vid || vid.length !== 11) return '';
  try {
    const maxUrl = `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg`;
    const maxRes = await fetch(maxUrl, { cf: { cacheTtl: 86400, cacheEverything: true } });
    if (maxRes.ok) {
      const buf = await maxRes.arrayBuffer();
      if (buf && buf.byteLength > 3500) return maxUrl;
    }
  } catch (_) {}
  try {
    const mqUrl = `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`;
    const mqRes = await fetch(mqUrl, { cf: { cacheTtl: 86400, cacheEverything: true } });
    if (mqRes.ok) {
      const buf = await mqRes.arrayBuffer();
      // YouTube's gray 120x90 3-dots placeholder is ~1097 bytes; valid 320x180 16:9 thumbs are > 2500 bytes
      if (buf && buf.byteLength > 2500) return mqUrl;
    }
  } catch (_) {}
  return '';
}

async function resolveQuickTrailer(movieTitle, year) {
  try {
    const q = `${movieTitle} ${year && year !== 'Film' ? year : ''} official trailer`.trim();
    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAQ%253D%253D`;
    const res = await fetch(ytUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      cf: { cacheTtl: 86400, cacheEverything: true }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const re = /"videoId":"([A-Za-z0-9_-]{11})"/g;
    const candidates = [];
    let m;
    while ((m = re.exec(html)) !== null && candidates.length < 5) {
      if (m[1] !== 'ASSCNBSAxm0' && !candidates.includes(m[1])) candidates.push(m[1]);
    }
    for (const vid of candidates) {
      const oe = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vid}&format=json`, {
        cf: { cacheTtl: 86400, cacheEverything: true }
      });
      if (!oe.ok) continue;
      const info = await oe.json();
      const author = String(info.author_name || '');
      const title = String(info.title || '');
      if (UNOFFICIAL_TRAILER_RE.test(author) || UNOFFICIAL_TRAILER_RE.test(title)) continue;
      const verifiedThumb = await verifyYoutubeThumbUrl(vid);
      if (!verifiedThumb) continue;
      return { id: vid, thumbUrl: verifiedThumb };
    }
  } catch (_) {}
  return null;
}

async function handleMovieDiscover(genreKey, langKey, platformKey, offsetNum) {
  const gCfg = DISCOVER_GENRE_TERMS[genreKey] || DISCOVER_GENRE_TERMS.all;
  const lCfg = DISCOVER_LANG_TERMS[langKey] || DISCOVER_LANG_TERMS.all;
  const pCfg = DISCOVER_PLATFORM_TERMS[platformKey] || DISCOVER_PLATFORM_TERMS.all;

  const fetchWikiFilmBatch = async (parts, limit = 18, offset = 0) => {
    const searchTerm = parts.filter(Boolean).join(' ');
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchTerm)}&gsrlimit=${limit}&gsroffset=${offset}&prop=pageimages|extracts|pageprops&piprop=thumbnail&pithumbsize=500&pilicense=any&exintro=1&explaintext=1&exsentences=3&format=json&origin=*`;
    const data = await fetchJson(wikiUrl);
    const raw = (data && data.query && data.query.pages) ? Object.values(data.query.pages) : [];
    return raw
      .filter(p => p && p.title && !NON_FILM_TITLE_RE.test(p.title))
      .sort((a, b) => (a.index || 99) - (b.index || 99));
  };

  const gsrOffset = Math.max(0, offsetNum * 16);
  const genreTerm = genreKey === 'all' ? '' : gCfg.term;
  // Platform terms like "Netflix" rarely appear in Wikipedia film infoboxes alongside regional languages; only include when no language/genre narrows it down
  const includePlatformTerm = langKey === 'all' && genreKey === 'all' && platformKey !== 'all';
  let pages = await fetchWikiFilmBatch(
    ['hastemplate:"Infobox film"', lCfg.term, includePlatformTerm ? pCfg.term : '', genreTerm || gCfg.term, 'film'],
    20,
    gsrOffset
  );

  // Fallback: if combined language + genre query returns fewer than 6 films, broaden to language + film
  if (pages.length < 6 && (lCfg.term || genreTerm)) {
    const broader = await fetchWikiFilmBatch(
      ['hastemplate:"Infobox film"', lCfg.term || genreTerm, 'film'],
      20,
      gsrOffset
    );
    const seenIds = new Set(pages.map(p => p.pageid));
    broader.forEach(p => {
      if (!seenIds.has(p.pageid)) {
        seenIds.add(p.pageid);
        pages.push(p);
      }
    });
  }

  pages = pages.slice(0, 14);

  const qids = pages.map(p => p.pageprops && p.pageprops.wikibase_item).filter(Boolean);
  let entities = {};
  if (qids.length) {
    try {
      const wdUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(qids.join('|'))}&props=claims|descriptions&languages=en&format=json`;
      const wdData = await fetchJson(wdUrl);
      entities = (wdData && wdData.entities) || {};
    } catch (_) {}
  }

  const rawItems = [];
  for (const p of pages) {
    const qid = (p.pageprops && p.pageprops.wikibase_item) || '';
    const ent = qid ? entities[qid] : null;
    const claims = (ent && ent.claims) || {};
    const desc = (ent && ent.descriptions && ent.descriptions.en && ent.descriptions.en.value) || '';
    const extractText = (p.extract || '').trim();
    const instanceIds = getClaimEntityIds(claims, 'P31', 6);

    // Strictly reject human/person biographies (Q5) or non-film entities
    if (instanceIds.includes('Q5') || PERSON_DESC_RE.test(desc) || PERSON_DESC_RE.test(extractText.slice(0, 180))) continue;
    const isConfirmedFilm = instanceIds.some(id => FILM_INSTANCE_IDS.has(id)) || /\b\d{4}\s+.*film\b/i.test(desc) || /\bis a \d{4} .*film\b/i.test(extractText);
    if (!isConfirmedFilm) continue;

    const cleanTitle = p.title.replace(/\s*\([^)]*film[^)]*\)/i, '').replace(/\s*\(\d{4}\s+[^)]*\)/i, '').trim();
    if (!cleanTitle || NON_FILM_TITLE_RE.test(cleanTitle)) continue;

    const yearFromWd = getClaimYear(claims, 'P577');
    const yearFromText = ((p.title || '') + ' ' + desc + ' ' + extractText).match(/\b(19\d{2}|20\d{2})\b/);
    const year = yearFromWd || (yearFromText ? yearFromText[1] : '2024');
    const runtime = getClaimRuntime(claims) || 118;
    const trailerId = getClaimString(claims, 'P1651');
    const imdbId = getClaimString(claims, 'P345');
    const wikiThumb = (p.thumbnail && p.thumbnail.source) ? p.thumbnail.source.split('?')[0] : '';
    const directorMatch = desc.match(/directed by ([^,;]+)/i);

    rawItems.push({
      pageid: p.pageid,
      qid,
      wikiTitle: p.title,
      title: cleanTitle,
      year,
      runtime,
      director: directorMatch ? directorMatch[1].trim() : '',
      overview: (extractText || desc || 'Discovered via WatchPulse Live Catalog (Wikipedia & Wikidata).').trim(),
      wikiThumb,
      trailer_id: trailerId,
      thumbUrl: '',
      imdb_id: imdbId,
      genres: [gCfg.label],
      genre_ids: [gCfg.id],
      language: lCfg.code,
      languageLabel: lCfg.label,
      platforms: [pCfg.label],
      officialUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`
    });
  }

  // Verify official 16:9 YouTube trailer thumbnails for top candidates; keep verified YouTube OR Wikipedia artwork so niche languages never collapse to 0-1 results
  await Promise.all(rawItems.slice(0, 12).map(async (item, idx) => {
    if (item.trailer_id) {
      const checkedUrl = await verifyYoutubeThumbUrl(item.trailer_id);
      if (checkedUrl) {
        item.thumbUrl = checkedUrl;
        return;
      }
      item.trailer_id = '';
    }
    if (idx < 8 || !item.wikiThumb) {
      const resolved = await resolveQuickTrailer(`${item.title} ${item.languageLabel !== 'English' ? item.languageLabel : ''}`.trim(), item.year);
      if (resolved) {
        item.trailer_id = resolved.id;
        item.thumbUrl = resolved.thumbUrl;
      }
    }
  }));

  const results = rawItems
    .filter(item => Boolean(item.thumbUrl || item.wikiThumb || item.overview))
    .map(item => ({
      ...item,
      poster: item.thumbUrl || item.wikiThumb || '',
      backdrop: item.thumbUrl || item.wikiThumb || ''
    }));

  return jsonResponse(200, {
    results,
    nextOffset: offsetNum + 1
  }, { 'X-WatchPulse-Edge': 'Cloudflare-Pages' });
}

const ITUNES_GENRE_MAP = {
  'action & adventure': { label: 'Action', id: 28 },
  'action': { label: 'Action', id: 28 },
  'sci-fi & fantasy': { label: 'Sci-Fi', id: 878 },
  'science fiction': { label: 'Sci-Fi', id: 878 },
  'drama': { label: 'Drama', id: 18 },
  'comedy': { label: 'Comedy', id: 35 },
  'horror': { label: 'Horror', id: 27 },
  'thriller': { label: 'Thriller', id: 53 },
  'mystery & suspense': { label: 'Thriller', id: 53 },
  'kids & family': { label: 'Animation', id: 16 },
  'animation': { label: 'Animation', id: 16 },
  'romance': { label: 'Romance', id: 10749 }
};

function mapItunesCategory(rawLabel) {
  const key = String(rawLabel || '').toLowerCase().trim();
  for (const [k, val] of Object.entries(ITUNES_GENRE_MAP)) {
    if (key.includes(k)) return val;
  }
  return { label: 'Drama', id: 18 };
}

async function fetchItunesTopMovies(country = 'us', limit = 8) {
  try {
    const url = `https://itunes.apple.com/${encodeURIComponent(country)}/rss/topmovies/limit=${limit}/json`;
    const data = await fetchJson(url);
    const entries = (data && data.feed && Array.isArray(data.feed.entry)) ? data.feed.entry : [];
    return entries.map((e, idx) => {
      const rawName = (e && e['im:name'] && e['im:name'].label) ? e['im:name'].label : '';
      const cleanTitle = rawName.replace(/\s*\((19|20)\d{2}\)\s*$/i, '').trim();
      const yearInTitle = rawName.match(/\b(19|20)\d{2}\b/);
      const relLabel = (e && e['im:releaseDate'] && e['im:releaseDate'].label) ? e['im:releaseDate'].label : '';
      const yearInRel = relLabel.match(/\b(19|20)\d{2}\b/);
      const year = (yearInTitle && yearInTitle[0]) || (yearInRel && yearInRel[0]) || String(new Date().getFullYear());
      const director = (e && e['im:artist'] && e['im:artist'].label) ? e['im:artist'].label : '';
      const summary = (e && e.summary && e.summary.label) ? e.summary.label : '';
      const catLabel = (e && e.category && e.category.attributes && e.category.attributes.label) ? e.category.attributes.label : 'Drama';
      const mappedGenre = mapItunesCategory(catLabel);
      const images = (e && Array.isArray(e['im:image'])) ? e['im:image'] : [];
      const lastImg = images.length ? (images[images.length - 1].label || '') : '';
      const hiResPoster = lastImg ? lastImg.replace(/\/\d+x\d+bb\.(png|jpg)$/i, '/600x900bb.jpg') : '';
      const durMs = (e && Array.isArray(e.link) && e.link[1] && e.link[1]['im:duration'] && e.link[1]['im:duration'].label)
        ? parseFloat(e.link[1]['im:duration'].label)
        : 0;
      return {
        source: 'WatchPulse Live Trending',
        title: cleanTitle,
        year,
        runtime: durMs > 1800000 ? Math.round(durMs / 60000) : 128,
        rating: Number((9.1 - Math.min(idx * 0.12, 1.1)).toFixed(1)),
        director,
        overview: summary || `${cleanTitle} (${year}) — Trending worldwide today across theaters and streaming.`,
        editorial_note: `Trending Live Today (#${idx + 1} Global Chart) • ${catLabel}${director ? ' • Directed by ' + director : ''}.`,
        genres: [mappedGenre.label],
        genre_ids: [mappedGenre.id],
        language: 'en',
        languageLabel: 'English',
        platforms: ['Netflix', 'Prime Video', 'Apple TV+'],
        itunesPoster: hiResPoster,
        trailer_id: ''
      };
    }).filter(x => x.title);
  } catch (_) {
    return [];
  }
}

async function fetchLiveWikipediaCurrentYearIntl(yearNum) {
  const intlSpecs = [
    { q: `incategory:"${yearNum}_films" Hindi OR Bollywood`, code: 'hi', label: 'Hindi', platform: 'Netflix' },
    { q: `incategory:"${yearNum}_films" Korean OR "South Korean"`, code: 'ko', label: 'Korean', platform: 'Netflix' },
    { q: `incategory:"${yearNum}_films" Pakistani OR Urdu OR Turkish`, code: 'ur', label: 'Urdu', platform: 'Prime Video' }
  ];

  const settled = await Promise.allSettled(intlSpecs.map(async (spec) => {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(spec.q)}&gsrsort=incoming_links_desc&gsrlimit=4&prop=pageimages|extracts|pageprops&piprop=thumbnail&pithumbsize=500&pilicense=any&exintro=1&explaintext=1&exsentences=2&format=json&origin=*`;
    const data = await fetchJson(wikiUrl);
    const pages = (data && data.query && data.query.pages) ? Object.values(data.query.pages) : [];
    const sorted = pages
      .filter(p => p && p.title && !NON_FILM_TITLE_RE.test(p.title))
      .sort((a, b) => (a.index || 99) - (b.index || 99));
    const pick = sorted[0];
    if (!pick) return null;
    const cleanTitle = pick.title.replace(/\s*\([^)]*film[^)]*\)/i, '').replace(/\s*\(\d{4}\s+[^)]*\)/i, '').trim();
    const wikiThumb = (pick.thumbnail && pick.thumbnail.source) ? pick.thumbnail.source.split('?')[0] : '';
    const extract = (pick.extract || '').trim();
    const isTurkish = /\bTurkish\b/i.test(extract);
    const finalCode = isTurkish ? 'tr' : spec.code;
    const finalLangLabel = isTurkish ? 'Turkish' : spec.label;
    return {
      qid: (pick.pageprops && pick.pageprops.wikibase_item) || '',
      wikiTitle: pick.title,
      source: 'WatchPulse Live Trending',
      title: cleanTitle,
      year: String(yearNum),
      runtime: 132,
      rating: 8.4,
      director: '',
      overview: extract || `${cleanTitle} (${yearNum}) — Trending ${finalLangLabel} release.`,
      editorial_note: `Trending Live (${yearNum} ${finalLangLabel} Release) • ${ extract ? extract.slice(0, 140) : 'New global cinema release.' }`,
      genres: ['Drama', 'Thriller'],
      genre_ids: [18, 53],
      language: finalCode,
      languageLabel: finalLangLabel,
      platforms: [spec.platform, 'Prime Video'],
      itunesPoster: wikiThumb,
      trailer_id: ''
    };
  }));

  return settled
    .filter(r => r.status === 'fulfilled' && r.value && r.value.title)
    .map(r => r.value);
}

async function handleLiveTrendingMovies() {
  const currentYear = new Date().getFullYear();
  const [usMovies, intlMovies] = await Promise.all([
    fetchItunesTopMovies('us', 9),
    fetchLiveWikipediaCurrentYearIntl(currentYear)
  ]);

  const combined = [];
  const seen = new Set();
  const pushUnique = (item) => {
    if (!item || !item.title) return;
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!key || seen.has(key)) return;
    seen.add(key);
    combined.push(item);
  };

  // Interleave global cinema/VOD chart leaders with live current-year Hindi, Korean, and Urdu/Turkish releases
  usMovies.slice(0, 6).forEach(pushUnique);
  intlMovies.forEach(pushUnique);
  usMovies.slice(6).forEach(pushUnique);

  const topItems = combined.slice(0, 12);

  // Resolve official 16:9 YouTube trailer IDs and verify non-placeholder thumbnails in parallel on the Cloudflare Edge
  await Promise.all(topItems.map(async (item) => {
    if (!item.trailer_id) {
      const resolved = await resolveQuickTrailer(`${item.title} ${item.languageLabel !== 'English' ? item.languageLabel : ''}`.trim(), item.year);
      if (resolved) {
        item.trailer_id = resolved.id;
        item.thumbUrl = resolved.thumbUrl;
      }
    } else {
      item.thumbUrl = await verifyYoutubeThumbUrl(item.trailer_id);
    }
  }));

  const results = topItems
    .filter(item => Boolean(item.trailer_id && item.thumbUrl))
    .map((item, idx) => ({
      id: `live-trend-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      qid: item.qid || '',
      wikiTitle: item.wikiTitle || item.title,
      media_type: 'movie',
      source: 'WatchPulse Live Trending',
      title: item.title,
      year: item.year,
      runtime: item.runtime || 126,
      rating: item.rating || Number((9.0 - idx * 0.1).toFixed(1)),
      director: item.director || '',
      overview: item.overview,
      editorial_note: item.editorial_note,
      genres: item.genres,
      genre_ids: item.genre_ids,
      language: item.language,
      languageLabel: item.languageLabel,
      platforms: item.platforms,
      trailer_id: item.trailer_id,
      poster: item.thumbUrl,
      backdrop: item.thumbUrl
    }));

  return jsonResponse(200, {
    updatedAt: new Date().toISOString(),
    results
  }, {
    'Cache-Control': 'public, max-age=1800, s-maxage=7200, stale-while-revalidate=43200',
    'X-WatchPulse-Edge': 'Cloudflare-Pages-Live-Trending'
  });
}

async function handleWikiDetails(qid, wikiTitle) {
  const wdUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(qid)}&props=claims|labels|descriptions&languages=en&format=json`;
  const [wdData, wikiData] = await Promise.all([
    fetchJson(wdUrl),
    wikiTitle
      ? fetchJson(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages|extracts&piprop=thumbnail&pithumbsize=600&pilicense=any&exintro=1&explaintext=1&format=json&origin=*`).catch(() => null)
      : Promise.resolve(null)
  ]);

  const ent = wdData && wdData.entities && wdData.entities[qid];
  if (!ent) return jsonResponse(404, { error: 'Entity not found' });
  const claims = ent.claims || {};

  const directorIds = getClaimEntityIds(claims, 'P57', 3);
  const castIds = getClaimEntityIds(claims, 'P161', 10);
  const genreIds = getClaimEntityIds(claims, 'P136', 5);
  const distIds = getClaimEntityIds(claims, 'P750', 5);
  const langIds = getClaimEntityIds(claims, 'P364', 2);
  const countryIds = getClaimEntityIds(claims, 'P495', 2);

  const allLabelIds = [...new Set([...directorIds, ...castIds, ...genreIds, ...distIds, ...langIds, ...countryIds])];
  const labelsMap = {};
  if (allLabelIds.length) {
    try {
      const lblUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(allLabelIds.join('|'))}&props=labels&languages=en&format=json`;
      const lblData = await fetchJson(lblUrl);
      const ents = (lblData && lblData.entities) || {};
      for (const id of allLabelIds) {
        const val = ents[id] && ents[id].labels && ents[id].labels.en && ents[id].labels.en.value;
        if (val) labelsMap[id] = val;
      }
    } catch (_) {}
  }

  const resolve = (ids) => ids.map(id => labelsMap[id]).filter(Boolean);
  const directors = resolve(directorIds);
  const cast = resolve(castIds);
  const genres = resolve(genreIds).map(g => g.replace(/\s+film$/i, '').replace(/^\w/, c => c.toUpperCase()));
  const distributors = resolve(distIds);
  const languages = resolve(langIds);
  const countries = resolve(countryIds);

  let fullOverview = '';
  let wikiPoster = '';
  if (wikiData && wikiData.query && wikiData.query.pages) {
    const firstPage = Object.values(wikiData.query.pages)[0];
    if (firstPage) {
      fullOverview = (firstPage.extract || '').trim();
      if (firstPage.thumbnail && firstPage.thumbnail.source) {
        wikiPoster = firstPage.thumbnail.source.split('?')[0];
      }
    }
  }

  const trailerId = getClaimString(claims, 'P1651');
  const imdbId = getClaimString(claims, 'P345');
  const year = getClaimYear(claims, 'P577');
  const runtime = getClaimRuntime(claims);
  const ytThumb = trailerId ? `https://i.ytimg.com/vi/${trailerId}/hqdefault.jpg` : '';

  return jsonResponse(200, {
    qid,
    title: (ent.labels && ent.labels.en && ent.labels.en.value) || wikiTitle || '',
    description: (ent.descriptions && ent.descriptions.en && ent.descriptions.en.value) || '',
    overview: fullOverview,
    year,
    runtime,
    director: directors.join(', '),
    cast,
    genres: genres.length ? genres : ['Feature Film'],
    platforms: distributors.length ? distributors : ['Check Local Streaming Apps'],
    languageLabel: languages[0] || 'Global',
    country: countries[0] || '',
    trailer_id: trailerId,
    imdb_id: imdbId,
    poster: wikiPoster || ytThumb,
    backdrop: ytThumb || wikiPoster
  }, { 'X-WatchPulse-Edge': 'Cloudflare-Pages' });
}

const OFFICIAL_TRAILER_CHANNEL_RE = /(warner\s*bros|sony\s*pictures|universal\s*pictures|paramount|marvel|netflix|prime\s*video|amazon|hbo|apple\s*tv|disney|pixar|a24|lionsgate|20th\s*century|focus\s*features|searchlight|neon|mubi|bbc|amc|fx\s*networks|showtime|hulu|peacock|starz|cbs|nbc|abc|fox|the\s*cw|syfy|crunchyroll|toho|gkids|all\s*the\s*anime|yrf|yash\s*raj|dharma|red\s*chillies|t-series|excel\s*entertainment|junglee|rotten\s*tomatoes\s*trailers|ign|imdb|fandango|kinocheck|official|pictures|studios|entertainment|television|network)/i;
const UNOFFICIAL_TRAILER_RE = /\b(fan[\s-]*made|concept|fake|parody|reaction|breakdown|ending\s+explained|review|recap|pitch\s+meeting|honest\s+trailer|lego|minecraft|ai\s+trailer|tribute|amv|teaser\s+concept|fan\s+trailer)\b/i;

async function handleTrailerSearch(q) {
  const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAQ%253D%253D`;
  const res = await fetch(ytUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    cf: { cacheTtl: 86400, cacheEverything: true }
  });
  if (!res.ok) return jsonResponse(502, { error: 'Trailer lookup temporarily unavailable', ids: [], verified: false });
  const html = await res.text();
  const seen = new Set();
  const rawIds = [];
  const re = /"videoId":"([A-Za-z0-9_-]{11})"/g;
  let m;
  while ((m = re.exec(html)) !== null && rawIds.length < 8) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      rawIds.push(m[1]);
    }
  }

  // Verify candidates via YouTube oEmbed and ONLY allow official studio / network / licensed trailer channels
  const checks = await Promise.all(rawIds.slice(0, 6).map(async (vid) => {
    try {
      const oe = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vid}&format=json`, {
        cf: { cacheTtl: 86400, cacheEverything: true }
      });
      if (!oe.ok) return null;
      const info = await oe.json();
      const author = String(info.author_name || '').trim();
      const title = String(info.title || '').trim();
      if (!author || UNOFFICIAL_TRAILER_RE.test(author) || UNOFFICIAL_TRAILER_RE.test(title)) return null;
      if (!OFFICIAL_TRAILER_CHANNEL_RE.test(author)) return null;
      return { id: vid, channel: author, title };
    } catch (_) {
      return null;
    }
  }));

  const verified = checks.filter(Boolean).slice(0, 4);
  const finalIds = verified.map(v => v.id);

  return jsonResponse(200, {
    ids: finalIds,
    primary: finalIds[0] || '',
    channels: verified.map(v => v.channel),
    verified: finalIds.length > 0
  }, {
    'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    'X-WatchPulse-Edge': 'Cloudflare-Pages'
  });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const action = (url.searchParams.get('action') || '').trim();
  const q = (url.searchParams.get('q') || '').trim().slice(0, 120);
  const id = (url.searchParams.get('id') || '').trim();
  const title = (url.searchParams.get('title') || '').trim().slice(0, 160);
  const page = Math.max(0, Math.min(250, parseInt(url.searchParams.get('page') || '0', 10) || 0));
  const genre = (url.searchParams.get('genre') || 'all').trim();
  const lang = (url.searchParams.get('lang') || 'all').trim();
  const platform = (url.searchParams.get('platform') || 'all').trim();
  const offset = Math.max(0, Math.min(50, parseInt(url.searchParams.get('offset') || '0', 10) || 0));

  try {
    if (action === 'trailer-search') {
      if (!q) return jsonResponse(400, { error: 'Missing query parameter q' });
      return await handleTrailerSearch(q);
    }

    if (action === 'movie-trending-live') {
      return await handleLiveTrendingMovies();
    }

    if (action === 'movie-discover') {
      return await handleMovieDiscover(genre, lang, platform, offset);
    }

    if (action === 'wiki-search') {
      if (!q) return jsonResponse(400, { error: 'Missing query parameter q' });
      return await handleWikiSearch(q);
    }

    if (action === 'wiki-details') {
      if (!/^Q\d+$/.test(id)) return jsonResponse(400, { error: 'Invalid Wikidata entity id' });
      return await handleWikiDetails(id, title);
    }

    let upstreamUrl = '';
    if (action === 'tv-popular') {
      upstreamUrl = `https://api.tvmaze.com/shows?page=${page}`;
    } else if (action === 'tv-search') {
      if (!q) return jsonResponse(400, { error: 'Missing query parameter q' });
      upstreamUrl = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`;
    } else if (action === 'tv-details') {
      if (!/^\d+$/.test(id)) return jsonResponse(400, { error: 'Invalid TVmaze show id' });
      upstreamUrl = `https://api.tvmaze.com/shows/${id}?embed=cast`;
    } else {
      return jsonResponse(400, { error: 'Invalid or disallowed catalog action' });
    }

    const res = await fetch(upstreamUrl, {
      headers: { 'User-Agent': USER_AGENT },
      cf: { cacheTtl: 3600, cacheEverything: true }
    });
    if (!res.ok) {
      return jsonResponse(res.status, { error: `Upstream catalog returned ${res.status}` });
    }
    const body = await res.text();
    return jsonResponse(200, body, { 'X-WatchPulse-Edge': 'Cloudflare-Pages' });
  } catch (err) {
    return jsonResponse(502, { error: 'Upstream catalog request timed out or failed' });
  }
}
