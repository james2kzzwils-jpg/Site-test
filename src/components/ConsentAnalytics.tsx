'use client';

import { useEffect, useState, useCallback } from 'react';
import { getStoredConsent, type ConsentValue } from './CookieConsent';

const GA_ID = 'G-K20V70P4GC';
const YM_ID = 109902116;

/**
 * Consent-aware analytics loader.
 *
 * - Does NOT render any `<script>` tags in the initial HTML.
 * - Dynamically injects Google Analytics and Yandex Metrika scripts
 *   *only* when consent is 'accepted'.
 * - Listens for the `consent-changed` custom event fired by <CookieConsent>.
 * - On page load, checks localStorage for a previously-stored consent.
 * - Yandex Metrika webvisor is disabled; it is enabled only on full consent.
 */
export default function ConsentAnalytics() {
  const [loaded, setLoaded] = useState(false);

  const loadAnalytics = useCallback(() => {
    if (loaded) return;
    setLoaded(true);

    // ── Google Analytics 4 ────────────────────────────────────────
    const gaScript = document.createElement('script');
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    gaScript.async = true;
    document.head.appendChild(gaScript);

    const gaInline = document.createElement('script');
    gaInline.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}');
    `;
    document.head.appendChild(gaInline);

    // ── Yandex Metrika ────────────────────────────────────────────
    const ymInline = document.createElement('script');
    ymInline.textContent = `
      (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
      })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}', 'ym');

      ym(${YM_ID}, 'init', {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true,
        webvisor:true,
        ecommerce:"dataLayer"
      });
    `;
    document.head.appendChild(ymInline);
  }, [loaded]);

  useEffect(() => {
    // Check on mount: if consent was already given, load immediately.
    if (getStoredConsent() === 'accepted') {
      loadAnalytics();
    }

    // Listen for consent changes from the banner.
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ConsentValue>).detail;
      if (detail === 'accepted') {
        loadAnalytics();
      }
    };

    window.addEventListener('consent-changed', handler);
    return () => window.removeEventListener('consent-changed', handler);
  }, [loadAnalytics]);

  // No noscript pixel either — only loads on explicit consent.
  return null;
}
