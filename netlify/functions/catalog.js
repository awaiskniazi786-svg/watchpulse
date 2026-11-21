/**
 * Netlify Serverless Proxy for WatchPulse Plan B ($0 Commercial-Safe Stack)
 * - TV Series: TVmaze API (CC BY-SA — Commercial AdSense Allowed, Zero API Key)
 * - Open Movie Facts Fallback: Wikipedia REST API (CC BY-SA / Open Data)
 * - Enforces explicit action allowlist + 10-minute in-memory & CDN caching
 */

const memoryCache = new Map();
const MEMORY_TTL_MS = 10 * 60 * 1000;

function jsonResponse(statusCode, bodyObj, cacheHit = '') {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': statusCode === 200
      ? 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400'
      : 'no-store'
  };
  if (cacheHit) headers['X-WatchPulse-Cache'] = cacheHit;
  return {
    statusCode,
    headers,
    body: typeof bodyObj === 'string' ? bodyObj : JSON.stringify(bodyObj)
  };
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const params = event.queryStringParameters || {};
  const action = (params.action || '').trim();
  const q = (params.q || '').trim().slice(0, 120);
  const id = (params.id || '').trim();
  const page = Math.max(0, Math.min(20, parseInt(params.page || '0', 10) || 0));

  let upstreamUrl = '';
  let cacheKey = '';

  if (action === 'tv-popular') {
    upstreamUrl = `https://api.tvmaze.com/shows?page=${page}`;
    cacheKey = `tv-popular:${page}`;
  } else if (action === 'tv-search') {
    if (!q) return jsonResponse(400, { error: 'Missing query parameter q' });
    upstreamUrl = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`;
    cacheKey = `tv-search:${q.toLowerCase()}`;
  } else if (action === 'tv-details') {
    if (!/^\d+$/.test(id)) return jsonResponse(400, { error: 'Invalid TVmaze show id' });
    upstreamUrl = `https://api.tvmaze.com/shows/${id}?embed=cast`;
    cacheKey = `tv-details:${id}`;
  } else if (action === 'wiki-search') {
    if (!q) return jsonResponse(400, { error: 'Missing query parameter q' });
    upstreamUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q + ' film')}&srlimit=6&format=json&origin=*`;
    cacheKey = `wiki-search:${q.toLowerCase()}`;
  } else {
    return jsonResponse(400, { error: 'Invalid or disallowed catalog action' });
  }

  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < MEMORY_TTL_MS) {
    return jsonResponse(200, cached.body, 'HIT');
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(upstreamUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'WatchPulse/2.0 (https://watchpulse.online; awaiskniazi786@gmail.com)' }
    });
    clearTimeout(timer);

    if (!res.ok) {
      return jsonResponse(res.status, { error: `Upstream catalog returned ${res.status}` });
    }

    const body = await res.text();
    if (memoryCache.size > 250) {
      const oldestKey = memoryCache.keys().next().value;
      memoryCache.delete(oldestKey);
    }
    memoryCache.set(cacheKey, { timestamp: Date.now(), body });
    return jsonResponse(200, body, 'MISS');
  } catch (err) {
    return jsonResponse(502, { error: 'Upstream catalog request timed out or failed' });
  }
};
