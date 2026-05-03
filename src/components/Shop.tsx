'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Shop() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const sectionRef = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShown(true);
      },
      { threshold: 0.04 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const categoryKeys = Object.keys(t.shop.categories) as Array<keyof typeof t.shop.categories>;

  const total = t.shop.products.length;
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: total };
    for (const p of t.shop.products) c[p.category] = (c[p.category] ?? 0) + 1;
    return c;
  }, [t.shop.products, total]);

  const products = useMemo(
    () =>
      activeCategory === 'all'
        ? t.shop.products
        : t.shop.products.filter((p) => p.category === activeCategory),
    [t.shop.products, activeCategory]
  );

  return (
    <section id="shop" ref={sectionRef} className="py-32 lg:py-44">
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
        <div
          className={`mb-16 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between ${
            shown ? 'reveal is-in' : 'reveal'
          }`}
        >
          <div className="max-w-2xl">
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
              <span className="accent-diamond">◆</span> {t.shop.section_label}
            </p>
            <h2 className="font-display text-[clamp(2.6rem,7vw,6rem)] font-medium leading-[0.98] tracking-[-0.04em] text-[var(--foreground)]">
              {t.shop.title}
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-[1.7] text-[var(--foreground)]/45">
            {t.shop.subtitle}
          </p>
        </div>

        <div
          className={`mb-14 flex flex-wrap items-end gap-x-8 gap-y-4 ${
            shown ? 'reveal is-in' : 'reveal'
          }`}
        >
          {categoryKeys.map((key) => {
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`hover-line inline-flex items-baseline gap-1.5 pb-1 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors duration-300 ${
                  isActive
                    ? 'is-active text-[var(--foreground)]'
                    : 'text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70'
                }`}
                data-cursor="hover"
              >
                {t.shop.categories[key]}
                <span
                  className={`text-[10px] transition-colors duration-300 ${
                    isActive ? 'text-[var(--accent)]' : 'text-[var(--foreground)]/40'
                  }`}
                >
                  ({counts[key] ?? 0})
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid border-t border-[var(--hairline)] sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, i) => (
            <div
              key={product.id}
              className={`group flex flex-col justify-between gap-8 border-b border-[var(--hairline)] p-8 transition-colors duration-500 hover:bg-[var(--foreground)]/[0.015] sm:p-9 lg:border-r lg:[&:nth-child(4n)]:border-r-0 ${
                shown ? 'reveal is-in' : 'reveal'
              }`}
              style={{ transitionDelay: `${180 + i * 100}ms` }}
            >
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
                  {t.shop.categories[product.category as keyof typeof t.shop.categories]}
                </span>
                <h3 className="mt-4 font-display text-[20px] font-medium leading-[1.2] tracking-[-0.015em] text-[var(--foreground)]">
                  {product.title}
                </h3>
                <p className="mt-3 text-[14px] leading-[1.65] text-[var(--foreground)]/45">
                  {product.description}
                </p>
              </div>

              <div className="flex items-end justify-between gap-4 pt-2">
                <span className="font-display text-[22px] font-medium tracking-[-0.015em] text-[var(--foreground)]">
                  {product.price}
                </span>
                <button
                  className="hover-line pb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/55 transition-colors duration-300 hover:text-[var(--foreground)]"
                  data-cursor="hover"
                >
                  {t.shop.coming_soon} <span className="text-[var(--accent)]">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
