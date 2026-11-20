/**
 * WatchPulse.online — Movie & TV Series Streaming Discovery Engine
 * Powered by TMDB API v3 (Regional Provider Data via JustWatch)
 */

const TMDB_PROXY_URL = '/api/tmdb';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';
const POSTER_SIZE = 'w500';
const BACKDROP_SIZE = 'w1280';
const PROFILE_SIZE = 'w185';
const FALLBACK_POSTER = '/preview.jpg';

function buildTmdbProxyUrl(endpoint, params = {}) {
  const query = new URLSearchParams({ endpoint });
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.set(key, String(val));
    }
  });
  return `${TMDB_PROXY_URL}?${query.toString()}`;
}

const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10765: 'Sci-Fi & Fantasy',
  10762: 'Kids',
  10764: 'Reality',
  10768: 'War & Politics'
};

// Map movie genre chip IDs to equivalent TV genre IDs when browsing TV Series
const MOVIE_TO_TV_GENRE = {
  '28': '10759',
  '878': '10765',
  '18': '18',
  '35': '35',
  '27': '9648',
  '53': '80',
  '16': '16'
};

const GENRE_SLUG_MAP = {
  action: '28',
  adventure: '12',
  animation: '16',
  comedy: '35',
  crime: '80',
  documentary: '99',
  drama: '18',
  family: '10751',
  fantasy: '14',
  history: '36',
  horror: '27',
  music: '10402',
  mystery: '9648',
  romance: '10749',
  scifi: '878',
  'sci-fi': '878',
  thriller: '53',
  war: '10752',
  western: '37'
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

const PROVIDER_NAMES = {
  '8': 'Netflix',
  '9': 'Prime Video',
  '337': 'Disney+',
  '350': 'Apple TV+',
  '1899': 'Max'
};

const TRENDING_KEYWORDS = [
  'Dune: Part Two',
  'The Wild Robot',
  'Oppenheimer',
  'Interstellar',
  'Severance',
  'Arrival',
  'Alien: Romulus',
  'The Bear',
  'Arcane',
  'Deadpool & Wolverine'
];

const FALLBACK_MOVIE = {
  id: 693134,
  media_type: 'movie',
  title: 'Dune: Part Two',
  release_date: '2024-02-27',
  vote_average: '8.3',
  runtime: 166,
  genres: ['Sci-Fi', 'Adventure'],
  genre_ids: [878, 12],
  overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.',
  poster_path: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  backdrop_path: 'https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg',
  trailer_key: 'Way9Dexny3w'
};

function detectDefaultRegion() {
  const saved = localStorage.getItem('watchpulse_region');
  if (saved && REGION_NAMES[saved]) return saved;

  try {
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
    if (tz.includes('karachi')) return 'PK';
    if (tz.includes('kolkata') || tz.includes('calcutta')) return 'IN';
    if (tz.includes('london')) return 'GB';
    if (tz.includes('toronto') || tz.includes('vancouver')) return 'CA';
    if (tz.includes('berlin')) return 'DE';
    if (tz.includes('sydney') || tz.includes('melbourne')) return 'AU';
    if (tz.includes('dubai')) return 'AE';
    if (tz.includes('paris')) return 'FR';
    if (tz.includes('madrid')) return 'ES';
    if (tz.includes('tokyo')) return 'JP';
    if (tz.includes('seoul')) return 'KR';
    if (tz.includes('sao_paulo')) return 'BR';
  } catch (_) {}

  return 'US';
}

function loadSavedWatchlist() {
  try {
    const raw = localStorage.getItem('cinestream_watchlist');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

const state = {
  mediaType: 'movie', // 'movie' | 'tv'
  region: detectDefaultRegion(),
  language: 'all',
  movies: [],
  heroMovie: null,
  activeGenre: 'all',
  activeProvider: 'all',
  searchQuery: '',
  page: 1,
  totalPages: 1,
  watchlist: loadSavedWatchlist(),
  isShowingWatchlistOnly: false,
  searchDebounceTimer: null
};

let activeModalMovie = null;

// DOM Elements
const brandLogo = document.getElementById('brandLogo');
const searchInput = document.getElementById('searchInput');
const voiceSearchBtn = document.getElementById('voiceSearchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchDropdown = document.getElementById('searchDropdown');
const watchlistNavBtn = document.getElementById('watchlistNavBtn');
const watchlistCount = document.getElementById('watchlistCount');
const surpriseNavBtn = document.getElementById('surpriseNavBtn');
const quizNavBtn = document.getElementById('quizNavBtn');

const mediaTypeToggle = document.getElementById('mediaTypeToggle');
const regionSelect = document.getElementById('regionSelect');
const languageSelect = document.getElementById('languageSelect');
const providerChips = document.getElementById('providerChips');
const genreChips = document.getElementById('genreChips');
const moviesGrid = document.getElementById('moviesGrid');
const gridTitle = document.getElementById('gridTitle');
const moviesCount = document.getElementById('moviesCount');
const watchlistNoticeBanner = document.getElementById('watchlistNoticeBanner');
const loadMoreBtn = document.getElementById('loadMoreBtn');

// Hero Elements
const heroBackdrop = document.getElementById('heroBackdrop');
const heroTitle = document.getElementById('heroTitle');
const heroRating = document.getElementById('heroRating');
const heroYear = document.getElementById('heroYear');
const heroGenre = document.getElementById('heroGenre');
const heroDuration = document.getElementById('heroDuration');
const heroOverview = document.getElementById('heroOverview');
const heroTrailerBtn = document.getElementById('heroTrailerBtn');
const heroDetailsBtn = document.getElementById('heroDetailsBtn');
const heroWatchlistBtn = document.getElementById('heroWatchlistBtn');

// Movie Details Modal Elements
const movieModal = document.getElementById('movieModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalPoster = document.getElementById('modalPoster');
const modalTitle = document.getElementById('modalTitle');
const modalRating = document.getElementById('modalRating');
const modalYear = document.getElementById('modalYear');
const modalRuntime = document.getElementById('modalRuntime');
const modalGenres = document.getElementById('modalGenres');
const modalOverview = document.getElementById('modalOverview');
const modalRegionNote = document.getElementById('modalRegionNote');
const modalFreshnessNote = document.getElementById('modalFreshnessNote');
const officialWatchLink = document.getElementById('officialWatchLink');
const reportDataIssueLink = document.getElementById('reportDataIssueLink');
const watchProvidersList = document.getElementById('watchProvidersList');
const modalCastList = document.getElementById('modalCastList');
const modalSimilarSection = document.getElementById('modalSimilarSection');
const modalSimilarList = document.getElementById('modalSimilarList');
const modalTrailerBtn = document.getElementById('modalTrailerBtn');
const modalWatchlistBtn = document.getElementById('modalWatchlistBtn');
const modalShareBtn = document.getElementById('modalShareBtn');

// Trailer Modal Elements
const trailerModal = document.getElementById('trailerModal');
const trailerCloseBtn = document.getElementById('trailerCloseBtn');
const trailerIframe = document.getElementById('trailerIframe');
const externalTrailerLink = document.getElementById('externalTrailerLink');

// Quiz Modal Elements
const quizModal = document.getElementById('quizModal');
const quizCloseBtn = document.getElementById('quizCloseBtn');
const quizMoodOptions = document.getElementById('quizMoodOptions');
const quizRuntimeOptions = document.getElementById('quizRuntimeOptions');
const quizFormatOptions = document.getElementById('quizFormatOptions');
const runQuizBtn = document.getElementById('runQuizBtn');
const quizResultsContainer = document.getElementById('quizResultsContainer');

// Mobile Bottom Nav
const mobileNavHome = document.getElementById('mobileNavHome');
const mobileNavSurprise = document.getElementById('mobileNavSurprise');
const mobileNavWatchlist = document.getElementById('mobileNavWatchlist');
const mobileWatchlistBadge = document.getElementById('mobileWatchlistBadge');
const mobileNavTop = document.getElementById('mobileNavTop');

/**
 * Privacy-conscious GA4 Event Helper (Only fires when explicit consent is granted)
 */
function trackEvent(eventName, params = {}) {
  try {
    if (localStorage.getItem('wp_cookie_consent') !== 'accepted') return;
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  } catch (_) {}
}

/**
 * Escape HTML special characters for safe rendering
 */
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function makeTitleSlug(item) {
  const slug = String(item.title || 'title')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${item.id}-${slug || 'watch'}`;
}

/**
 * Normalize TMDB Movie or TV Object
 */
function normalizeItem(m, forcedType) {
  const mediaType = forcedType || m.media_type || state.mediaType || 'movie';
  const genreNames = (m.genre_ids || [])
    .map(id => GENRE_MAP[id])
    .filter(Boolean);

  const rawTitle = m.title || m.name || m.original_title || m.original_name || 'Untitled';
  const rawDate = m.release_date || m.first_air_date || '2026';
  const runtimeVal = m.runtime || (Array.isArray(m.episode_run_time) && m.episode_run_time[0]) || null;

  return {
    id: m.id,
    media_type: mediaType,
    title: rawTitle,
    release_date: rawDate,
    vote_average: m.vote_average ? Number(m.vote_average).toFixed(1) : '7.2',
    runtime: runtimeVal,
    number_of_seasons: m.number_of_seasons || null,
    genres: genreNames.length > 0 ? genreNames : (m.genres ? m.genres.map(g => g.name) : [mediaType === 'tv' ? 'TV Series' : 'Feature']),
    genre_ids: m.genre_ids || [],
    original_language: m.original_language || 'en',
    overview: m.overview || 'Official synopsis is being updated for this release.',
    poster_path: m.poster_path
      ? `${TMDB_IMAGE_BASE}${POSTER_SIZE}${m.poster_path}`
      : FALLBACK_POSTER,
    backdrop_path: m.backdrop_path
      ? `${TMDB_IMAGE_BASE}${BACKDROP_SIZE}${m.backdrop_path}`
      : (m.poster_path ? `${TMDB_IMAGE_BASE}${BACKDROP_SIZE}${m.poster_path}` : FALLBACK_POSTER),
    trailer_key: null,
    providers: null,
    cast: null,
    watched: false
  };
}

/**
 * Parse Clean URL (/movie/123-slug, /tv/123-slug) or Legacy Query (?movie=123)
 */
function parseDeepTitleFromLocation() {
  const pathMatch = window.location.pathname.match(/^\/(movie|tv)\/(\d+)/i);
  if (pathMatch) {
    return { mediaType: pathMatch[1].toLowerCase(), id: parseInt(pathMatch[2], 10) };
  }
  const params = new URLSearchParams(window.location.search);
  const legacyMovie = params.get('movie');
  if (legacyMovie) {
    const id = parseInt(legacyMovie.split('-')[0], 10);
    if (id) return { mediaType: 'movie', id, isLegacyQuery: true };
  }
  const legacyTv = params.get('tv');
  if (legacyTv) {
    const id = parseInt(legacyTv.split('-')[0], 10);
    if (id) return { mediaType: 'tv', id, isLegacyQuery: true };
  }
  return null;
}

/**
 * Initialize Application
 */
async function initApp() {
  if (regionSelect) regionSelect.value = state.region;
  updateWatchlistBadge();
  setupEventListeners();
  initCookieConsent();

  const urlParams = new URLSearchParams(window.location.search);
  const deepGenreParam = urlParams.get('genre');
  const deepQueryParam = urlParams.get('q');
  const deepRegionParam = urlParams.get('region');
  const deepLangParam = urlParams.get('lang');
  const deepTypeParam = urlParams.get('type');

  if (deepRegionParam && REGION_NAMES[deepRegionParam.toUpperCase()]) {
    state.region = deepRegionParam.toUpperCase();
    if (regionSelect) regionSelect.value = state.region;
  }

  if (deepLangParam && LANGUAGE_NAMES[deepLangParam.toLowerCase()]) {
    state.language = deepLangParam.toLowerCase();
    if (languageSelect) languageSelect.value = state.language;
  }

  if (deepTypeParam === 'tv' || deepTypeParam === 'movie') {
    setMediaTypeUI(deepTypeParam);
  }

  const deepTitle = parseDeepTitleFromLocation();

  await loadTrendingCatalog();

  if (deepQueryParam && deepQueryParam.trim() !== '') {
    const query = deepQueryParam.trim();
    state.searchQuery = query;
    searchInput.value = query;
    clearSearchBtn.classList.remove('hidden');
    await searchTitlesLive(query);
    if (searchDropdown) searchDropdown.classList.add('hidden');
    document.title = `Search "${query}" — WatchPulse`;
  } else if (deepGenreParam && deepGenreParam.trim() !== '') {
    const rawGenre = deepGenreParam.trim().toLowerCase();
    const genreId = GENRE_SLUG_MAP[rawGenre] || (GENRE_MAP[rawGenre] ? rawGenre : null);
    if (genreId) {
      state.activeGenre = genreId;
      document.querySelectorAll('.chip').forEach(c => {
        c.classList.toggle('active', c.dataset.genre === genreId);
      });
      await loadCombinedCatalog(false);
    }
  } else if (state.language !== 'all') {
    await loadCombinedCatalog(false);
  }

  if (deepTitle && deepTitle.id) {
    await openTitleById(deepTitle.id, deepTitle.mediaType);
  }
}

async function openTitleById(id, mediaType = 'movie') {
  const match = state.movies.find(m => m.id === id && m.media_type === mediaType);
  if (match) {
    await openMovieModal(match);
    return;
  }
  try {
    const res = await fetch(buildTmdbProxyUrl(`/${mediaType}/${id}`));
    if (!res.ok) throw new Error('Title lookup failed');
    const data = await res.json();
    if (data && data.id) {
      const normalized = normalizeItem(data, mediaType);
      await openMovieModal(normalized);
    }
  } catch (err) {
    console.warn('Could not open deep-linked title:', err);
  }
}

function setMediaTypeUI(type) {
  state.mediaType = type === 'tv' ? 'tv' : 'movie';
  if (mediaTypeToggle) {
    mediaTypeToggle.querySelectorAll('.media-type-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === state.mediaType);
    });
  }
}

function getEffectiveGenreId(rawGenreId) {
  if (rawGenreId === 'all') return 'all';
  if (state.mediaType === 'tv') {
    return MOVIE_TO_TV_GENRE[rawGenreId] || rawGenreId;
  }
  return rawGenreId;
}

function buildCatalogHeading() {
  const typeLabel = state.mediaType === 'tv' ? 'TV Series' : 'Movies';
  const regionCode = state.region;
  const langLabel = state.language !== 'all' ? `${LANGUAGE_NAMES[state.language] || ''} ` : '';
  const genreLabel = state.activeGenre !== 'all' ? `${GENRE_MAP[state.activeGenre] || ''} ` : '';
  const providerName = state.activeProvider !== 'all' ? PROVIDER_NAMES[state.activeProvider] : null;

  if (providerName) {
    return `Top ${langLabel}${genreLabel}${typeLabel} on ${providerName} (${regionCode})`;
  }
  if (state.activeGenre !== 'all' || state.language !== 'all') {
    return `Top ${langLabel}${genreLabel}${typeLabel} (${regionCode})`;
  }
  return `Trending ${typeLabel} This Week`;
}

/**
 * Load Combined Catalog (Supports Movies/TV, Region, Language, Providers, Genres & Pagination)
 */
async function loadCombinedCatalog(append = false) {
  if (!append) {
    state.page = 1;
    showLoadingGrid();
  } else if (loadMoreBtn) {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading more...';
  }

  if (watchlistNoticeBanner) watchlistNoticeBanner.classList.add('hidden');
  gridTitle.textContent = buildCatalogHeading();

  const provider = state.activeProvider;
  const genre = getEffectiveGenreId(state.activeGenre);
  const lang = state.language;
  const mediaType = state.mediaType;

  try {
    let url;
    const isDefaultTrending = provider === 'all' && genre === 'all' && lang === 'all';
    if (isDefaultTrending) {
      url = buildTmdbProxyUrl(`/trending/${mediaType}/week`, { page: state.page });
    } else {
      const minVotes = lang !== 'all' || provider !== 'all' ? 15 : 40;
      const queryParams = {
        watch_region: state.region,
        sort_by: 'popularity.desc',
        'vote_count.gte': minVotes,
        page: state.page
      };
      if (provider !== 'all') {
        queryParams.with_watch_providers = provider;
      }
      if (genre !== 'all') {
        queryParams.with_genres = genre;
      }
      if (lang !== 'all') {
        queryParams.with_original_language = lang;
      }
      url = buildTmdbProxyUrl(`/discover/${mediaType}`, queryParams);
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.totalPages = Math.min(data.total_pages || 1, 20);
    const incoming = (data.results || []).map(item => normalizeItem(item, mediaType));

    if (append) {
      const existingIds = new Set(state.movies.map(m => `${m.media_type}-${m.id}`));
      incoming.forEach(item => {
        if (!existingIds.has(`${item.media_type}-${item.id}`)) {
          state.movies.push(item);
        }
      });
    } else {
      state.movies = incoming;
    }

    renderMoviesGrid(state.movies);
  } catch (err) {
    console.error('Failed to load catalog:', err);
    renderErrorGrid('Unable to load the catalog right now. Please check your connection and try again.', () => loadCombinedCatalog(append));
  } finally {
    if (loadMoreBtn) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = '⬇ Load More Titles';
    }
  }
}

/**
 * Load Initial Trending Catalog & Hero Spotlight
 */
async function loadTrendingCatalog() {
  state.page = 1;
  showLoadingGrid();
  if (watchlistNoticeBanner) watchlistNoticeBanner.classList.add('hidden');

  try {
    const res = await fetch(buildTmdbProxyUrl(`/trending/${state.mediaType}/week`, { page: 1 }));
    if (!res.ok) throw new Error('Trending API response was not OK');
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      state.totalPages = Math.min(data.total_pages || 1, 20);
      state.movies = data.results.map(m => normalizeItem(m, state.mediaType));
      state.heroMovie = state.movies[0];

      fetchTitleDetails(state.heroMovie.id, state.heroMovie.media_type).then(details => {
        if (details.trailer_key) {
          state.heroMovie.trailer_key = details.trailer_key;
        }
        if (details.runtimeLabel) {
          heroDuration.textContent = details.runtimeLabel;
        }
      });

      renderHero(state.heroMovie);
      renderMoviesGrid(state.movies);
      return;
    }
    throw new Error('Empty trending results');
  } catch (err) {
    console.warn('Falling back to cached highlight:', err);
    state.movies = [FALLBACK_MOVIE];
    state.totalPages = 1;
    renderHero(FALLBACK_MOVIE);
    renderMoviesGrid(state.movies);
  }
}

/**
 * Live Search Across TMDB (Movies or TV Series)
 */
async function searchTitlesLive(query, append = false) {
  if (!query || query.trim() === '') {
    loadCombinedCatalog(false);
    renderTrendingDropdown();
    return;
  }

  if (!append) {
    state.page = 1;
    showLoadingGrid();
  }

  const cleanQuery = query.trim();
  const typeLabel = state.mediaType === 'tv' ? 'TV Series' : 'Movies';
  gridTitle.textContent = `${typeLabel} matching "${cleanQuery}"`;
  trackEvent('search', { search_term: cleanQuery, media_type: state.mediaType });

  try {
    const res = await fetch(
      buildTmdbProxyUrl(`/search/${state.mediaType}`, {
        query: cleanQuery,
        page: state.page
      })
    );
    if (!res.ok) throw new Error('Search request failed');
    const data = await res.json();
    state.totalPages = Math.min(data.total_pages || 1, 10);
    const results = (data.results || []).map(m => normalizeItem(m, state.mediaType));

    if (append) {
      const existing = new Set(state.movies.map(m => m.id));
      results.forEach(r => {
        if (!existing.has(r.id)) state.movies.push(r);
      });
    } else {
      state.movies = results;
      renderAutocompleteDropdown(state.movies.slice(0, 5));
    }

    renderMoviesGrid(state.movies);
  } catch (err) {
    console.error('Search error:', err);
    renderErrorGrid(`Could not complete search for "${cleanQuery}".`, () => searchTitlesLive(cleanQuery, append));
  }
}

function renderTrendingDropdown() {
  if (!searchDropdown) return;

  searchDropdown.innerHTML = `
    <div style="padding: 0.75rem 1rem 0.4rem; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; justify-content: space-between;">
      <span>🔥 Popular Searches</span>
      <span style="font-size: 0.68rem; color: var(--accent-cyan);">1-Tap Instant Pick</span>
    </div>
    <div class="trending-chips-wrap">
      ${TRENDING_KEYWORDS.map(kw => `
        <button type="button" class="trending-search-chip" data-keyword="${escapeHtml(kw)}">
          🔍 ${escapeHtml(kw)}
        </button>
      `).join('')}
    </div>
  `;

  searchDropdown.querySelectorAll('.trending-search-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const kw = btn.dataset.keyword;
      searchInput.value = kw;
      state.searchQuery = kw;
      clearSearchBtn.classList.remove('hidden');
      searchTitlesLive(kw);
      searchDropdown.classList.add('hidden');
    });
  });

  searchDropdown.classList.remove('hidden');
}

function renderAutocompleteDropdown(results) {
  if (!searchDropdown) return;

  if (!results || results.length === 0) {
    searchDropdown.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No instant matches found. Try switching Movies / TV Series above.</div>`;
    searchDropdown.classList.remove('hidden');
    return;
  }

  searchDropdown.replaceChildren();
  results.forEach(item => {
    const row = document.createElement('div');
    row.className = 'search-item';
    const year = (item.release_date || '2026').substring(0, 4);
    const genre = (item.genres && item.genres[0]) || (item.media_type === 'tv' ? 'TV Series' : 'Movie');

    row.innerHTML = `
      <img src="${escapeHtml(item.poster_path)}" alt="${escapeHtml(item.title)}" class="search-item-poster" onerror="this.src='${FALLBACK_POSTER}'">
      <div class="search-item-info">
        <div class="search-item-title">${escapeHtml(item.title)}</div>
        <div class="search-item-meta">
          <span class="search-item-rating">⭐ ${escapeHtml(item.vote_average)}</span>
          <span>•</span>
          <span>${escapeHtml(year)}</span>
          <span>•</span>
          <span>${escapeHtml(genre)}</span>
        </div>
      </div>
    `;

    row.addEventListener('click', () => {
      openMovieModal(item);
      searchDropdown.classList.add('hidden');
    });

    searchDropdown.appendChild(row);
  });

  searchDropdown.classList.remove('hidden');
}

/**
 * Voice Search Setup
 */
function setupVoiceSearch() {
  if (!voiceSearchBtn) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    voiceSearchBtn.style.display = 'none';
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  let isRecording = false;

  voiceSearchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isRecording) {
      recognition.stop();
      return;
    }
    try {
      recognition.start();
    } catch (err) {
      console.warn('Speech start issue:', err);
    }
  });

  recognition.onstart = () => {
    isRecording = true;
    voiceSearchBtn.classList.add('recording');
    searchInput.placeholder = 'Listening... Speak title now 🎙️';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    searchInput.value = transcript;
    state.searchQuery = transcript;
    clearSearchBtn.classList.remove('hidden');
    searchTitlesLive(transcript);
  };

  recognition.onerror = () => {
    isRecording = false;
    voiceSearchBtn.classList.remove('recording');
    searchInput.placeholder = 'Search movies, TV series, genres...';
  };

  recognition.onend = () => {
    isRecording = false;
    voiceSearchBtn.classList.remove('recording');
    searchInput.placeholder = 'Search movies, TV series, genres...';
  };
}

function classifyProviderPill(name) {
  const lower = String(name || '').toLowerCase();
  if (lower.includes('netflix')) return 'netflix';
  if (lower.includes('prime') || lower.includes('amazon')) return 'prime';
  if (lower.includes('apple')) return 'apple';
  if (lower.includes('disney') || lower.includes('hotstar')) return 'disney';
  return 'prime';
}

/**
 * Fetch Deep Details (Videos, Regional Watch Providers by Tier, Credits & Recommendations)
 */
async function fetchTitleDetails(id, mediaType = 'movie') {
  try {
    const res = await fetch(
      buildTmdbProxyUrl(`/${mediaType}/${id}`, {
        append_to_response: 'videos,watch/providers,credits,recommendations'
      })
    );
    if (!res.ok) throw new Error('Detail fetch failed');
    const data = await res.json();

    // Find official YouTube trailer
    let trailerKey = null;
    if (data.videos && Array.isArray(data.videos.results)) {
      const trailer = data.videos.results.find(
        v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
      );
      if (trailer) trailerKey = trailer.key;
    }

    // Extract Streaming Providers strictly for the selected country (no fabricated fallback providers)
    const wpResults = data['watch/providers'] ? data['watch/providers'].results : null;
    const countryData = wpResults ? wpResults[state.region] : null;

    const dedupeNames = (arr) => {
      const seen = new Set();
      return (arr || []).filter(p => {
        if (!p || !p.provider_name || seen.has(p.provider_name)) return false;
        seen.add(p.provider_name);
        return true;
      }).map(p => ({
        name: p.provider_name,
        class: classifyProviderPill(p.provider_name)
      }));
    };

    const providerTiers = {
      subscription: dedupeNames(countryData ? countryData.flatrate : []).slice(0, 5),
      free: dedupeNames([
        ...((countryData && countryData.free) || []),
        ...((countryData && countryData.ads) || [])
      ]).slice(0, 4),
      rent: dedupeNames(countryData ? countryData.rent : []).slice(0, 4),
      buy: dedupeNames(countryData ? countryData.buy : []).slice(0, 4),
      link: (countryData && countryData.link) || `https://www.themoviedb.org/${mediaType}/${id}/watch?locale=${state.region}`
    };

    // Extract Top 5 Cast
    const topCast = (data.credits && Array.isArray(data.credits.cast))
      ? data.credits.cast.slice(0, 5).map(c => ({
          name: c.name,
          character: c.character,
          profile: c.profile_path ? `${TMDB_IMAGE_BASE}${PROFILE_SIZE}${c.profile_path}` : null
        }))
      : [];

    // Extract up to 6 Similar / Recommended Titles (excluding current ID)
    const similar = (data.recommendations && Array.isArray(data.recommendations.results))
      ? data.recommendations.results
          .filter(r => r && r.id && r.id !== id)
          .slice(0, 6)
          .map(r => normalizeItem(r, r.media_type || mediaType))
      : [];

    let runtimeLabel = 'Feature';
    if (mediaType === 'tv') {
      const seasons = data.number_of_seasons || 1;
      const episodes = data.number_of_episodes || '';
      runtimeLabel = `${seasons} Season${seasons > 1 ? 's' : ''}${episodes ? ` (${episodes} Eps)` : ''}`;
    } else if (data.runtime) {
      runtimeLabel = `${data.runtime} min`;
    }

    return {
      runtime: data.runtime || null,
      runtimeLabel,
      genres: data.genres ? data.genres.map(g => g.name) : [],
      trailer_key: trailerKey,
      providerTiers,
      cast: topCast,
      similar
    };
  } catch (err) {
    console.warn('Could not fetch deep details:', err);
    return {
      runtime: null,
      runtimeLabel: mediaType === 'tv' ? 'TV Series' : 'Feature',
      genres: [],
      trailer_key: null,
      providerTiers: {
        subscription: [],
        free: [],
        rent: [],
        buy: [],
        link: `https://www.themoviedb.org/${mediaType}/${id}/watch?locale=${state.region}`,
        error: true
      },
      cast: [],
      similar: []
    };
  }
}

/**
 * Render Spotlight Hero Banner
 */
function renderHero(item) {
  if (!item) return;
  heroTitle.textContent = item.title;
  heroRating.textContent = `⭐ ${item.vote_average}`;
  heroYear.textContent = (item.release_date || '2026').substring(0, 4);
  heroGenre.textContent = (item.genres || ['Action']).slice(0, 2).join(' / ');
  if (item.media_type === 'tv') {
    heroDuration.textContent = item.number_of_seasons ? `${item.number_of_seasons} Seasons` : 'TV Series';
  } else {
    heroDuration.textContent = item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : 'Feature Film';
  }
  heroOverview.textContent = item.overview;
  heroBackdrop.style.backgroundImage = `url("${item.backdrop_path}")`;

  const isSaved = state.watchlist.some(m => m.id === item.id);
  heroWatchlistBtn.textContent = isSaved ? '✓ In Watchlist' : '🔖 Add to Watchlist';
  heroWatchlistBtn.classList.toggle('active', isSaved);

  heroTrailerBtn.onclick = async () => {
    if (!item.trailer_key) {
      const details = await fetchTitleDetails(item.id, item.media_type);
      item.trailer_key = details.trailer_key;
    }
    openTrailer(item.trailer_key, item.title);
  };
  heroDetailsBtn.onclick = () => openMovieModal(item);
  heroWatchlistBtn.onclick = () => toggleWatchlist(item);
}

/**
 * Render Movies / TV Grid
 */
function renderMoviesGrid(itemsToDisplay) {
  moviesGrid.replaceChildren();

  if (loadMoreBtn) {
    const canLoadMore = !state.isShowingWatchlistOnly && state.page < state.totalPages && itemsToDisplay && itemsToDisplay.length > 0;
    loadMoreBtn.classList.toggle('hidden', !canLoadMore);
  }

  if (!itemsToDisplay || itemsToDisplay.length === 0) {
    const emptyMsg = state.isShowingWatchlistOnly
      ? 'Your watchlist is empty. Click the 🔖 icon on any movie or TV series to save it locally in your browser.'
      : 'No matching titles found for this filter combination. Try switching to "All Languages" or another streaming service.';

    moviesGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 14px;">
        <h3 style="font-size: 1.35rem; margin-bottom: 0.5rem;">No Titles Found</h3>
        <p style="color: var(--text-muted); max-width: 500px; margin: 0 auto 1.1rem;">${escapeHtml(emptyMsg)}</p>
        <button type="button" id="resetFiltersBtn" class="btn secondary-btn">Reset Filters</button>
      </div>
    `;
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => brandLogo.click());
    }
    moviesCount.textContent = '0 titles';
    return;
  }

  moviesCount.textContent = `Showing ${itemsToDisplay.length} titles`;

  const isTop10Eligible = !state.searchQuery && !state.isShowingWatchlistOnly && state.activeGenre === 'all' && state.language === 'all';

  itemsToDisplay.forEach((item, index) => {
    const savedEntry = state.watchlist.find(m => m.id === item.id);
    const isSaved = Boolean(savedEntry);
    const isWatched = Boolean(savedEntry && savedEntry.watched);
    const isTop10 = isTop10Eligible && index < 10;
    const rankBadgeHtml = isTop10 ? `<span class="top10-flame-badge">🔥 #${index + 1}</span>` : '';
    const rankNumHtml = isTop10 ? `<div class="top10-rank-num">${index + 1}</div>` : '';

    const card = document.createElement('div');
    card.className = 'movie-card';
    const year = (item.release_date || '2026').substring(0, 4);
    const primaryGenre = (item.genres && item.genres[0]) || (item.media_type === 'tv' ? 'TV Series' : 'Movie');

    card.innerHTML = `
      <div class="card-poster-wrap">
        <img class="card-poster" src="${escapeHtml(item.poster_path)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='${FALLBACK_POSTER}'">
        <span class="card-rating">⭐ ${escapeHtml(item.vote_average)}</span>
        ${rankBadgeHtml}
        ${rankNumHtml}
        <button type="button" class="card-bookmark-btn ${isSaved ? 'active' : ''}" title="${isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}" aria-label="Bookmark ${escapeHtml(item.title)}">
          ${isSaved ? '✓' : '🔖'}
        </button>
        ${isSaved ? `<button type="button" class="card-watched-btn ${isWatched ? 'watched' : ''}" title="Mark as watched">${isWatched ? '✓ Watched' : '○ To Watch'}</button>` : ''}
      </div>
      <div class="card-body">
        <h3 class="card-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h3>
        <div class="card-meta">
          <span>${escapeHtml(year)}</span>
          <span>${escapeHtml(primaryGenre)}</span>
        </div>
      </div>
    `;

    const bookmarkBtn = card.querySelector('.card-bookmark-btn');
    bookmarkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWatchlist(item);
      renderMoviesGrid(state.isShowingWatchlistOnly ? state.watchlist : state.movies);
    });

    const watchedBtn = card.querySelector('.card-watched-btn');
    if (watchedBtn) {
      watchedBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWatchedStatus(item.id);
        renderMoviesGrid(state.isShowingWatchlistOnly ? state.watchlist : state.movies);
      });
    }

    card.addEventListener('click', () => openMovieModal(item));
    moviesGrid.appendChild(card);
  });
}

