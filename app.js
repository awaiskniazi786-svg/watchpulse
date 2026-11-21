/**
 * WatchPulse.online — Plan B Commercial-Safe Discovery Engine ($0/Month, Zero TMDB)
 * - TV Series: Live TVmaze API (CC BY-SA — Commercial AdSense Allowed, Zero API Key)
 * - Movies: WatchPulse Curated Editorial Library (data/curated-catalog.json) + Wikipedia Open Facts Fallback
 * - Trailers: Official YouTube Search / Embed
 * - Local Watchlist + Watched Status: Browser localStorage
 */

const CATALOG_PROXY_URL = '/api/catalog';
const CURATED_CATALOG_URL = '/data/curated-catalog.json';
const FALLBACK_POSTER = '/preview.jpg';

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

const REGION_NAMES = {
  US: 'United States',
  GB: 'United Kingdom',
  PK: 'Pakistan',
  CA: 'Canada',
  DE: 'Germany',
  IN: 'India',
  AU: 'Australia',
  AE: 'United Arab Emirates',
  FR: 'France',
  ES: 'Spain',
  JP: 'Japan',
  KR: 'South Korea',
  BR: 'Brazil'
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
  'Severance',
  'Silo',
  'Dune: Part Two',
  'Chernobyl',
  'Oppenheimer',
  'Maharaja',
  'Dark',
  'Stranger Things'
];

// Verified Official Embeddable YouTube Trailer IDs (100% public YouTube embed player)
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

// App State
const state = {
  mediaType: 'tv', // Default to Live TVmaze TV Series (full real posters & live search!) or switch to Curated Movies
  region: 'US',
  language: 'all',
  provider: 'all',
  genre: 'all',
  searchQuery: '',
  tvPage: 0,
  curatedMovies: [],
  tvShowsCache: [],
  displayedItems: [],
  currentHero: null,
  currentModalItem: null,
  watchlist: [],
  showingWatchlist: false
};

// DOM Elements
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
  regionSelect: document.getElementById('regionSelect'),
  languageSelect: document.getElementById('languageSelect'),
  providerChips: document.getElementById('providerChips'),
  genreChips: document.getElementById('genreChips'),
  gridTitle: document.getElementById('gridTitle'),
  moviesCount: document.getElementById('moviesCount'),
  watchlistNoticeBanner: document.getElementById('watchlistNoticeBanner'),
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

function trackEvent(eventName, params = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...params });
  } catch (_) {}
}

