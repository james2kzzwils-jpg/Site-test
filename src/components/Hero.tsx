'use client';

import { useEffect, useRef } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Hero() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const children = el.querySelectorAll('[data-reveal]');
    children.forEach((child, i) => {
      const htmlEl = child as HTMLElement;
      htmlEl.style.opacity = '0';
      htmlEl.style.transform = 'translateY(40px)';
      setTimeout(() => {
        htmlEl.style.transition = 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
        htmlEl.style.opacity = '1';
        htmlEl.style.transform = 'translateY(0)';
      }, 300 + i * 150);
    });
  }, []);

  return (
    <section className="relative flex min-h-screen items-end overflow-hidden pb-[12vh]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/[0.03] via-transparent to-violet-500/[0.03]" />
        <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </div>

      <div ref={containerRef} className="relative z-10 mx-auto w-full max-w-[1400px] px-8 lg:px-16">
        <p data-reveal className="mb-8 font-mono text-[11px] tracking-[0.4em] text-white/25 uppercase">
          James Creative Labs
        </p>

        <h1 data-reveal className="mb-12 max-w-[900px]">
          <span className="block text-[clamp(3rem,8vw,7.5rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-white">
            {t.hero.title_line1}
          </span>
          <span className="block text-[clamp(3rem,8vw,7.5rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-white/20">
            {t.hero.title_line2}
          </span>
        </h1>

        <p data-reveal className="mb-16 max-w-md text-[16px] leading-[1.7] text-white/30">
          {t.hero.subtitle}
        </p>

        <div data-reveal className="flex items-center gap-8">
          <button
            onClick={() => document.querySelector('#works')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded-full bg-white px-10 py-4 text-[13px] font-medium tracking-[-0.01em] text-[#0a0a0a] transition-all duration-500 hover:bg-cyan-400"
          >
            {t.hero.cta_works}
          </button>
          <button
            onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-[13px] font-medium tracking-[-0.01em] text-white/40 transition-colors duration-500 hover:text-white"
          >
            {t.hero.cta_contact} →
          </button>
        </div>
      </div>
    </section>
  );
}