function showLoadingGrid() {
  if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
  moviesGrid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
      <h3 style="font-size: 1.3rem; margin-bottom: 0.5rem; color: var(--accent-cyan);">⚡ Fetching live from TMDB...</h3>
      <p style="color: var(--text-muted);">Retrieving verified posters, ratings, and regional streaming providers</p>
    </div>
  `;
}

function renderErrorGrid(message, onRetry) {
  if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
  moviesGrid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1rem; background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.3); border-radius: 14px;">
      <h3 style="font-size: 1.3rem; margin-bottom: 0.5rem; color: #fca5a5;">⚠️ Connection Issue</h3>
      <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto 1.1rem;">${escapeHtml(message)}</p>
      <button type="button" id="retryCatalogBtn" class="btn primary-btn">↻ Retry Loading</button>
    </div>
  `;
  const retryBtn = document.getElementById('retryCatalogBtn');
  if (retryBtn && typeof onRetry === 'function') {
    retryBtn.addEventListener('click', onRetry);
  }
}

/**
 * Watchlist & "Watched" Status Management (Local Browser Storage)
 */
function toggleWatchlist(item) {
  const index = state.watchlist.findIndex(m => m.id === item.id);
  if (index >= 0) {
    state.watchlist.splice(index, 1);
  } else {
    state.watchlist.push({ ...item, watched: false });
    trackEvent('watchlist_add', { title: item.title, id: item.id, media_type: item.media_type });
  }

  localStorage.setItem('cinestream_watchlist', JSON.stringify(state.watchlist));
  updateWatchlistBadge();

  if (activeModalMovie && activeModalMovie.id === item.id) {
    const isSaved = state.watchlist.some(m => m.id === item.id);
    modalWatchlistBtn.textContent = isSaved ? '✓ In Watchlist' : '🔖 Bookmark to Watchlist';
  }

  if (state.heroMovie && state.heroMovie.id === item.id) {
    const isSaved = state.watchlist.some(m => m.id === item.id);
    heroWatchlistBtn.textContent = isSaved ? '✓ In Watchlist' : '🔖 Add to Watchlist';
    heroWatchlistBtn.classList.toggle('active', isSaved);
  }
}

