'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/i18n/LanguageContext';

const Scene3D = dynamic(() => import('./Scene3D'), { ssr: false });

export default function Hero() {
  const { t } = useLanguage();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const els = [titleRef.current, subtitleRef.current];
    els.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      setTimeout(() => {
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 300 + i * 200);
    });
  }, []);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <Scene3D />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <div className="mb-6 inline-block rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-1.5">
          <span className="font-mono text-xs tracking-widest text-cyan-400 uppercase">
            James Creative Labs
          </span>
        </div>

        <h1 ref={titleRef} className="mb-6">
          <span className="block font-mono text-5xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl">
            {t.hero.title_line1}
          </span>
          <span className="block font-mono text-5xl font-bold tracking-tight text-cyan-400 sm:text-7xl lg:text-8xl">
            {t.hero.title_line2}
          </span>
        </h1>

        <p
          ref={subtitleRef}
          className="mx-auto mb-10 max-w-2xl font-mono text-sm leading-relaxed text-white/40 sm:text-base"
        >
          {t.hero.subtitle}
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={() => document.querySelector('#works')?.scrollIntoView({ behavior: 'smooth' })}
            className="group relative overflow-hidden rounded-full bg-cyan-400 px-8 py-3 font-mono text-sm font-medium text-black transition-all hover:bg-cyan-300"
          >
            <span className="relative z-10">{t.hero.cta_works}</span>
          </button>
          <button
            onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded-full border border-white/10 px-8 py-3 font-mono text-sm text-white/70 transition-all hover:border-cyan-400/30 hover:text-cyan-400"
          >
            {t.hero.cta_contact}
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
        <span className="font-mono text-[10px] tracking-widest text-white/20 uppercase">
          {t.hero.scroll}
        </span>
        <div className="h-8 w-px animate-pulse bg-gradient-to-b from-cyan-400/50 to-transparent" />
      </div>
    </section>
  );
}
