import Script from "next/script";

const GA_ID = "G-K20V70P4GC";

/**
 * Google Analytics 4 (gtag.js), loaded on every page via the root layout.
 * Uses next/script with `lazyOnload` so analytics is fetched during browser
 * idle time, after the page is interactive — it no longer competes with
 * hydration and so does not inflate Time To Interactive. Pageviews are still
 * captured reliably; they just register a moment later.
 */
export default function GoogleAnalytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
