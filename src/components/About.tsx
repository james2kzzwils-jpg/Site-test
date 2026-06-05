'use client';

import { useRef, useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import ToolBalls from './ToolBalls';

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
          {/* Push the body copy down by the label height (≈11px line +
              1.5rem mb-6) so it sits flush with the heading, not the
              tiny "Философия" label above it. */}
          <p className="max-w-xl text-[16px] leading-[1.75] text-[var(--foreground)]/55 lg:pt-[2.6rem]">
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
            {t.about.approach_steps.map((step, i) => {
              // Accent column rising from the bottom of each card. The
              // fill height (and the gradient itself) ramps step-by-step
              // — the first card stays flat so a viewer reads the
              // progression top→bottom of the section. The 50% cap is
              // a hard ceiling so text stays comfortably legible at
              // the bottom of card #5.
              const total = t.about.approach_steps.length;
              const ramp = total > 1 ? i / (total - 1) : 0;
              const fillHeightPct = Math.round(ramp * 92); // 0 → 92
              const fillOpacity = 0.08 + ramp * 0.42; // 0.08 → 0.50
              return (
                <div
                  key={step.number}
                  className={`group relative flex flex-col gap-6 overflow-hidden border-b border-[var(--hairline)] p-8 transition-colors duration-500 hover:bg-[var(--foreground)]/[0.015] sm:p-10 lg:border-r lg:[&:nth-child(5n)]:border-r-0 ${
                    shown ? 'reveal is-in' : 'reveal'
                  }`}
                  style={{ transitionDelay: `${200 + i * 100}ms` }}
                >
                  {fillHeightPct > 0 ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 transition-[height,opacity] duration-1000 ease-out"
                      style={{
                        height: shown ? `${fillHeightPct}%` : '0%',
                        opacity: shown ? fillOpacity : 0,
                        background:
                          'linear-gradient(to top, var(--accent) 0%, var(--accent-glow) 55%, transparent 100%)',
                        transitionDelay: `${300 + i * 120}ms`,
                      }}
                    />
                  ) : null}
                  <span className="relative font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--accent)]">
                    {step.number}
                  </span>
                  <h4 className="relative font-display text-[20px] font-medium leading-[1.2] tracking-[-0.015em] text-[var(--foreground)]">
                    {step.title}
                  </h4>
                  <p className="relative text-[14px] leading-[1.65] text-[var(--foreground)]/45">
                    {step.description}
                  </p>
                  <div className="relative mt-auto flex flex-col gap-4 border-t border-[var(--hairline)] pt-5">
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
              );
            })}
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

        {/* Toolkit — floating balls inside a soft container */}
        <div className={shown ? 'reveal is-in' : 'reveal'}>
          <h3 className="mb-10 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/45">
            ({t.about.toolkit_label})
          </h3>
          <ToolBalls tools={t.about.tools} />
        </div>
      </div>
    </section>
  );
}
