'use client';

import { useRef, useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Services() {
  const { t } = useLanguage();
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

  return (
    <section id="services" ref={sectionRef} className="relative py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/[0.02] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div
          className={`mb-16 transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <span className="font-mono text-xs tracking-widest text-cyan-400 uppercase">
            {'// '}{t.services.title}
          </span>
          <h2 className="mt-4 font-mono text-4xl font-bold text-white sm:text-5xl">
            {t.services.title}
          </h2>
          <p className="mt-4 max-w-2xl font-mono text-sm text-white/40">
            {t.services.subtitle}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {t.services.items.map((service, i) => (
            <div
              key={service.number}
              className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-[#111] p-8 transition-all duration-500 hover:border-cyan-400/20 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="absolute -right-4 -top-4 font-mono text-[120px] font-bold leading-none text-white/[0.02] transition-colors group-hover:text-cyan-400/[0.05]">
                {service.number}
              </div>

              <div className="relative">
                <span className="font-mono text-xs text-cyan-400/60">{service.number}</span>
                <h3 className="mt-2 font-mono text-xl font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  {service.title}
                </h3>
                <p className="mt-4 font-mono text-sm leading-relaxed text-white/40">
                  {service.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {service.tools.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] text-white/50 transition-all group-hover:border-cyan-400/20 group-hover:text-cyan-400/60"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
