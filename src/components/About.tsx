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
    <section id="about" ref={sectionRef} className="py-14 sm:py-24 lg:py-36">
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
          className={`mb-16 sm:mb-32 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20 ${
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

        {/* Approach steps — desktop: 5-col grid; mobile: tree/timeline */}
        <div className="mb-16 sm:mb-32">
          <div className="mb-8 sm:mb-12 flex items-end justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/45">
              ({t.about.approach_label})
            </p>
            <h3 className="hidden max-w-md text-[clamp(1.1rem,2vw,1.5rem)] font-medium leading-[1.25] tracking-[-0.015em] text-[var(--foreground)]/55 sm:block">
              {t.about.approach_title}
            </h3>
          </div>

          {/* ─── Desktop grid (sm+) ─── */}
          <div className="hidden border-t border-[var(--hairline)] sm:grid sm:grid-cols-2 lg:grid-cols-5">
            {t.about.approach_steps.map((step, i) => {
              const total = t.about.approach_steps.length;
              const ramp = total > 1 ? i / (total - 1) : 0;
              const fillHeightPct = Math.round(ramp * 92);
              const fillOpacity = 0.08 + ramp * 0.42;
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
                  <div className="relative mt-auto border-t border-[var(--hairline)] pt-5">
                    <span className="mb-2 block whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
                      → {t.about.deliverable_label}
                    </span>
                    <p className="text-[13px] leading-[1.6] text-[var(--foreground)]/55">
                      {step.deliverable}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── Mobile tree/timeline (below sm) ─── */}
          <div className="relative sm:hidden">
            {/* Vertical connector line */}
            <div
              aria-hidden="true"
              className="absolute left-5 top-0 bottom-0 w-px bg-[var(--hairline)]"
            />
            {t.about.approach_steps.map((step, i) => {
              const isEven = i % 2 === 0;
              return (
                <div
                  key={step.number}
                  className={`relative flex gap-5 pb-8 ${
                    shown ? 'reveal is-in' : 'reveal'
                  }`}
                  style={{ transitionDelay: `${200 + i * 120}ms` }}
                >
                  {/* Circle node */}
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/50 bg-[var(--background)] shadow-[0_0_16px_var(--accent-glow)]">
                    <span className="font-mono text-[10px] font-medium text-[var(--accent)]">
                      {step.number}
                    </span>
                  </div>
                  {/* Content card */}
                  <div className="flex-1 rounded-sm border border-[var(--hairline)] bg-[var(--foreground)]/[0.015] p-4">
                    <h4 className="mb-1 font-display text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--foreground)]">
                      {step.title}
                    </h4>
                    <p className="text-[13px] leading-[1.55] text-[var(--foreground)]/45">
                      {step.description}
                    </p>
                    <p className="mt-3 border-t border-[var(--hairline)] pt-3 text-[12px] leading-[1.55] text-[var(--foreground)]/55">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
                        → {t.about.deliverable_label}:
                      </span>{' '}
                      {step.deliverable}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p
            className={`mt-6 sm:mt-10 max-w-3xl font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/45 ${
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
