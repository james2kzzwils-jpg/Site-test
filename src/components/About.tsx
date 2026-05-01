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
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="relative py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.02] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Philosophy */}
        <div
          className={`mb-24 transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <span className="font-mono text-xs tracking-widest text-cyan-400 uppercase">
            {'// '}{t.about.philosophy_label}
          </span>
          <h2 className="mt-4 font-mono text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            {t.about.philosophy_title}
          </h2>
          <p className="mt-6 max-w-3xl font-mono text-base leading-relaxed text-white/50 sm:text-lg">
            {t.about.philosophy_text}
          </p>
        </div>

        {/* Process */}
        <div className="mb-24">
          <span className="font-mono text-xs tracking-widest text-cyan-400 uppercase">
            {'// '}{t.about.approach_label}
          </span>
          <h3 className="mt-4 mb-12 font-mono text-3xl font-bold text-white">
            {t.about.approach_title}
          </h3>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.about.approach_steps.map((step, i) => (
              <div
                key={step.number}
                className={`group relative rounded-2xl border border-white/5 bg-[#111] p-6 transition-all duration-500 hover:border-cyan-400/20 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <span className="font-mono text-3xl font-bold text-cyan-400/20 group-hover:text-cyan-400/40 transition-colors">
                  {step.number}
                </span>
                <h4 className="mt-4 font-mono text-sm font-semibold text-white">
                  {step.title}
                </h4>
                <p className="mt-2 font-mono text-xs leading-relaxed text-white/40">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Toolkit */}
        <div>
          <span className="font-mono text-xs tracking-widest text-cyan-400 uppercase">
            {'// '}{t.about.toolkit_label}
          </span>
          <div className="mt-6 flex flex-wrap gap-4">
            {t.about.tools.map((tool, i) => (
              <div
                key={tool}
                className={`rounded-xl border border-white/5 bg-[#111] px-6 py-4 font-mono text-sm text-white/60 transition-all duration-500 hover:border-cyan-400/20 hover:text-cyan-400 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${i * 80}ms` }}
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
