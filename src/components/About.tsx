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
      { threshold: 0.02 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="py-32 lg:py-48">
      <div className="mx-auto max-w-[1400px] px-8 lg:px-16">

        <div
          className={`mb-40 transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className="mb-12 max-w-[700px] text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1] tracking-[-0.03em] text-white">
            {t.about.philosophy_title}
          </h2>
          <p className="max-w-2xl text-[17px] leading-[1.8] text-white/25">
            {t.about.philosophy_text}
          </p>
        </div>

        <div className="mb-40">
          <h3
            className={`mb-20 text-[clamp(1.5rem,3vw,2.25rem)] font-medium leading-[1.2] tracking-[-0.02em] text-white/60 transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            {t.about.approach_title}
          </h3>

          <div className="grid gap-px bg-white/[0.04] sm:grid-cols-2 lg:grid-cols-4">
            {t.about.approach_steps.map((step, i) => (
              <div
                key={step.number}
                className={`bg-[#0a0a0a] p-10 transition-all duration-1000 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
                style={{ transitionDelay: `${400 + i * 100}ms` }}
              >
                <span className="mb-8 block text-[clamp(2rem,4vw,3rem)] font-light leading-none text-white/[0.06]">
                  {step.number}
                </span>
                <h4 className="mb-3 text-[15px] font-medium text-white/70">
                  {step.title}
                </h4>
                <p className="text-[13px] leading-[1.7] text-white/20">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3
            className={`mb-12 text-[18px] font-medium text-white/40 transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            {t.about.toolkit_label}
          </h3>
          <div className="flex flex-wrap gap-3">
            {t.about.tools.map((tool, i) => (
              <div
                key={tool}
                className={`rounded-full bg-white/[0.04] px-6 py-3 text-[14px] text-white/30 transition-all duration-500 hover:bg-white/[0.08] hover:text-white/50 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
                style={{ transitionDelay: `${600 + i * 50}ms` }}
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