function toggleWatchedStatus(id) {
  const entry = state.watchlist.find(m => m.id === id);
  if (!entry) return;
  entry.watched = !entry.watched;
  localStorage.setItem('cinestream_watchlist', JSON.stringify(state.watchlist));
}

function updateWatchlistBadge() {
  if (watchlistCount) watchlistCount.textContent = state.watchlist.length;
  if (mobileWatchlistBadge) {
    mobileWatchlistBadge.textContent = state.watchlist.length;
    mobileWatchlistBadge.classList.toggle('hidden', state.watchlist.length === 0);
  }
}

/**
 * Render Tiered Providers inside Title Modal
 */
function renderProviderTiers(providerTiers, item) {
  watchProvidersList.replaceChildren();
  const regionName = REGION_NAMES[state.region] || state.region;

  if (modalRegionNote) {
    modalRegionNote.textContent = `Region: ${regionName} (${state.region}) • Catalogs vary by country`;
  }
  if (modalFreshnessNote) {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    modalFreshnessNote.textContent = `Checked live (${today}) via TMDB / JustWatch`;
  }
  if (officialWatchLink && providerTiers.link) {
    officialWatchLink.href = providerTiers.link;
  }
  if (reportDataIssueLink) {
    reportDataIssueLink.href = `/contact.html?subject=bug&title=${encodeURIComponent(item.title)}&region=${encodeURIComponent(state.region)}`;
    reportDataIssueLink.onclick = () => {
      trackEvent('report_data_issue', { title: item.title, region: state.region });
    };
  }

  const tierDefinitions = [
    { key: 'subscription', label: 'Included with Subscription' },
    { key: 'free', label: 'Free / Free with Ads' },
    { key: 'rent', label: 'Available to Rent' },
    { key: 'buy', label: 'Available to Buy' }
  ];

  let totalProvidersRendered = 0;

  tierDefinitions.forEach(tier => {
    const list = providerTiers[tier.key] || [];
    if (list.length === 0) return;

    const group = document.createElement('div');
    group.className = 'provider-tier-group';

    const label = document.createElement('span');
    label.className = 'provider-tier-label';
    label.textContent = tier.label;
    group.appendChild(label);

    const row = document.createElement('div');
    row.className = 'providers-list';

    list.forEach(p => {
      totalProvidersRendered++;
      const pill = document.createElement('span');
      pill.className = `provider-pill ${p.class}`;
      pill.textContent = p.name;
      row.appendChild(pill);
    });

    group.appendChild(row);
    watchProvidersList.appendChild(group);
  });

  if (totalProvidersRendered === 0) {
    const emptyNote = document.createElement('p');
    emptyNote.style.cssText = 'color: var(--text-muted); font-size: 0.85rem; margin: 0.25rem 0;';
    emptyNote.textContent = `No verified streaming, free, or rental providers are currently reported for ${regionName} (${state.region}). This title may be in theatrical release or available in another country.`;
    watchProvidersList.appendChild(emptyNote);
  }
}

