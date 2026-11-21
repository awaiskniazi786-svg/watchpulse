/**
 * WatchPulse.online — Commercial-Safe Discovery Engine ($0/Month, Cloudflare Pages)
 * - TV Series: Live TVmaze API (CC BY-SA — Commercial AdSense Allowed, Zero API Key)
 * - Movies: WatchPulse Curated Editorial Library (data/curated-catalog.json) + Wikipedia Open Film Search
 * - Thumbnails & Trailers: Official YouTube HD Thumbnails & Privacy-Enhanced Embeds (youtube-nocookie.com)
 * - Watchlist + Watched Status: Private Browser localStorage
 */

const CATALOG_PROXY_URL = '/api/catalog';
const CURATED_CATALOG_URL = '/data/curated-catalog.json?v=20261121d';

const GENRE_MAP = {
  28: 'Action',
  878: 'Sci-Fi',
  18: 'Drama',
  35: 'Comedy',
  27: 'Horror',
  53: 'Thriller',
  16: 'Animation'
};

const GENRE_SLUG_MAP = {
  action: '28',
  scifi: '878',
  'sci-fi': '878',
  drama: '18',
  comedy: '35',
  horror: '27',
  thriller: '53',
  animation: '16'
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
  ur: 'Urdu',
  tr: 'Turkish',
  ar: 'Arabic'
};

const TRENDING_KEYWORDS = [
  'Dune: Part Two',
  'Severance',
  'Oppenheimer',
  'Silo',
  'Interstellar',
  'Chernobyl',
  'Maharaja',
  'Stranger Things'
];

// Verified Official Embeddable YouTube Trailer IDs for TV Series & Curated Movies
const VERIFIED_TRAILER_IDS = {
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
  searchQuery: '',
  searchFilterTab: 'all', // 'all' | 'movie' | 'tv'
  lastSearchResults: [],
  tvPage: 0,
  curatedMovies: [],
  tvShowsCache: [],
  displayedItems: [],
  currentHero: null,
  currentModalItem: null,
  watchlist: [],
  showingWatchlist: false
};

