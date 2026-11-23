/**
 * WatchPulse.online — Commercial-Safe Discovery Engine ($0/Month, Cloudflare Pages)
 * - TV Series: Live TVmaze API (CC BY-SA — Commercial AdSense Allowed, Zero API Key)
 * - Movies: WatchPulse Curated Editorial Library (data/curated-catalog.json) + Wikipedia Open Film Search
 * - Thumbnails & Trailers: Official YouTube HD Thumbnails & Privacy-Enhanced Embeds (youtube-nocookie.com)
 * - Watchlist + Watched Status: Private Browser localStorage
 */

const CATALOG_PROXY_URL = '/api/catalog';
const CURATED_CATALOG_URL = '/data/curated-catalog.json?v=20261122f';
const TRENDING_MOVIE_COUNT = 8;
const PAGE_SIZE = 32;

const GENRE_MAP = {
  28: 'Action',
  878: 'Sci-Fi',
  18: 'Drama',
  35: 'Comedy',
  27: 'Horror',
  53: 'Thriller',
  16: 'Animation',
  10749: 'Romance'
};

const GENRE_SLUG_MAP = {
  action: '28',
  scifi: '878',
  'sci-fi': '878',
  drama: '18',
  comedy: '35',
  horror: '27',
  thriller: '53',
  animation: '16',
  romance: '10749',
  romantic: '10749'
};

const PROVIDER_NAMES = {
  '8': 'Netflix',
  '9': 'Prime Video',
  '337': 'Disney+',
  '350': 'Apple TV+',
  '1899': 'HBO Max'
};

const LANGUAGE_NAMES = {
  en: 'English',
  ko: 'Korean',
  hi: 'Hindi',
  ja: 'Japanese',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ml: 'Malayalam',
  ta: 'Tamil',
  ur: 'Urdu',
  tr: 'Turkish',
  ar: 'Arabic',
  it: 'Italian',
  zh: 'Chinese'
};

const SORT_LABELS = {
  trending: 'Trending',
  rating: 'Highest Rated',
  newest: 'Newest',
  runtime: 'Shortest Runtime'
};

const TRENDING_KEYWORDS = [
  'Spider-Man: Brand New Day',
  'The Odyssey',
  'Peaky Blinders: The Immortal Man',
  'The Rip',
  'Project Hail Mary',
  'Avatar: Fire and Ash',
  'Severance',
  'Dune: Part Two'
];

// Verified Official Embeddable YouTube Trailer IDs for TV Series & Curated Movies
const VERIFIED_TRAILER_IDS = {
  'spider-man: brand new day': '62bIsvRcPv0',
  'the odyssey': 'f_bKjZeJBBI',
  'peaky blinders: the immortal man': 'lcvUGs3xaDM',
  'the rip': 'yeR5bcbRPak',
  'project hail mary': 'm08TxIsFTRI',
  'avatar: fire and ash': 'nb_fFj_0rq8',
  'wake up dead man: a knives out mystery': '0hc8yz5-d5Y',
  'superman': 'Ox8ZLF6cGM0',
  'f1: the movie': '8yh9BPUBbbQ',
  'jurassic world rebirth': 'jan5CFWs9ic',
  'toy story 5': 'c51ND9Hdbw0',
  'michael': 'mbtgEE6rkxw',
  'dune: part two': 'Way9Dexny3w',
  'oppenheimer': 'uYPbbksJxIg',
  'interstellar': 'zSWdZVtXT7E',
  'arrival': 'tFMo3UJ4B4g',
  'the wild robot': '67vbA5ZJdKQ',
  'a quiet place': 'WR7cc5t7tv8',
  'get out': 'DzfpyUB60YY',
  'hereditary': 'V6wWKNij_1M',
  'mad max: fury road': 'hEJnMQG9ev8',
  'nobody': 'wZti8QKBWPo',
  'mission: impossible – fallout': 'wb49-oV0F78',
  'mission: impossible - fallout': 'wb49-oV0F78',
  "ocean's eleven": 'imm6OR605UI',
  'spider-man: into the spider-verse': 'g4Hbz2jLxvQ',
  'your name (kimi no na wa)': 'xU47nhruN-Q',
  'your name': 'xU47nhruN-Q',
  'severance': 'xEQP4VVuyrY',
  'silo': '8ZYhuvIv1pA',
  'chernobyl': 's9APLXM9Ei8',
  'dark': 'rrwycJ08PSA',
  'andor': 'cKOegEuCcfw',
  'breaking bad': 'HhesaQXLuRY',
  'stranger things': 'b9EkMc79ZSU',
  'the last of us': 'uLtkt8BonwM',
  'squid game': 'oqxAJKy0ii4'
};

const state = {
  mediaType: 'tv',
  language: 'all',
  provider: 'all',
  genre: 'all',
  languages: [],
  providers: [],
  genres: [],
  sortBy: 'trending',
  openDropdown: null,
  searchQuery: '',
  searchFilterTab: 'all', // 'all' | 'movie' | 'tv'
  lastSearchResults: [],
  tvPage: 0,
  currentPage: 1,
  curatedMovies: [],
  tvShowsCache: [],
  displayedItems: [],
  currentHero: null,
  currentModalItem: null,
  watchlist: [],
  showingWatchlist: false,
  discoverOffsets: {},
  autoFilledKeys: {},
  isLoadingMore: false,
  liveTrendingSynced: false
};