function detectDefaultRegion() {
  try {
    const saved = localStorage.getItem('wp_region');
    if (saved && REGION_NAMES[saved]) return saved;
    const lang = (navigator.language || 'en-US').toUpperCase();
    const parts = lang.split('-');
    if (parts[1] && REGION_NAMES[parts[1]]) return parts[1];
  } catch (_) {}
  return 'US';
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

/**
 * Smart Fetch Helper:
 * Uses /api/catalog on Netlify production; seamlessly falls back to direct CORS-enabled
 * TVmaze / Wikipedia public APIs when previewing locally without Netlify Functions.
 */
async function fetchCatalogApi(action, params = {}) {
  const qs = new URLSearchParams({ action, ...params });
  try {
    const res = await fetch(`${CATALOG_PROXY_URL}?${qs.toString()}`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch (_) {}

  // Direct CORS-enabled fallback for local preview (zero API keys needed!)
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
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent((params.q || '') + ' film')}&srlimit=6&format=json&origin=*`);
    if (!res.ok) throw new Error('Wikipedia search unavailable');
    return await res.json();
  }
  throw new Error('Unknown catalog action');
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
    backdrop: show.image ? (show.image.original || show.image.medium) : '',
    overview: stripHtmlTags(show.summary) || 'Explore episode schedule, streaming network details, and official trailers on WatchPulse.',
    platforms: [networkName],
    officialUrl: show.url || 'https://www.tvmaze.com',
    status: show.status || '',
    cast
  };
}

function normalizeCuratedMovie(m) {
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
    poster: '',
    backdrop: '/preview.jpg'
  };
}

function renderPosterArtHtml(item) {
  if (item.poster) {
    return `<img src="${escapeHtml(item.poster)}" alt="${escapeHtml(item.title)} poster" class="movie-poster" loading="lazy">`;
  }
  const accent = escapeHtml(item.accent || 'teal');
  const tag = item.source === 'Wikipedia Open Data' ? 'OPEN FILM DATA' : 'WATCHPULSE PICK';
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
    const bg = item.backdrop || '/preview.jpg';
    els.heroBackdrop.style.backgroundImage = `url('${bg}')`;
  }
  if (els.heroTitle) els.heroTitle.textContent = item.title;
  if (els.heroRating) els.heroRating.textContent = `⭐ ${item.rating}`;
  if (els.heroYear) els.heroYear.textContent = item.year;
  if (els.heroGenre) els.heroGenre.textContent = (item.genres || []).slice(0, 2).join(' / ');
  if (els.heroDuration) {
    els.heroDuration.textContent = item.media_type === 'tv'
      ? `📺 ${item.platforms[0] || 'TV Series'}`
      : `⏱️ ${item.runtime} min`;
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
  if (state.searchQuery) {
    return `Search Results for "${state.searchQuery}" (${state.mediaType === 'tv' ? 'TVmaze Live TV' : 'Curated Movies + Open Facts'})`;
  }
  const typeLabel = state.mediaType === 'tv' ? 'Popular TV Series (Live via TVmaze)' : 'Curated Editorial Movies';
  const parts = [];
  if (state.genre !== 'all' && GENRE_MAP[state.genre]) parts.push(GENRE_MAP[state.genre]);
  if (state.provider !== 'all' && PROVIDER_NAMES[state.provider]) parts.push(`on ${PROVIDER_NAMES[state.provider]}`);
  if (state.language !== 'all' && LANGUAGE_NAMES[state.language]) parts.push(LANGUAGE_NAMES[state.language]);
  return parts.length ? `${parts.join(' • ')} — ${typeLabel}` : typeLabel;
}

function renderMoviesGrid(items) {
  state.displayedItems = items;
  if (els.gridTitle) els.gridTitle.textContent = buildCatalogHeading();
  if (els.moviesCount) els.moviesCount.textContent = `Showing ${items.length} title${items.length === 1 ? '' : 's'}`;

  if (!items.length) {
    els.moviesGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem;">
        <h3 style="margin-bottom: 0.5rem;">No matching titles found</h3>
        <p style="color: var(--text-muted); margin-bottom: 1rem;">Try switching between Movies &amp; TV Series, clearing a filter, or searching another title.</p>
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
    const primaryPlatform = (item.platforms && item.platforms[0]) ? item.platforms[0] : (item.media_type === 'tv' ? 'TV Series' : 'Curated');
    return `
      <article class="movie-card" data-id="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="Open details for ${escapeHtml(item.title)}">
        <div class="poster-wrap">
          ${renderPosterArtHtml(item)}
          <span class="card-rating-badge">⭐ ${escapeHtml(item.rating)}</span>
          <span class="card-type-badge">${item.media_type === 'tv' ? '📺 TV' : '🎬 Film'}</span>
          <button type="button" class="card-watchlist-btn ${isSaved ? 'saved' : ''}" data-wl-id="${escapeHtml(item.id)}" title="${isSaved ? 'Remove from Watchlist' : 'Save to Watchlist'}" aria-label="Toggle Watchlist">${isSaved ? '✓' : '🔖'}</button>
        </div>
        <div class="movie-info">
          <h3 class="movie-title">${escapeHtml(item.title)}</h3>
          <div class="movie-meta">
            <span>${escapeHtml(item.year)}</span>
            <span>•</span>
            <span>${escapeHtml(primaryPlatform)}</span>
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
    <div class="movie-card skeleton-card" style="min-height: 310px; opacity: 0.5;">
      <div class="poster-wrap" style="background: rgba(255,255,255,0.05); height: 240px;"></div>
      <div class="movie-info" style="padding: 0.75rem;"><div style="height: 14px; background: rgba(255,255,255,0.08); border-radius: 4px;"></div></div>
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

    applyLocalFiltersAndRender();
    if (els.loadMoreBtn) els.loadMoreBtn.classList.remove('hidden');
  } catch (err) {
    els.moviesGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);">Could not reach TVmaze API right now. Try switching to Curated Movies or retrying.</div>`;
  }
}

