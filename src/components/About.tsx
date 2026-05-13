'use client';

import { useRef, useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function About() {
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
    <section id="about" ref={sectionRef} className="py-32 lg:py-44">
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
        <p
          className={`mb-10 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45 ${
            shown ? 'reveal is-in' : 'reveal'
          }`}
        >
          <span className="accent-diamond">◆</span> {t.about.section_label}
        </p>

        {/* Philosophy */}
        <div
          className={`mb-32 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20 ${
            shown ? 'reveal is-in' : 'reveal'
          }`}
        >
          <div>
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/45">
              ({t.about.philosophy_label})
            </p>
            <h3 className="max-w-[800px] font-display text-[clamp(2.2rem,5.4vw,4.5rem)] font-medium leading-[1] tracking-[-0.035em] text-[var(--foreground)]">
              {t.about.philosophy_title}
            </h3>
          </div>
          <p className="max-w-xl text-[16px] leading-[1.75] text-[var(--foreground)]/55">
            {t.about.philosophy_text}
          </p>
        </div>

        {/* Approach steps */}
        <div className="mb-32">
          <div className="mb-12 flex items-end justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/45">
              ({t.about.approach_label})
            </p>
            <h3 className="hidden max-w-md text-[clamp(1.1rem,2vw,1.5rem)] font-medium leading-[1.25] tracking-[-0.015em] text-[var(--foreground)]/55 sm:block">
              {t.about.approach_title}
            </h3>
          </div>

          <div className="grid border-t border-[var(--hairline)] sm:grid-cols-2 lg:grid-cols-5">
            {t.about.approach_steps.map((step, i) => (
              <div
                key={step.number}
                className={`group flex flex-col gap-6 border-b border-[var(--hairline)] p-8 transition-colors duration-500 hover:bg-[var(--foreground)]/[0.015] sm:p-10 lg:border-r lg:[&:nth-child(5n)]:border-r-0 ${
                  shown ? 'reveal is-in' : 'reveal'
                }`}
                style={{ transitionDelay: `${200 + i * 100}ms` }}
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--accent)]">
                  {step.number}
                </span>
                <h4 className="font-display text-[20px] font-medium leading-[1.2] tracking-[-0.015em] text-[var(--foreground)]">
                  {step.title}
                </h4>
                <p className="text-[14px] leading-[1.65] text-[var(--foreground)]/45">
                  {step.description}
                </p>
                <div className="mt-auto flex flex-col gap-4 border-t border-[var(--hairline)] pt-5">
                  <div>
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/55">
                        {t.about.understanding_label}
                      </span>
                      <span className="font-display text-[18px] font-medium tracking-[-0.01em] text-[var(--foreground)]">
                        {step.mutual_pct}%
                      </span>
                    </div>
                    <div className="h-[2px] w-full bg-[var(--hairline)]">
                      <div
                        className="h-full bg-[var(--foreground)]/80 transition-[width] duration-700"
                        style={{ width: shown ? `${step.mutual_pct}%` : '0%' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
                        → {t.about.result_label}
                      </span>
                      <span className="font-display text-[18px] font-medium tracking-[-0.01em] text-[var(--accent)]">
                        {step.result_pct}%
                      </span>
                    </div>
                    <div className="h-[2px] w-full bg-[var(--hairline)]">
                      <div
                        className="h-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent-glow)] transition-[width] duration-700"
                        style={{ width: shown ? `${step.result_pct}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p
            className={`mt-10 max-w-3xl font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/45 ${
              shown ? 'reveal is-in' : 'reveal'
            }`}
            style={{ transitionDelay: '720ms' }}
          >
            <span className="accent-diamond">◆</span> {t.about.rounds_note}
          </p>
        </div>

        {/* Toolkit */}
        <div className={shown ? 'reveal is-in' : 'reveal'}>
          <h3 className="mb-10 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/45">
            ({t.about.toolkit_label})
          </h3>
          <div className="flex flex-wrap gap-2">
            {t.about.tools.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-[var(--hairline)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--foreground)]/65 transition-colors duration-300 hover:border-[var(--hairline-strong)] hover:text-[var(--foreground)]"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