const els = {
  brandLogo: document.getElementById('brandLogo'),
  searchInput: document.getElementById('searchInput'),
  voiceSearchBtn: document.getElementById('voiceSearchBtn'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  searchDropdown: document.getElementById('searchDropdown'),
  quizNavBtn: document.getElementById('quizNavBtn'),
  surpriseNavBtn: document.getElementById('surpriseNavBtn'),
  compassQuickPickBtn: document.getElementById('compassQuickPickBtn'),
  heroCompanyOptions: document.getElementById('heroCompanyOptions'),
  heroQuizContinueBtn: document.getElementById('heroQuizContinueBtn'),
  languageChips: document.getElementById('languageChips'),
  compactFilterSystem: document.getElementById('compactFilterSystem'),
  langDropdownBtn: document.getElementById('langDropdownBtn'),
  langBtnValue: document.getElementById('langBtnValue'),
  langPopover: document.getElementById('langPopover'),
  langSearchInput: document.getElementById('langSearchInput'),
  langOptionsList: document.getElementById('langOptionsList'),
  langApplyBtn: document.getElementById('langApplyBtn'),
  platformDropdownBtn: document.getElementById('platformDropdownBtn'),
  platformBtnValue: document.getElementById('platformBtnValue'),
  platformPopover: document.getElementById('platformPopover'),
  platformSearchInput: document.getElementById('platformSearchInput'),
  platformOptionsList: document.getElementById('platformOptionsList'),
  platformApplyBtn: document.getElementById('platformApplyBtn'),
  genreDropdownBtn: document.getElementById('genreDropdownBtn'),
  genreBtnValue: document.getElementById('genreBtnValue'),
  genrePopover: document.getElementById('genrePopover'),
  genreSearchInput: document.getElementById('genreSearchInput'),
  genreOptionsList: document.getElementById('genreOptionsList'),
  genreApplyBtn: document.getElementById('genreApplyBtn'),
  sortDropdownBtn: document.getElementById('sortDropdownBtn'),
  sortBtnValue: document.getElementById('sortBtnValue'),
  sortPopover: document.getElementById('sortPopover'),
  sortOptionsList: document.getElementById('sortOptionsList'),
  sortApplyBtn: document.getElementById('sortApplyBtn'),
  activeFiltersBar: document.getElementById('activeFiltersBar'),
  activeFiltersList: document.getElementById('activeFiltersList'),
  compactTitlesCount: document.getElementById('compactTitlesCount'),
  filterSheetBackdrop: document.getElementById('filterSheetBackdrop'),
  watchlistNavBtn: document.getElementById('watchlistNavBtn'),
  watchlistCount: document.getElementById('watchlistCount'),
  watchlistStripCount: document.getElementById('watchlistStripCount'),
  openWatchlistStripBtn: document.getElementById('openWatchlistStripBtn'),
  mobileHeaderWatchlistBtn: document.getElementById('mobileHeaderWatchlistBtn'),
  mobileHeaderWatchlistCount: document.getElementById('mobileHeaderWatchlistCount'),
  heroBackdrop: document.getElementById('heroBackdrop'),
  heroTitle: document.getElementById('heroTitle'),
  heroRating: document.getElementById('heroRating'),
  heroYear: document.getElementById('heroYear'),
  heroGenre: document.getElementById('heroGenre'),
  heroDuration: document.getElementById('heroDuration'),
  heroOverview: document.getElementById('heroOverview'),
  heroTrailerBtn: document.getElementById('heroTrailerBtn'),
  heroDetailsBtn: document.getElementById('heroDetailsBtn'),
  heroWatchlistBtn: document.getElementById('heroWatchlistBtn'),
  mediaTypeToggle: document.getElementById('mediaTypeToggle'),
  languageSelect: document.getElementById('languageSelect'),
  providerChips: document.getElementById('providerChips'),
  genreChips: document.getElementById('genreChips'),
  gridTitle: document.getElementById('gridTitle'),
  moviesCount: document.getElementById('moviesCount'),
  watchlistNoticeBanner: document.getElementById('watchlistNoticeBanner'),
  searchResultTabs: document.getElementById('searchResultTabs'),
  moviesGrid: document.getElementById('moviesGrid'),
  moreMoviesSection: document.getElementById('moreMoviesSection'),
  moreGridTitle: document.getElementById('moreGridTitle'),
  moreMoviesCount: document.getElementById('moreMoviesCount'),
  moreMoviesGrid: document.getElementById('moreMoviesGrid'),
  paginationBar: document.getElementById('paginationBar'),
  infiniteLoadWrap: document.getElementById('infiniteLoadWrap'),
  infiniteLoadMoreBtn: document.getElementById('infiniteLoadMoreBtn'),
  infiniteLoadBtnText: document.getElementById('infiniteLoadBtnText'),
  infiniteLoadHint: document.getElementById('infiniteLoadHint'),
  loadMoreBtn: document.getElementById('loadMoreBtn'),
  movieModal: document.getElementById('movieModal'),
  modalCloseBtn: document.getElementById('modalCloseBtn'),
  modalBackdrop: document.getElementById('modalBackdrop'),
  modalPoster: document.getElementById('modalPoster'),
  modalTitle: document.getElementById('modalTitle'),
  modalRating: document.getElementById('modalRating'),
  modalYear: document.getElementById('modalYear'),
  modalRuntime: document.getElementById('modalRuntime'),
  modalGenres: document.getElementById('modalGenres'),
  modalOverview: document.getElementById('modalOverview'),
  modalRegionNote: document.getElementById('modalRegionNote'),
  watchProvidersList: document.getElementById('watchProvidersList'),
  modalFreshnessNote: document.getElementById('modalFreshnessNote'),
  officialWatchLink: document.getElementById('officialWatchLink'),
  reportDataIssueLink: document.getElementById('reportDataIssueLink'),
  modalCastList: document.getElementById('modalCastList'),
  modalSimilarSection: document.getElementById('modalSimilarSection'),
  modalSimilarList: document.getElementById('modalSimilarList'),
  modalTrailerBtn: document.getElementById('modalTrailerBtn'),
  modalWatchlistBtn: document.getElementById('modalWatchlistBtn'),
  modalShareBtn: document.getElementById('modalShareBtn'),
  quizModal: document.getElementById('quizModal'),
  quizCloseBtn: document.getElementById('quizCloseBtn'),
  quizMoodOptions: document.getElementById('quizMoodOptions'),
  quizRuntimeOptions: document.getElementById('quizRuntimeOptions'),
  quizFormatOptions: document.getElementById('quizFormatOptions'),
  quizLangOptions: document.getElementById('quizLangOptions'),
  runQuizBtn: document.getElementById('runQuizBtn'),
  quizResultsContainer: document.getElementById('quizResultsContainer'),
  trailerModal: document.getElementById('trailerModal'),
  trailerCloseBtn: document.getElementById('trailerCloseBtn'),
  trailerIframe: document.getElementById('trailerIframe'),
  trailerStatusLabel: document.getElementById('trailerStatusLabel'),
  switchTrailerBtn: document.getElementById('switchTrailerBtn'),
  externalTrailerLink: document.getElementById('externalTrailerLink'),
  cookieBanner: document.getElementById('cookieBanner'),
  acceptCookiesBtn: document.getElementById('cookieAcceptBtn'),
  declineCookiesBtn: document.getElementById('cookieDeclineBtn'),
  mobileNavHome: document.getElementById('mobileNavHome'),
  mobileNavSurprise: document.getElementById('mobileNavSurprise'),
  mobileNavWatchlist: document.getElementById('mobileNavWatchlist'),
  mobileWatchlistBadge: document.getElementById('mobileWatchlistBadge'),
  mobileNavTop: document.getElementById('mobileNavTop')
};

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtmlTags(html) {
  return String(html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function normalizeForFuzzy(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

// Fast Levenshtein distance for typo-tolerant local search (e.g. "sipderman" -> "spiderman")
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let j = 1; j <= b.length; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const tmp = dp[i];
      dp[i] = Math.min(dp[i] + 1, dp[i - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[a.length];
}

function fuzzyMatches(query, text) {
  const q = normalizeForFuzzy(query);
  const t = normalizeForFuzzy(text);
  if (!q) return false;
  if (t.includes(q)) return true;
  const qWords = q.split(' ').filter(w => w.length >= 3);
  const tWords = t.split(' ');
  if (!qWords.length) return false;
  return qWords.every(qw => tWords.some(tw => tw.includes(qw) || editDistance(qw, tw.slice(0, qw.length + 1)) <= (qw.length >= 6 ? 2 : 1)));
}

function trackEvent(eventName, params = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...params });
  } catch (_) {}
}

function loadSavedWatchlist() {
  try {
    const raw = localStorage.getItem('watchpulse_watchlist');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function saveWatchlist() {
  try {
    localStorage.setItem('watchpulse_watchlist', JSON.stringify(state.watchlist));
  } catch (_) {}
  updateWatchlistBadge();
}

function updateWatchlistBadge() {
  const count = String(state.watchlist.length);
  if (els.watchlistCount) els.watchlistCount.textContent = count;
  if (els.watchlistStripCount) els.watchlistStripCount.textContent = count;
  if (els.mobileHeaderWatchlistCount) els.mobileHeaderWatchlistCount.textContent = count;
  if (els.mobileWatchlistBadge) {
    els.mobileWatchlistBadge.textContent = count;
    els.mobileWatchlistBadge.classList.toggle('hidden', state.watchlist.length === 0);
  }
}

async function fetchCatalogApi(action, params = {}) {
  const qs = new URLSearchParams({ action, ...params });
  try {
    const res = await fetch(`${CATALOG_PROXY_URL}?${qs.toString()}`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch (_) {}

  if (action === 'tv-popular') {
    const page = params.page || 0;
    const res = await fetch(`https://api.tvmaze.com/shows?page=${page}`);
    if (!res.ok) throw new Error('TVmaze unavailable');
    return await res.json();
  }
  if (action === 'tv-search') {
    const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(params.q || '')}`);
    if (!res.ok) throw new Error('TVmaze search unavailable');
    return await res.json();
  }
  if (action === 'tv-details') {
    const res = await fetch(`https://api.tvmaze.com/shows/${encodeURIComponent(params.id)}?embed=cast`);
    if (!res.ok) throw new Error('TVmaze details unavailable');
    return await res.json();
  }
  if (action === 'wiki-search') {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent((params.q || '') + ' film')}&gsrlimit=8&prop=pageimages|extracts|pageprops&piprop=thumbnail&pithumbsize=500&pilicense=any&exintro=1&explaintext=1&exsentences=4&format=json&origin=*`);
    if (!res.ok) throw new Error('Wikipedia search unavailable');
    return await res.json();
  }
  if (action === 'movie-discover') {
    const gMap = { all: '2025 2026', '28': 'action', '878': 'science fiction', '18': 'drama', '35': 'comedy', '27': 'horror', '53': 'thriller', '16': 'animated', '10749': 'romantic' };
    const lMap = { all: '', en: 'American British', ko: 'South Korean', hi: 'Hindi Bollywood', ur: 'Pakistani Urdu', ja: 'Japanese', tr: 'Turkish', ta: 'Tamil', ml: 'Malayalam', de: 'German', es: 'Spanish', fr: 'French', ar: 'Arabic' };
    const pMap = { all: '', '8': 'Netflix', '9': 'Amazon Prime', '337': 'Disney', '350': 'Apple TV+', '1899': 'HBO Warner Bros' };
    const gTerm = gMap[params.genre] || '2025 2026';
    const lTerm = lMap[params.lang] || '';
    const pTerm = pMap[params.platform] || '';
    const offsetNum = Number(params.offset) || 0;
    const gsrOffset = offsetNum * 12;
    const qStr = ['hastemplate:"Infobox film"', lTerm, pTerm, gTerm, 'film'].filter(Boolean).join(' ');
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(qStr)}&gsrlimit=12&gsroffset=${gsrOffset}&prop=pageimages|extracts|pageprops&piprop=thumbnail&pithumbsize=500&pilicense=any&exintro=1&explaintext=1&exsentences=3&format=json&origin=*`);
    if (!res.ok) throw new Error('Wikipedia discover unavailable');
    const data = await res.json();
    const pages = (data && data.query && data.query.pages) ? Object.values(data.query.pages) : [];
    const results = pages
      .filter(p => p && p.title && !/\b(in film|filmography|list of|disambiguation|franchise|character|soundtrack|actress|actor|politician|singer|musician|director|producer|cricketer|journalist|biography)\b/i.test(p.title))
      .filter(p => Boolean((p.thumbnail && p.thumbnail.source) || VERIFIED_TRAILER_IDS[p.title.replace(/\s*\([^)]*film[^)]*\)/i, '').trim().toLowerCase()]))
      .sort((a, b) => (a.index || 99) - (b.index || 99))
      .map(p => {
        const cleanTitle = p.title.replace(/\s*\([^)]*film[^)]*\)/i, '').replace(/\s*\(\d{4}\s+[^)]*\)/i, '').trim();
        const yearMatch = (p.title + ' ' + (p.extract || '')).match(/\b(19|20)\d{2}\b/);
        const poster = (p.thumbnail && p.thumbnail.source) ? p.thumbnail.source.split('?')[0] : '';
        return {
          pageid: p.pageid,
          qid: (p.pageprops && p.pageprops.wikibase_item) || '',
          wikiTitle: p.title,
          title: cleanTitle,
          year: yearMatch ? yearMatch[0] : '2024',
          runtime: 115,
          overview: (p.extract || 'Discovered via WatchPulse Live Catalog.').trim(),
          poster,
          backdrop: poster,
          trailer_id: VERIFIED_TRAILER_IDS[cleanTitle.toLowerCase()] || '',
          officialUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`
        };
      });
    return { results, nextOffset: offsetNum + 1 };
  }
  if (action === 'movie-trending-live') {
    const curYear = new Date().getFullYear();
    const [itunesRes, hiRes, koRes] = await Promise.allSettled([
      fetch('https://itunes.apple.com/us/rss/topmovies/limit=8/json').then(r => r.ok ? r.json() : null),
      fetch(`https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(`incategory:"${curYear}_films" Hindi OR Bollywood`)}&gsrsort=incoming_links_desc&gsrlimit=3&prop=pageimages|extracts|pageprops&piprop=thumbnail&pithumbsize=500&pilicense=any&exintro=1&explaintext=1&exsentences=2&format=json&origin=*`).then(r => r.ok ? r.json() : null),
      fetch(`https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(`incategory:"${curYear}_films" Korean OR "South Korean"`)}&gsrsort=incoming_links_desc&gsrlimit=3&prop=pageimages|extracts|pageprops&piprop=thumbnail&pithumbsize=500&pilicense=any&exintro=1&explaintext=1&exsentences=2&format=json&origin=*`).then(r => r.ok ? r.json() : null)
    ]);
    const results = [];
    if (itunesRes.status === 'fulfilled' && itunesRes.value && itunesRes.value.feed && Array.isArray(itunesRes.value.feed.entry)) {
      itunesRes.value.feed.entry.forEach((e, idx) => {
        const rawName = (e && e['im:name'] && e['im:name'].label) ? e['im:name'].label : '';
        const cleanTitle = rawName.replace(/\s*\((19|20)\d{2}\)\s*$/i, '').trim();
        if (!cleanTitle) return;
        const yearMatch = (rawName + ' ' + ((e['im:releaseDate'] && e['im:releaseDate'].label) || '')).match(/\b(19|20)\d{2}\b/);
        const director = (e && e['im:artist'] && e['im:artist'].label) ? e['im:artist'].label : '';
        const summary = (e && e.summary && e.summary.label) ? e.summary.label : '';
        const imgs = (e && Array.isArray(e['im:image'])) ? e['im:image'] : [];
        const rawImg = imgs.length ? (imgs[imgs.length - 1].label || '') : '';
        const poster = rawImg ? rawImg.replace(/\/\d+x\d+bb\.(png|jpg)$/i, '/600x900bb.jpg') : '';
        const tid = VERIFIED_TRAILER_IDS[cleanTitle.toLowerCase()] || '';
        const ytThumb = tid ? getYtThumbUrl(tid, 'maxresdefault') : '';
        results.push({
          id: `live-trend-${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          media_type: 'movie',
          source: 'WatchPulse Live Trending',
          title: cleanTitle,
          year: yearMatch ? yearMatch[0] : String(curYear),
          runtime: 128,
          rating: Number((9.1 - Math.min(idx * 0.1, 0.9)).toFixed(1)),
          director,
          overview: summary || `${cleanTitle} — Trending worldwide today.`,
          editorial_note: `Trending Live Today (#${idx + 1} Global Chart)${director ? ' • Directed by ' + director : ''}.`,
          genres: ['Action', 'Drama'],
          genre_ids: [28, 18],
          language: 'en',
          languageLabel: 'English',
          platforms: ['Netflix', 'Prime Video', 'Apple TV+'],
          trailer_id: tid,
          poster: ytThumb || poster,
          backdrop: ytThumb || poster
        });
      });
    }
    const pushWikiIntl = (resObj, langCode, langLabel) => {
      if (resObj.status !== 'fulfilled' || !resObj.value || !resObj.value.query || !resObj.value.query.pages) return;
      const pages = Object.values(resObj.value.query.pages)
        .filter(p => p && p.title && !/\b(in film|filmography|list of|disambiguation)\b/i.test(p.title))
        .sort((a, b) => (a.index || 99) - (b.index || 99));
      const pick = pages[0];
      if (!pick) return;
      const cleanTitle = pick.title.replace(/\s*\([^)]*film[^)]*\)/i, '').replace(/\s*\(\d{4}\s+[^)]*\)/i, '').trim();
      const poster = (pick.thumbnail && pick.thumbnail.source) ? pick.thumbnail.source.split('?')[0] : '';
      const tid = VERIFIED_TRAILER_IDS[cleanTitle.toLowerCase()] || '';
      const ytThumb = tid ? getYtThumbUrl(tid, 'maxresdefault') : '';
      results.push({
        id: `live-trend-${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        qid: (pick.pageprops && pick.pageprops.wikibase_item) || '',
        wikiTitle: pick.title,
        media_type: 'movie',
        source: 'WatchPulse Live Trending',
        title: cleanTitle,
        year: String(curYear),
        runtime: 132,
        rating: 8.4,
        director: '',
        overview: (pick.extract || `${cleanTitle} (${curYear}) — Trending ${langLabel} release.`).trim(),
        editorial_note: `Trending Live (${curYear} ${langLabel} Release).`,
        genres: ['Drama', 'Thriller'],
        genre_ids: [18, 53],
        language: langCode,
        languageLabel: langLabel,
        platforms: ['Netflix', 'Prime Video'],
        trailer_id: tid,
        poster: ytThumb || poster,
        backdrop: ytThumb || poster
      });
    };
    pushWikiIntl(hiRes, 'hi', 'Hindi');
    pushWikiIntl(koRes, 'ko', 'Korean');
    return { results };
  }
  if (action === 'wiki-details') {
    throw new Error('Wiki details requires Cloudflare edge proxy');
  }
  throw new Error('Unknown catalog action');
}

function getTrailerIdForItem(item) {
  if (!item) return '';
  if (item.trailer_id) return item.trailer_id;
  return VERIFIED_TRAILER_IDS[(item.title || '').toLowerCase().trim()] || '';
}

function getYtThumbUrl(tid, variant = 'maxresdefault') {
  return tid ? `https://i.ytimg.com/vi/${encodeURIComponent(tid)}/${variant}.jpg` : '';
}

function getYtBackdropCss(tid) {
  return tid
    ? `url('${getYtThumbUrl(tid, 'maxresdefault')}'), url('${getYtThumbUrl(tid, 'mqdefault')}')`
    : '';
}

function getThumbUrlForItem(item) {
  if (!item) return '';
  if (item.poster) return item.poster;
  const tid = getTrailerIdForItem(item);
  if (tid) return getYtThumbUrl(tid, 'maxresdefault');
  return '';
}

function normalizeTvMazeShow(show) {
  if (!show) return null;
  const networkName = (show.webChannel && show.webChannel.name) || (show.network && show.network.name) || 'TV / Streaming';
  const year = show.premiered ? show.premiered.slice(0, 4) : 'TBA';
  const rating = show.rating && show.rating.average ? Number(show.rating.average) : 7.5;
  const genres = Array.isArray(show.genres) && show.genres.length ? show.genres : ['Drama'];
  const langMap = {
    English: 'en',
    Korean: 'ko',
    Hindi: 'hi',
    Japanese: 'ja',
    Spanish: 'es',
    French: 'fr',
    German: 'de',
    Malayalam: 'ml',
    Tamil: 'ta',
    Urdu: 'ur',
    Turkish: 'tr',
    Arabic: 'ar',
    Italian: 'it',
    Chinese: 'zh',
    Mandarin: 'zh'
  };
  const langCode = langMap[show.language] || 'en';
  const cast = show._embedded && Array.isArray(show._embedded.cast)
    ? show._embedded.cast.slice(0, 8).map(c => c.person && c.person.name).filter(Boolean)
    : [];
  const tid = VERIFIED_TRAILER_IDS[(show.name || '').toLowerCase().trim()] || '';

  return {
    id: `tvmaze-${show.id}`,
    tvmazeId: show.id,
    media_type: 'tv',
    source: 'TVmaze',
    title: show.name || 'Untitled Series',
    year,
    rating: Number(rating.toFixed(1)),
    runtime: show.averageRuntime || show.runtime || 45,
    genres,
    language: langCode,
    languageLabel: show.language || 'English',
    poster: show.image ? (show.image.medium || show.image.original) : '',
    backdrop: show.image ? (show.image.original || show.image.medium) : getYtThumbUrl(tid, 'maxresdefault'),
    trailer_id: tid,
    overview: stripHtmlTags(show.summary) || 'Explore episode schedule, primary streaming network details, and official trailers on WatchPulse.',
    platforms: [networkName],
    officialUrl: show.url || 'https://www.tvmaze.com',
    status: show.status || '',
    cast
  };
}

function normalizeCuratedMovie(m) {
  const tid = m.trailer_id || VERIFIED_TRAILER_IDS[(m.title || '').toLowerCase().trim()] || '';
  const thumb = getYtThumbUrl(tid, 'maxresdefault');
  return {
    id: m.id,
    media_type: 'movie',
    source: 'WatchPulse Curated',
    title: m.title,
    year: m.year,
    rating: m.rating,
    runtime: m.runtime,
    genres: m.genres || ['Drama'],
    genre_ids: m.genre_ids || [],
    moods: Array.isArray(m.moods) ? m.moods : [],
    language: m.language || 'en',
    languageLabel: LANGUAGE_NAMES[m.language] || 'English',
    director: m.director || '',
    cast: m.cast || [],
    platforms: m.platforms || [],
    overview: m.overview,
    editorial_note: m.editorial_note || '',
    guide_url: (m.guide_url || '/guides').replace(/\.html$/i, ''),
    guide_title: m.guide_title || 'WatchPulse Editorial Guides',
    accent: m.accent || 'teal',
    trailer_id: tid,
    poster: thumb,
    backdrop: thumb
  };
}

function renderEditorialPosterFallbackHtml(item) {
  const accent = escapeHtml(item.accent || 'violet');
  const typeTag = item.media_type === 'tv' ? 'TV SERIES' : 'FEATURE FILM';
  const genreTag = escapeHtml((item.genres && item.genres[0]) || 'Cinema');
  return `
    <div class="editorial-poster-art accent-${accent}">
      <div class="ep-center">
        <span class="ep-icon-ring" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>
        </span>
        <span class="ep-type-kicker">${typeTag} &bull; ${genreTag}</span>
      </div>
    </div>
  `;
}

function renderPosterArtHtml(item) {
  const thumb = getThumbUrlForItem(item) || item.poster || '';
  const hasTrailer = Boolean(getTrailerIdForItem(item));
  if (thumb) {
    return `
      <div class="curated-thumb-card">
        <img src="${escapeHtml(thumb)}" alt="" class="curated-thumb-backdrop" aria-hidden="true" loading="lazy" referrerpolicy="no-referrer">
        <img src="${escapeHtml(thumb)}" alt="${escapeHtml(item.title)} preview" class="curated-thumb-img" width="320" height="180" loading="lazy" referrerpolicy="no-referrer">
        <div class="curated-thumb-scrim"></div>
        ${hasTrailer ? `
          <div class="curated-thumb-play" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </div>
        ` : ''}
      </div>
    `;
  }
  return renderEditorialPosterFallbackHtml(item);
}

function renderHero(item) {
  if (!item) return;
  state.currentHero = item;
  if (els.heroBackdrop) {
    const tid = getTrailerIdForItem(item);
    const hasCustomBackdrop = Boolean(item.backdrop && !item.backdrop.includes('i.ytimg.com'));
    if (hasCustomBackdrop) {
      els.heroBackdrop.style.backgroundImage = `url('${item.backdrop}')`;
    } else if (tid) {
      els.heroBackdrop.style.backgroundImage = getYtBackdropCss(tid);
    } else {
      const bg = item.backdrop || getThumbUrlForItem(item);
      els.heroBackdrop.style.backgroundImage = bg
        ? `url('${bg}')`
        : 'linear-gradient(135deg, #2B1B5C 0%, #14131D 55%, #0C0B12 100%)';
    }
  }
  if (els.heroTitle) els.heroTitle.textContent = item.title;
  if (els.heroRating) els.heroRating.textContent = `Rating ${item.rating}`;
  if (els.heroYear) els.heroYear.textContent = item.year;
  if (els.heroGenre) els.heroGenre.textContent = (item.genres || []).slice(0, 2).join(' / ');
  if (els.heroDuration) {
    els.heroDuration.textContent = item.media_type === 'tv'
      ? (item.platforms[0] || 'TV Series')
      : (item.runtime ? `${item.runtime} min` : 'Feature Film');
  }
  if (els.heroOverview) els.heroOverview.textContent = item.editorial_note || item.overview;
  updateHeroWatchlistBtn();
}

function updateHeroWatchlistBtn() {
  if (!els.heroWatchlistBtn || !state.currentHero) return;
  const inList = state.watchlist.some(w => w.id === state.currentHero.id);
  els.heroWatchlistBtn.textContent = inList ? 'Saved in watchlist' : 'Add to watchlist';
}

function getActiveGenresList() {
  if (Array.isArray(state.genres) && state.genres.length) return state.genres;
  return state.genre && state.genre !== 'all' ? [String(state.genre)] : [];
}

function getActiveProvidersList() {
  if (Array.isArray(state.providers) && state.providers.length) return state.providers;
  return state.provider && state.provider !== 'all' ? [String(state.provider)] : [];
}

function getActiveLanguagesList() {
  if (Array.isArray(state.languages) && state.languages.length) return state.languages;
  return state.language && state.language !== 'all' ? [String(state.language)] : [];
}

function buildCatalogHeading() {
  if (state.showingWatchlist) return 'Your Private Watchlist';
  if (state.searchQuery) return `Search Results for "${state.searchQuery}"`;
  const typeLabel = state.mediaType === 'tv' ? 'Popular TV Series (Live via TVmaze)' : 'Curated Editorial Movies';
  const parts = [];
  const gList = getActiveGenresList().map(g => GENRE_MAP[g]).filter(Boolean);
  const pList = getActiveProvidersList().map(p => PROVIDER_NAMES[p]).filter(Boolean);
  const lList = getActiveLanguagesList().map(l => LANGUAGE_NAMES[l]).filter(Boolean);
  if (gList.length) parts.push(gList.join(', '));
  if (pList.length) parts.push(`on ${pList.join(', ')}`);
  if (lList.length) parts.push(lList.join(', '));
  if (state.sortBy && state.sortBy !== 'trending' && SORT_LABELS[state.sortBy]) {
    parts.push(SORT_LABELS[state.sortBy]);
  }
  return parts.length ? `${parts.join(' • ')} — ${typeLabel}` : typeLabel;
}

function renderSearchResultTabs() {
  if (!els.searchResultTabs) return;
  if (!state.searchQuery || !state.lastSearchResults.length) {
    els.searchResultTabs.classList.add('hidden');
    els.searchResultTabs.innerHTML = '';
    return;
  }
  const allCount = state.lastSearchResults.length;
  const movieCount = state.lastSearchResults.filter(x => x.media_type === 'movie').length;
  const tvCount = state.lastSearchResults.filter(x => x.media_type === 'tv').length;

  els.searchResultTabs.classList.remove('hidden');
  els.searchResultTabs.innerHTML = `
    <button type="button" class="search-tab-btn ${state.searchFilterTab === 'all' ? 'active' : ''}" data-stab="all">All (${allCount})</button>
    <button type="button" class="search-tab-btn ${state.searchFilterTab === 'movie' ? 'active' : ''}" data-stab="movie">Movies (${movieCount})</button>
    <button type="button" class="search-tab-btn ${state.searchFilterTab === 'tv' ? 'active' : ''}" data-stab="tv">TV Series (${tvCount})</button>
  `;
  els.searchResultTabs.querySelectorAll('[data-stab]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.searchFilterTab = btn.dataset.stab;
      renderSearchResultTabs();
      const filtered = state.searchFilterTab === 'all'
        ? state.lastSearchResults
        : state.lastSearchResults.filter(x => x.media_type === state.searchFilterTab);
      renderMoviesGrid(filtered);
      if (filtered.length) renderHero(filtered[0]);
    });
  });
}

