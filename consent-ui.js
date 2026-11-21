/**
 * WatchPulse Shared Consent UI & Privacy Settings Controller
 * - Ensures ONLY ONE consent banner appears: if Google's certified AdSense CMP
 *   (__tcfapi / googlefc) is active (EEA/UK/CH), our custom banner stays hidden.
 * - Powers the "Privacy Settings" link in the footer on EVERY page so visitors
 *   can revisit or change their cookie & analytics consent choice at any time.
 */
(function () {
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
        '<span class="cookie-icon">🍪</span>' +
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
    // 1. Prefer Google's certified AdSense CMP revocation dialog when present (EEA/UK/CH)
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
    // 2. Non-EEA fallback: show WatchPulse's Consent Mode v2 preferences bar
    var banner = ensureBannerElement();
    bindBannerButtons(banner);
    banner.classList.remove('hidden');
  };

  function initSharedConsent() {
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
