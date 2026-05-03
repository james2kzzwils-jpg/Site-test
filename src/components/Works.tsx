'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShown(true);
      },
      { threshold: 0.04 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return { ref, shown };
}

function FilterPill({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`hover-line inline-flex items-baseline gap-1.5 pb-1 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors duration-300 ${
        active
          ? 'is-active text-[var(--foreground)]'
          : 'text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70'
      }`}
      data-cursor="hover"
    >
      {label}
      <span
        className={`text-[10px] transition-colors duration-300 ${
          active ? 'text-[var(--accent)]' : 'text-[var(--foreground)]/40'
        }`}
      >
        ({count})
      </span>
    </button>
  );
}

export default function Works() {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const { ref, shown } = useReveal<HTMLElement>();

  const total = t.works.projects.length;
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: total };
    for (const p of t.works.projects) {
      c[p.category] = (c[p.category] ?? 0) + 1;
    }
    return c;
  }, [t.works.projects, total]);

  const filterKeys = Object.keys(t.works.filters) as Array<keyof typeof t.works.filters>;

  const filtered = useMemo(
    () =>
      activeFilter === 'all'
        ? t.works.projects
        : t.works.projects.filter((p) => p.category === activeFilter),
    [t.works.projects, activeFilter]
  );

  return (
    <section
      id="works"
      ref={ref}
      className="relative py-32 lg:py-44"
    >
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
        {/* Section header */}
        <div
          className={`mb-16 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between ${
            shown ? 'reveal is-in' : 'reveal'
          }`}
        >
          <div className="max-w-2xl">
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
              <span className="accent-diamond">◆</span> {t.works.section_label}
            </p>
            <h2 className="font-display text-[clamp(2.6rem,7vw,6rem)] font-medium leading-[0.98] tracking-[-0.04em] text-[var(--foreground)]">
              {t.works.title}
            </h2>
            <p className="mt-7 max-w-md text-[15px] leading-[1.7] text-[var(--foreground)]/45">
              {t.works.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <FilterPill
              label={t.works.filters.all}
              count={counts.all ?? 0}
              active={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
            />
            {filterKeys
              .filter((k) => k !== 'all')
              .map((k) => (
                <FilterPill
                  key={k}
                  label={t.works.filters[k]}
                  count={counts[k] ?? 0}
                  active={activeFilter === k}
                  onClick={() => setActiveFilter(k)}
                />
              ))}
          </div>
        </div>

        {/* List */}
        <div className="border-t border-[var(--hairline)]">
          {filtered.map((project, i) => {
            const idx = String(i + 1).padStart(2, '0');
            const tot = String(total).padStart(2, '0');
            return (
              <Link
                key={project.id}
                href={`/works/${project.id}`}
                className={`group block border-b border-[var(--hairline)] transition-[background-color] duration-500 hover:bg-[var(--foreground)]/[0.015] ${
                  shown ? 'reveal is-in' : 'reveal'
                }`}
                style={{ transitionDelay: `${120 + i * 90}ms` }}
                data-cursor="view"
                data-cursor-label={t.works.view_project}
              >
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-6 py-7 sm:gap-10 sm:py-9 lg:gap-14 lg:py-10">
                  {/* Number */}
                  <span className="font-mono text-[11px] tabular-nums tracking-[0.16em] text-[var(--foreground)]/35 transition-colors duration-500 group-hover:text-[var(--accent)]">
                    {idx}
                    <span className="text-[var(--foreground)]/20">/{tot}</span>
                  </span>

                  {/* Title + tags */}
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-8">
                    <h3 className="font-display text-[clamp(1.8rem,4.6vw,3.2rem)] font-medium leading-[1] tracking-[-0.025em] text-[var(--foreground)]/85 transition-[transform,color] duration-500 group-hover:translate-x-2 group-hover:text-[var(--accent)]">
                      {project.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
                      {project.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[var(--hairline)] px-3 py-[5px] font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/55"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Year + arrow */}
                  <div className="flex items-center gap-4">
                    <span className="hidden font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/35 md:inline">
                      {project.client}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/55">
                      {project.year}
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-[18px] text-[var(--foreground)]/40 transition-[transform,color] duration-500 group-hover:translate-x-1 group-hover:text-[var(--accent)]"
                    >
                      →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom meta */}
        <div className="mt-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--foreground)]/35">
          <span>
            <span className="text-[var(--accent)]">
              ({String(filtered.length).padStart(2, '0')})
            </span>{' '}
            {t.works.section_label}
          </span>
          <span>↑ index</span>
        </div>
      </div>
    </section>
  );
}