function hideMoreMoviesSection() {
  if (els.moreMoviesSection) els.moreMoviesSection.classList.add('hidden');
  if (els.moreMoviesGrid) els.moreMoviesGrid.innerHTML = '';
  if (els.moviesGrid) els.moviesGrid.classList.remove('trending-grid');
}

function hidePaginationBar() {
  if (!els.paginationBar) return;
  els.paginationBar.classList.add('hidden');
  els.paginationBar.innerHTML = '';
}

function getPaginationNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = [1];
  if (currentPage > 3) pages.push('...');
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let p = start; p <= end; p++) pages.push(p);
  if (currentPage < totalPages - 2) pages.push('...');
  pages.push(totalPages);
  return pages;
}

function renderPaginationBar() {
  hidePaginationBar();
}

function renderCardListIntoGrid(gridEl, items, options = {}) {
  if (!gridEl) return;
  const showTrendingRank = Boolean(options.showTrendingRank);
  gridEl.classList.add('has-trailer-thumbs');

  gridEl.innerHTML = items.map((item, idx) => {
    const savedObj = state.watchlist.find(w => w.id === item.id);
    const isSaved = Boolean(savedObj);
    const isWatched = Boolean(savedObj && savedObj.watched);
    const primaryGenre = (item.genres && item.genres[0]) ? item.genres[0] : (item.media_type === 'tv' ? 'TV Series' : 'Feature Film');
    const secondaryGenre = (item.genres && item.genres[1]) ? item.genres[1] : '';
    const genrePair = [primaryGenre, secondaryGenre].filter(Boolean).join(' / ');
    const isEditorsPick = !showTrendingRank && (item.id === 'wp-dune-part-two' || (idx === 0 && Boolean(item.featured)));
    const tid = getTrailerIdForItem(item);

    const badgeHtml = showTrendingRank
      ? `<span class="trending-rank-badge ${idx < 3 ? 'rank-top' : ''}">#${idx + 1} Trending</span>`
      : (isEditorsPick ? '<span class="editors-pick-badge">Editor\u0027s Pick</span>' : `<span class="card-format-badge">${item.media_type === 'tv' ? 'TV Series' : 'Movie'}</span>`);

    const numRating = Number(item.rating);
    const ratingChipHtml = (!Number.isNaN(numRating) && numRating > 0)
      ? `<span class="card-rating-pill"><span class="star-glyph" aria-hidden="true">&#9733;</span> ${numRating.toFixed(1)}</span>`
      : `<span class="card-rating-pill">${item.media_type === 'tv' ? 'TV' : 'HD'}</span>`;

    const durationOrTypeText = item.media_type === 'tv'
      ? (item.runtime ? `~${item.runtime}m/ep` : 'Series')
      : (item.runtime ? `${item.runtime}m` : 'Feature');

    const langBadgeHtml = (item.language && item.language !== 'en' && item.languageLabel)
      ? `<span class="card-overlay-pill card-lang-pill">${escapeHtml(item.languageLabel)}</span>`
      : '';

    const primaryPlatform = (item.platforms && item.platforms[0])
      ? item.platforms[0].replace(/^Check Local Apps$/i, 'Streaming')
      : (item.media_type === 'tv' ? 'TV Network' : 'Streaming');

    const extraPlatformCount = (item.platforms && item.platforms.length > 1)
      ? ` +${item.platforms.length - 1}`
      : '';

    const snippetRaw = (item.editorial_note || item.overview || 'Explore cast, runtime, official trailer, and reference details on WatchPulse.').replace(/<[^>]*>/g, '').trim();
    const snippetText = snippetRaw.length > 130 ? `${snippetRaw.slice(0, 127).trim()}...` : snippetRaw;

    const bookmarkSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
    const playSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    const infoSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

    const actionPillHtml = tid
      ? `<button type="button" class="card-quick-trailer-btn" data-trailer-id="${escapeHtml(item.id)}" title="Watch official trailer for ${escapeHtml(item.title)}" aria-label="Watch trailer for ${escapeHtml(item.title)}">${playSvg}<span>Trailer</span></button>`
      : `<span class="card-quick-details-pill">${infoSvg}<span>Details</span></span>`;

    return `
      <article class="movie-card" style="--card-idx: ${Math.min(idx, 15)};" data-id="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="Open details for ${escapeHtml(item.title)}">
        <div class="card-poster-wrap is-trailer-thumb">
          ${renderPosterArtHtml(item)}
          ${badgeHtml}
          <button type="button" class="card-bookmark-btn ${isSaved ? 'active' : ''}" data-wl-id="${escapeHtml(item.id)}" title="${isSaved ? 'Remove from Watchlist' : 'Save to Watchlist'}" aria-label="${isSaved ? 'Remove from Watchlist' : 'Save to Watchlist'}">${bookmarkSvg}</button>
          <div class="card-poster-bottom-bar">
            <div class="card-poster-pills">
              ${ratingChipHtml}
              <span class="card-overlay-pill">${escapeHtml(durationOrTypeText)}</span>
              ${langBadgeHtml}
            </div>
            ${actionPillHtml}
          </div>
        </div>
        <div class="card-body">
          <div class="card-header-line">
            <h3 class="card-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h3>
            <span class="card-year-badge">${escapeHtml(item.year || '')}</span>
          </div>
          <div class="card-tags-row">
            <span class="card-platform-tag">${escapeHtml(primaryPlatform)}${escapeHtml(extraPlatformCount)}</span>
            <span class="card-genre-tag">${escapeHtml(genrePair)}</span>
          </div>
          <p class="card-synopsis">${escapeHtml(snippetText)}</p>
          ${state.showingWatchlist ? `
            <button type="button" class="watched-toggle-btn ${isWatched ? 'is-watched' : ''}" data-watched-id="${escapeHtml(item.id)}">
              ${isWatched ? 'Watched' : 'Mark as watched'}
            </button>
          ` : ''}
        </div>
      </article>
    `;
  }).join('');

  gridEl.querySelectorAll('.movie-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const wlBtn = e.target.closest('[data-wl-id]');
      if (wlBtn) {
        e.stopPropagation();
        const found = state.displayedItems.find(x => x.id === wlBtn.dataset.wlId);
        if (found) toggleWatchlist(found);
        return;
      }
      const trailerBtn = e.target.closest('[data-trailer-id]');
      if (trailerBtn) {
        e.stopPropagation();
        const found = state.displayedItems.find(x => x.id === trailerBtn.dataset.trailerId);
        if (found) openTrailerForItem(found);
        return;
      }
      const watchedBtn = e.target.closest('[data-watched-id]');
      if (watchedBtn) {
        e.stopPropagation();
        toggleWatchedStatus(watchedBtn.dataset.watchedId);
        return;
      }
      const found = state.displayedItems.find(x => x.id === card.dataset.id);
      if (found) openMovieModal(found);
    });
    card.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === card) {
        e.preventDefault();
        const found = state.displayedItems.find(x => x.id === card.dataset.id);
        if (found) openMovieModal(found);
      }
    });
    const thumbImg = card.querySelector('.curated-thumb-img');
    const backdropImg = card.querySelector('.curated-thumb-backdrop');
    if (thumbImg) {
      const handleBrokenOrPlaceholderThumb = () => {
        const item = state.displayedItems.find(x => x.id === card.dataset.id);
        const tid = getTrailerIdForItem(item);
        if (tid && !thumbImg.dataset.triedMq && !thumbImg.src.includes('/mqdefault.jpg')) {
          thumbImg.dataset.triedMq = '1';
          const mqUrl = `https://i.ytimg.com/vi/${encodeURIComponent(tid)}/mqdefault.jpg`;
          thumbImg.src = mqUrl;
          if (backdropImg) backdropImg.src = mqUrl;
          return;
        }
        const thumbCard = thumbImg.closest('.curated-thumb-card');
        if (thumbCard && item) {
          thumbCard.outerHTML = renderEditorialPosterFallbackHtml(item);
        }
      };
      thumbImg.addEventListener('error', handleBrokenOrPlaceholderThumb);
      thumbImg.addEventListener('load', () => {
        // YouTube's gray 3-dots placeholder image has naturalWidth === 120 and naturalHeight === 90
        if (thumbImg.naturalWidth > 0 && thumbImg.naturalWidth <= 120) {
          handleBrokenOrPlaceholderThumb();
          return;
        }
        // If portrait poster (e.g. TVmaze or Wikipedia portrait), fit cleanly inside 16:9 frame over blurred backdrop
        if (thumbImg.naturalHeight > thumbImg.naturalWidth * 1.05) {
          thumbImg.classList.add('is-portrait-fit');
          if (backdropImg) backdropImg.classList.add('is-active');
        }
      });
    }
  });
}

function renderMoviesGrid(items) {
  hideMoreMoviesSection();
  state.displayedItems = items;
  if (els.gridTitle) els.gridTitle.textContent = buildCatalogHeading();
  if (els.moviesCount) els.moviesCount.textContent = `Showing ${items.length} title${items.length === 1 ? '' : 's'}`;

  if (!items.length) {
    els.moviesGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem;">
        <h3 style="margin-bottom: 0.5rem;">No matching titles found</h3>
        <p style="color: var(--text-muted); margin-bottom: 1rem;">Try switching between Curated Movies &amp; Live TV Series, clearing a filter, or searching another title.</p>
        <button type="button" class="btn primary-btn" id="resetFiltersBtn">Reset Filters</button>
      </div>
    `;
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);
    return;
  }

  renderCardListIntoGrid(els.moviesGrid, items, { showTrendingRank: false });
}

function showLoadingGrid() {
  hideMoreMoviesSection();
  hidePaginationBar();
  els.moviesGrid.innerHTML = Array.from({ length: 8 }).map(() => `
    <div class="movie-card skeleton-card" style="opacity: 0.5;">
      <div class="card-poster-wrap" style="background: rgba(255,255,255,0.05);"></div>
      <div class="card-body"><div style="height: 14px; background: rgba(255,255,255,0.08); border-radius: 4px;"></div></div>
    </div>
  `).join('');
}

async function loadCuratedMovies() {
  if (state.curatedMovies.length) return state.curatedMovies;
  const res = await fetch(CURATED_CATALOG_URL);
  if (!res.ok) throw new Error('Unable to load curated catalog');
  const raw = await res.json();
  state.curatedMovies = raw.map(normalizeCuratedMovie);
  return state.curatedMovies;
}

async function loadTvCatalog(append = false) {
  if (!append && state.mediaType === 'tv') showLoadingGrid();
  try {
    const rawShows = await fetchCatalogApi('tv-popular', { page: state.tvPage });
    const normalized = rawShows
      .filter(s => s && s.image && s.rating && s.rating.average)
      .sort((a, b) => (b.weight || 0) - (a.weight || 0))
      .map(normalizeTvMazeShow)
      .filter(Boolean);

    if (append) {
      const existingIds = new Set(state.tvShowsCache.map(x => x.id));
      normalized.forEach(s => { if (!existingIds.has(s.id)) state.tvShowsCache.push(s); });
    } else {
      state.tvShowsCache = normalized;
    }

    if (!state.searchQuery && !state.showingWatchlist && state.mediaType === 'tv') applyLocalFiltersAndRender();
  } catch (err) {
    if (state.mediaType === 'tv') {
      els.moviesGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);">Could not reach TVmaze API right now. Try switching to Curated Movies or retrying.</div>`;
    }
  }
}

function matchesProvider(item, providerId) {
  if (providerId === 'all') return true;
  const target = (PROVIDER_NAMES[providerId] || '').toLowerCase();
  return (item.platforms || []).some(p => {
    const lp = p.toLowerCase();
    if (target.includes('hbo')) return lp.includes('max') || lp.includes('hbo');
    if (target === 'apple tv+') return lp.includes('apple');
    if (target === 'prime video') return lp.includes('prime') || lp.includes('amazon');
    return lp.includes(target);
  });
}