function matchesProvider(item, providerId) {
  if (providerId === 'all') return true;
  const target = (PROVIDER_NAMES[providerId] || '').toLowerCase();
  return (item.platforms || []).some(p => {
    const lp = p.toLowerCase();
    if (target === 'max') return lp.includes('max') || lp.includes('hbo');
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

async function searchTitlesLive(query) {
  state.searchQuery = query.trim();
  state.showingWatchlist = false;
  if (els.watchlistNoticeBanner) els.watchlistNoticeBanner.classList.add('hidden');

  if (!state.searchQuery) {
    applyLocalFiltersAndRender();
    return;
  }

  showLoadingGrid();
  if (els.loadMoreBtn) els.loadMoreBtn.classList.add('hidden');

  const qLower = state.searchQuery.toLowerCase();

  // Unified Search: always search Curated Movies + Wikipedia Open Film Search + TVmaze TV Shows together!
  const curatedHits = state.curatedMovies.filter(m =>
    m.title.toLowerCase().includes(qLower) ||
    m.overview.toLowerCase().includes(qLower) ||
    (m.director || '').toLowerCase().includes(qLower) ||
    (m.genres || []).some(g => g.toLowerCase().includes(qLower))
  );

  const [wikiRes, tvRes] = await Promise.allSettled([
    fetchCatalogApi('wiki-search', { q: state.searchQuery }),
    fetchCatalogApi('tv-search', { q: state.searchQuery })
  ]);

  let wikiHits = [];
  if (wikiRes.status === 'fulfilled' && wikiRes.value && wikiRes.value.query && Array.isArray(wikiRes.value.query.search)) {
    const existingTitles = new Set(curatedHits.map(x => x.title.toLowerCase()));
    wikiHits = wikiRes.value.query.search
      .filter(w => {
        const cleanTitle = w.title.replace(/\s*\([^)]*film[^)]*\)/i, '').trim();
        return cleanTitle && !existingTitles.has(cleanTitle.toLowerCase());
      })
      .slice(0, 6)
      .map(w => {
        const cleanTitle = w.title.replace(/\s*\([^)]*film[^)]*\)/i, '').trim();
        const yearMatch = (w.title + ' ' + w.snippet).match(/\b(19|20)\d{2}\b/);
        return {
          id: `wiki-${w.pageid}`,
          media_type: 'movie',
          source: 'Wikipedia Open Data',
          title: cleanTitle,
          year: yearMatch ? yearMatch[0] : 'Film',
          rating: 'Film',
          runtime: 0,
          genres: ['Film'],
          language: 'en',
          languageLabel: 'Global',
          director: '',
          cast: [],
          platforms: ['Check Regional Streaming Apps'],
          overview: stripHtmlTags(w.snippet) + '...',
          officialUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(w.title.replace(/ /g, '_'))}`,
          accent: 'indigo',
          poster: '',
          backdrop: '/preview.jpg'
        };
      });
  }

  let tvHits = [];
  if (tvRes.status === 'fulfilled' && Array.isArray(tvRes.value)) {
    tvHits = tvRes.value.slice(0, 8).map(r => normalizeTvMazeShow(r.show)).filter(Boolean);
  }

  // Prioritize exact/prefix title matches first across Movies & TV so searching any movie or show feels natural!
  const allCombined = state.mediaType === 'movie'
    ? [...curatedHits, ...wikiHits, ...tvHits]
    : [...tvHits, ...curatedHits, ...wikiHits];

  const scoreItem = (it) => {
    const t = (it.title || '').toLowerCase();
    if (t === qLower) return 100;
    if (t.startsWith(qLower)) return 80;
    if (t.includes(qLower)) return 60;
    return it.source === 'WatchPulse Curated' ? 40 : 20;
  };
  const combined = allCombined.sort((a, b) => scoreItem(b) - scoreItem(a));

  renderMoviesGrid(combined);
  if (combined.length) renderHero(combined[0]);
  trackEvent('watchpulse_search', { query: state.searchQuery, media_type: state.mediaType, results: combined.length });
}

async function openMovieModal(item) {
  state.currentModalItem = item;
  let detailed = item;

  // Fetch live TVmaze cast if TV show doesn't have cast embedded yet
  if (item.media_type === 'tv' && item.tvmazeId && (!item.cast || !item.cast.length)) {
    try {
      const fullShow = await fetchCatalogApi('tv-details', { id: item.tvmazeId });
      detailed = normalizeTvMazeShow(fullShow) || item;
      state.currentModalItem = detailed;
    } catch (_) {}
  }

  if (els.modalBackdrop) {
    els.modalBackdrop.style.backgroundImage = `url('${detailed.backdrop || '/preview.jpg'}')`;
  }
  if (els.modalPoster) {
    els.modalPoster.src = detailed.poster || FALLBACK_POSTER;
    els.modalPoster.alt = `${detailed.title} poster`;
  }
  if (els.modalTitle) els.modalTitle.textContent = detailed.title;
  if (els.modalRating) els.modalRating.textContent = `⭐ ${detailed.rating}`;
  if (els.modalYear) els.modalYear.textContent = detailed.year;
  if (els.modalRuntime) {
    els.modalRuntime.textContent = detailed.runtime
      ? (detailed.media_type === 'tv' ? `~${detailed.runtime}m / ep` : `${detailed.runtime} min`)
      : 'Feature Film';
  }
  if (els.modalGenres) els.modalGenres.textContent = (detailed.genres || []).join(', ');
  if (els.modalOverview) {
    els.modalOverview.textContent = detailed.editorial_note
      ? `${detailed.overview} — WatchPulse Note: ${detailed.editorial_note}`
      : detailed.overview;
  }

  if (els.modalRegionNote) {
    els.modalRegionNote.textContent = detailed.media_type === 'tv'
      ? 'Primary Network / Streaming Home (TVmaze — varies by country)'
      : 'Curated Platform Note (checked Nov 21, 2026 — verify locally)';
  }

  // Render honest commercial-safe provider & guide chips
  if (els.watchProvidersList) {
    const pills = (detailed.platforms || []).map(p => `<span class="provider-pill">${escapeHtml(p)}</span>`).join('');
    const guideBtn = detailed.guide_url
      ? `<a href="${escapeHtml(detailed.guide_url)}" class="provider-pill" style="border-color: var(--accent-cyan); color: var(--accent-cyan); text-decoration: none;">📚 Read: ${escapeHtml(detailed.guide_title)} →</a>`
      : '';
    els.watchProvidersList.innerHTML = `<div class="provider-tier-group"><div class="provider-tier-pills">${pills}${guideBtn}</div></div>`;
  }

  if (els.modalFreshnessNote) {
    els.modalFreshnessNote.textContent = detailed.source === 'TVmaze'
      ? 'Live TV data provided by TVmaze (CC BY-SA — Commercial Allowed)'
      : detailed.source === 'Wikipedia Open Data'
        ? 'Open film summary via Wikipedia (CC BY-SA)'
        : 'Curated by WatchPulse Editorial — verify exact regional catalog inside your app';
  }

  if (els.officialWatchLink) {
    els.officialWatchLink.href = detailed.officialUrl || detailed.guide_url || '/guides.html';
    els.officialWatchLink.textContent = detailed.source === 'TVmaze'
      ? 'View Full Episode Guide on TVmaze ↗'
      : detailed.source === 'Wikipedia Open Data'
        ? 'Read Full Article on Wikipedia ↗'
        : 'Open Matching WatchPulse Guide →';
  }

  if (els.reportDataIssueLink) {
    els.reportDataIssueLink.href = `/contact.html?subject=bug&title=${encodeURIComponent(detailed.title)}&region=${encodeURIComponent(state.region)}`;
  }

  if (els.modalCastList) {
    if (detailed.cast && detailed.cast.length) {
      els.modalCastList.innerHTML = detailed.cast.map(name => `<span class="cast-pill">${escapeHtml(name)}</span>`).join('');
    } else if (detailed.director) {
      els.modalCastList.innerHTML = `<span class="cast-pill">Director: ${escapeHtml(detailed.director)}</span>`;
    } else {
      els.modalCastList.innerHTML = `<span class="cast-pill">See official reference link above</span>`;
    }
  }

  // Similar titles from local pool (zero extra API call!)
  if (els.modalSimilarSection && els.modalSimilarList) {
    const pool = detailed.media_type === 'tv' ? state.tvShowsCache : state.curatedMovies;
    const primaryGenre = (detailed.genres && detailed.genres[0]) || '';
    const similar = pool.filter(x => x.id !== detailed.id && (x.genres || []).includes(primaryGenre)).slice(0, 4);
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
  els.movieModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeMovieModal() {
  els.movieModal.classList.add('hidden');
  document.body.style.overflow = '';
}

function updateModalWatchlistBtn() {
  if (!els.modalWatchlistBtn || !state.currentModalItem) return;
  const inList = state.watchlist.some(w => w.id === state.currentModalItem.id);
  els.modalWatchlistBtn.textContent = inList ? '✓ Saved in Watchlist' : '🔖 Bookmark to Watchlist';
}

function toggleWatchlist(item) {
  const idx = state.watchlist.findIndex(w => w.id === item.id);
  if (idx >= 0) {
    state.watchlist.splice(idx, 1);
  } else {
    state.watchlist.unshift({ ...item, watched: false });
  }
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

function openTrailerForItem(item) {
  if (!item) return;
  const key = VERIFIED_TRAILER_IDS[(item.title || '').toLowerCase().trim()] || '';
  const searchQuery = `${item.title} ${item.year || ''} official trailer`;
  const ytWatchUrl = key
    ? `https://www.youtube.com/watch?v=${key}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

  if (els.externalTrailerLink) {
    els.externalTrailerLink.href = ytWatchUrl;
    els.externalTrailerLink.textContent = key ? '↗ Open Trailer on YouTube' : `↗ Search "${item.title}" Trailer on YouTube`;
  }

  if (els.trailerModal && els.trailerIframe) {
    const videoWrap = els.trailerIframe.parentElement;
    let fallbackBox = document.getElementById('trailerNoEmbedCard');
    if (key) {
      if (fallbackBox) fallbackBox.style.display = 'none';
      els.trailerIframe.style.display = 'block';
      els.trailerIframe.src = `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0`;
    } else {
      els.trailerIframe.src = '';
      els.trailerIframe.style.display = 'none';
      if (!fallbackBox && videoWrap) {
        fallbackBox = document.createElement('div');
        fallbackBox.id = 'trailerNoEmbedCard';
        fallbackBox.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.85rem;padding:1.5rem;text-align:center;background:radial-gradient(circle at top,#134e4a 0%,#0b0f17 75%);color:#f8fafc;';
        videoWrap.appendChild(fallbackBox);
      }
      if (fallbackBox) {
        fallbackBox.style.display = 'flex';
        fallbackBox.innerHTML = `
          <span style="font-size:2rem;">🎬</span>
          <h3 style="margin:0;font-size:1.15rem;">Official Trailer: ${escapeHtml(item.title)} (${escapeHtml(item.year || '')})</h3>
          <p style="margin:0;max-width:420px;font-size:0.86rem;color:#cbd5e1;">Direct embedded playback is enabled for featured WatchPulse titles. Launch the official studio trailer on YouTube with one tap:</p>
          <a href="${escapeHtml(ytWatchUrl)}" target="_blank" rel="noopener noreferrer" class="btn primary-btn" style="text-decoration:none;">▶ Watch Official Trailer on YouTube ↗</a>
        `;
      }
    }
    els.trailerModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } else {
    window.open(ytWatchUrl, '_blank', 'noopener,noreferrer');
  }
  trackEvent('watchpulse_trailer_click', { title: item.title, embedded: Boolean(key) });
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
      searchTitlesLive(transcript);
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
  state.showingWatchlist = false;
  if (els.searchInput) els.searchInput.value = '';
  if (els.clearSearchBtn) els.clearSearchBtn.classList.add('hidden');
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

  // Avoid double cookie banners when Google's certified AdSense CMP (EEA/UK/CH) is active
  const hasGoogleCmp = () => typeof window.__tcfapi === 'function' || Boolean(window.googlefc && window.googlefc.ccpa);
  if (!saved) {
    setTimeout(() => {
      if (!hasGoogleCmp()) {
        els.cookieBanner.classList.remove('hidden');
      }
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
      searchTimer = setTimeout(() => searchTitlesLive(val), 320);
    });
    els.searchInput.addEventListener('focus', () => {
      if (!els.searchInput.value.trim() && els.searchDropdown) {
        els.searchDropdown.innerHTML = `<div style="padding:0.5rem 0.75rem;font-size:0.75rem;color:var(--text-muted);">Popular Quick Searches</div>` +
          TRENDING_KEYWORDS.map(k => `<button type="button" class="dropdown-item" data-kw="${escapeHtml(k)}" style="width:100%;text-align:left;padding:0.5rem 0.75rem;background:none;border:none;color:var(--text-main);cursor:pointer;">🔍 ${escapeHtml(k)}</button>`).join('');
        els.searchDropdown.classList.remove('hidden');
        els.searchDropdown.querySelectorAll('[data-kw]').forEach(btn => {
          btn.addEventListener('click', () => {
            els.searchInput.value = btn.dataset.kw;
            els.searchDropdown.classList.add('hidden');
            if (els.clearSearchBtn) els.clearSearchBtn.classList.remove('hidden');
            searchTitlesLive(btn.dataset.kw);
          });
        });
      }
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
      searchTitlesLive('');
    });
  }

  if (els.mediaTypeToggle) {
    els.mediaTypeToggle.querySelectorAll('.media-type-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const nextType = btn.dataset.type;
        if (nextType === state.mediaType) return;
        setMediaTypeUI(nextType);
        if (state.searchQuery) {
          await searchTitlesLive(state.searchQuery);
        } else if (nextType === 'tv' && !state.tvShowsCache.length) {
          await loadTvCatalog(false);
        } else {
          applyLocalFiltersAndRender();
        }
      });
    });
  }

  if (els.regionSelect) {
    els.regionSelect.value = state.region;
    els.regionSelect.addEventListener('change', () => {
      state.region = els.regionSelect.value;
      try { localStorage.setItem('wp_region', state.region); } catch (_) {}
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

  // Trailer modal close listeners
  if (els.trailerCloseBtn) els.trailerCloseBtn.addEventListener('click', closeTrailerModal);
  if (els.trailerModal) {
    els.trailerModal.addEventListener('click', (e) => {
      if (e.target === els.trailerModal) closeTrailerModal();
    });
  }

  // Mobile Bottom Navigation Dock
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
  state.region = detectDefaultRegion();
  state.watchlist = loadSavedWatchlist();
  updateWatchlistBadge();
  initCookieConsent();
  setupEventListeners();

  // Read URL params (?type=tv|movie, ?q=..., ?genre=..., ?lang=...)
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

  // Load curated movies immediately + live TVmaze catalog in parallel
  await Promise.allSettled([loadCuratedMovies(), loadTvCatalog(false)]);

  if (urlQuery) {
    if (els.searchInput) els.searchInput.value = urlQuery;
    if (els.clearSearchBtn) els.clearSearchBtn.classList.remove('hidden');
    await searchTitlesLive(urlQuery);
  } else {
    applyLocalFiltersAndRender();
  }
}

document.addEventListener('DOMContentLoaded', initApp);
