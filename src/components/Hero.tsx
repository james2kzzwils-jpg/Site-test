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
    <section className="relative flex min-h-screen items-end overflow-hidden pb-[14vh]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/[0.03] via-transparent to-violet-500/[0.03]" />
        <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </div>

      <div ref={containerRef} className="relative z-10 mx-auto w-full max-w-[1400px] px-8 lg:px-16">
        <p data-reveal className="mb-10 text-[12px] tracking-[0.3em] text-white/20 uppercase">
          James Creative Labs
        </p>

        <h1 data-reveal className="mb-14 max-w-[900px]">
          <span className="block text-[clamp(2.8rem,7.5vw,7rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-white">
            {t.hero.title_line1}
          </span>
          <span className="block text-[clamp(2.8rem,7.5vw,7rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-white/20">
            {t.hero.title_line2}
          </span>
        </h1>

        <p data-reveal className="mb-16 max-w-lg text-[16px] leading-[1.8] text-white/30">
          {t.hero.subtitle}
        </p>

        <div data-reveal className="flex flex-wrap items-center gap-6">
          <button
            onClick={() => document.querySelector('#works')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded-full bg-white px-12 py-5 text-[15px] font-medium text-[#0a0a0a] transition-all duration-500 hover:bg-cyan-400 hover:shadow-[0_0_40px_rgba(0,240,255,0.15)]"
          >
            {t.hero.cta_works}
          </button>
          <button
            onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded-full border border-white/[0.12] px-12 py-5 text-[15px] font-medium text-white/50 transition-all duration-500 hover:border-white/30 hover:text-white"
          >
            {t.hero.cta_contact}
          </button>
        </div>
      </div>
    </section>
  );
}
