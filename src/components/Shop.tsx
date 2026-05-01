'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Shop() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const categoryKeys = Object.keys(t.shop.categories) as Array<keyof typeof t.shop.categories>;
  const products = t.shop.products.filter(
    (p) => activeCategory === 'all' || p.category === activeCategory
  );

  return (
    <section id="shop" ref={sectionRef} className="relative py-40">
      <div className="mx-auto max-w-[1400px] px-8 lg:px-12">
        <div className="mb-6 grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div
            className={`transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <span className="mb-6 inline-block font-mono text-[11px] tracking-[0.2em] text-cyan-400/70 uppercase">
              {'// '}{t.shop.title}
            </span>
            <h2 className="font-mono text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-white">
              {t.shop.title}
            </h2>
          </div>
          <div
            className={`flex items-end transition-all duration-1000 delay-200 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <p className="max-w-xl text-[15px] leading-[1.8] text-white/35">
              {t.shop.subtitle}
            </p>
          </div>
        </div>

        <div
          className={`mb-14 mt-16 flex flex-wrap gap-3 transition-all duration-1000 delay-300 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {categoryKeys.map((key) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`rounded-full border px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] transition-all duration-300 ${
                activeCategory === key
                  ? 'border-cyan-400/30 bg-cyan-400/[0.08] text-cyan-400'
                  : 'border-white/[0.06] text-white/35 hover:border-white/15 hover:text-white/60'
              }`}
            >
              {t.shop.categories[key]}
            </button>
          ))}
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, i) => (
            <div
              key={product.id}
              className={`group relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0f0f0f] transition-all duration-700 hover:border-cyan-400/15 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ transitionDelay: `${400 + i * 120}ms` }}
            >
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-violet-500/[0.06] to-cyan-400/[0.06]">
                <span className="select-none font-mono text-[52px] font-black text-white/[0.04] transition-all duration-500 group-hover:text-white/[0.08]">
                  {'</>'}
                </span>
              </div>

              <div className="p-7">
                <span className="inline-block rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">
                  {t.shop.categories[product.category as keyof typeof t.shop.categories]}
                </span>
                <h3 className="mt-4 font-mono text-[15px] font-semibold tracking-tight text-white transition-colors duration-300 group-hover:text-cyan-400">
                  {product.title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.7] text-white/35">
                  {product.description}
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="font-mono text-xl font-bold text-white">
                    {product.price}
                  </span>
                  <button className="rounded-full border border-white/[0.08] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 transition-all duration-300 hover:border-cyan-400/20 hover:text-cyan-400">
                    {t.shop.coming_soon}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
