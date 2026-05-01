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
      { threshold: 0.02 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const categoryKeys = Object.keys(t.shop.categories) as Array<keyof typeof t.shop.categories>;
  const products = t.shop.products.filter(
    (p) => activeCategory === 'all' || p.category === activeCategory
  );

  return (
    <section id="shop" ref={sectionRef} className="py-32 lg:py-48">
      <div className="mx-auto max-w-[1400px] px-8 lg:px-16">
        <div
          className={`mb-24 max-w-2xl transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className="mb-6 text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1] tracking-[-0.03em] text-white">
            {t.shop.title}
          </h2>
          <p className="max-w-lg text-[16px] leading-[1.7] text-white/25">
            {t.shop.subtitle}
          </p>
        </div>

        <div
          className={`mb-16 flex flex-wrap gap-3 transition-all duration-1000 delay-200 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {categoryKeys.map((key) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`rounded-full px-6 py-3 text-[13px] transition-all duration-300 ${
                activeCategory === key
                  ? 'bg-white text-[#0a0a0a]'
                  : 'bg-white/[0.04] text-white/30 hover:bg-white/[0.08] hover:text-white/50'
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
              className={`group overflow-hidden rounded-3xl bg-white/[0.02] transition-all duration-700 hover:bg-white/[0.05] ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ transitionDelay: `${300 + i * 100}ms` }}
            >
              <div className="flex h-44 items-center justify-center">
                <span className="select-none text-[56px] font-light text-white/[0.04] transition-colors duration-500 group-hover:text-white/[0.08]">
                  {'</>'}
                </span>
              </div>

              <div className="p-8 pt-0">
                <span className="text-[11px] tracking-wide text-white/20">
                  {t.shop.categories[product.category as keyof typeof t.shop.categories]}
                </span>
                <h3 className="mt-3 text-[16px] font-medium tracking-[-0.01em] text-white/80 transition-colors duration-300 group-hover:text-white">
                  {product.title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.7] text-white/20">
                  {product.description}
                </p>
                <div className="mt-8 flex items-center justify-between">
                  <span className="text-[20px] font-medium text-white">
                    {product.price}
                  </span>
                  <button className="rounded-full bg-white/[0.06] px-5 py-2 text-[11px] text-white/35 transition-all duration-300 hover:bg-white/[0.12] hover:text-white/60">
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