/**
 * Open Movie / TV Series Details Modal
 */
async function openMovieModal(item) {
  activeModalMovie = item;
  const mediaType = item.media_type === 'tv' ? 'tv' : 'movie';
  const itemSlug = makeTitleSlug(item);
  const cleanPath = `/${mediaType}/${itemSlug}`;
  const fullUrl = `https://watchpulse.online${cleanPath}`;

  window.history.pushState({ path: cleanPath, id: item.id, mediaType }, '', cleanPath);

  const year = (item.release_date || '2026').substring(0, 4);
  document.title = `Where to Watch ${item.title} (${year}) — WatchPulse`;
  updateDynamicMovieMeta(item, fullUrl);
  updateMovieSchema(item, fullUrl);
  trackEvent('movie_open', { title: item.title, id: item.id, media_type: mediaType, region: state.region });

  modalTitle.textContent = item.title;
  modalRating.textContent = `⭐ ${item.vote_average}`;
  modalYear.textContent = year;
  modalRuntime.textContent = 'Checking...';
  modalGenres.textContent = (item.genres || []).join(', ') || (mediaType === 'tv' ? 'TV Series' : 'Feature');
  modalOverview.textContent = item.overview;
  modalPoster.src = item.poster_path;
  modalPoster.onerror = () => { modalPoster.src = FALLBACK_POSTER; };
  modalBackdrop.style.backgroundImage = `url("${item.backdrop_path}")`;

  const isSaved = state.watchlist.some(m => m.id === item.id);
  modalWatchlistBtn.textContent = isSaved ? '✓ In Watchlist' : '🔖 Bookmark to Watchlist';
  modalWatchlistBtn.onclick = () => toggleWatchlist(item);

  if (modalShareBtn) {
    modalShareBtn.onclick = () => {
      const shareUrl = window.location.href;
      trackEvent('share_click', { title: item.title, url: shareUrl });
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          modalShareBtn.textContent = '✓ Link Copied!';
          setTimeout(() => { modalShareBtn.textContent = '🔗 Share Link'; }, 2000);
        });
      } else {
        prompt('Copy this direct link to share:', shareUrl);
      }
    };
  }

  watchProvidersList.innerHTML = '<span class="provider-pill prime">Checking regional availability...</span>';
  modalCastList.innerHTML = '<span style="color: var(--text-muted); font-size: 0.8rem;">Loading cast...</span>';
  if (modalSimilarSection) modalSimilarSection.classList.add('hidden');

  movieModal.classList.remove('hidden');

  const details = await fetchTitleDetails(item.id, mediaType);
  if (!activeModalMovie || activeModalMovie.id !== item.id) return;

  item.trailer_key = details.trailer_key;
  item.runtime = details.runtime;
  modalRuntime.textContent = details.runtimeLabel;
  if (details.genres.length > 0) {
    modalGenres.textContent = details.genres.join(', ');
  }

  renderProviderTiers(details.providerTiers, item);

  // Render Cast
  modalCastList.replaceChildren();
  if (details.cast && details.cast.length > 0) {
    details.cast.forEach(actor => {
      const chip = document.createElement('div');
      chip.className = 'cast-chip';
      chip.innerHTML = `
        ${actor.profile ? `<img src="${escapeHtml(actor.profile)}" alt="${escapeHtml(actor.name)}" class="cast-avatar">` : ''}
        <span><strong>${escapeHtml(actor.name)}</strong> <span class="cast-char">as ${escapeHtml(actor.character || 'Cast')}</span></span>
      `;
      modalCastList.appendChild(chip);
    });
  } else {
    modalCastList.innerHTML = '<span style="color: var(--text-muted); font-size: 0.8rem;">Cast details not listed for this title.</span>';
  }

  // Render Similar / Recommended Titles
  if (modalSimilarSection && modalSimilarList) {
    modalSimilarList.replaceChildren();
    if (details.similar && details.similar.length > 0) {
      details.similar.forEach(sim => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'similar-item-btn';
        const simYear = (sim.release_date || '2026').substring(0, 4);
        btn.innerHTML = `
          <img src="${escapeHtml(sim.poster_path)}" alt="${escapeHtml(sim.title)}" loading="lazy" onerror="this.src='${FALLBACK_POSTER}'">
          <div class="similar-item-title">${escapeHtml(sim.title)}</div>
          <div class="similar-item-meta">⭐ ${escapeHtml(sim.vote_average)} • ${escapeHtml(simYear)}</div>
        `;
        btn.addEventListener('click', () => openMovieModal(sim));
        modalSimilarList.appendChild(btn);
      });
      modalSimilarSection.classList.remove('hidden');
    }
  }

  modalTrailerBtn.onclick = () => openTrailer(details.trailer_key, item.title);
}