const els = {
  brandLogo: document.getElementById('brandLogo'),
  searchInput: document.getElementById('searchInput'),
  voiceSearchBtn: document.getElementById('voiceSearchBtn'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  searchDropdown: document.getElementById('searchDropdown'),
  quizNavBtn: document.getElementById('quizNavBtn'),
  surpriseNavBtn: document.getElementById('surpriseNavBtn'),
  watchlistNavBtn: document.getElementById('watchlistNavBtn'),
  watchlistCount: document.getElementById('watchlistCount'),
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
  if (els.watchlistCount) els.watchlistCount.textContent = String(state.watchlist.length);
  if (els.mobileWatchlistBadge) {
    els.mobileWatchlistBadge.textContent = String(state.watchlist.length);
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

function getThumbUrlForItem(item) {
  if (!item) return '';
  if (item.poster) return item.poster;
  const tid = getTrailerIdForItem(item);
  if (tid) return `https://i.ytimg.com/vi/${tid}/hqdefault.jpg`;
  return '';
}

function normalizeTvMazeShow(show) {
  if (!show) return null;
  const networkName = (show.webChannel && show.webChannel.name) || (show.network && show.network.name) || 'TV / Streaming';
  const year = show.premiered ? show.premiered.slice(0, 4) : 'TBA';
  const rating = show.rating && show.rating.average ? Number(show.rating.average) : 7.5;
  const genres = Array.isArray(show.genres) && show.genres.length ? show.genres : ['Drama'];
  const langMap = { English: 'en', Korean: 'ko', Hindi: 'hi', Japanese: 'ja', Spanish: 'es', French: 'fr', Urdu: 'ur', Turkish: 'tr', Arabic: 'ar' };
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
    backdrop: show.image ? (show.image.original || show.image.medium) : (tid ? `https://i.ytimg.com/vi/${tid}/hqdefault.jpg` : ''),
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
  const thumb = tid ? `https://i.ytimg.com/vi/${tid}/hqdefault.jpg` : '';
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
    language: m.language || 'en',
    languageLabel: LANGUAGE_NAMES[m.language] || 'English',
    director: m.director || '',
    cast: m.cast || [],
    platforms: m.platforms || [],
    overview: m.overview,
    editorial_note: m.editorial_note || '',
    guide_url: m.guide_url || '/guides.html',
    guide_title: m.guide_title || 'WatchPulse Editorial Guides',
    accent: m.accent || 'teal',
    trailer_id: tid,
    poster: thumb,
    backdrop: thumb
  };
}

function renderPosterArtHtml(item) {
  const isYtThumb = Boolean(item.poster && item.poster.includes('i.ytimg.com'));
  // 1. Real vertical poster (TVmaze shows OR Wikipedia/Wikidata movie posters)
  if (item.poster && !isYtThumb) {
    return `<img src="${escapeHtml(item.poster)}" alt="${escapeHtml(item.title)} poster" class="card-poster" loading="lazy" referrerpolicy="no-referrer">`;
  }
  // 2. Curated or searched movie with verified HD YouTube trailer thumbnail
  const thumb = getThumbUrlForItem(item);
  if (thumb) {
    const rt = item.runtime ? `⏱️ ${item.runtime}m` : '▶ Trailer';
    return `
      <div class="curated-thumb-card">
        <img src="${escapeHtml(thumb)}" alt="${escapeHtml(item.title)} official trailer preview" class="curated-thumb-img" loading="lazy">
        <div class="curated-thumb-scrim"></div>
        <div class="curated-thumb-play" aria-hidden="true">▶</div>
        <div class="curated-thumb-footer">
          <span>${escapeHtml(rt)}</span>
        </div>
      </div>
    `;
  }
  // 3. Clean typographic fallback when no poster or trailer exists
  const accent = escapeHtml(item.accent || 'teal');
  const tag = item.source === 'Wikipedia & Wikidata' ? 'OPEN FILM DATA' : 'WATCHPULSE PICK';
  const sub = item.director ? `Dir. ${escapeHtml(item.director)}` : escapeHtml((item.genres || []).slice(0, 2).join(' • '));
  return `
    <div class="editorial-poster-art accent-${accent}">
      <div class="ep-top">
        <span class="ep-badge">${tag}</span>
        <span class="ep-year">${escapeHtml(item.year)}</span>
      </div>
      <div class="ep-center">
        <div class="ep-title">${escapeHtml(item.title)}</div>
        <div class="ep-sub">${sub}</div>
      </div>
      <div class="ep-bottom">
        <span>⏱️ ${item.runtime ? item.runtime + 'm' : 'Feature'}</span>
        <span>${escapeHtml((item.genres || ['Film'])[0])}</span>
      </div>
    </div>
  `;
}

function renderHero(item) {
  if (!item) return;
  state.currentHero = item;
  if (els.heroBackdrop) {
    const bg = item.backdrop || getThumbUrlForItem(item);
    if (bg) {
      els.heroBackdrop.style.backgroundImage = `url('${bg}')`;
    } else {
      els.heroBackdrop.style.backgroundImage = 'linear-gradient(135deg, #0b132b 0%, #1c2541 55%, #0f766e 100%)';
    }
  }
  if (els.heroTitle) els.heroTitle.textContent = item.title;
  if (els.heroRating) els.heroRating.textContent = `⭐ ${item.rating}`;
  if (els.heroYear) els.heroYear.textContent = item.year;
  if (els.heroGenre) els.heroGenre.textContent = (item.genres || []).slice(0, 2).join(' / ');
  if (els.heroDuration) {
    els.heroDuration.textContent = item.media_type === 'tv'
      ? `📺 ${item.platforms[0] || 'TV Series'}`
      : (item.runtime ? `⏱️ ${item.runtime} min` : '🎬 Feature Film');
  }
  if (els.heroOverview) els.heroOverview.textContent = item.editorial_note || item.overview;
  updateHeroWatchlistBtn();
}

function updateHeroWatchlistBtn() {
  if (!els.heroWatchlistBtn || !state.currentHero) return;
  const inList = state.watchlist.some(w => w.id === state.currentHero.id);
  els.heroWatchlistBtn.textContent = inList ? '✓ Saved in Watchlist' : '🔖 Add to Watchlist';
}

function buildCatalogHeading() {
  if (state.showingWatchlist) return '🔖 Your Private Watchlist';
  if (state.searchQuery) return `Search Results for "${state.searchQuery}"`;
  const typeLabel = state.mediaType === 'tv' ? 'Popular TV Series (Live via TVmaze)' : 'Curated Editorial Movies';
  const parts = [];
  if (state.genre !== 'all' && GENRE_MAP[state.genre]) parts.push(GENRE_MAP[state.genre]);
  if (state.provider !== 'all' && PROVIDER_NAMES[state.provider]) parts.push(`on ${PROVIDER_NAMES[state.provider]}`);
  if (state.language !== 'all' && LANGUAGE_NAMES[state.language]) parts.push(LANGUAGE_NAMES[state.language]);
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
    <button type="button" class="search-tab-btn ${state.searchFilterTab === 'all' ? 'active' : ''}" data-stab="all">✨ All (${allCount})</button>
    <button type="button" class="search-tab-btn ${state.searchFilterTab === 'movie' ? 'active' : ''}" data-stab="movie">🎬 Movies (${movieCount})</button>
    <button type="button" class="search-tab-btn ${state.searchFilterTab === 'tv' ? 'active' : ''}" data-stab="tv">📺 TV Series (${tvCount})</button>
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

function renderMoviesGrid(items) {
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

  els.moviesGrid.innerHTML = items.map(item => {
    const savedObj = state.watchlist.find(w => w.id === item.id);
    const isSaved = Boolean(savedObj);
    const isWatched = Boolean(savedObj && savedObj.watched);
    const ratingText = typeof item.rating === 'number' ? `⭐ ${item.rating}` : (item.runtime ? `⏱️ ${item.runtime}m` : '🎬 Film');
    const primaryPlatform = (item.platforms && item.platforms[0]) ? item.platforms[0] : (item.media_type === 'tv' ? 'TV Series' : (item.director ? `Dir. ${item.director}` : 'Curated'));
    return `
      <article class="movie-card" data-id="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="Open details for ${escapeHtml(item.title)}">
        <div class="card-poster-wrap">
          ${renderPosterArtHtml(item)}
          <span class="card-rating">${escapeHtml(ratingText)}</span>
          <span class="card-type-pill">${item.media_type === 'tv' ? '📺 TV' : '🎬 Film'}</span>
          <button type="button" class="card-bookmark-btn ${isSaved ? 'active' : ''}" data-wl-id="${escapeHtml(item.id)}" title="${isSaved ? 'Remove from Watchlist' : 'Save to Watchlist'}" aria-label="Toggle Watchlist">${isSaved ? '✓' : '🔖'}</button>
        </div>
        <div class="card-body">
          <h3 class="card-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h3>
          <div class="card-meta">
            <span>${escapeHtml(item.year)}</span>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:65%;">${escapeHtml(primaryPlatform)}</span>
          </div>
          ${state.showingWatchlist ? `
            <button type="button" class="watched-toggle-btn ${isWatched ? 'is-watched' : ''}" data-watched-id="${escapeHtml(item.id)}" style="margin-top:0.5rem;width:100%;padding:0.35rem;border-radius:6px;border:1px solid var(--border-color);background:rgba(255,255,255,0.04);color:var(--text-main);font-size:0.78rem;cursor:pointer;">
              ${isWatched ? '✓ Watched' : '○ Mark as Watched'}
            </button>
          ` : ''}
        </div>
      </article>
    `;
  }).join('');

  els.moviesGrid.querySelectorAll('.movie-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const wlBtn = e.target.closest('[data-wl-id]');
      if (wlBtn) {
        e.stopPropagation();
        const found = state.displayedItems.find(x => x.id === wlBtn.dataset.wlId);
        if (found) toggleWatchlist(found);
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
  });
}

function showLoadingGrid() {
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
  if (!append) showLoadingGrid();
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

    if (!state.searchQuery) applyLocalFiltersAndRender();
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
  return (item.genres || []).some(g => {
    const lg = g.toLowerCase();
    if (targetName === 'sci-fi') return lg.includes('sci') || lg.includes('science');
    return lg.includes(targetName);
  });
}

function applyLocalFiltersAndRender() {
  state.showingWatchlist = false;
  if (els.watchlistNoticeBanner) els.watchlistNoticeBanner.classList.add('hidden');
  if (els.searchResultTabs) els.searchResultTabs.classList.add('hidden');

  const pool = state.mediaType === 'tv' ? state.tvShowsCache : state.curatedMovies;
  const filtered = pool.filter(item => {
    if (!matchesGenre(item, state.genre)) return false;
    if (!matchesProvider(item, state.provider)) return false;
    if (state.language !== 'all' && item.language !== state.language) return false;
    return true;
  });

  const limit = state.mediaType === 'tv' ? 24 + (state.tvPage * 24) : filtered.length;
  const visible = filtered.slice(0, limit);
  renderMoviesGrid(visible);
  if (visible.length && !state.searchQuery) renderHero(visible[0]);
  if (els.loadMoreBtn) {
    els.loadMoreBtn.classList.toggle('hidden', state.mediaType !== 'tv' || Boolean(state.searchQuery));
  }
}

function renderAutocompleteSuggestions(query, items) {
  if (!els.searchDropdown) return;
  if (!query) {
    els.searchDropdown.innerHTML = `<div class="dropdown-section-title" style="padding:0.5rem 0.8rem;">Popular Quick Searches</div>` +
      TRENDING_KEYWORDS.map(k => `<button type="button" class="ac-row" data-kw="${escapeHtml(k)}"><span>🔍</span><span class="ac-title">${escapeHtml(k)}</span></button>`).join('');
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
        : `<div class="ac-thumb" style="display:flex;align-items:center;justify-content:center;font-size:0.85rem;">${item.media_type === 'tv' ? '📺' : '🎬'}</div>`;
      return `
        <button type="button" class="ac-row" data-ac-id="${escapeHtml(item.id)}">
          ${thumbHtml}
          <div class="ac-meta">
            <span class="ac-title">${escapeHtml(item.title)}</span>
            <span class="ac-sub">${escapeHtml(item.year)} • ⭐ ${escapeHtml(item.rating)} • ${escapeHtml((item.platforms && item.platforms[0]) || item.source)}</span>
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
  if (els.modalBackdrop) {
    const bg = detailed.backdrop || thumb;
    els.modalBackdrop.style.backgroundImage = bg
      ? `url('${bg}')`
      : 'linear-gradient(135deg, #0b132b 0%, #1c2541 60%, #0f766e 100%)';
  }
  if (els.modalPoster) {
    if (thumb) {
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
      ? `⭐ ${detailed.rating}`
      : (detailed.country ? `🌍 ${detailed.country}` : '🎬 Feature Film');
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
      ? 'Primary Network / Streaming Home (TVmaze — varies by country)'
      : detailed.source === 'Wikipedia & Wikidata'
        ? 'Distributors & Reference Info (Wikipedia & Wikidata — check local streaming apps)'
        : 'Curated Platform Note (checked Nov 21, 2026 — verify locally)';
  }

  if (els.watchProvidersList) {
    const pills = (detailed.platforms || []).map(p => `<span class="provider-pill">${escapeHtml(p)}</span>`).join('');
    const imdbBtn = detailed.imdb_id
      ? `<a href="https://www.imdb.com/title/${encodeURIComponent(detailed.imdb_id)}/" target="_blank" rel="noopener noreferrer" class="provider-pill" style="border-color: #f5c518; color: #f5c518; text-decoration: none;">IMDb Profile ↗</a>`
      : '';
    const guideBtn = detailed.guide_url
      ? `<a href="${escapeHtml(detailed.guide_url)}" class="provider-pill" style="border-color: var(--accent-cyan); color: var(--accent-cyan); text-decoration: none;">📚 Read: ${escapeHtml(detailed.guide_title)} →</a>`
      : '';
    els.watchProvidersList.innerHTML = `<div class="provider-tier-group"><div class="provider-tier-pills">${pills}${imdbBtn}${guideBtn}</div></div>`;
  }

  if (els.modalFreshnessNote) {
    els.modalFreshnessNote.textContent = detailed.source === 'TVmaze'
      ? 'Live TV data provided by TVmaze (CC BY-SA — Commercial Allowed)'
      : detailed.source === 'Wikipedia & Wikidata'
        ? 'Live film profile powered by Wikipedia (CC BY-SA) & Wikidata (CC0 Public Domain)'
        : 'Curated by WatchPulse Editorial — verify current local availability inside your app';
  }

  if (els.officialWatchLink) {
    els.officialWatchLink.href = detailed.officialUrl || detailed.guide_url || '/guides.html';
    els.officialWatchLink.textContent = detailed.source === 'TVmaze'
      ? 'View Full Episode Guide on TVmaze ↗'
      : detailed.source === 'Wikipedia & Wikidata'
        ? 'Read Full Film Article on Wikipedia ↗'
        : 'Open Matching WatchPulse Guide →';
  }

  if (els.reportDataIssueLink) {
    els.reportDataIssueLink.href = `/contact.html?subject=bug&title=${encodeURIComponent(detailed.title)}`;
  }

  if (els.modalCastList) {
    if (isLoadingDetails && (!detailed.cast || !detailed.cast.length)) {
      els.modalCastList.innerHTML = `<span class="cast-pill" style="opacity:0.75;">⏳ Loading full cast, director &amp; details...</span>`;
    } else {
      const chips = [];
      if (detailed.director) chips.push(`<span class="cast-pill" style="border-color:var(--accent-cyan);color:var(--accent-cyan);">🎬 Dir. ${escapeHtml(detailed.director)}</span>`);
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
        <button type="button" class="similar-chip" data-sim-id="${escapeHtml(s.id)}" style="padding:0.45rem 0.7rem;border-radius:8px;border:1px solid var(--border-color);background:rgba(255,255,255,0.04);color:var(--text-main);cursor:pointer;font-size:0.8rem;text-align:left;">
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
  els.modalWatchlistBtn.textContent = inList ? '✓ Saved in Watchlist' : '🔖 Bookmark to Watchlist';
}

function toggleWatchlist(item) {
  const idx = state.watchlist.findIndex(w => w.id === item.id);
  if (idx >= 0) state.watchlist.splice(idx, 1);
  else state.watchlist.unshift({ ...item, watched: false });
  saveWatchlist();
  updateHeroWatchlistBtn();
  updateModalWatchlistBtn();
  if (state.showingWatchlist) renderMoviesGrid(state.watchlist);
  else renderMoviesGrid(state.displayedItems);
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
    els.trailerStatusLabel.textContent = `▶ Playing "${title}" official trailer on WatchPulse${pos}`;
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
    box.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.85rem;padding:1.5rem;text-align:center;background:radial-gradient(circle at top,#134e4a 0%,#0b0f17 75%);color:#f8fafc;';
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
  if (els.trailerStatusLabel) els.trailerStatusLabel.textContent = `⏳ Loading official trailer for "${item.title}"...`;
  showTrailerOverlayBox(`
    <span style="font-size:2rem;">🎬</span>
    <h3 style="margin:0;font-size:1.1rem;">Finding Official HD Trailer...</h3>
    <p style="margin:0;max-width:400px;font-size:0.85rem;color:#cbd5e1;">Loading "${escapeHtml(item.title)}" directly inside WatchPulse.</p>
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

  // Last-resort fallback only if YouTube search itself is unreachable
  if (els.trailerStatusLabel) els.trailerStatusLabel.textContent = `Could not auto-load embed for "${item.title}"`;
  showTrailerOverlayBox(`
    <span style="font-size:2rem;">🎬</span>
    <h3 style="margin:0;font-size:1.15rem;">Official Trailer: ${escapeHtml(item.title)}</h3>
    <p style="margin:0;max-width:420px;font-size:0.86rem;color:#cbd5e1;">Auto-embed wasn't returned for this title right now. You can watch it directly on YouTube:</p>
    <a href="${escapeHtml(ytSearchUrl)}" target="_blank" rel="noopener noreferrer" class="btn primary-btn" style="text-decoration:none;">▶ Watch on YouTube ↗</a>
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

function resetAllFilters() {
  state.genre = 'all';
  state.provider = 'all';
  state.language = 'all';
  state.searchQuery = '';
  state.searchFilterTab = 'all';
  state.lastSearchResults = [];
  state.showingWatchlist = false;
  if (els.searchInput) els.searchInput.value = '';
  if (els.clearSearchBtn) els.clearSearchBtn.classList.add('hidden');
  if (els.searchDropdown) els.searchDropdown.classList.add('hidden');
  if (els.searchResultTabs) els.searchResultTabs.classList.add('hidden');
  if (els.languageSelect) els.languageSelect.value = 'all';
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

function runFinderQuiz() {
  const moodBtn = els.quizMoodOptions && els.quizMoodOptions.querySelector('.selected');
  const runtimeBtn = els.quizRuntimeOptions && els.quizRuntimeOptions.querySelector('.selected');
  const formatBtn = els.quizFormatOptions && els.quizFormatOptions.querySelector('.selected');

  const genreId = moodBtn ? moodBtn.dataset.genre : '53';
  const runtimeMode = runtimeBtn ? runtimeBtn.dataset.runtime : 'standard';
  const format = formatBtn ? formatBtn.dataset.format : 'movie';

  const pool = format === 'tv' ? state.tvShowsCache : state.curatedMovies;
  let matches = pool.filter(item => matchesGenre(item, genreId));
  if (format === 'movie') {
    const rtFiltered = matches.filter(m => {
      if (runtimeMode === 'short') return m.runtime <= 105;
      if (runtimeMode === 'epic') return m.runtime >= 130;
      return m.runtime >= 95 && m.runtime <= 135;
    });
    if (rtFiltered.length >= 2) matches = rtFiltered;
  }
  const top3 = (matches.length ? matches : pool).slice(0, 3);

  els.quizResultsContainer.innerHTML = top3.map(item => `
    <div class="quiz-result-item" data-quiz-id="${escapeHtml(item.id)}" style="cursor:pointer;padding:0.75rem;border-radius:10px;border:1px solid var(--border-color);background:rgba(255,255,255,0.03);margin-bottom:0.6rem;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:0.5rem;">
        <strong>${escapeHtml(item.title)} (${escapeHtml(item.year)})</strong>
        <span style="color:var(--accent-cyan);font-size:0.82rem;">⭐ ${escapeHtml(item.rating)}</span>
      </div>
      <p style="font-size:0.82rem;color:var(--text-muted);margin:0.3rem 0 0;">${escapeHtml(item.editorial_note || item.overview.slice(0, 130) + '...')}</p>
    </div>
  `).join('');

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
  if (!els.cookieBanner) return;
  let saved = null;
  try { saved = localStorage.getItem('wp_cookie_consent'); } catch (_) {}

  const hasGoogleCmp = () => typeof window.__tcfapi === 'function' || Boolean(window.googlefc && window.googlefc.ccpa);
  if (!saved) {
    setTimeout(() => {
      if (!hasGoogleCmp()) els.cookieBanner.classList.remove('hidden');
    }, 900);
  }

  const handleChoice = (accepted) => {
    try { localStorage.setItem('wp_cookie_consent', accepted ? 'accepted' : 'declined'); } catch (_) {}
    const stateVal = accepted ? 'granted' : 'denied';
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: stateVal,
        ad_user_data: stateVal,
        ad_personalization: stateVal,
        analytics_storage: stateVal
      });
    }
    els.cookieBanner.classList.add('hidden');
  };

  if (els.acceptCookiesBtn) els.acceptCookiesBtn.addEventListener('click', () => handleChoice(true));
  if (els.declineCookiesBtn) els.declineCookiesBtn.addEventListener('click', () => handleChoice(false));
}

function setupEventListeners() {
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
      state.language = els.languageSelect.value;
      applyLocalFiltersAndRender();
    });
  }

  if (els.providerChips) {
    els.providerChips.querySelectorAll('.provider-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        els.providerChips.querySelectorAll('.provider-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.provider = chip.dataset.provider;
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
        applyLocalFiltersAndRender();
      });
    });
  }

  if (els.loadMoreBtn) {
    els.loadMoreBtn.addEventListener('click', () => {
      state.tvPage += 1;
      loadTvCatalog(true);
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
        els.modalShareBtn.textContent = '✓ Link Copied!';
        setTimeout(() => { els.modalShareBtn.textContent = '🔗 Share Link'; }, 1800);
      } catch (_) {}
    });
  }

  if (els.watchlistNavBtn) {
    els.watchlistNavBtn.addEventListener('click', () => {
      state.showingWatchlist = !state.showingWatchlist;
      if (state.showingWatchlist) {
        if (els.watchlistNoticeBanner) els.watchlistNoticeBanner.classList.remove('hidden');
        if (els.searchResultTabs) els.searchResultTabs.classList.add('hidden');
        if (els.loadMoreBtn) els.loadMoreBtn.classList.add('hidden');
        renderMoviesGrid(state.watchlist);
      } else {
        applyLocalFiltersAndRender();
      }
    });
  }

  if (els.surpriseNavBtn) {
    els.surpriseNavBtn.addEventListener('click', () => {
      const pool = state.displayedItems.length ? state.displayedItems : state.curatedMovies;
      if (!pool.length) return;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      openMovieModal(pick);
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
  if (els.runQuizBtn) els.runQuizBtn.addEventListener('click', runFinderQuiz);

  if (els.trailerCloseBtn) els.trailerCloseBtn.addEventListener('click', closeTrailerModal);
  if (els.trailerModal) {
    els.trailerModal.addEventListener('click', (e) => {
      if (e.target === els.trailerModal) closeTrailerModal();
    });
  }

  if (els.mobileNavHome) {
    els.mobileNavHome.addEventListener('click', () => {
      resetAllFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  if (els.mobileNavSurprise && els.quizModal) {
    els.mobileNavSurprise.addEventListener('click', () => {
      els.quizModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  }
  if (els.mobileNavWatchlist && els.watchlistNavBtn) {
    els.mobileNavWatchlist.addEventListener('click', () => els.watchlistNavBtn.click());
  }
  if (els.mobileNavTop) {
    els.mobileNavTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  setupVoiceSearch();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTrailerModal();
      closeMovieModal();
      if (els.quizModal) els.quizModal.classList.add('hidden');
    }
  });
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
  else if (urlQuery || urlLang) state.mediaType = 'movie';
  else state.mediaType = 'tv';

  setMediaTypeUI(state.mediaType);

  if (urlGenre) {
    const mapped = GENRE_SLUG_MAP[urlGenre.toLowerCase()] || urlGenre;
    if (GENRE_MAP[mapped]) {
      state.genre = mapped;
      if (els.genreChips) {
        els.genreChips.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.genre === mapped));
      }
    }
  }
  if (urlLang && LANGUAGE_NAMES[urlLang]) {
    state.language = urlLang;
    if (els.languageSelect) els.languageSelect.value = urlLang;
  }

  await Promise.allSettled([loadCuratedMovies(), loadTvCatalog(false)]);

  if (urlQuery) {
    if (els.searchInput) els.searchInput.value = urlQuery;
    if (els.clearSearchBtn) els.clearSearchBtn.classList.remove('hidden');
    await searchTitlesLive(urlQuery, false);
  } else {
    applyLocalFiltersAndRender();
  }
}

document.addEventListener('DOMContentLoaded', initApp);
