'use client';

import { useRef, useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

function ServiceRow({
  service,
  index,
  isVisible,
}: {
  service: { number: string; title: string; description: string; tools: string[] };
  index: number;
  isVisible: boolean;
}) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div
      className={`group transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
      style={{ transitionDelay: `${200 + index * 110}ms` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-6 border-t border-[var(--hairline)] py-9 text-left lg:gap-14 lg:py-11"
        data-cursor="hover"
      >
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
          ({service.number})
        </span>

        <h3 className="flex-1 font-display text-[clamp(1.3rem,2.6vw,2rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--foreground)]/80 transition-colors duration-300 group-hover:text-[var(--foreground)]">
          {service.title}
        </h3>

        <span
          aria-hidden="true"
          className={`shrink-0 font-mono text-[18px] text-[var(--foreground)]/35 transition-transform duration-500 ${
            open ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="grid gap-10 pb-12 sm:grid-cols-[1fr_1fr] lg:pl-[calc(2rem+5rem)]">
          <p className="max-w-xl text-[15px] leading-[1.75] text-[var(--foreground)]/55">
            {service.description}
          </p>
          <div className="flex flex-wrap items-start gap-2">
            {service.tools.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-[var(--hairline)] px-3 py-[6px] font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--foreground)]/55"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Services() {
  const { t } = useLanguage();
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

  return (
    <section id="services" ref={sectionRef} className="py-32 lg:py-44">
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
        <div
          className={`mb-20 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between ${
            shown ? 'reveal is-in' : 'reveal'
          }`}
        >
          <div className="max-w-2xl">
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
              ◆ {t.services.section_label}
            </p>
            <h2 className="font-display text-[clamp(2.6rem,7vw,6rem)] font-medium leading-[0.98] tracking-[-0.04em] text-[var(--foreground)]">
              {t.services.title}
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-[1.7] text-[var(--foreground)]/45">
            {t.services.subtitle}
          </p>
        </div>

        <div>
          {t.services.items.map((service, i) => (
            <ServiceRow
              key={service.number}
              service={service}
              index={i}
              isVisible={shown}
            />
          ))}
          <div className="border-t border-[var(--hairline)]" />
        </div>
      </div>
    </section>
  );
}
