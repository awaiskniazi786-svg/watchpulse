/**
 * Cloudflare Pages Function: /api/catalog
 * Commercial-Safe WatchPulse Backend ($0/Month, 100,000 req/day free)
 * - TV Series: TVmaze API (CC BY-SA — Commercial AdSense Allowed, Zero API Key)
 * - Universal Movie Search & Rich Details: Wikipedia API (CC BY-SA) + Wikidata API (CC0 Public Domain)
 *   Returns posters, full plots, directors, full cast, genres, runtimes, release dates, IMDb IDs, and official YouTube trailer IDs (P1651)!
 * - Enforces explicit action allowlist + Cloudflare Edge caching
 */

const USER_AGENT = 'WatchPulse/2.1 (https://watchpulse.online; awaiskniazi786@gmail.com)';

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

const NON_FILM_TITLE_RE = /\b(in film|filmography|discography|soundtrack|list of|disambiguation|franchise|character|comics|video game|fictional)\b/i;

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

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const action = (url.searchParams.get('action') || '').trim();
  const q = (url.searchParams.get('q') || '').trim().slice(0, 120);
  const id = (url.searchParams.get('id') || '').trim();
  const title = (url.searchParams.get('title') || '').trim().slice(0, 160);
  const page = Math.max(0, Math.min(20, parseInt(url.searchParams.get('page') || '0', 10) || 0));

  try {
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
