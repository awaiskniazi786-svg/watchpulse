/**
 * Cloudflare Pages Function: /api/catalog
 * Commercial-Safe WatchPulse Plan B Backend ($0/Month, 100,000 req/day free)
 * - TV Series: TVmaze API (CC BY-SA — Commercial AdSense Allowed, Zero API Key)
 * - Open Movie Facts Fallback: Wikipedia Search API (CC BY-SA / Open Data)
 * - Enforces explicit action allowlist + Cloudflare Edge caching
 */

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

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const action = (url.searchParams.get('action') || '').trim();
  const q = (url.searchParams.get('q') || '').trim().slice(0, 120);
  const id = (url.searchParams.get('id') || '').trim();
  const page = Math.max(0, Math.min(20, parseInt(url.searchParams.get('page') || '0', 10) || 0));

  let upstreamUrl = '';
  if (action === 'tv-popular') {
    upstreamUrl = `https://api.tvmaze.com/shows?page=${page}`;
  } else if (action === 'tv-search') {
    if (!q) return jsonResponse(400, { error: 'Missing query parameter q' });
    upstreamUrl = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`;
  } else if (action === 'tv-details') {
    if (!/^\d+$/.test(id)) return jsonResponse(400, { error: 'Invalid TVmaze show id' });
    upstreamUrl = `https://api.tvmaze.com/shows/${id}?embed=cast`;
  } else if (action === 'wiki-search') {
    if (!q) return jsonResponse(400, { error: 'Missing query parameter q' });
    upstreamUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q + ' film')}&srlimit=6&format=json&origin=*`;
  } else {
    return jsonResponse(400, { error: 'Invalid or disallowed catalog action' });
  }

  try {
    const res = await fetch(upstreamUrl, {
      headers: { 'User-Agent': 'WatchPulse/2.0 (https://watchpulse.online; awaiskniazi786@gmail.com)' },
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
