'use client';

import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { resetConsent } from '@/components/CookieConsent';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative overflow-hidden border-t border-[var(--hairline)]">
      {/* Distant planet + star — pure CSS, no canvas, no images.
          Sits behind the footer content as a faint mood piece so the
          scroll ends on a destination: "we've arrived somewhere". The
          element is decorative (aria-hidden) and uses
          `pointer-events-none` so it never intercepts clicks. */}
      <PlanetGlow />

      {/* Big monogram + tagline */}
      <div className="relative mx-auto max-w-[1600px] px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr] lg:gap-24">
          <div>
            <p className="font-display text-[clamp(2.4rem,7vw,6rem)] font-medium leading-[0.98] tracking-[-0.04em] text-[var(--foreground)]">
              {t.footer.brand}
            </p>
            <p className="mt-6 max-w-md font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
              {t.footer.tagline}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12">
            <div>
              <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
                <span className="accent-diamond">◆</span> Sitemap
              </p>
              <div className="flex flex-col gap-3">
                {(['works', 'services', 'about', 'faq', 'contact'] as const).map((item) => (
                  <a
                    key={item}
                    href={`#${item}`}
                    className="hover-line inline-block w-fit pb-[3px] font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/55 transition-colors duration-300 hover:text-[var(--foreground)]"
                    data-cursor="hover"
                  >
                    {t.nav[item]}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
                <span className="accent-diamond">◆</span> Social
              </p>
              <div className="flex flex-col gap-3">
                {(
                  [
                    ['Behance', 'https://www.behance.net/2kzz'],
                    ['Vimeo', 'https://vimeo.com/1166636825'],
                    ['LinkedIn', 'https://www.linkedin.com/in/andrey-epov-cg'],
                    ['Telegram', 'https://t.me/aepov_2kzz'],
                    ['Instagram', 'https://www.instagram.com/2kzz___/'],
                  ] as const
                ).map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="hover-line inline-block w-fit pb-[3px] font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/55 transition-colors duration-300 hover:text-[var(--foreground)]"
                    data-cursor="hover"
                  >
                    {label} <span className="text-[var(--accent)]">↗</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-[var(--hairline)]">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-3 px-6 py-6 sm:flex-row sm:items-center sm:px-10 lg:px-14">
          <p className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/35">
            <span>© {new Date().getFullYear()} {t.footer.brand}. {t.footer.rights}</span>
            <Link
              href="/privacy"
              className="transition-colors hover:text-[var(--foreground)]/60"
              data-cursor="hover"
            >
              {t.footer.privacy}
            </Link>
            <button
              type="button"
              onClick={resetConsent}
              className="uppercase transition-colors hover:text-[var(--foreground)]/60"
              data-cursor="hover"
            >
              {t.footer.cookieSettings}
            </button>
          </p>
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/35">
            <span
              aria-hidden="true"
              className="h-[6px] w-[6px] animate-pulse rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent-glow)]"
            />
            {t.footer.available}
          </p>
        </div>
      </div>
    </footer>
  );
}

// Distant planet with atmosphere + a faint star, rendered entirely
// in CSS radial-gradients. Costs ~0 bytes on the wire and almost
// nothing at paint time (no canvas, no WebGL, no DOM animation in the
// hot path). The composition reads like an establishing shot at the
// end of the scroll: a small star sits high-right, a half-lit planet
// floats low-right with a soft accent atmosphere bleeding past its
// horizon.
function PlanetGlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 select-none"
    >
      {/* Ambient atmosphere wash — extends well past the planet
          silhouette so the surrounding darkness picks up a hint of
          accent without revealing a hard edge anywhere. */}
      <div
        className="absolute bottom-[-260px] right-[-220px] h-[820px] w-[820px] opacity-[0.55]"
        style={{
          background:
            'radial-gradient(circle at 38% 42%, var(--accent-glow) 0%, rgba(212,255,0,0.04) 28%, transparent 60%)',
        }}
      />

      {/* Soft atmospheric halo — a wide, low-opacity accent/cool bloom
          spread over a broad band (no crisp ring) so the planet's edge
          dissolves into the dark with a subtle iridescent shimmer
          instead of a hard outline. */}
      <div
        className="absolute bottom-[-220px] right-[-200px] h-[560px] w-[560px] rounded-full opacity-[0.9]"
        style={{
          background: [
            // Cool side of the shimmer (upper-right, toward the star).
            'radial-gradient(circle at 62% 30%, rgba(150,196,255,0.07) 0%, rgba(150,196,255,0.02) 30%, transparent 55%)',
            // Warm accent bloom, broad and feathered — peaks gently and
            // fades long so there is never a visible boundary.
            'radial-gradient(circle at 50% 52%, transparent 38%, rgba(212,255,0,0.10) 56%, rgba(212,255,0,0.035) 70%, transparent 86%)',
          ].join(', '),
        }}
      />

      {/* Planet body. Lit sub-surface bleed on the upper-right horizon,
          then a volumetric radial that fades its own alpha to fully
          transparent before the geometric edge — so the eye reads a
          massive far-away sphere with no hard silhouette anywhere. */}
      <div
        className="absolute bottom-[-160px] right-[-140px] h-[440px] w-[440px] rounded-full opacity-[0.9]"
        style={{
          background: [
            // Sub-surface light bleed near the lit horizon (upper-right),
            // with a faint accent tint for the iridescent feel.
            'radial-gradient(circle at 76% 26%, rgba(245,243,238,0.14) 0%, rgba(212,255,0,0.05) 16%, transparent 34%)',
            // Main body — warm-dark sphere whose opacity feathers out to
            // zero by ~90% so it melts into the footer with no edge.
            'radial-gradient(circle at 50% 50%, rgba(38,42,32,0.92) 0%, rgba(22,25,20,0.9) 34%, rgba(12,14,11,0.76) 56%, rgba(6,7,6,0.4) 74%, rgba(0,0,0,0) 90%)',
          ].join(', '),
        }}
      />

      {/* Star — small, bright, sits high in the right half of the
          footer so it's "the light source" for the planet below it.
          Glow done with a multi-stop box-shadow; no animation so
          there's nothing to repaint. */}
      <div
        className="absolute right-[16%] top-[18%] h-[5px] w-[5px] rounded-full bg-[var(--accent)] opacity-80"
        style={{
          boxShadow:
            '0 0 8px var(--accent), 0 0 22px var(--accent-glow), 0 0 64px rgba(212,255,0,0.18)',
        }}
      />
    </div>
  );
}
