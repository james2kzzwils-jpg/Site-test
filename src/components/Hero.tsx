'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/i18n/LanguageContext';
import ShowreelModal from './ShowreelModal';

// Three.js is heavy. Loading it via next/dynamic with ssr:false splits the
// whole react-three-fiber + three bundle into its own async chunk so it no
// longer sits in the critical path that blocks hydration / Time To
// Interactive. The hero still renders instantly; the particle field fades in
// once its chunk arrives.
const Scene3D = dynamic(() => import('./Scene3D'), {
  ssr: false,
  loading: () => null,
});

export default function Hero() {
  const { locale, t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showReel, setShowReel] = useState(false);

  const kicker =
    locale === 'ru' ? 'Авторская CGI / Motion Lab' : 'Founder-Led Creative Lab';
  const titleLine1 = 'Giving Form';
  const titleLine2 = 'to the Invisible';
  const subtitle =
    locale === 'ru'
      ? 'Epov Creative Labs — founder-led creative lab Андрея Эпова: премиальный CGI, product visuals и procedural motion для брендов, продуктов и пространственных проектов.'
      : 'Epov Creative Labs is a founder-led creative lab by Andrey Epov, creating premium CGI, product visuals, and procedural motion for brands, products, and spatial experiences.';
  const showreelCta =
    locale === 'ru' ? 'Посмотреть Showreel' : 'Watch Showreel';
  const startProjectCta =
    locale === 'ru' ? 'Начать проект' : 'Start a Project';
  const selectedWorkLabel =
    locale === 'ru' ? 'Selected Work' : 'Selected Work';
  const scrollLabel =
    locale === 'ru' ? 'Листай к selected work' : 'Scroll to selected work';

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const reveals = el.querySelectorAll<HTMLElement>('[data-reveal]');
    reveals.forEach((node, i) => {
      node.style.transitionDelay = `${320 + i * 110}ms`;
      window.requestAnimationFrame(() => node.classList.add('is-in'));
    });
  }, []);

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
      {/* Subtle 3D scene behind — reacts to the showreel opening: the
          particle field converges toward the video panel spot. */}
      <Scene3D reelOpen={showReel} />

      {/* Top gradient that fades the 3D toward the type */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/30 to-[#050505]" />

      {/* Side meta — left vertical "Click & Hold" / right vertical scroll cue */}
      <div className="pointer-events-none absolute inset-y-0 left-4 hidden items-center sm:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--foreground)]/35 [writing-mode:vertical-rl]">
          {t.hero.click_hold}
        </span>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-4 hidden items-center sm:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--foreground)]/35 [writing-mode:vertical-rl]">
          {selectedWorkLabel}
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-between px-6 pb-14 pt-44 sm:px-10 lg:px-14 lg:pb-20 lg:pt-48"
      >
        {/* Top row — kicker + role chips. Chips only on xl to avoid nav collision */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p
            data-reveal
            className="reveal flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45"
          >
            <span
              aria-hidden="true"
              className="h-[6px] w-[6px] rounded-full bg-[var(--accent)] shadow-[0_0_24px_var(--accent-glow)]"
            />
            {kicker}
          </p>
          <div
            data-reveal
            className="reveal hidden items-center gap-2 xl:flex"
          >
            {t.brand.roles.map((r) => (
              <span
                key={r}
                className="rounded-full border border-[var(--hairline)] px-3 py-[6px] font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/65"
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Hero type */}
        <div className="mt-auto pt-14">
          <h1
            data-reveal
            className="reveal mb-10 max-w-[1400px] font-display"
            style={{ lineHeight: 0.92 }}
          >
            <span className="block text-[clamp(3rem,11vw,11rem)] font-medium tracking-[-0.045em] text-[var(--foreground)]">
              {titleLine1}
            </span>
            <span className="block text-[clamp(3rem,11vw,11rem)] font-medium tracking-[-0.045em] text-[var(--foreground)]/30">
              {titleLine2}
            </span>
          </h1>

          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <p
              data-reveal
              className="reveal max-w-xl text-[16px] leading-[1.65] text-[var(--foreground)]/55"
            >
              {subtitle}
            </p>

            <div
              data-reveal
              className="reveal flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-end sm:gap-6"
            >
              <button
                type="button"
                onClick={() => setShowReel(true)}
                className="group inline-flex items-center justify-center gap-3 rounded-full border-2 border-[var(--accent)] bg-[var(--accent)]/[0.08] px-8 py-3.5 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--accent)] shadow-[0_0_24px_var(--accent-glow)] transition-all duration-300 hover:bg-[var(--accent)]/[0.18] hover:shadow-[0_0_40px_var(--accent-glow)]"
                data-cursor="hover"
              >
                <span aria-hidden="true" className="text-[14px]">
                  ▶
                </span>
                {showreelCta}
              </button>
              <a
                href="#contact"
                className="group inline-flex items-center justify-center gap-3 rounded-full border-2 border-[var(--foreground)]/30 px-8 py-3.5 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--foreground)]/80 transition-all duration-300 hover:border-[var(--foreground)]/60 hover:text-[var(--foreground)]"
                data-cursor="hover"
              >
                {startProjectCta}
                <span aria-hidden="true" className="text-[var(--accent)]">
                  ↗
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom row — scroll cue */}
        <div className="mt-16 flex items-center justify-between border-t border-[var(--hairline)] pt-6 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--foreground)]/40">
          <span>{scrollLabel}</span>
          <span className="hidden sm:inline">
            <span className="text-[var(--accent)]">◆</span> {selectedWorkLabel}
          </span>
          <span>2026</span>
        </div>
      </div>

      <ShowreelModal open={showReel} onClose={() => setShowReel(false)} />
    </section>
  );
}
