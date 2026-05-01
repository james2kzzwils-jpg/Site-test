'use client';

import { useRef, useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

function ServiceBlock({
  service,
  index,
  isVisible,
}: {
  service: { number: string; title: string; description: string; tools: string[] };
  index: number;
  isVisible: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(index === 0);

  return (
    <div
      className={`group transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
      style={{ transitionDelay: `${200 + index * 100}ms` }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-8 border-t border-white/[0.06] py-14 text-left lg:gap-16 lg:py-16"
      >
        <span className="shrink-0 text-[clamp(2rem,5vw,4rem)] font-light leading-none text-white/[0.08] transition-colors duration-500 group-hover:text-white/20">
          {service.number}
        </span>

        <h3 className="flex-1 text-[clamp(1.1rem,2.5vw,1.75rem)] font-medium leading-[1.3] tracking-[-0.02em] text-white/70 transition-colors duration-300 group-hover:text-white">
          {service.title}
        </h3>

        <span className={`shrink-0 text-[24px] text-white/15 transition-transform duration-500 ${isExpanded ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pb-14 pl-0 lg:pl-[calc(clamp(2rem,5vw,4rem)+4rem)]">
          <p className="mb-8 max-w-xl text-[15px] leading-[1.8] text-white/25">
            {service.description}
          </p>
          <div className="flex flex-wrap gap-3">
            {service.tools.map((tool) => (
              <span
                key={tool}
                className="rounded-xl bg-white/[0.04] px-6 py-3 text-[14px] text-white/30 transition-colors duration-300 hover:bg-white/[0.08] hover:text-white/50"
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.02 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="services" ref={sectionRef} className="py-40 lg:py-56">
      <div className="mx-auto max-w-[1400px] px-8 lg:px-16">
        <div
          className={`mb-20 max-w-2xl transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className="mb-6 text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1] tracking-[-0.03em] text-white">
            {t.services.title}
          </h2>
          <p className="max-w-lg text-[16px] leading-[1.7] text-white/25">
            {t.services.subtitle}
          </p>
        </div>

        <div>
          {t.services.items.map((service, i) => (
            <ServiceBlock
              key={service.number}
              service={service}
              index={i}
              isVisible={isVisible}
            />
          ))}
          <div className="border-t border-white/[0.06]" />
        </div>
      </div>
    </section>
  );
}
