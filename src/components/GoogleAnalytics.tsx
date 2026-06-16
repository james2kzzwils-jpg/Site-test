import Script from "next/script";

const GA_ID = "G-K20V70P4GC";

/**
 * Google Analytics 4 (gtag.js), loaded on every page via the root layout.
 * Uses next/script with `afterInteractive` so it loads early without
 * blocking render or breaking hydration.
 */
export default function GoogleAnalytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