function matchesGenre(item, genreId) {
  if (genreId === 'all') return true;
  const targetName = (GENRE_MAP[genreId] || '').toLowerCase();
  if (Array.isArray(item.genre_ids) && item.genre_ids.includes(Number(genreId))) return true;
  if (String(genreId) === '10749' && Array.isArray(item.moods) && item.moods.includes('romantic')) return true;
  return (item.genres || []).some(g => {
    const lg = g.toLowerCase();
    if (targetName === 'sci-fi') return lg.includes('sci') || lg.includes('science');
    return lg.includes(targetName);
  });
}

function filterAndSortCatalogPool() {
  const pool = state.mediaType === 'tv' ? state.tvShowsCache : state.curatedMovies;
  const gList = getActiveGenresList();
  const pList = getActiveProvidersList();
  const lList = getActiveLanguagesList();

  const filtered = pool.filter(item => {
    if (gList.length && !gList.some(g => matchesGenre(item, g))) return false;
    if (pList.length && !pList.some(p => matchesProvider(item, p))) return false;
    if (lList.length && !lList.includes(item.language)) return false;
    return true;
  });

  if (state.sortBy === 'rating') {
    return [...filtered].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  }
  if (state.sortBy === 'newest') {
    return [...filtered].sort((a, b) => {
      const yDiff = (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0);
      return yDiff !== 0 ? yDiff : ((Number(b.rating) || 0) - (Number(a.rating) || 0));
    });
  }
  if (state.sortBy === 'runtime') {
    return [...filtered].sort((a, b) => (Number(a.runtime) || 999) - (Number(b.runtime) || 999));
  }
  return filtered;
}

function formatTriggerSummary(labels, emptyText, allowTwoNames = false) {
  if (!labels.length) return emptyText;
  if (labels.length === 1) return labels[0];
  if (labels.length === 2 && allowTwoNames) return `${labels[0]}, ${labels[1]}`;
  return `${labels[0]}, +${labels.length - 1}`;
}

function syncCompactFilterUI(matchingCount = 0) {
  const lList = getActiveLanguagesList();
  const pList = getActiveProvidersList();
  const gList = getActiveGenresList();

  state.language = lList.length === 1 ? lList[0] : (lList.length ? lList[0] : 'all');
  state.provider = pList.length === 1 ? pList[0] : (pList.length ? pList[0] : 'all');
  state.genre = gList.length === 1 ? gList[0] : (gList.length ? gList[0] : 'all');
  if (els.languageSelect) els.languageSelect.value = lList.length ? lList[0] : 'all';

  const langLabels = lList.map(code => LANGUAGE_NAMES[code]).filter(Boolean);
  const provLabels = pList.map(id => PROVIDER_NAMES[id]).filter(Boolean);
  const genreLabels = gList.map(id => GENRE_MAP[id]).filter(Boolean);

  if (els.langBtnValue) els.langBtnValue.textContent = formatTriggerSummary(langLabels, 'All', true);
  if (els.langDropdownBtn) {
    els.langDropdownBtn.classList.toggle('is-default', lList.length === 0);
    els.langDropdownBtn.classList.toggle('has-active', lList.length > 0);
  }

  if (els.platformBtnValue) els.platformBtnValue.textContent = formatTriggerSummary(provLabels, 'All', false);
  if (els.platformDropdownBtn) {
    els.platformDropdownBtn.classList.toggle('is-default', pList.length === 0);
    els.platformDropdownBtn.classList.toggle('has-active', pList.length > 0);
  }

  if (els.genreBtnValue) els.genreBtnValue.textContent = formatTriggerSummary(genreLabels, 'All genres', false);
  if (els.genreDropdownBtn) {
    els.genreDropdownBtn.classList.toggle('is-default', gList.length === 0);
    els.genreDropdownBtn.classList.toggle('has-active', gList.length > 0);
  }

  if (els.sortBtnValue) els.sortBtnValue.textContent = SORT_LABELS[state.sortBy] || 'Trending';
  if (els.sortDropdownBtn) {
    els.sortDropdownBtn.classList.toggle('is-default', state.sortBy === 'trending');
    els.sortDropdownBtn.classList.toggle('has-active', state.sortBy !== 'trending');
  }

  if (els.langOptionsList) {
    els.langOptionsList.querySelectorAll('.filter-check-row').forEach(row => {
      const val = row.dataset.val;
      const isChecked = val === 'all' ? lList.length === 0 : lList.includes(val);
      row.classList.toggle('checked', isChecked);
      row.setAttribute('aria-pressed', isChecked ? 'true' : 'false');
    });
  }

  if (els.platformOptionsList) {
    els.platformOptionsList.querySelectorAll('.filter-check-row').forEach(row => {
      const val = row.dataset.val;
      const isChecked = val === 'all' ? pList.length === 0 : pList.includes(val);
      row.classList.toggle('checked', isChecked);
      row.setAttribute('aria-pressed', isChecked ? 'true' : 'false');
    });
  }

  if (els.genreOptionsList) {
    els.genreOptionsList.querySelectorAll('.filter-check-row').forEach(row => {
      const val = row.dataset.val;
      const isChecked = val === 'all' ? gList.length === 0 : gList.includes(val);
      row.classList.toggle('checked', isChecked);
      row.setAttribute('aria-pressed', isChecked ? 'true' : 'false');
    });
  }

  if (els.sortOptionsList) {
    els.sortOptionsList.querySelectorAll('.filter-check-row').forEach(row => {
      const val = row.dataset.val;
      const isChecked = val === state.sortBy;
      row.classList.toggle('checked', isChecked);
      row.setAttribute('aria-pressed', isChecked ? 'true' : 'false');
    });
  }

  const totalActiveCount = lList.length + pList.length + gList.length + (state.sortBy !== 'trending' ? 1 : 0);
  const drawerBadgeEl = document.getElementById('drawerFilterCountBadge');
  const openDrawerBtnEl = document.getElementById('openFilterDrawerBtn');
  if (drawerBadgeEl) {
    drawerBadgeEl.textContent = String(totalActiveCount);
    drawerBadgeEl.classList.toggle('hidden', totalActiveCount === 0);
  }
  if (openDrawerBtnEl) {
    openDrawerBtnEl.classList.toggle('has-active', totalActiveCount > 0);
  }

  const countText = `Show ${matchingCount} title${matchingCount === 1 ? '' : 's'}`;
  [els.langApplyBtn, els.platformApplyBtn, els.genreApplyBtn, els.sortApplyBtn].forEach(btn => {
    if (btn) btn.textContent = countText;
  });

  if (els.compactTitlesCount) {
    els.compactTitlesCount.textContent = `${matchingCount} title${matchingCount === 1 ? '' : 's'}`;
  }

  if (els.activeFiltersBar && els.activeFiltersList) {
    const activeChips = [];
    lList.forEach(code => {
      if (LANGUAGE_NAMES[code]) activeChips.push({ group: 'language', val: code, label: LANGUAGE_NAMES[code] });
    });
    pList.forEach(id => {
      if (PROVIDER_NAMES[id]) activeChips.push({ group: 'platform', val: id, label: PROVIDER_NAMES[id] });
    });
    gList.forEach(id => {
      if (GENRE_MAP[id]) activeChips.push({ group: 'genre', val: id, label: GENRE_MAP[id] });
    });
    if (state.sortBy !== 'trending' && SORT_LABELS[state.sortBy]) {
      activeChips.push({ group: 'sort', val: state.sortBy, label: `Sort: ${SORT_LABELS[state.sortBy]}` });
    }

    if (activeChips.length > 0) {
      els.activeFiltersBar.classList.remove('hidden');
      els.activeFiltersList.innerHTML =
        `<span class="active-filters-label">Active:</span>` +
        activeChips.map(c => `
          <button type="button" class="active-filter-chip" data-remove-group="${escapeHtml(c.group)}" data-remove-val="${escapeHtml(c.val)}" aria-label="Remove ${escapeHtml(c.label)} filter">
            <span>${escapeHtml(c.label)}</span>
            <span class="chip-x" aria-hidden="true">&times;</span>
          </button>
        `).join('') +
        `<button type="button" class="clear-all-filters-btn" id="clearAllFiltersBtn">Clear all</button>`;

      els.activeFiltersList.querySelectorAll('[data-remove-group]').forEach(chip => {
        chip.addEventListener('click', () => {
          const grp = chip.dataset.removeGroup;
          const val = chip.dataset.removeVal;
          if (grp === 'language') state.languages = state.languages.filter(x => x !== val);
          else if (grp === 'platform') state.providers = state.providers.filter(x => x !== val);
          else if (grp === 'genre') state.genres = state.genres.filter(x => x !== val);
          else if (grp === 'sort') state.sortBy = 'trending';
          state.currentPage = 1;
          applyLocalFiltersAndRender();
        });
      });

      const clearAllBtn = document.getElementById('clearAllFiltersBtn');
      if (clearAllBtn) clearAllBtn.addEventListener('click', resetAllFilters);
    } else {
      els.activeFiltersBar.classList.add('hidden');
      els.activeFiltersList.innerHTML = '';
    }
  }
}

function getFilterSignature() {
  const g = getActiveGenresList()[0] || 'all';
  const l = getActiveLanguagesList()[0] || 'all';
  const p = getActiveProvidersList()[0] || 'all';
  return `${state.mediaType}|${g}|${l}|${p}`;
}

function updateInfiniteLoadBarUI() {
  if (!els.infiniteLoadWrap) return;
  if (state.showingWatchlist || state.searchQuery) {
    els.infiniteLoadWrap.classList.add('hidden');
    return;
  }
  els.infiniteLoadWrap.classList.remove('hidden');

  const gList = getActiveGenresList().map(g => GENRE_MAP[g]).filter(Boolean);
  const pList = getActiveProvidersList().map(p => PROVIDER_NAMES[p]).filter(Boolean);
  const lList = getActiveLanguagesList().map(l => LANGUAGE_NAMES[l]).filter(Boolean);
  const parts = [...lList.slice(0, 1), ...gList.slice(0, 1), ...pList.slice(0, 1)];
  const noun = state.mediaType === 'tv' ? 'TV Series' : 'Movies';
  const label = parts.length ? `Load More ${parts.join(' ')} ${noun}` : `Load More ${noun}`;

  if (els.infiniteLoadBtnText && !state.isLoadingMore) {
    els.infiniteLoadBtnText.textContent = label;
  }
}