/**
 * Trailer Modal
 */
function openTrailer(trailerKey, titleName = '') {
  if (!trailerKey) {
    const query = encodeURIComponent(`${titleName || 'movie'} official trailer`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank', 'noopener,noreferrer');
    return;
  }
  trackEvent('trailer_play', { title: titleName, video_key: trailerKey });
  trailerIframe.src = `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&enablejsapi=1`;
  if (externalTrailerLink) {
    externalTrailerLink.href = `https://www.youtube.com/watch?v=${trailerKey}`;
  }
  trailerModal.classList.remove('hidden');
}

function closeTrailer() {
  trailerIframe.src = '';
  trailerModal.classList.add('hidden');
}

function pickSurpriseMovie() {
  if (state.movies.length === 0) return;
  const randomIndex = Math.floor(Math.random() * state.movies.length);
  openMovieModal(state.movies[randomIndex]);
}

/**
 * Tonight's Pick Movie & Show Finder Quiz
 */
function setupQuizOptionGroup(container) {
  if (!container) return;
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.quiz-opt-btn');
    if (!btn) return;
    container.querySelectorAll('.quiz-opt-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
}

async function runFinderQuiz() {
  if (!quizResultsContainer) return;
  const moodBtn = quizMoodOptions ? quizMoodOptions.querySelector('.quiz-opt-btn.selected') : null;
  const runtimeBtn = quizRuntimeOptions ? quizRuntimeOptions.querySelector('.quiz-opt-btn.selected') : null;
  const formatBtn = quizFormatOptions ? quizFormatOptions.querySelector('.quiz-opt-btn.selected') : null;

  const rawGenre = moodBtn ? moodBtn.dataset.genre : '53';
  const moodLabel = moodBtn ? moodBtn.dataset.label : 'High-Tension';
  const runtimePref = runtimeBtn ? runtimeBtn.dataset.runtime : 'short';
  const runtimeLabel = runtimeBtn ? runtimeBtn.dataset.label : 'Under 100 min';
  const format = formatBtn ? formatBtn.dataset.format : 'movie';
  const effectiveGenre = format === 'tv' ? (MOVIE_TO_TV_GENRE[rawGenre] || rawGenre) : rawGenre;

  quizResultsContainer.innerHTML = `<p style="color: var(--accent-cyan); font-size: 0.9rem; text-align: center; padding: 1rem;">⚡ Finding top-rated matches for ${escapeHtml(moodLabel)} (${escapeHtml(runtimeLabel)})...</p>`;

  try {
    const quizParams = {
      watch_region: state.region,
      with_genres: effectiveGenre,
      sort_by: 'vote_average.desc',
      'vote_count.gte': 250
    };
    if (format === 'movie') {
      if (runtimePref === 'short') quizParams['with_runtime.lte'] = 100;
      else if (runtimePref === 'standard') {
        quizParams['with_runtime.gte'] = 98;
        quizParams['with_runtime.lte'] = 132;
      } else if (runtimePref === 'epic') {
        quizParams['with_runtime.gte'] = 130;
      }
    }

    const res = await fetch(buildTmdbProxyUrl(`/discover/${format}`, quizParams));
    if (!res.ok) throw new Error('Quiz fetch failed');
    const data = await res.json();
    const picks = (data.results || []).slice(0, 3).map(m => normalizeItem(m, format));

    if (picks.length === 0) {
      quizResultsContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.86rem;">No exact matches found for that combination. Try another runtime option above.</p>`;
      return;
    }

    quizResultsContainer.replaceChildren();
    const heading = document.createElement('h3');
    heading.style.cssText = 'font-size: 1rem; margin-bottom: 0.35rem;';
    heading.textContent = `Top 3 Explained Matches (${REGION_NAMES[state.region] || state.region}):`;
    quizResultsContainer.appendChild(heading);

    picks.forEach((pick, idx) => {
      const year = (pick.release_date || '2026').substring(0, 4);
      const row = document.createElement('div');
      row.className = 'quiz-result-item';
      row.innerHTML = `
        <img src="${escapeHtml(pick.poster_path)}" alt="${escapeHtml(pick.title)}" onerror="this.src='${FALLBACK_POSTER}'">
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem;">
            <strong style="font-size: 0.98rem;">#${idx + 1} ${escapeHtml(pick.title)} (${escapeHtml(year)})</strong>
            <span style="color: #fbbf24; font-size: 0.82rem; font-weight: 700;">⭐ ${escapeHtml(pick.vote_average)}</span>
          </div>
          <span class="quiz-why-badge">Why it fits: ${escapeHtml(moodLabel)} • ${escapeHtml(runtimeLabel)} • Community rating ${escapeHtml(pick.vote_average)}/10</span>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.25rem 0 0.55rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(pick.overview)}</p>
          <button type="button" class="btn secondary-btn quiz-open-btn" style="padding: 0.35rem 0.75rem; font-size: 0.78rem;">📡 Check Where to Watch &amp; Trailer</button>
        </div>
      `;
      row.querySelector('.quiz-open-btn').addEventListener('click', () => {
        quizModal.classList.add('hidden');
        openMovieModal(pick);
      });
      quizResultsContainer.appendChild(row);
    });
  } catch (err) {
    quizResultsContainer.innerHTML = `<p style="color: #fca5a5; font-size: 0.85rem;">Could not load recommendations right now. Please try again.</p>`;
  }
}

/**
 * Event Listeners Setup
 */
function setupEventListeners() {
  brandLogo.addEventListener('click', () => {
    state.isShowingWatchlistOnly = false;
    state.activeGenre = 'all';
    state.activeProvider = 'all';
    state.language = 'all';
    state.searchQuery = '';
    searchInput.value = '';
    if (languageSelect) languageSelect.value = 'all';
    clearSearchBtn.classList.add('hidden');
    watchlistNavBtn.classList.remove('active');
    document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.genre === 'all'));
    document.querySelectorAll('.provider-chip').forEach(c => c.classList.toggle('active', c.dataset.provider === 'all'));
    window.history.pushState({}, '', '/');
    loadTrendingCatalog();
  });

  setupVoiceSearch();

  // Media Type Toggle (Movies vs TV Series)
  if (mediaTypeToggle) {
    mediaTypeToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('.media-type-btn');
      if (!btn || btn.dataset.type === state.mediaType) return;
      setMediaTypeUI(btn.dataset.type);
      state.isShowingWatchlistOnly = false;
      watchlistNavBtn.classList.remove('active');
      if (state.searchQuery.trim() !== '') {
        searchTitlesLive(state.searchQuery, false);
      } else if (state.activeProvider === 'all' && state.activeGenre === 'all' && state.language === 'all') {
        loadTrendingCatalog();
      } else {
        loadCombinedCatalog(false);
      }
    });
  }

  // Country / Region Selector
  if (regionSelect) {
    regionSelect.addEventListener('change', (e) => {
      state.region = e.target.value;
      localStorage.setItem('watchpulse_region', state.region);
      trackEvent('region_change', { region: state.region });
      if (!state.isShowingWatchlistOnly) {
        loadCombinedCatalog(false);
      }
      if (activeModalMovie && !movieModal.classList.contains('hidden')) {
        openMovieModal(activeModalMovie);
      }
    });
  }

  // Original Language Selector
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      state.language = e.target.value;
      state.isShowingWatchlistOnly = false;
      watchlistNavBtn.classList.remove('active');
      trackEvent('language_change', { language: state.language });
      loadCombinedCatalog(false);
    });
  }

  // Load More Pagination Button
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      if (state.page >= state.totalPages) return;
      state.page += 1;
      if (state.searchQuery.trim() !== '') {
        searchTitlesLive(state.searchQuery, true);
      } else {
        loadCombinedCatalog(true);
      }
    });
  }

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim() === '') {
      renderTrendingDropdown();
    } else if (state.movies.length > 0) {
      renderAutocompleteDropdown(state.movies.slice(0, 5));
    }
  });

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    state.searchQuery = val;
    clearSearchBtn.classList.toggle('hidden', val === '');

    if (val.trim() === '') {
      renderTrendingDropdown();
      searchTitlesLive('');
      return;
    }

    clearTimeout(state.searchDebounceTimer);
    state.searchDebounceTimer = setTimeout(() => {
      searchTitlesLive(val);
    }, 320);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    searchTitlesLive('');
    if (searchDropdown) searchDropdown.classList.add('hidden');
  });

  document.addEventListener('click', (e) => {
    if (searchDropdown && !e.target.closest('.search-bar-wrap')) {
      searchDropdown.classList.add('hidden');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key === 'Escape') {
      if (searchDropdown) searchDropdown.classList.add('hidden');
      if (quizModal) quizModal.classList.add('hidden');
    }
  });

  if (providerChips) {
    providerChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.provider-chip');
      if (chip) {
        document.querySelectorAll('.provider-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.activeProvider = chip.dataset.provider;
        state.isShowingWatchlistOnly = false;
        watchlistNavBtn.classList.remove('active');
        trackEvent('provider_filter', { provider: state.activeProvider, region: state.region });
        loadCombinedCatalog(false);
      }
    });
  }

  genreChips.addEventListener('click', (e) => {
    if (e.target.classList.contains('chip')) {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      state.activeGenre = e.target.dataset.genre;
      state.isShowingWatchlistOnly = false;
      watchlistNavBtn.classList.remove('active');
      loadCombinedCatalog(false);
    }
  });

  watchlistNavBtn.addEventListener('click', () => {
    state.isShowingWatchlistOnly = !state.isShowingWatchlistOnly;
    if (state.isShowingWatchlistOnly) {
      gridTitle.textContent = 'My Saved Watchlist';
      watchlistNavBtn.classList.add('active');
      if (watchlistNoticeBanner) watchlistNoticeBanner.classList.remove('hidden');
      renderMoviesGrid(state.watchlist);
    } else {
      watchlistNavBtn.classList.remove('active');
      if (watchlistNoticeBanner) watchlistNoticeBanner.classList.add('hidden');
      loadCombinedCatalog(false);
    }
  });

  surpriseNavBtn.addEventListener('click', pickSurpriseMovie);

  // Quiz Modal Handlers
  setupQuizOptionGroup(quizMoodOptions);
  setupQuizOptionGroup(quizRuntimeOptions);
  setupQuizOptionGroup(quizFormatOptions);

  if (quizNavBtn && quizModal) {
    quizNavBtn.addEventListener('click', () => {
      quizModal.classList.remove('hidden');
    });
  }
  if (quizCloseBtn && quizModal) {
    quizCloseBtn.addEventListener('click', () => quizModal.classList.add('hidden'));
    quizModal.addEventListener('click', (e) => {
      if (e.target === quizModal) quizModal.classList.add('hidden');
    });
  }
  if (runQuizBtn) {
    runQuizBtn.addEventListener('click', runFinderQuiz);
  }

  // Mobile Bottom Navigation Dock
  if (mobileNavHome) {
    mobileNavHome.addEventListener('click', () => {
      mobileNavWatchlist.classList.remove('active');
      mobileNavHome.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      brandLogo.click();
    });
  }

  if (mobileNavSurprise) {
    mobileNavSurprise.addEventListener('click', () => {
      if (quizModal) quizModal.classList.remove('hidden');
      else pickSurpriseMovie();
    });
  }

  if (mobileNavWatchlist) {
    mobileNavWatchlist.addEventListener('click', () => {
      watchlistNavBtn.click();
      mobileNavWatchlist.classList.toggle('active', state.isShowingWatchlistOnly);
      mobileNavHome.classList.toggle('active', !state.isShowingWatchlistOnly);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (mobileNavTop) {
    mobileNavTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const closeModal = () => {
    movieModal.classList.add('hidden');
    activeModalMovie = null;
    document.title = 'WatchPulse — Where to Stream Any Movie & TV Series Legally';
    resetHomeMeta();
    window.history.pushState({ path: '/' }, '', '/');
  };

  modalCloseBtn.addEventListener('click', closeModal);
  movieModal.addEventListener('click', (e) => {
    if (e.target === movieModal) closeModal();
  });

  trailerCloseBtn.addEventListener('click', closeTrailer);
  trailerModal.addEventListener('click', (e) => {
    if (e.target === trailerModal) closeTrailer();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!trailerModal.classList.contains('hidden')) closeTrailer();
      else if (!movieModal.classList.contains('hidden')) closeModal();
    }
  });

  window.addEventListener('popstate', () => {
    const deep = parseDeepTitleFromLocation();
    if (deep && deep.id) {
      openTitleById(deep.id, deep.mediaType);
    } else if (!movieModal.classList.contains('hidden')) {
      movieModal.classList.add('hidden');
      activeModalMovie = null;
      resetHomeMeta();
    }
  });
}

/**
 * Update Dynamic Title Meta, Canonical & Social Preview Tags
 */
function updateDynamicMovieMeta(item, canonicalUrl) {
  const regionName = REGION_NAMES[state.region] || state.region;
  const descText = `Find where to stream ${item.title} legally in ${regionName} (${state.region}). Compare subscription, free, rent, and buy availability, watch the official trailer, and view cast details on WatchPulse.`;

  const canonicalEl = document.querySelector('link[rel="canonical"]');
  if (canonicalEl && canonicalUrl) canonicalEl.setAttribute('href', canonicalUrl);

  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.setAttribute('content', descText);

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl && canonicalUrl) ogUrl.setAttribute('content', canonicalUrl);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', `Where to Watch ${item.title} — WatchPulse`);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', descText);

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) ogImage.setAttribute('content', item.backdrop_path || item.poster_path);

  const twitterTitle = document.querySelector('meta[property="twitter:title"]');
  if (twitterTitle) twitterTitle.setAttribute('content', `Where to Watch ${item.title} — WatchPulse`);

  const twitterDesc = document.querySelector('meta[property="twitter:description"]');
  if (twitterDesc) twitterDesc.setAttribute('content', descText);

  const twitterImage = document.querySelector('meta[property="twitter:image"]');
  if (twitterImage) twitterImage.setAttribute('content', item.backdrop_path || item.poster_path);
}

