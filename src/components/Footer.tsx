'use client';

import { useLanguage } from '@/i18n/LanguageContext';

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
                {(['works', 'services', 'shop', 'about', 'contact'] as const).map((item) => (
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
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/35">
            © {new Date().getFullYear()} {t.footer.brand}. {t.footer.rights}
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

      {/* Planet body. The first gradient is the lit hemisphere
          (cool light coming from the upper-right star), the second is
          the atmospheric rim, and the radial gradient on the body
          itself produces the dark-to-mid transition that gives the
          sphere its volume. Sits half off-canvas so the eye reads it
          as something massive and far away. */}
      <div
        className="absolute bottom-[-160px] right-[-140px] h-[440px] w-[440px] rounded-full opacity-[0.85]"
        style={{
          background: [
            // Atmosphere rim — a thin, very soft accent halo right
            // outside the planet's silhouette.
            'radial-gradient(circle at 50% 50%, transparent 49%, rgba(212,255,0,0.18) 50%, rgba(212,255,0,0.04) 53%, transparent 56%)',
            // Sub-surface light bleed near the lit horizon (upper-right).
            'radial-gradient(circle at 78% 26%, rgba(245,243,238,0.16) 0%, rgba(245,243,238,0.05) 14%, transparent 30%)',
            // Main body — dark sphere with a touch of warmth in the
            // middle, fading to near-black on the unlit side.
            'radial-gradient(circle at 50% 50%, rgba(35,38,30,0.95) 0%, rgba(20,22,18,0.95) 40%, rgba(8,8,8,0.95) 70%, rgba(0,0,0,0.95) 100%)',
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
