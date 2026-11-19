/**
 * Netlify Serverless Proxy for TMDB API v3
 * - Keeps TMDB_API_KEY in server environment variables when deployed via Netlify Functions
 * - Enforces an explicit endpoint allowlist and input validation
 * - Adds CDN & in-memory caching to reduce upstream rate-limit pressure
 */

const ALLOWED_PATH_PATTERNS = [
  /^\/trending\/(movie|tv)\/week$/,
  /^\/discover\/(movie|tv)$/,
  /^\/search\/(movie|tv)$/,
  /^\/(movie|tv)\/\d+$/,
  /^\/watch\/providers\/regions$/
];

const memoryCache = new Map();
const MEMORY_TTL_MS = 10 * 60 * 1000; // 10 minutes

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const params = event.queryStringParameters || {};
  const endpoint = (params.endpoint || '').trim();

  if (!endpoint || !ALLOWED_PATH_PATTERNS.some(rx => rx.test(endpoint))) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid or disallowed TMDB endpoint' })
    };
  }

  const apiKey = (process.env.TMDB_API_KEY || '').trim();
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error: TMDB_API_KEY environment variable is not set.' })
    };
  }
  const upstreamParams = new URLSearchParams();

  for (const [k, v] of Object.entries(params)) {
    if (k !== 'endpoint' && k !== 'api_key' && typeof v === 'string' && v.length <= 160) {
      upstreamParams.set(k, v);
    }
  }

  const cacheKey = `${endpoint}?${upstreamParams.toString()}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < MEMORY_TTL_MS) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
        'X-WatchPulse-Cache': 'HIT'
      },
      body: cached.body
    };
  }

  upstreamParams.set('api_key', apiKey);
  const url = `https://api.themoviedb.org/3${endpoint}?${upstreamParams.toString()}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Upstream TMDB returned ${res.status}` })
      };
    }

    const body = await res.text();
    if (memoryCache.size > 250) {
      const oldestKey = memoryCache.keys().next().value;
      memoryCache.delete(oldestKey);
    }
    memoryCache.set(cacheKey, { timestamp: Date.now(), body });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
        'X-WatchPulse-Cache': 'MISS'
      },
      body
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Upstream TMDB request timed out or failed' })
    };
  }
};