function resetHomeMeta() {
  const homeDesc = 'Discover where to stream movies and TV series legally across Netflix, Prime Video, Disney+, Apple TV+, Max, and free services by country. Read original editorial guides and watch official trailers on WatchPulse.online.';

  const canonicalEl = document.querySelector('link[rel="canonical"]');
  if (canonicalEl) canonicalEl.setAttribute('href', 'https://watchpulse.online/');

  const robotsMeta = document.getElementById('dynamicRobotsMeta');
  if (robotsMeta) robotsMeta.remove();

  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.setAttribute('content', homeDesc);

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', 'https://watchpulse.online/');

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', 'WatchPulse — Discover Where to Stream Any Movie & Show');

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', homeDesc);

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) ogImage.setAttribute('content', 'https://watchpulse.online/preview.jpg');

  const schemaTag = document.getElementById('dynamic-movie-schema');
  if (schemaTag) schemaTag.remove();
}

/**
 * Policy-Compliant Movie / TVSeries Schema (Matches Visible Content Only — No Fabricated Rating Counts)
 */
function updateMovieSchema(item, canonicalUrl) {
  let schemaTag = document.getElementById('dynamic-movie-schema');
  if (!schemaTag) {
    schemaTag = document.createElement('script');
    schemaTag.id = 'dynamic-movie-schema';
    schemaTag.type = 'application/ld+json';
    document.head.appendChild(schemaTag);
  }

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': item.media_type === 'tv' ? 'TVSeries' : 'Movie',
    name: item.title,
    url: canonicalUrl || window.location.href,
    image: item.poster_path,
    datePublished: item.release_date || '2026',
    description: item.overview,
    genre: item.genres || []
  };

  schemaTag.textContent = JSON.stringify(schemaData);
}