async function loadMoreCategoryTitles(increaseVisibleLimit = true) {
  if (state.isLoadingMore) return;
  if (increaseVisibleLimit) {
    state.currentPage += 1;
  }
  const neededCount = state.currentPage * PAGE_SIZE;
  const currentFiltered = filterAndSortCatalogPool();

  // If we already have enough local titles buffered to show the next +30 batch, render immediately and only fetch API if running low
  if (increaseVisibleLimit && currentFiltered.length >= neededCount) {
    applyLocalFiltersAndRender();
    return;
  }

  state.isLoadingMore = true;
  if (els.infiniteLoadMoreBtn) els.infiniteLoadMoreBtn.disabled = true;
  if (els.infiniteLoadBtnText) els.infiniteLoadBtnText.textContent = 'Loading more verified titles...';

  try {
    const gList = getActiveGenresList();
    const lList = getActiveLanguagesList();
    const pList = getActiveProvidersList();
    const primaryGenre = gList[0] || 'all';
    const primaryLang = lList[0] || 'all';
    const primaryPlatform = pList[0] || 'all';
    const sig = getFilterSignature();

    if (state.mediaType === 'tv') {
      const existingIds = new Set(state.tvShowsCache.map(x => x.id));
      let addedMatches = 0;

      // Scan up to 3 TVmaze catalog pages or run a targeted TVmaze search for active filters
      for (let step = 0; step < 3 && addedMatches < 10; step++) {
        state.tvPage += 1;
        try {
          const rawShows = await fetchCatalogApi('tv-popular', { page: state.tvPage });
          const normalized = (Array.isArray(rawShows) ? rawShows : [])
            .filter(s => s && s.image && s.rating && s.rating.average)
            .sort((a, b) => (b.weight || 0) - (a.weight || 0))
            .map(normalizeTvMazeShow)
            .filter(Boolean);

          normalized.forEach(s => {
            if (!existingIds.has(s.id)) {
              existingIds.add(s.id);
              state.tvShowsCache.push(s);
              const matchesG = !gList.length || gList.some(g => matchesGenre(s, g));
              const matchesP = !pList.length || pList.some(p => matchesProvider(s, p));
              const matchesL = !lList.length || lList.includes(s.language);
              if (matchesG && matchesP && matchesL) addedMatches += 1;
            }
          });
        } catch (_) {
          break;
        }
      }

      if (addedMatches === 0 && (gList.length || pList.length || lList.length)) {
        const qParts = [
          lList[0] ? LANGUAGE_NAMES[lList[0]] : '',
          pList[0] ? PROVIDER_NAMES[pList[0]] : '',
          gList[0] ? GENRE_MAP[gList[0]] : ''
        ].filter(Boolean);
        if (qParts.length) {
          try {
            const searchRes = await fetchCatalogApi('tv-search', { q: qParts.join(' ') });
            if (Array.isArray(searchRes)) {
              searchRes.map(r => normalizeTvMazeShow(r && r.show)).filter(Boolean).forEach(s => {
                if (!existingIds.has(s.id)) {
                  if (gList.length && GENRE_MAP[primaryGenre] && !s.genres.includes(GENRE_MAP[primaryGenre])) {
                    s.genres = [GENRE_MAP[primaryGenre], ...s.genres];
                  }
                  if (pList.length && PROVIDER_NAMES[primaryPlatform]) {
                    s.platforms = [PROVIDER_NAMES[primaryPlatform], ...(s.platforms || [])];
                  }
                  if (lList.length) {
                    s.language = primaryLang;
                    s.languageLabel = LANGUAGE_NAMES[primaryLang] || s.languageLabel;
                  }
                  existingIds.add(s.id);
                  state.tvShowsCache.push(s);
                }
              });
            }
          } catch (_) {}
        }
      }
    } else {
      const currentOffset = state.discoverOffsets[sig] || 0;
      state.discoverOffsets[sig] = currentOffset + 1;

      const data = await fetchCatalogApi('movie-discover', {
        genre: primaryGenre,
        lang: primaryLang,
        platform: primaryPlatform,
        offset: currentOffset
      });

      const existingTitles = new Set(state.curatedMovies.map(m => normalizeForFuzzy(m.title)));
      const rawResults = (data && Array.isArray(data.results)) ? data.results : [];

      const activeGenreLabels = gList.map(g => GENRE_MAP[g]).filter(Boolean);
      const activeGenreIds = gList.map(g => Number(g)).filter(Boolean);
      const activePlatformLabels = pList.map(p => PROVIDER_NAMES[p]).filter(Boolean);
      const activeLangCode = primaryLang !== 'all' ? primaryLang : 'en';

      rawResults.forEach(w => {
        const normTitle = normalizeForFuzzy(w.title);
        if (!w || !w.title || !normTitle || existingTitles.has(normTitle)) return;
        if (/\b(actress|actor|politician|singer|musician|cricketer|journalist|biography)\b/i.test(w.title + ' ' + (w.overview || '').slice(0, 120))) return;

        const tid = w.trailer_id || VERIFIED_TRAILER_IDS[(w.title || '').toLowerCase()] || '';
        const poster = w.poster || (tid ? getYtThumbUrl(tid, 'mqdefault') : '');
        if (!poster && !tid) return;

        existingTitles.add(normTitle);

        state.curatedMovies.push({
          id: `discover-${w.pageid || w.qid || normTitle.replace(/\s+/g, '-')}`,
          qid: w.qid || '',
          wikiTitle: w.wikiTitle || w.title,
          media_type: 'movie',
          source: 'WatchPulse Live Catalog',
          title: w.title,
          year: w.year || '2024',
          rating: 7.9,
          runtime: Number(w.runtime) || 118,
          genres: activeGenreLabels.length ? activeGenreLabels : (Array.isArray(w.genres) && w.genres.length ? w.genres : ['Drama']),
          genre_ids: activeGenreIds.length ? activeGenreIds : (Array.isArray(w.genre_ids) && w.genre_ids.length ? w.genre_ids : [18]),
          moods: primaryGenre === '10749' ? ['romantic'] : [],
          language: activeLangCode,
          languageLabel: LANGUAGE_NAMES[activeLangCode] || 'English',
          director: w.director || '',
          cast: [],
          platforms: activePlatformLabels.length ? activePlatformLabels : (Array.isArray(w.platforms) && w.platforms.length ? w.platforms : ['Netflix', 'Prime Video']),
          overview: w.overview || 'Explore cast, director, runtime, and official trailer on WatchPulse.',
          editorial_note: '',
          guide_url: '/guides',
          guide_title: 'WatchPulse Discovery Guides',
          officialUrl: w.officialUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent((w.wikiTitle || w.title).replace(/ /g, '_'))}`,
          imdb_id: w.imdb_id || '',
          accent: 'violet',
          trailer_id: tid,
          poster,
          backdrop: poster,
          _detailsLoaded: false
        });
      });
    }
  } catch (_) {
  } finally {
    state.isLoadingMore = false;
    if (els.infiniteLoadMoreBtn) els.infiniteLoadMoreBtn.disabled = false;
    applyLocalFiltersAndRender();
  }
}

function applyLocalFiltersAndRender() {
  state.showingWatchlist = false;
  if (els.watchlistNoticeBanner) els.watchlistNoticeBanner.classList.add('hidden');
  if (els.searchResultTabs) els.searchResultTabs.classList.add('hidden');

  const filtered = filterAndSortCatalogPool();
  syncCompactFilterUI(filtered.length);
  updateInfiniteLoadBarUI();

  const sig = getFilterSignature();
  if (filtered.length < 8 && !state.autoFilledKeys[sig] && !state.isLoadingMore && !state.searchQuery) {
    state.autoFilledKeys[sig] = true;
    loadMoreCategoryTitles(false);
  }

  state.currentPage = Math.max(1, state.currentPage);
  const visibleLimit = state.currentPage * PAGE_SIZE;

  const hasActiveFilters =
    getActiveGenresList().length > 0 ||
    getActiveProvidersList().length > 0 ||
    getActiveLanguagesList().length > 0 ||
    state.sortBy !== 'trending';

  const isTrendingMoviesSplit =
    state.mediaType === 'movie' &&
    !state.searchQuery &&
    !state.showingWatchlist &&
    !hasActiveFilters &&
    filtered.length > TRENDING_MOVIE_COUNT;

  if (isTrendingMoviesSplit) {
    const trendingItems = filtered.slice(0, TRENDING_MOVIE_COUNT);
    const moreVisibleItems = filtered.slice(TRENDING_MOVIE_COUNT, visibleLimit);
    state.displayedItems = [...trendingItems, ...moreVisibleItems];

    if (els.gridTitle) els.gridTitle.textContent = 'Trending Movies';
    if (els.moviesCount) {
      els.moviesCount.textContent = state.liveTrendingSynced
        ? `Top ${trendingItems.length} \u00b7 Live Today`
        : `Top ${trendingItems.length}`;
    }
    if (els.moviesGrid) els.moviesGrid.classList.add('trending-grid');
    renderCardListIntoGrid(els.moviesGrid, trendingItems, { showTrendingRank: true });

    if (els.moreMoviesSection) els.moreMoviesSection.classList.remove('hidden');
    if (els.moreGridTitle) els.moreGridTitle.textContent = 'More Curated Movies';
    if (els.moreMoviesCount) {
      const startNum = TRENDING_MOVIE_COUNT + 1;
      const endNum = TRENDING_MOVIE_COUNT + moreVisibleItems.length;
      els.moreMoviesCount.textContent = `Showing ${startNum}\u2013${endNum} of ${filtered.length} titles`;
    }
    if (els.moreMoviesGrid) {
      els.moreMoviesGrid.classList.add('more-grid-5');
      renderCardListIntoGrid(els.moreMoviesGrid, moreVisibleItems, { showTrendingRank: false });
    }

    if (trendingItems.length && !state.searchQuery) renderHero(trendingItems[0]);
    if (els.loadMoreBtn) els.loadMoreBtn.classList.add('hidden');
    hidePaginationBar();
    return;
  }

  const visibleItems = filtered.slice(0, visibleLimit);
  renderMoviesGrid(visibleItems);
  if (els.moviesCount) {
    els.moviesCount.textContent = filtered.length
      ? `Showing 1\u2013${visibleItems.length} of ${filtered.length} titles`
      : 'Showing 0 titles';
  }
  if (visibleItems.length && !state.searchQuery) renderHero(visibleItems[0]);
  if (els.loadMoreBtn) els.loadMoreBtn.classList.add('hidden');
  hidePaginationBar();
}

function renderAutocompleteSuggestions(query, items) {
  if (!els.searchDropdown) return;
  if (!query) {
    const acSearchSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;color:var(--muted);" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
    els.searchDropdown.innerHTML = `<div class="dropdown-section-title" style="padding:0.5rem 0.8rem;">Popular Quick Searches</div>` +
      TRENDING_KEYWORDS.map(k => `<button type="button" class="ac-row" data-kw="${escapeHtml(k)}">${acSearchSvg}<span class="ac-title">${escapeHtml(k)}</span></button>`).join('');
    els.searchDropdown.classList.remove('hidden');
    els.searchDropdown.querySelectorAll('[data-kw]').forEach(btn => {
      btn.addEventListener('click', () => {
        els.searchInput.value = btn.dataset.kw;
        els.searchDropdown.classList.add('hidden');
        if (els.clearSearchBtn) els.clearSearchBtn.classList.remove('hidden');
        searchTitlesLive(btn.dataset.kw, true);
      });
    });
    return;
  }

  if (!items.length) {
    els.searchDropdown.classList.add('hidden');
    return;
  }

  els.searchDropdown.innerHTML = `<div class="dropdown-section-title" style="padding:0.45rem 0.8rem;">Instant Matches — Click to Open</div>` +
    items.slice(0, 6).map(item => {
      const thumb = getThumbUrlForItem(item);
      const thumbHtml = thumb
        ? `<img src="${escapeHtml(thumb)}" alt="" class="ac-thumb" loading="lazy">`
        : `<div class="ac-thumb" style="display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:var(--accent-3);">${item.media_type === 'tv' ? 'TV' : 'Film'}</div>`;
      return `
        <button type="button" class="ac-row" data-ac-id="${escapeHtml(item.id)}">
          ${thumbHtml}
          <div class="ac-meta">
            <span class="ac-title">${escapeHtml(item.title)}</span>
            <span class="ac-sub">${escapeHtml(item.year)} \u00b7 Rating ${escapeHtml(item.rating)} \u00b7 ${escapeHtml((item.platforms && item.platforms[0]) || item.source)}</span>
          </div>
          <span class="ac-type-pill">${item.media_type === 'tv' ? 'TV' : 'Film'}</span>
        </button>
      `;
    }).join('');

  els.searchDropdown.classList.remove('hidden');
  els.searchDropdown.querySelectorAll('[data-ac-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const picked = items.find(x => x.id === btn.dataset.acId);
      els.searchDropdown.classList.add('hidden');
      if (picked) openMovieModal(picked);
    });
  });
}

async function searchTitlesLive(query, scrollToGrid = false) {
  state.searchQuery = query.trim();
  state.searchFilterTab = 'all';
  state.showingWatchlist = false;
  if (els.watchlistNoticeBanner) els.watchlistNoticeBanner.classList.add('hidden');

  if (!state.searchQuery) {
    state.lastSearchResults = [];
    if (els.searchResultTabs) els.searchResultTabs.classList.add('hidden');
    applyLocalFiltersAndRender();
    return;
  }

  showLoadingGrid();
  if (els.loadMoreBtn) els.loadMoreBtn.classList.add('hidden');
  if (els.infiniteLoadWrap) els.infiniteLoadWrap.classList.add('hidden');

  const qLower = normalizeForFuzzy(state.searchQuery);

  // 1. Typo-tolerant match against WatchPulse's 44 curated movies + cached TV shows
  const curatedHits = state.curatedMovies.filter(m =>
    fuzzyMatches(state.searchQuery, `${m.title} ${m.director} ${(m.genres || []).join(' ')}`)
  );

  // 2. Parallel Wikipedia Open Film Search + TVmaze Live TV Search
  const [wikiRes, tvRes] = await Promise.allSettled([
    fetchCatalogApi('wiki-search', { q: state.searchQuery }),
    fetchCatalogApi('tv-search', { q: state.searchQuery })
  ]);

  let wikiHits = [];
  const existingTitles = new Set(curatedHits.map(x => normalizeForFuzzy(x.title)));
  if (wikiRes.status === 'fulfilled' && wikiRes.value) {
    // 1. Upgraded Cloudflare Edge Wikipedia + Wikidata enriched results
    if (Array.isArray(wikiRes.value.results)) {
      wikiHits = wikiRes.value.results
        .filter(w => w && w.title && !existingTitles.has(normalizeForFuzzy(w.title)))
        .map(w => ({
          id: `wiki-${w.pageid || w.qid || normalizeForFuzzy(w.title)}`,
          qid: w.qid || '',
          wikiTitle: w.wikiTitle || w.title,
          media_type: 'movie',
          source: 'Wikipedia & Wikidata',
          title: w.title,
          year: w.year || 'Film',
          rating: 'Film',
          runtime: w.runtime || 0,
          genres: ['Feature Film'],
          language: 'en',
          languageLabel: 'Global',
          director: w.director || '',
          cast: [],
          platforms: w.director ? [`Dir. ${w.director}`] : ['Check Local Apps'],
          overview: w.overview || w.description || 'Click to load full cast, director, runtime, and trailer details.',
          officialUrl: w.officialUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent((w.wikiTitle || w.title).replace(/ /g, '_'))}`,
          imdb_id: w.imdb_id || '',
          accent: 'indigo',
          trailer_id: w.trailer_id || VERIFIED_TRAILER_IDS[(w.title || '').toLowerCase()] || '',
          poster: w.poster || '',
          backdrop: w.backdrop || w.poster || '',
          _detailsLoaded: false
        }));
    } else if (wikiRes.value.query && wikiRes.value.query.pages) {
      // 2. Direct browser fallback (generator=search)
      const pages = Object.values(wikiRes.value.query.pages)
        .sort((a, b) => (a.index || 99) - (b.index || 99));
      wikiHits = pages
        .filter(p => p && p.title && !/\b(in film|filmography|list of|disambiguation)\b/i.test(p.title))
        .map(p => {
          const cleanTitle = p.title.replace(/\s*\([^)]*film[^)]*\)/i, '').trim();
          const yearMatch = (p.title + ' ' + (p.extract || '')).match(/\b(19|20)\d{2}\b/);
          const poster = (p.thumbnail && p.thumbnail.source) ? p.thumbnail.source.split('?')[0] : '';
          return {
            id: `wiki-${p.pageid}`,
            qid: (p.pageprops && p.pageprops.wikibase_item) || '',
            wikiTitle: p.title,
            media_type: 'movie',
            source: 'Wikipedia & Wikidata',
            title: cleanTitle,
            year: yearMatch ? yearMatch[0] : 'Film',
            rating: 'Film',
            runtime: 0,
            genres: ['Feature Film'],
            language: 'en',
            languageLabel: 'Global',
            director: '',
            cast: [],
            platforms: ['Check Local Apps'],
            overview: (p.extract || '').trim() || 'Open film summary via Wikipedia.',
            officialUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
            accent: 'indigo',
            trailer_id: VERIFIED_TRAILER_IDS[cleanTitle.toLowerCase()] || '',
            poster,
            backdrop: poster,
            _detailsLoaded: false
          };
        })
        .filter(w => w.title && !existingTitles.has(normalizeForFuzzy(w.title)))
        .slice(0, 6);
    }
  }

  let tvHits = [];
  if (tvRes.status === 'fulfilled' && Array.isArray(tvRes.value)) {
    tvHits = tvRes.value.slice(0, 8).map(r => normalizeTvMazeShow(r.show)).filter(Boolean);
  }

  const allCombined = [...curatedHits, ...tvHits, ...wikiHits];
  const scoreItem = (it) => {
    const t = normalizeForFuzzy(it.title);
    let score = 0;
    if (t === qLower) score += 120;
    else if (t.startsWith(qLower)) score += 90;
    else if (t.includes(qLower)) score += 70;
    else score += 30;
    if (it.source === 'WatchPulse Curated') score += 25;
    if (it.poster || it.trailer_id) score += 10;
    return score;
  };
  const combined = allCombined.sort((a, b) => scoreItem(b) - scoreItem(a));

  state.lastSearchResults = combined;
  renderSearchResultTabs();
  renderMoviesGrid(combined);
  if (combined.length) renderHero(combined[0]);
  if (!scrollToGrid && document.activeElement === els.searchInput) {
    renderAutocompleteSuggestions(state.searchQuery, combined);
  } else if (scrollToGrid && els.gridTitle) {
    els.gridTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  trackEvent('watchpulse_search', { query: state.searchQuery, results: combined.length });
}

