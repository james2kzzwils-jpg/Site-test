'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/i18n/LanguageContext';

const Scene3D = dynamic(() => import('./Scene3D'), { ssr: false });

export default function Hero() {
  const { t } = useLanguage();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = [titleRef.current, subtitleRef.current, ctaRef.current];
    els.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      setTimeout(() => {
        el.style.transition = 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 400 + i * 200);
    });
  }, []);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <Scene3D />

      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/40 via-transparent to-[#0a0a0a]" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-8 text-center lg:px-12">
        <div className="mb-10 inline-block">
          <span className="font-mono text-[11px] tracking-[0.3em] text-cyan-400/60 uppercase">
            James Creative Labs
          </span>
        </div>

        <h1 ref={titleRef} className="mb-8">
          <span className="block font-mono text-[clamp(2.5rem,7vw,6rem)] font-bold leading-[1.05] tracking-[-0.02em] text-white">
            {t.hero.title_line1}
          </span>
          <span className="block font-mono text-[clamp(2.5rem,7vw,6rem)] font-bold leading-[1.05] tracking-[-0.02em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">
            {t.hero.title_line2}
          </span>
        </h1>

        <p
          ref={subtitleRef}
          className="mx-auto mb-14 max-w-xl text-[15px] leading-[1.8] text-white/35"
        >
          {t.hero.subtitle}
        </p>

        <div ref={ctaRef} className="flex flex-col items-center justify-center gap-5 sm:flex-row">
          <button
            onClick={() => document.querySelector('#works')?.scrollIntoView({ behavior: 'smooth' })}
            className="group relative overflow-hidden rounded-full bg-white px-10 py-4 font-mono text-[12px] font-semibold uppercase tracking-[0.15em] text-[#0a0a0a] transition-all duration-500 hover:bg-cyan-400"
          >
            {t.hero.cta_works}
          </button>
          <button
            onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded-full border border-white/[0.12] px-10 py-4 font-mono text-[12px] uppercase tracking-[0.15em] text-white/50 transition-all duration-500 hover:border-cyan-400/30 hover:text-cyan-400"
          >
            {t.hero.cta_contact}
          </button>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3">
        <span className="font-mono text-[10px] tracking-[0.3em] text-white/15 uppercase">
          {t.hero.scroll}
        </span>
        <div className="h-10 w-px animate-pulse bg-gradient-to-b from-white/20 to-transparent" />
      </div>
    </section>
  );
}