function applyConsentModeUpdate(isAccepted) {
  const mode = isAccepted ? 'granted' : 'denied';
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      ad_storage: mode,
      ad_user_data: mode,
      ad_personalization: mode,
      analytics_storage: mode
    });
  }
}

function initCookieConsent() {
  const cookieBanner = document.getElementById('cookieBanner');
  const cookieAcceptBtn = document.getElementById('cookieAcceptBtn');
  const cookieDeclineBtn = document.getElementById('cookieDeclineBtn');

  if (!cookieBanner) return;

  const savedConsent = localStorage.getItem('wp_cookie_consent');
  if (savedConsent === 'accepted') {
    applyConsentModeUpdate(true);
  } else if (savedConsent === 'declined') {
    applyConsentModeUpdate(false);
  } else {
    setTimeout(() => {
      cookieBanner.classList.remove('hidden');
    }, 1200);
  }

  if (cookieAcceptBtn) {
    cookieAcceptBtn.addEventListener('click', () => {
      localStorage.setItem('wp_cookie_consent', 'accepted');
      applyConsentModeUpdate(true);
      cookieBanner.classList.add('hidden');
    });
  }

  if (cookieDeclineBtn) {
    cookieDeclineBtn.addEventListener('click', () => {
      localStorage.setItem('wp_cookie_consent', 'declined');
      applyConsentModeUpdate(false);
      cookieBanner.classList.add('hidden');
    });
  }
}

document.addEventListener('DOMContentLoaded', initApp);
