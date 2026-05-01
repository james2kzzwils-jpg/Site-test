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
      className={`group border-b border-white/[0.06] transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-start gap-8 py-10 text-left transition-colors duration-300 lg:items-center lg:gap-12 lg:py-14"
      >
        <span className="shrink-0 font-mono text-[clamp(2.5rem,6vw,5rem)] font-black leading-none text-white/[0.07] transition-colors duration-500 group-hover:text-cyan-400/30">
          {service.number}
        </span>

        <div className="flex-1">
          <h3 className="font-mono text-[clamp(1.2rem,2.5vw,2rem)] font-bold leading-[1.2] tracking-tight text-white transition-colors duration-300 group-hover:text-cyan-400">
            {service.title}
          </h3>
        </div>

        <span className={`shrink-0 font-mono text-2xl text-white/20 transition-transform duration-500 ${isExpanded ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pb-12 pl-0 lg:pl-[calc(clamp(2.5rem,6vw,5rem)+3rem)]">
          <p className="mb-8 max-w-2xl text-[15px] leading-[1.8] text-white/40">
            {service.description}
          </p>
          <div className="flex flex-wrap gap-3">
            {service.tools.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 font-mono text-[11px] tracking-[0.1em] text-white/45 transition-all duration-300 hover:border-cyan-400/20 hover:text-cyan-400/70"
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
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="services" ref={sectionRef} className="relative py-40">
      <div className="mx-auto max-w-[1400px] px-8 lg:px-12">
        <div className="mb-6 grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div
            className={`transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <span className="mb-6 inline-block font-mono text-[11px] tracking-[0.2em] text-cyan-400/70 uppercase">
              {'// '}{t.services.title}
            </span>
            <h2 className="font-mono text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-white">
              {t.services.title}
            </h2>
          </div>
          <div
            className={`flex items-end transition-all duration-1000 delay-200 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <p className="max-w-xl text-[15px] leading-[1.8] text-white/35">
              {t.services.subtitle}
            </p>
          </div>
        </div>

        <div className="mt-16 border-t border-white/[0.06]">
          {t.services.items.map((service, i) => (
            <ServiceBlock
              key={service.number}
              service={service}
              index={i}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