function populateMovieModalContent(detailed, isLoadingDetails = false) {
  const thumb = getThumbUrlForItem(detailed);
  const tid = getTrailerIdForItem(detailed);
  if (els.modalBackdrop) {
    const hasCustomBackdrop = Boolean(detailed.backdrop && !detailed.backdrop.includes('i.ytimg.com'));
    if (hasCustomBackdrop) {
      els.modalBackdrop.style.backgroundImage = `url('${detailed.backdrop}')`;
    } else if (tid) {
      els.modalBackdrop.style.backgroundImage = getYtBackdropCss(tid);
    } else {
      const bg = detailed.backdrop || thumb;
      els.modalBackdrop.style.backgroundImage = bg
        ? `url('${bg}')`
        : 'linear-gradient(135deg, #2B1B5C 0%, #14131D 60%, #0C0B12 100%)';
    }
  }
  if (els.modalPoster) {
    if (thumb) {
      const isYt = thumb.includes('i.ytimg.com');
      els.modalPoster.classList.toggle('is-trailer-thumb', isYt);
      els.modalPoster.dataset.triedMq = '';
      els.modalPoster.onerror = () => {
        if (tid && !els.modalPoster.dataset.triedMq) {
          els.modalPoster.dataset.triedMq = '1';
          els.modalPoster.src = getYtThumbUrl(tid, 'mqdefault');
        }
      };
      els.modalPoster.referrerPolicy = 'no-referrer';
      els.modalPoster.src = thumb;
      els.modalPoster.style.display = 'block';
      els.modalPoster.alt = `${detailed.title} poster`;
    } else {
      els.modalPoster.style.display = 'none';
    }
  }
  if (els.modalTitle) els.modalTitle.textContent = detailed.title;
  if (els.modalRating) {
    els.modalRating.textContent = typeof detailed.rating === 'number'
      ? `Rating ${detailed.rating}`
      : (detailed.country ? `${detailed.country}` : 'Feature Film');
  }
  if (els.modalYear) els.modalYear.textContent = detailed.year || 'Film';
  if (els.modalRuntime) {
    els.modalRuntime.textContent = detailed.runtime
      ? (detailed.media_type === 'tv' ? `~${detailed.runtime}m / ep` : `${detailed.runtime} min`)
      : (detailed.languageLabel || 'Feature Film');
  }
  if (els.modalGenres) {
    const gList = (detailed.genres || []).join(', ');
    els.modalGenres.textContent = detailed.director ? `${gList} • Dir. ${detailed.director}` : gList;
  }
  if (els.modalOverview) {
    els.modalOverview.textContent = detailed.editorial_note
      ? `${detailed.overview} — WatchPulse Note: ${detailed.editorial_note}`
      : detailed.overview;
  }

  if (els.modalRegionNote) {
    els.modalRegionNote.textContent = detailed.media_type === 'tv'
      ? 'Original Network Tag (TVmaze — regional rights vary)'
      : detailed.source === 'Wikipedia & Wikidata'
        ? 'Distributors & Reference Links (Wikipedia & Wikidata)'
        : 'WatchPulse Editorial Tag (check your local streaming app)';
  }

  if (els.watchProvidersList) {
    const pills = (detailed.platforms || []).map(p => `<span class="provider-pill">${escapeHtml(p)}</span>`).join('');
    const imdbBtn = detailed.imdb_id
      ? `<a href="https://www.imdb.com/title/${encodeURIComponent(detailed.imdb_id)}/" target="_blank" rel="noopener noreferrer" class="provider-pill imdb-pill" style="text-decoration: none;">IMDb Profile ↗</a>`
      : '';
    const guideBtn = detailed.guide_url
      ? `<a href="${escapeHtml(detailed.guide_url.replace(/\.html$/i, ''))}" class="provider-pill" style="border-color: var(--accent-cyan); color: var(--accent-cyan); text-decoration: none;">Read: ${escapeHtml(detailed.guide_title)} →</a>`
      : '';
    els.watchProvidersList.innerHTML = `<div class="provider-tier-group"><div class="provider-tier-pills">${pills}${imdbBtn}${guideBtn}</div></div>`;
  }

  if (els.modalFreshnessNote) {
    els.modalFreshnessNote.textContent = detailed.source === 'TVmaze'
      ? 'TV metadata & artwork via TVmaze (CC BY-SA)'
      : detailed.source === 'Wikipedia & Wikidata'
        ? 'Film profile via Wikipedia (CC BY-SA) & Wikidata (CC0 Public Domain)'
        : 'Curated by WatchPulse Editorial — verify playback inside your streaming app';
  }

  if (els.officialWatchLink) {
    els.officialWatchLink.href = (detailed.officialUrl || detailed.guide_url || '/guides').replace(/\.html$/i, '');
    els.officialWatchLink.textContent = detailed.source === 'TVmaze'
      ? 'View Episode Guide on TVmaze ↗'
      : detailed.source === 'Wikipedia & Wikidata'
        ? 'Read Full Film Article on Wikipedia ↗'
        : 'Open Matching WatchPulse Guide →';
  }

  if (els.reportDataIssueLink) {
    els.reportDataIssueLink.href = `/contact?subject=bug&title=${encodeURIComponent(detailed.title)}`;
  }

  if (els.modalCastList) {
    if (isLoadingDetails && (!detailed.cast || !detailed.cast.length)) {
      els.modalCastList.innerHTML = `<span class="cast-pill" style="opacity:0.75;">Loading full cast, director &amp; details...</span>`;
    } else {
      const chips = [];
      if (detailed.director) chips.push(`<span class="cast-pill" style="border-color:var(--accent-cyan);color:var(--accent-cyan);">Dir. ${escapeHtml(detailed.director)}</span>`);
      if (detailed.cast && detailed.cast.length) {
        detailed.cast.forEach(name => chips.push(`<span class="cast-pill">${escapeHtml(name)}</span>`));
      }
      els.modalCastList.innerHTML = chips.length
        ? chips.join('')
        : `<span class="cast-pill">See official reference link above</span>`;
    }
  }

  if (els.modalSimilarSection && els.modalSimilarList) {
    const pool = detailed.media_type === 'tv' ? state.tvShowsCache : state.curatedMovies;
    const primaryGenre = (detailed.genres && detailed.genres[0]) || '';
    let similar = pool.filter(x => x.id !== detailed.id && (x.genres || []).some(g => g.toLowerCase().includes(primaryGenre.toLowerCase()))).slice(0, 4);
    if (!similar.length) similar = pool.filter(x => x.id !== detailed.id).slice(0, 4);
    if (similar.length) {
      els.modalSimilarSection.classList.remove('hidden');
      els.modalSimilarList.innerHTML = similar.map(s => `
        <button type="button" class="similar-chip" data-sim-id="${escapeHtml(s.id)}" style="padding:0.5rem 0.8rem;border-radius:8px;border:1px solid var(--border-color);background:var(--card-inset-bg);color:var(--text-main);cursor:pointer;font-size:0.8rem;text-align:left;">
          <strong>${escapeHtml(s.title)}</strong> (${escapeHtml(s.year)})
        </button>
      `).join('');
      els.modalSimilarList.querySelectorAll('[data-sim-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          const next = pool.find(x => x.id === btn.dataset.simId);
          if (next) openMovieModal(next);
        });
      });
    } else {
      els.modalSimilarSection.classList.add('hidden');
    }
  }

  updateModalWatchlistBtn();
}

async function openMovieModal(item) {
  state.currentModalItem = item;
  const needsTvDetails = Boolean(item.media_type === 'tv' && item.tvmazeId && (!item.cast || !item.cast.length));
  const needsWikiDetails = Boolean(item.media_type === 'movie' && item.qid && !item._detailsLoaded);

  // Open immediately so the UI feels instant, then hydrate full live cast/director/runtime/genres/trailer
  populateMovieModalContent(item, needsTvDetails || needsWikiDetails);
  els.movieModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (needsTvDetails) {
    try {
      const fullShow = await fetchCatalogApi('tv-details', { id: item.tvmazeId });
      const hydrated = normalizeTvMazeShow(fullShow);
      if (hydrated && state.currentModalItem && state.currentModalItem.id === item.id) {
        Object.assign(item, hydrated, { _detailsLoaded: true });
        state.currentModalItem = item;
        populateMovieModalContent(item, false);
      }
    } catch (_) {
      if (state.currentModalItem && state.currentModalItem.id === item.id) populateMovieModalContent(item, false);
    }
  } else if (needsWikiDetails) {
    try {
      const wd = await fetchCatalogApi('wiki-details', { id: item.qid, title: item.wikiTitle || item.title });
      if (wd && state.currentModalItem && state.currentModalItem.id === item.id) {
        Object.assign(item, {
          overview: wd.overview || item.overview,
          year: wd.year || item.year,
          runtime: wd.runtime || item.runtime,
          director: wd.director || item.director,
          cast: (Array.isArray(wd.cast) && wd.cast.length) ? wd.cast : item.cast,
          genres: (Array.isArray(wd.genres) && wd.genres.length) ? wd.genres : item.genres,
          platforms: (Array.isArray(wd.platforms) && wd.platforms.length) ? wd.platforms : item.platforms,
          languageLabel: wd.languageLabel || item.languageLabel,
          country: wd.country || item.country || '',
          trailer_id: wd.trailer_id || item.trailer_id,
          imdb_id: wd.imdb_id || item.imdb_id || '',
          poster: wd.poster || item.poster,
          backdrop: wd.backdrop || item.backdrop,
          _detailsLoaded: true
        });
        state.currentModalItem = item;
        populateMovieModalContent(item, false);
      }
    } catch (_) {
      if (state.currentModalItem && state.currentModalItem.id === item.id) populateMovieModalContent(item, false);
    }
  }
}

function closeMovieModal() {
  if (els.movieModal) els.movieModal.classList.add('hidden');
  document.body.style.overflow = '';
}

function updateModalWatchlistBtn() {
  if (!els.modalWatchlistBtn || !state.currentModalItem) return;
  const inList = state.watchlist.some(w => w.id === state.currentModalItem.id);
  const labelSpan = els.modalWatchlistBtn.querySelector('span');
  if (labelSpan) labelSpan.textContent = inList ? 'Saved in Watchlist' : 'Bookmark to Watchlist';
  else els.modalWatchlistBtn.textContent = inList ? 'Saved in Watchlist' : 'Bookmark to Watchlist';
}

function toggleWatchlist(item) {
  const idx = state.watchlist.findIndex(w => w.id === item.id);
  if (idx >= 0) state.watchlist.splice(idx, 1);
  else state.watchlist.unshift({ ...item, watched: false });
  saveWatchlist();
  updateHeroWatchlistBtn();
  updateModalWatchlistBtn();
  if (state.showingWatchlist) renderMoviesGrid(state.watchlist);
  else if (state.searchQuery) renderMoviesGrid(state.displayedItems);
  else applyLocalFiltersAndRender();
}

function toggleWatchedStatus(id) {
  const target = state.watchlist.find(w => w.id === id);
  if (!target) return;
  target.watched = !target.watched;
  saveWatchlist();
  if (state.showingWatchlist) renderMoviesGrid(state.watchlist);
}

const trailerPlayerState = {
  ids: [],
  idx: 0,
  title: ''
};

