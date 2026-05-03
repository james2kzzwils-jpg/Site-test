'use client';

import { useEffect, useRef } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import Scene3D from './Scene3D';

export default function Hero() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

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
      {/* Subtle 3D scene behind */}
      <Scene3D />

      {/* Top gradient that fades the 3D toward the type */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/30 to-[#050505]" />

      {/* Side meta — left vertical "Click & Hold" / right vertical "scroll" */}
      <div className="pointer-events-none absolute inset-y-0 left-4 hidden items-center sm:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--foreground)]/35 [writing-mode:vertical-rl]">
          {t.hero.click_hold}
        </span>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-4 hidden items-center sm:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--foreground)]/35 [writing-mode:vertical-rl]">
          {t.hero.discover}
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-between px-6 pb-14 pt-36 sm:px-10 lg:px-14 lg:pb-20 lg:pt-40"
      >
        {/* Top row — kicker + role chips */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p
            data-reveal
            className="reveal font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45"
          >
            {t.hero.kicker}
          </p>
          <div data-reveal className="reveal flex flex-wrap items-center gap-2">
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
              {t.hero.title_line1}
            </span>
            <span className="block text-[clamp(3rem,11vw,11rem)] font-medium tracking-[-0.045em] text-[var(--foreground)]/30">
              {t.hero.title_line2}
            </span>
          </h1>

          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <p
              data-reveal
              className="reveal max-w-xl text-[16px] leading-[1.65] text-[var(--foreground)]/55"
            >
              {t.hero.subtitle}
            </p>

            <div data-reveal className="reveal flex items-end justify-end gap-10">
              <a
                href="#works"
                className="hover-line group inline-flex items-center gap-3 pb-2 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--foreground)]/80 transition-colors duration-300 hover:text-[var(--foreground)]"
                data-cursor="hover"
              >
                <span aria-hidden="true">→</span>
                {t.hero.cta_works}
              </a>
              <a
                href="#contact"
                className="hover-line group inline-flex items-center gap-3 pb-2 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--foreground)]/55 transition-colors duration-300 hover:text-[var(--foreground)]"
                data-cursor="hover"
              >
                {t.hero.cta_contact}
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom row — scroll cue */}
        <div className="mt-16 flex items-center justify-between border-t border-[var(--hairline)] pt-6 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--foreground)]/40">
          <span>{t.hero.scroll}</span>
          <span className="hidden sm:inline">{`(06)`} ◆ Index</span>
          <span>2025</span>
        </div>
      </div>
    </section>
  );
}
