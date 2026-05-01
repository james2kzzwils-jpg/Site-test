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
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const categoryKeys = Object.keys(t.shop.categories) as Array<keyof typeof t.shop.categories>;
  const products = t.shop.products.filter(
    (p) => activeCategory === 'all' || p.category === activeCategory
  );

  return (
    <section id="shop" ref={sectionRef} className="relative py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div
          className={`mb-16 transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <span className="font-mono text-xs tracking-widest text-cyan-400 uppercase">
            {'// '}{t.shop.title}
          </span>
          <h2 className="mt-4 font-mono text-4xl font-bold text-white sm:text-5xl">
            {t.shop.title}
          </h2>
          <p className="mt-4 max-w-2xl font-mono text-sm text-white/40">
            {t.shop.subtitle}
          </p>
        </div>

        <div className="mb-12 flex flex-wrap gap-3">
          {categoryKeys.map((key) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`rounded-full border px-5 py-2 font-mono text-xs uppercase tracking-wider transition-all ${
                activeCategory === key
                  ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-400'
                  : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
              }`}
            >
              {t.shop.categories[key]}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, i) => (
            <div
              key={product.id}
              className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-[#111] transition-all duration-500 hover:border-cyan-400/20 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-violet-500/10 to-cyan-400/10">
                <div className="font-mono text-2xl text-white/10">
                  {'</>'}
                </div>
              </div>

              <div className="p-5">
                <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] uppercase text-white/40">
                  {t.shop.categories[product.category as keyof typeof t.shop.categories]}
                </span>
                <h3 className="mt-3 font-mono text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  {product.title}
                </h3>
                <p className="mt-2 font-mono text-xs leading-relaxed text-white/40">
                  {product.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-lg font-bold text-cyan-400">
                    {product.price}
                  </span>
                  <button className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider text-cyan-400 transition-all hover:bg-cyan-400/20">
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