function renderEmbeddedTrailerId(videoId, title) {
  const fallbackBox = document.getElementById('trailerNoEmbedCard');
  if (fallbackBox) fallbackBox.style.display = 'none';
  if (els.trailerIframe) {
    els.trailerIframe.style.display = 'block';
    els.trailerIframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&modestbranding=1`;
  }
  if (els.externalTrailerLink) {
    els.externalTrailerLink.href = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
    els.externalTrailerLink.textContent = '↗ YouTube';
  }
  if (els.trailerStatusLabel) {
    const pos = trailerPlayerState.ids.length > 1 ? ` (Source ${trailerPlayerState.idx + 1}/${trailerPlayerState.ids.length})` : '';
    els.trailerStatusLabel.textContent = `Playing "${title}" official trailer on WatchPulse${pos}`;
  }
  if (els.switchTrailerBtn) {
    els.switchTrailerBtn.classList.toggle('hidden', trailerPlayerState.ids.length <= 1);
  }
}

function showTrailerOverlayBox(html) {
  if (!els.trailerIframe) return;
  const videoWrap = els.trailerIframe.parentElement;
  els.trailerIframe.src = '';
  els.trailerIframe.style.display = 'none';
  let box = document.getElementById('trailerNoEmbedCard');
  if (!box && videoWrap) {
    box = document.createElement('div');
    box.id = 'trailerNoEmbedCard';
    box.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.85rem;padding:1.5rem;text-align:center;background:radial-gradient(circle at top,#2B1B5C 0%,#0C0B12 75%);color:#F3F4F7;';
    videoWrap.appendChild(box);
  }
  if (box) {
    box.style.display = 'flex';
    box.innerHTML = html;
  }
}

async function openTrailerForItem(item) {
  if (!item || !els.trailerModal) return;

  const yearStr = /^\d{4}$/.test(String(item.year || '')) ? item.year : '';
  const searchQuery = `${item.title} ${yearStr} ${item.media_type === 'tv' ? 'official series trailer' : 'official trailer'}`.replace(/\s+/g, ' ').trim();
  const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

  trailerPlayerState.title = item.title;
  trailerPlayerState.idx = 0;

  // Open modal RIGHT ON WATCHPULSE immediately!
  els.trailerModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  if (els.switchTrailerBtn) els.switchTrailerBtn.classList.add('hidden');
  if (els.externalTrailerLink) {
    els.externalTrailerLink.href = ytSearchUrl;
    els.externalTrailerLink.textContent = '↗ YouTube';
  }

  const knownKey = getTrailerIdForItem(item);
  if (knownKey) {
    const existingList = Array.isArray(item._trailerCandidates) && item._trailerCandidates.length
      ? item._trailerCandidates
      : [knownKey];
    trailerPlayerState.ids = existingList;
    renderEmbeddedTrailerId(knownKey, item.title);
    trackEvent('watchpulse_trailer_click', { title: item.title, embedded: true });

    // Silently load alternate trailer IDs in background so "Alternate Trailer" works if studio disabled embed
    if (existingList.length === 1) {
      fetchCatalogApi('trailer-search', { q: searchQuery }).then(res => {
        if (res && Array.isArray(res.ids) && res.ids.length) {
          const merged = [knownKey, ...res.ids.filter(id => id !== knownKey)];
          item._trailerCandidates = merged;
          if (trailerPlayerState.title === item.title) {
            trailerPlayerState.ids = merged;
            if (els.switchTrailerBtn) els.switchTrailerBtn.classList.toggle('hidden', merged.length <= 1);
          }
        }
      }).catch(() => {});
    }
    return;
  }

  // No pre-cached trailer ID yet -> resolve live on Cloudflare Edge & embed directly inside WatchPulse!
  if (els.trailerStatusLabel) els.trailerStatusLabel.textContent = `Loading official trailer for "${item.title}"...`;
  showTrailerOverlayBox(`
    <h3 style="margin:0;font-size:1.1rem;">Finding Official HD Trailer...</h3>
    <p style="margin:0;max-width:400px;font-size:0.85rem;color:var(--muted);">Loading "${escapeHtml(item.title)}" directly inside WatchPulse.</p>
  `);

  try {
    const res = await fetchCatalogApi('trailer-search', { q: searchQuery });
    const ids = (res && Array.isArray(res.ids)) ? res.ids.filter(Boolean) : [];
    // Only apply if modal is still open for this same title
    if (els.trailerModal.classList.contains('hidden') || trailerPlayerState.title !== item.title) return;

    if (ids.length) {
      item.trailer_id = ids[0];
      item._trailerCandidates = ids;
      trailerPlayerState.ids = ids;
      trailerPlayerState.idx = 0;
      renderEmbeddedTrailerId(ids[0], item.title);
      trackEvent('watchpulse_trailer_click', { title: item.title, embedded: true, resolvedLive: true });
      return;
    }
  } catch (_) {}

  // Official-channel verification fallback: if no verified studio/network trailer was found, link cleanly to YouTube
  if (els.trailerStatusLabel) els.trailerStatusLabel.textContent = `No verified official studio channel embed found for "${item.title}"`;
  showTrailerOverlayBox(`
    <h3 style="margin:0;font-size:1.15rem;">Official Trailer: ${escapeHtml(item.title)}</h3>
    <p style="margin:0;max-width:420px;font-size:0.86rem;color:var(--muted);">WatchPulse only embeds trailers from verified studio and network channels. Open YouTube to view official uploads:</p>
    <a href="${escapeHtml(ytSearchUrl)}" target="_blank" rel="noopener noreferrer" class="btn primary-btn" style="text-decoration:none;">Search Official Trailer on YouTube ↗</a>
  `);
  trackEvent('watchpulse_trailer_click', { title: item.title, embedded: false });
}

if (els.switchTrailerBtn) {
  els.switchTrailerBtn.addEventListener('click', () => {
    if (trailerPlayerState.ids.length <= 1) return;
    trailerPlayerState.idx = (trailerPlayerState.idx + 1) % trailerPlayerState.ids.length;
    renderEmbeddedTrailerId(trailerPlayerState.ids[trailerPlayerState.idx], trailerPlayerState.title);
  });
}

function closeTrailerModal() {
  if (els.trailerIframe) els.trailerIframe.src = '';
  if (els.trailerModal) els.trailerModal.classList.add('hidden');
  if (!els.movieModal || els.movieModal.classList.contains('hidden')) {
    document.body.style.overflow = '';
  }
}

function setupVoiceSearch() {
  if (!els.voiceSearchBtn) return;
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    els.voiceSearchBtn.style.display = 'none';
    return;
  }
  const recognition = new SpeechRec();
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  els.voiceSearchBtn.addEventListener('click', () => {
    try {
      els.voiceSearchBtn.classList.add('listening');
      recognition.start();
    } catch (_) {}
  });
  recognition.onresult = (event) => {
    const transcript = event.results && event.results[0] && event.results[0][0] ? event.results[0][0].transcript : '';
    if (transcript && els.searchInput) {
      els.searchInput.value = transcript;
      if (els.clearSearchBtn) els.clearSearchBtn.classList.remove('hidden');
      searchTitlesLive(transcript, true);
    }
  };
  recognition.onend = () => els.voiceSearchBtn.classList.remove('listening');
  recognition.onerror = () => els.voiceSearchBtn.classList.remove('listening');
}

function setMediaTypeUI(type) {
  state.mediaType = type;
  if (!els.mediaTypeToggle) return;
  els.mediaTypeToggle.querySelectorAll('.media-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
}

function closeAllFilterDropdowns() {
  state.openDropdown = null;
  [
    [els.langDropdownBtn, els.langPopover, els.langSearchInput, els.langOptionsList],
    [els.platformDropdownBtn, els.platformPopover, els.platformSearchInput, els.platformOptionsList],
    [els.genreDropdownBtn, els.genrePopover, els.genreSearchInput, els.genreOptionsList],
    [els.sortDropdownBtn, els.sortPopover, null, els.sortOptionsList]
  ].forEach(([btn, pop, searchInput, listEl]) => {
    if (btn) {
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
    if (pop) pop.classList.add('hidden');
    if (searchInput && searchInput.value) {
      searchInput.value = '';
      if (listEl) {
        listEl.querySelectorAll('.filter-check-row').forEach(r => { r.style.display = ''; });
      }
    }
  });
  if (els.filterSheetBackdrop) els.filterSheetBackdrop.classList.add('hidden');
}

function resetAllFilters() {
  state.genre = 'all';
  state.provider = 'all';
  state.language = 'all';
  state.genres = [];
  state.providers = [];
  state.languages = [];
  state.sortBy = 'trending';
  state.searchQuery = '';
  state.searchFilterTab = 'all';
  state.lastSearchResults = [];
  state.showingWatchlist = false;
  state.currentPage = 1;
  closeAllFilterDropdowns();
  if (els.searchInput) els.searchInput.value = '';
  if (els.clearSearchBtn) els.clearSearchBtn.classList.add('hidden');
  if (els.searchDropdown) els.searchDropdown.classList.add('hidden');
  if (els.searchResultTabs) els.searchResultTabs.classList.add('hidden');
  if (els.languageSelect) els.languageSelect.value = 'all';
  if (els.languageChips) {
    els.languageChips.querySelectorAll('.filter-pill').forEach(c => c.classList.toggle('active', c.dataset.lang === 'all'));
  }
  if (els.providerChips) {
    els.providerChips.querySelectorAll('.provider-chip').forEach(c => c.classList.toggle('active', c.dataset.provider === 'all'));
  }
  if (els.genreChips) {
    els.genreChips.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.genre === 'all'));
  }
  applyLocalFiltersAndRender();
}

function setupQuizOptionGroup(container) {
  if (!container) return;
  container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.quiz-opt-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}

function matchesQuizLanguage(item, langPref) {
  if (!langPref || langPref === 'all') return true;
  if (langPref === 'hi-ur') return item.language === 'hi' || item.language === 'ur';
  if (langPref === 'global') return item.language !== 'en';
  return item.language === langPref;
}

async function runFinderQuiz() {
  const moodBtn = els.quizMoodOptions && els.quizMoodOptions.querySelector('.selected');
  const runtimeBtn = els.quizRuntimeOptions && els.quizRuntimeOptions.querySelector('.selected');
  const formatBtn = els.quizFormatOptions && els.quizFormatOptions.querySelector('.selected');
  const langBtn = els.quizLangOptions && els.quizLangOptions.querySelector('.selected');

  const genreId = moodBtn ? moodBtn.dataset.genre : '53';
  const runtimeMode = runtimeBtn ? runtimeBtn.dataset.runtime : 'short';
  const format = formatBtn ? formatBtn.dataset.format : 'movie';
  const langPref = langBtn ? langBtn.dataset.lang : 'all';

  if (!state.tvShowsCache.length && (format === 'tv' || format === 'both' || format === 'anime' || format === 'miniseries')) {
    try { await loadTvCatalog(false); } catch (_) {}
  }

  let pool = [];
  if (format === 'tv') {
    pool = state.tvShowsCache.length ? state.tvShowsCache : state.curatedMovies;
  } else if (format === 'both') {
    pool = [...state.curatedMovies, ...state.tvShowsCache];
  } else if (format === 'anime') {
    const combined = [...state.curatedMovies, ...state.tvShowsCache];
    const anim = combined.filter(x => (x.genres || []).some(g => /animation|anime/i.test(g)));
    pool = anim.length ? anim : state.curatedMovies;
  } else if (format === 'miniseries') {
    const mini = state.tvShowsCache.filter(x => (x.status || '').toLowerCase() === 'ended' || (Number(x.runtime) || 0) >= 40);
    pool = mini.length ? mini : (state.tvShowsCache.length ? state.tvShowsCache : state.curatedMovies);
  } else if (format === 'short-film') {
    const shortMovies = state.curatedMovies.filter(m => m.runtime > 0 && m.runtime <= 105);
    pool = shortMovies.length ? shortMovies : state.curatedMovies;
  } else if (format === 'epic-cinema') {
    const epicMovies = state.curatedMovies.filter(m => m.runtime >= 130);
    pool = epicMovies.length ? epicMovies : state.curatedMovies;
  } else {
    pool = state.curatedMovies;
  }

  const matchesRt = (item) => {
    if (runtimeMode === 'any') return true;
    const rt = Number(item.runtime) || 0;
    if (item.media_type === 'tv') {
      if (runtimeMode === 'short') return rt > 0 && rt <= 42;
      if (runtimeMode === 'epic') return rt >= 50;
      return rt >= 40 && rt <= 55;
    }
    if (runtimeMode === 'short') return rt > 0 && rt <= 105;
    if (runtimeMode === 'epic') return rt >= 130;
    return rt >= 95 && rt <= 135;
  };

  const scored = pool.map((item, idx) => {
    const gOk = matchesGenre(item, genreId);
    const lOk = matchesQuizLanguage(item, langPref);
    const rOk = matchesRt(item);
    let score = 0;
    if (gOk) score += 100;
    if (lOk) score += 80;
    if (rOk) score += 40;
    score += (Number(item.rating) || 7) * 0.5;
    return { item, gOk, lOk, rOk, score, idx };
  }).sort((a, b) => (Math.abs(b.score - a.score) > 0.01 ? b.score - a.score : a.idx - b.idx));

  const strict = scored.filter(s => s.gOk && s.lOk && s.rOk);
  const genreAndLang = scored.filter(s => s.gOk && s.lOk);
  const langOnly = langPref !== 'all' ? scored.filter(s => s.lOk) : [];
  const genreOnly = scored.filter(s => s.gOk);
  const chosen = strict.length ? strict : (genreAndLang.length ? genreAndLang : (langOnly.length ? langOnly : (genreOnly.length ? genreOnly : scored)));
  const top3 = chosen.slice(0, 3).map(s => s.item);

  const langFallbackNotice = (langPref !== 'all' && !langOnly.length)
    ? `<p style="font-size:0.8rem;color:var(--eyebrow);margin:0 0 10px;">No titles in that exact language are in the current format pool—showing closest mood matches (try "Movies &amp; TV (Any)" or "Feature Movies").</p>`
    : '';

  els.quizResultsContainer.innerHTML = langFallbackNotice + top3.map(item => {
    const thumb = getThumbUrlForItem(item);
    const tid = getTrailerIdForItem(item);
    const isYt = Boolean(thumb && thumb.includes('i.ytimg.com'));
    const mqFallback = isYt && tid ? getYtThumbUrl(tid, 'mqdefault') : '';
    const thumbHtml = thumb
      ? `<img src="${escapeHtml(thumb)}" alt="${escapeHtml(item.title)}" class="${isYt ? 'is-trailer-thumb' : ''}" loading="lazy"${mqFallback ? ` data-mq-fallback="${escapeHtml(mqFallback)}"` : ''}>`
      : '';
    const langTag = item.languageLabel || LANGUAGE_NAMES[item.language] || 'Global';
    const rtTag = item.runtime ? (item.media_type === 'tv' ? `~${item.runtime}m / ep` : `${item.runtime} min`) : '';
    const subMeta = [langTag, rtTag, item.media_type === 'tv' ? 'TV Series' : 'Film'].filter(Boolean).join(' \u00b7 ');
    return `
      <div class="quiz-result-item" data-quiz-id="${escapeHtml(item.id)}" style="cursor:pointer;">
        ${thumbHtml}
        <div style="flex:1;min-width:0;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:0.5rem;flex-wrap:wrap;">
            <strong>${escapeHtml(item.title)} (${escapeHtml(item.year)})</strong>
            <span style="color:var(--accent-cyan);font-size:0.82rem;">Rating ${escapeHtml(item.rating)}</span>
          </div>
          <div style="font-size:0.76rem;color:var(--eyebrow);margin-top:2px;">${escapeHtml(subMeta)}</div>
          <p style="font-size:0.82rem;color:var(--text-muted);margin:0.35rem 0 0;">${escapeHtml(item.editorial_note || (item.overview || '').slice(0, 130) + '...')}</p>
        </div>
      </div>
    `;
  }).join('');

  els.quizResultsContainer.querySelectorAll('img[data-mq-fallback]').forEach(img => {
    img.addEventListener('error', () => {
      if (!img.dataset.triedMq && img.dataset.mqFallback) {
        img.dataset.triedMq = '1';
        img.src = img.dataset.mqFallback;
      }
    });
  });

  els.quizResultsContainer.querySelectorAll('[data-quiz-id]').forEach(row => {
    row.addEventListener('click', () => {
      const picked = top3.find(x => x.id === row.dataset.quizId);
      if (picked) {
        els.quizModal.classList.add('hidden');
        document.body.style.overflow = '';
        openMovieModal(picked);
      }
    });
  });
}

function initCookieConsent() {
  // Delegated to shared /consent-ui.js so every page shares identical single-banner + Privacy Settings behavior
}

function setupCompactFilterDropdowns() {
  const openDrawerBtn = document.getElementById('openFilterDrawerBtn');
  const closeDrawerBtn = document.getElementById('closeFilterDrawerBtn');
  const rightDrawer = document.getElementById('rightFilterDrawer');
  const drawerResetAllBtn = document.getElementById('drawerResetAllBtn');

  const openRightFilterDrawer = () => {
    if (!rightDrawer) return;
    rightDrawer.classList.remove('hidden');
    if (els.filterSheetBackdrop) els.filterSheetBackdrop.classList.remove('hidden');
    if (openDrawerBtn) openDrawerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeRightFilterDrawer = () => {
    if (!rightDrawer) return;
    rightDrawer.classList.add('hidden');
    if (els.filterSheetBackdrop) els.filterSheetBackdrop.classList.add('hidden');
    if (openDrawerBtn) openDrawerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  window.closeWatchPulseFilterDrawer = closeRightFilterDrawer;

  if (openDrawerBtn) {
    openDrawerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (rightDrawer && !rightDrawer.classList.contains('hidden')) {
        closeRightFilterDrawer();
      } else {
        openRightFilterDrawer();
      }
    });
  }

  if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener('click', closeRightFilterDrawer);
  }

  if (drawerResetAllBtn) {
    drawerResetAllBtn.addEventListener('click', () => {
      resetAllFilters();
    });
  }

  if (els.langSearchInput && els.langOptionsList) {
    els.langSearchInput.addEventListener('input', () => {
      const q = els.langSearchInput.value.trim().toLowerCase();
      els.langOptionsList.querySelectorAll('.filter-check-row').forEach(row => {
        const label = (row.dataset.label || row.textContent || '').toLowerCase();
        row.style.display = (!q || label.includes(q)) ? '' : 'none';
      });
    });
  }

  if (els.filterSheetBackdrop) {
    els.filterSheetBackdrop.addEventListener('click', () => {
      closeRightFilterDrawer();
      closeAllFilterDropdowns();
    });
  }

  document.querySelectorAll('.filter-check-row[data-filter-group]').forEach(row => {
    row.addEventListener('click', () => {
      const grp = row.dataset.filterGroup;
      const val = row.dataset.val;
      state.searchQuery = '';
      state.currentPage = 1;
      if (els.searchInput) els.searchInput.value = '';
      if (els.clearSearchBtn) els.clearSearchBtn.classList.add('hidden');

      if (grp === 'language') {
        if (val === 'all') {
          state.languages = [];
        } else {
          if (state.languages.includes(val)) {
            state.languages = state.languages.filter(x => x !== val);
          } else {
            state.languages = [...state.languages, val];
          }
        }
      } else if (grp === 'platform') {
        if (val === 'all') {
          state.providers = [];
        } else {
          if (state.providers.includes(val)) {
            state.providers = state.providers.filter(x => x !== val);
          } else {
            state.providers = [...state.providers, val];
          }
        }
      } else if (grp === 'genre') {
        if (val === 'all') {
          state.genres = [];
        } else {
          if (state.genres.includes(val)) {
            state.genres = state.genres.filter(x => x !== val);
          } else {
            state.genres = [...state.genres, val];
          }
        }
      } else if (grp === 'sort') {
        state.sortBy = val || 'trending';
      }

      applyLocalFiltersAndRender();
    });
  });

  document.querySelectorAll('[data-reset-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const grp = btn.dataset.resetFilter;
      if (grp === 'language') state.languages = [];
      else if (grp === 'platform') state.providers = [];
      else if (grp === 'genre') state.genres = [];
      else if (grp === 'sort') state.sortBy = 'trending';
      state.currentPage = 1;
      applyLocalFiltersAndRender();
    });
  });

  document.querySelectorAll('[data-apply-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeRightFilterDrawer();
      closeAllFilterDropdowns();
    });
  });
}

function setupEventListeners() {
  setupCompactFilterDropdowns();
  if (els.brandLogo) els.brandLogo.addEventListener('click', () => { resetAllFilters(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

  let searchTimer = null;
  if (els.searchInput) {
    els.searchInput.addEventListener('input', () => {
      const val = els.searchInput.value.trim();
      if (els.clearSearchBtn) els.clearSearchBtn.classList.toggle('hidden', !val);
      clearTimeout(searchTimer);
      if (!val) {
        renderAutocompleteSuggestions('', []);
        searchTitlesLive('', false);
        return;
      }
      searchTimer = setTimeout(() => searchTitlesLive(val, false), 260);
    });
    els.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(searchTimer);
        if (els.searchDropdown) els.searchDropdown.classList.add('hidden');
        searchTitlesLive(els.searchInput.value.trim(), true);
      }
    });
    els.searchInput.addEventListener('focus', () => {
      const val = els.searchInput.value.trim();
      renderAutocompleteSuggestions(val, val ? state.lastSearchResults : []);
    });
  }

  document.addEventListener('click', (e) => {
    if (els.searchDropdown && !e.target.closest('.search-bar-wrap')) {
      els.searchDropdown.classList.add('hidden');
    }
  });

  if (els.clearSearchBtn) {
    els.clearSearchBtn.addEventListener('click', () => {
      els.searchInput.value = '';
      els.clearSearchBtn.classList.add('hidden');
      if (els.searchDropdown) els.searchDropdown.classList.add('hidden');
      searchTitlesLive('', false);
    });
  }

  if (els.mediaTypeToggle) {
    els.mediaTypeToggle.querySelectorAll('.media-type-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const nextType = btn.dataset.type;
        if (nextType === state.mediaType && !state.searchQuery) return;
        state.searchQuery = '';
        state.currentPage = 1;
        if (els.searchInput) els.searchInput.value = '';
        if (els.clearSearchBtn) els.clearSearchBtn.classList.add('hidden');
        if (els.searchResultTabs) els.searchResultTabs.classList.add('hidden');
        setMediaTypeUI(nextType);
        if (nextType === 'tv' && !state.tvShowsCache.length) {
          await loadTvCatalog(false);
        } else {
          applyLocalFiltersAndRender();
        }
      });
    });
  }

  if (els.languageSelect) {
    els.languageSelect.addEventListener('change', () => {
      const val = els.languageSelect.value;
      state.language = val;
      state.languages = (!val || val === 'all') ? [] : [val];
      state.currentPage = 1;
      applyLocalFiltersAndRender();
    });
  }

  if (els.languageChips) {
    els.languageChips.querySelectorAll('.filter-pill').forEach(chip => {
      chip.addEventListener('click', () => {
        els.languageChips.querySelectorAll('.filter-pill').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.language = chip.dataset.lang;
        state.currentPage = 1;
        if (els.languageSelect) els.languageSelect.value = state.language;
        chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        applyLocalFiltersAndRender();
      });
    });
  }

  if (els.heroCompanyOptions) {
    const companyLabels = {
      'solo': 'Solo',
      'date-night': 'Date night',
      'friends': 'Friends',
      'family': 'Family'
    };
    const quickPickTextEl = document.getElementById('compassQuickPickText');
    els.heroCompanyOptions.querySelectorAll('.focus-opt-card').forEach(card => {
      card.addEventListener('click', () => {
        els.heroCompanyOptions.querySelectorAll('.focus-opt-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const companyKey = card.dataset.company || 'date-night';
        if (els.heroQuizContinueBtn) {
          els.heroQuizContinueBtn.href = `/movie-finder?company=${encodeURIComponent(companyKey)}&step=2&mode=one`;
        }
        if (quickPickTextEl) {
          quickPickTextEl.textContent = `1 instant ${companyLabels[companyKey] || ''} pick`.trim();
        }
      });
    });
  }

  if (els.providerChips) {
    els.providerChips.querySelectorAll('.provider-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        els.providerChips.querySelectorAll('.provider-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.provider = chip.dataset.provider;
        state.currentPage = 1;
        chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        applyLocalFiltersAndRender();
      });
    });
  }

  if (els.genreChips) {
    els.genreChips.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        els.genreChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.genre = chip.dataset.genre;
        state.currentPage = 1;
        chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        applyLocalFiltersAndRender();
      });
    });
  }

  if (els.infiniteLoadMoreBtn) {
    els.infiniteLoadMoreBtn.addEventListener('click', () => {
      loadMoreCategoryTitles(true);
    });
  }

  if (els.loadMoreBtn) {
    els.loadMoreBtn.addEventListener('click', () => {
      loadMoreCategoryTitles(true);
    });
  }

  if (els.heroTrailerBtn) els.heroTrailerBtn.addEventListener('click', () => openTrailerForItem(state.currentHero));
  if (els.heroDetailsBtn) els.heroDetailsBtn.addEventListener('click', () => { if (state.currentHero) openMovieModal(state.currentHero); });
  if (els.heroWatchlistBtn) els.heroWatchlistBtn.addEventListener('click', () => { if (state.currentHero) toggleWatchlist(state.currentHero); });

  if (els.modalCloseBtn) els.modalCloseBtn.addEventListener('click', closeMovieModal);
  if (els.movieModal) els.movieModal.addEventListener('click', (e) => { if (e.target === els.movieModal) closeMovieModal(); });
  if (els.modalTrailerBtn) els.modalTrailerBtn.addEventListener('click', () => openTrailerForItem(state.currentModalItem));
  if (els.modalWatchlistBtn) els.modalWatchlistBtn.addEventListener('click', () => { if (state.currentModalItem) toggleWatchlist(state.currentModalItem); });
  if (els.modalShareBtn) {
    els.modalShareBtn.addEventListener('click', async () => {
      if (!state.currentModalItem) return;
      const shareUrl = `${window.location.origin}/?type=${state.currentModalItem.media_type}&q=${encodeURIComponent(state.currentModalItem.title)}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        const shareSpan = els.modalShareBtn.querySelector('span');
        if (shareSpan) shareSpan.textContent = 'Link Copied!'; else els.modalShareBtn.textContent = 'Link Copied!';
        setTimeout(() => {
          if (shareSpan) shareSpan.textContent = 'Share Link'; else els.modalShareBtn.textContent = 'Share Link';
        }, 1800);
      } catch (_) {}
    });
  }

  const openWatchlistView = (scrollIntoView = false) => {
    state.showingWatchlist = scrollIntoView ? true : !state.showingWatchlist;
    if (state.showingWatchlist) {
      if (els.watchlistNoticeBanner) els.watchlistNoticeBanner.classList.remove('hidden');
      if (els.searchResultTabs) els.searchResultTabs.classList.add('hidden');
      if (els.loadMoreBtn) els.loadMoreBtn.classList.add('hidden');
      if (els.infiniteLoadWrap) els.infiniteLoadWrap.classList.add('hidden');
      hidePaginationBar();
      renderMoviesGrid(state.watchlist);
      if (scrollIntoView && els.gridTitle) els.gridTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      applyLocalFiltersAndRender();
    }
  };

  if (els.watchlistNavBtn) els.watchlistNavBtn.addEventListener('click', () => openWatchlistView(false));
  if (els.openWatchlistStripBtn) els.openWatchlistStripBtn.addEventListener('click', () => openWatchlistView(true));
  if (els.mobileHeaderWatchlistBtn) els.mobileHeaderWatchlistBtn.addEventListener('click', () => openWatchlistView(true));

  if (els.surpriseNavBtn) {
    els.surpriseNavBtn.addEventListener('click', () => {
      const pool = state.displayedItems.length ? state.displayedItems : state.curatedMovies;
      if (!pool.length) return;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      openMovieModal(pick);
    });
  }

  if (els.compassQuickPickBtn) {
    els.compassQuickPickBtn.addEventListener('click', () => {
      const selectedCard = els.heroCompanyOptions ? els.heroCompanyOptions.querySelector('.focus-opt-card.selected') : null;
      const company = selectedCard ? selectedCard.dataset.company : 'date-night';
      const basePool = state.curatedMovies.length ? state.curatedMovies : state.displayedItems;
      if (!basePool.length) return;
      let filtered = basePool;
      if (company === 'family') {
        filtered = basePool.filter(m => (m.genre_ids || []).includes(16) || (m.genres || []).some(g => /animation|family/i.test(g)));
      } else if (company === 'date-night') {
        filtered = basePool.filter(m => (m.genre_ids || []).some(id => [10749, 35, 18, 53].includes(id)));
      } else if (company === 'friends') {
        filtered = basePool.filter(m => (m.genre_ids || []).some(id => [28, 35, 27, 53].includes(id)));
      } else if (company === 'solo') {
        filtered = basePool.filter(m => (m.genre_ids || []).some(id => [878, 53, 18, 27].includes(id)));
      }
      const pool = filtered.length ? filtered : basePool;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      openMovieModal(pick);
      trackEvent('watchpulse_quick_pick', { title: pick.title, company });
    });
  }

  if (els.quizNavBtn && els.quizModal) {
    els.quizNavBtn.addEventListener('click', () => {
      els.quizModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  }
  if (els.quizCloseBtn && els.quizModal) {
    els.quizCloseBtn.addEventListener('click', () => {
      els.quizModal.classList.add('hidden');
      document.body.style.overflow = '';
    });
  }
  setupQuizOptionGroup(els.quizMoodOptions);
  setupQuizOptionGroup(els.quizRuntimeOptions);
  setupQuizOptionGroup(els.quizFormatOptions);
  setupQuizOptionGroup(els.quizLangOptions);
  if (els.runQuizBtn) els.runQuizBtn.addEventListener('click', runFinderQuiz);

  if (els.trailerCloseBtn) els.trailerCloseBtn.addEventListener('click', closeTrailerModal);
  if (els.trailerModal) {
    els.trailerModal.addEventListener('click', (e) => {
      if (e.target === els.trailerModal) closeTrailerModal();
    });
  }

  const setActiveMobileNav = (activeEl) => {
    [els.mobileNavHome, els.mobileNavSurprise, els.mobileNavWatchlist].forEach(el => {
      if (el) el.classList.toggle('active', el === activeEl);
    });
  };

  if (els.mobileNavHome) {
    els.mobileNavHome.addEventListener('click', () => {
      setActiveMobileNav(els.mobileNavHome);
      resetAllFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  if (els.mobileNavSurprise && els.quizModal) {
    els.mobileNavSurprise.addEventListener('click', () => {
      setActiveMobileNav(els.mobileNavSurprise);
      els.quizModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  }
  if (els.mobileNavWatchlist) {
    els.mobileNavWatchlist.addEventListener('click', () => {
      setActiveMobileNav(els.mobileNavWatchlist);
      openWatchlistView(true);
    });
  }
  if (els.mobileNavTop) {
    els.mobileNavTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  setupVoiceSearch();

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && els.searchInput && document.activeElement !== els.searchInput && !['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement && document.activeElement.tagName) || '')) {
      e.preventDefault();
      els.searchInput.focus();
      return;
    }
    if (e.key === 'Escape') {
      if (typeof window.closeWatchPulseFilterDrawer === 'function') window.closeWatchPulseFilterDrawer();
      closeAllFilterDropdowns();
      closeTrailerModal();
      closeMovieModal();
      if (els.quizModal) els.quizModal.classList.add('hidden');
    }
  });
}

async function syncLiveTrendingMovies() {
  try {
    const data = await fetchCatalogApi('movie-trending-live');
    const liveItems = (data && Array.isArray(data.results)) ? data.results : [];
    if (!liveItems.length) return;

    const existingByTitle = new Map();
    state.curatedMovies.forEach(m => {
      existingByTitle.set(normalizeForFuzzy(m.title), m);
    });

    const promotedTop = [];
    const seenKeys = new Set();

    liveItems.forEach(item => {
      if (!item || !item.title) return;
      const key = normalizeForFuzzy(item.title);
      if (!key || seenKeys.has(key)) return;
      seenKeys.add(key);

      const existing = existingByTitle.get(key);
      if (existing) {
        if (item.trailer_id && !existing.trailer_id) {
          existing.trailer_id = item.trailer_id;
          const ytThumb = getYtThumbUrl(item.trailer_id, 'maxresdefault');
          existing.poster = ytThumb;
          existing.backdrop = ytThumb;
        }
        promotedTop.push(existing);
      } else {
        const tid = item.trailer_id || VERIFIED_TRAILER_IDS[item.title.toLowerCase()] || '';
        const ytThumb = tid ? getYtThumbUrl(tid, 'maxresdefault') : '';
        const poster = ytThumb || item.poster || '';
        promotedTop.push({
          id: item.id || `live-trend-${key.replace(/\s+/g, '-')}`,
          qid: item.qid || '',
          wikiTitle: item.wikiTitle || item.title,
          media_type: 'movie',
          source: 'WatchPulse Live Trending',
          title: item.title,
          year: item.year || String(new Date().getFullYear()),
          rating: Number(item.rating) || 8.5,
          runtime: Number(item.runtime) || 126,
          genres: Array.isArray(item.genres) && item.genres.length ? item.genres : ['Drama'],
          genre_ids: Array.isArray(item.genre_ids) && item.genre_ids.length ? item.genre_ids : [18],
          moods: [],
          language: item.language || 'en',
          languageLabel: item.languageLabel || LANGUAGE_NAMES[item.language] || 'English',
          director: item.director || '',
          cast: [],
          platforms: Array.isArray(item.platforms) && item.platforms.length ? item.platforms : ['Netflix', 'Prime Video'],
          overview: item.overview || `${item.title} — Trending worldwide today.`,
          editorial_note: item.editorial_note || '',
          guide_url: '/guides',
          guide_title: 'WatchPulse Live Trending Guide',
          accent: 'amber',
          trailer_id: tid,
          poster,
          backdrop: poster,
          _detailsLoaded: false
        });
      }
    });

    if (promotedTop.length) {
      const rest = state.curatedMovies.filter(m => !seenKeys.has(normalizeForFuzzy(m.title)));
      state.curatedMovies = [...promotedTop, ...rest];
      state.liveTrendingSynced = true;
      if (!state.showingWatchlist && !state.searchQuery && state.mediaType === 'movie') {
        applyLocalFiltersAndRender();
      }
    }
  } catch (_) {}
}

async function initApp() {
  state.watchlist = loadSavedWatchlist();
  updateWatchlistBadge();
  initCookieConsent();
  setupEventListeners();

  const params = new URLSearchParams(window.location.search);
  const urlType = params.get('type');
  const urlGenre = params.get('genre');
  const urlLang = params.get('lang');
  const urlQuery = params.get('q');

  if (urlType === 'movie' || urlType === 'tv') state.mediaType = urlType;
  else state.mediaType = 'movie';

  setMediaTypeUI(state.mediaType);

  if (urlGenre) {
    const mapped = GENRE_SLUG_MAP[urlGenre.toLowerCase()] || urlGenre;
    if (GENRE_MAP[mapped]) {
      state.genre = mapped;
      state.genres = [String(mapped)];
    }
  }
  if (urlLang && LANGUAGE_NAMES[urlLang]) {
    state.language = urlLang;
    state.languages = [urlLang];
    if (els.languageSelect) els.languageSelect.value = urlLang;
  }

  await Promise.allSettled([loadCuratedMovies(), loadTvCatalog(false)]);

  if (params.get('watchlist') === '1') {
    state.showingWatchlist = true;
    if (els.watchlistNoticeBanner) els.watchlistNoticeBanner.classList.remove('hidden');
    if (els.loadMoreBtn) els.loadMoreBtn.classList.add('hidden');
    if (els.infiniteLoadWrap) els.infiniteLoadWrap.classList.add('hidden');
    hidePaginationBar();
    renderMoviesGrid(state.watchlist);
  } else if (urlQuery) {
    if (els.searchInput) els.searchInput.value = urlQuery;
    if (els.clearSearchBtn) els.clearSearchBtn.classList.remove('hidden');
    await searchTitlesLive(urlQuery, false);
  } else {
    applyLocalFiltersAndRender();
  }

  // Auto-sync live daily global & multi-language trending movies in background
  syncLiveTrendingMovies();
  initScrollRevealAnimations();
}

function initScrollRevealAnimations() {
  if (typeof IntersectionObserver === 'undefined') return;
  const targets = document.querySelectorAll('.focus-guides-section, .watchlist-strip, .hero-section, .seo-content-section, .focus-guide-card');
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  targets.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top > window.innerHeight * 0.92) {
      el.classList.add('reveal-on-scroll');
      observer.observe(el);
    }
  });
}

document.addEventListener('DOMContentLoaded', initApp);
