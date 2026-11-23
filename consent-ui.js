/**
 * WatchPulse Shared Consent UI, Privacy Settings & Dark/Light Theme Controller
 * - Initializes saved Dark/Light theme (defaults to Signature Royal Violet Dark Mode)
 *   and injects/binds the theme switcher button in the navbar across all 28 pages.
 * - Ensures ONLY ONE consent banner appears: if Google's certified AdSense CMP
 *   (__tcfapi / googlefc) is active (EEA/UK/CH), our custom banner stays hidden.
 * - Powers the "Privacy Settings" link in the footer on EVERY page.
 */
(function () {
  var THEME_KEY = 'wp_theme_pref';

  function getSavedTheme() {
    try {
      var t = localStorage.getItem(THEME_KEY);
      if (t === 'light' || t === 'dark') return t;
    } catch (_) {}
    return 'dark';
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
    updateThemeButtons(theme);
  }

  function getThemeButtonSvg(theme) {
    if (theme === 'light') {
      // Moon icon (click to switch to Dark Purple Cinema theme)
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    }
    // Sun icon (click to switch to Light Editorial theme)
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
  }

  function updateThemeButtons(theme) {
    var label = theme === 'light' ? 'Switch to dark purple theme' : 'Switch to light theme';
    document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
      btn.innerHTML = getThemeButtonSvg(theme);
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    });
  }

  function ensureThemeToggleButton() {
    var navActions = document.querySelector('.navbar .nav-actions, .app-header .nav-actions');
    if (navActions && !navActions.querySelector('.theme-toggle-btn')) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-toggle-btn';
      navActions.appendChild(btn);
    }
    document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
      if (btn.dataset.wpThemeBound) return;
      btn.dataset.wpThemeBound = '1';
      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        applyTheme(current === 'light' ? 'dark' : 'light');
      });
    });
    updateThemeButtons(getSavedTheme());
  }

  // Apply saved theme immediately before paint
  applyTheme(getSavedTheme());

  function applyConsentState(accepted) {
    try { localStorage.setItem('wp_cookie_consent', accepted ? 'accepted' : 'denied'); } catch (_) {}
    var val = accepted ? 'granted' : 'denied';
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: val,
        ad_user_data: val,
        ad_personalization: val,
        analytics_storage: val
      });
    }
  }

  function hasGoogleCmp() {
    return typeof window.__tcfapi === 'function' || Boolean(window.googlefc);
  }

  function ensureBannerElement() {
    var existing = document.getElementById('cookieBanner');
    if (existing) return existing;
    var aside = document.createElement('aside');
    aside.id = 'cookieBanner';
    aside.className = 'cookie-banner hidden';
    aside.setAttribute('aria-label', 'Cookie & Privacy Preferences');
    aside.innerHTML =
      '<div class="cookie-banner-content">' +
        '<p>WatchPulse uses local storage, analytics, and Google AdSense cookies to remember your watchlist, measure traffic, and keep our editorial guide free. Read our <a href="/privacy">Privacy Policy</a>.</p>' +
      '</div>' +
      '<div class="cookie-banner-actions">' +
        '<button id="cookieAcceptBtn" type="button" class="btn primary-btn" style="padding: 0.45rem 1.1rem; font-size: 0.85rem;">Accept All</button>' +
        '<button id="cookieDeclineBtn" type="button" class="btn secondary-btn" style="padding: 0.45rem 0.9rem; font-size: 0.85rem;">Necessary Only</button>' +
      '</div>';
    document.body.appendChild(aside);
    return aside;
  }

  function bindBannerButtons(banner) {
    if (!banner || banner.dataset.wpConsentBound) return;
    banner.dataset.wpConsentBound = '1';
    var acc = document.getElementById('cookieAcceptBtn');
    var dec = document.getElementById('cookieDeclineBtn');
    if (acc) acc.addEventListener('click', function () { applyConsentState(true); banner.classList.add('hidden'); });
    if (dec) dec.addEventListener('click', function () { applyConsentState(false); banner.classList.add('hidden'); });
  }

  window.openWatchPulsePrivacySettings = function (e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (window.googlefc && typeof window.googlefc.showRevocationMessage === 'function') {
      try { window.googlefc.showRevocationMessage(); return; } catch (_) {}
    }
    if (window.googlefc && Array.isArray(window.googlefc.callbackQueue)) {
      try {
        window.googlefc.callbackQueue.push(function () {
          if (typeof window.googlefc.showRevocationMessage === 'function') {
            window.googlefc.showRevocationMessage();
          }
        });
        return;
      } catch (_) {}
    }
    var banner = ensureBannerElement();
    bindBannerButtons(banner);
    banner.classList.remove('hidden');
  };

  function initSharedConsent() {
    ensureThemeToggleButton();
    var banner = ensureBannerElement();
    bindBannerButtons(banner);

    var saved = null;
    try { saved = localStorage.getItem('wp_cookie_consent'); } catch (_) {}
    if (!saved) {
      setTimeout(function () {
        if (!hasGoogleCmp()) banner.classList.remove('hidden');
      }, 1400);
    }

    document.querySelectorAll('[data-privacy-settings]').forEach(function (el) {
      el.addEventListener('click', window.openWatchPulsePrivacySettings);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSharedConsent);
  } else {
    initSharedConsent();
  }
})();
