'use client';

import { useRef, useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function About() {
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
    <section id="about" ref={sectionRef} className="relative py-40">
      <div className="mx-auto max-w-[1400px] px-8 lg:px-12">

        <div
          className={`mb-32 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-24 transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div>
            <span className="mb-6 inline-block font-mono text-[11px] tracking-[0.2em] text-cyan-400/70 uppercase">
              {'// '}{t.about.philosophy_label}
            </span>
            <h2 className="font-mono text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-white">
              {t.about.philosophy_title}
            </h2>
          </div>
          <div className="flex items-end">
            <p className="text-[15px] leading-[1.9] text-white/40">
              {t.about.philosophy_text}
            </p>
          </div>
        </div>

        <div className="mb-32">
          <div
            className={`mb-16 transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <span className="mb-6 inline-block font-mono text-[11px] tracking-[0.2em] text-cyan-400/70 uppercase">
              {'// '}{t.about.approach_label}
            </span>
            <h3 className="font-mono text-[clamp(1.5rem,3vw,2.5rem)] font-bold leading-[1.15] tracking-tight text-white">
              {t.about.approach_title}
            </h3>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.about.approach_steps.map((step, i) => (
              <div
                key={step.number}
                className={`group relative rounded-2xl border border-white/[0.04] bg-[#0f0f0f] p-8 transition-all duration-700 hover:border-cyan-400/15 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
                style={{ transitionDelay: `${300 + i * 150}ms` }}
              >
                <span className="mb-6 block font-mono text-[clamp(2rem,4vw,3rem)] font-black leading-none text-white/[0.06] transition-colors duration-500 group-hover:text-cyan-400/20">
                  {step.number}
                </span>
                <h4 className="mb-3 font-mono text-[14px] font-semibold tracking-tight text-white">
                  {step.title}
                </h4>
                <p className="text-[13px] leading-[1.7] text-white/35">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <span
            className={`mb-8 inline-block font-mono text-[11px] tracking-[0.2em] text-cyan-400/70 uppercase transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            {'// '}{t.about.toolkit_label}
          </span>
          <div className="flex flex-wrap gap-3">
            {t.about.tools.map((tool, i) => (
              <div
                key={tool}
                className={`rounded-xl border border-white/[0.04] bg-[#0f0f0f] px-6 py-3.5 font-mono text-[13px] text-white/45 transition-all duration-500 hover:border-cyan-400/15 hover:text-cyan-400/80 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
                style={{ transitionDelay: `${600 + i * 60}ms` }}
              >
                {tool}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
