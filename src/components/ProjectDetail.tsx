'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Marquee from '@/components/Marquee';
import { useLanguage } from '@/i18n/LanguageContext';

export default function ProjectDetail({ slug }: { slug: string }) {
  const { t } = useLanguage();
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [slug]);

  const projects = t.works.projects;
  const index = useMemo(
    () => projects.findIndex((p) => p.id === slug),
    [projects, slug]
  );
  const project = projects[index];
  const next = projects[(index + 1) % projects.length];

  if (!project) return null;

  const idx = String(index + 1).padStart(2, '0');
  const tot = String(projects.length).padStart(2, '0');

  return (
    <>
      <Navigation rooted />
      <main className="bg-[var(--background)]">
        {/* Hero */}
        <section ref={heroRef} className="relative pb-20 pt-36 sm:pt-44 lg:pb-28">
          <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
            <div className="mb-12 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/45">
              <Link
                href="/#works"
                className="hover-line inline-flex items-center gap-2 pb-1 transition-colors duration-300 hover:text-[var(--foreground)]"
                data-cursor="hover"
              >
                ← {t.project.back_to_works}
              </Link>
              <span>
                ({idx}/{tot}) ◆ {project.client}
              </span>
            </div>

            <p
              className="reveal-auto mb-8 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45"
              style={{ animationDelay: '40ms' }}
            >
              {project.year} —{' '}
              {t.works.filters[project.category as keyof typeof t.works.filters]}
            </p>

            <h1
              className="reveal-auto mb-12 max-w-[1400px] font-display text-[clamp(3rem,11vw,11rem)] font-medium leading-[0.92] tracking-[-0.045em] text-[var(--foreground)]"
              style={{ animationDelay: '120ms' }}
            >
              {project.title}
            </h1>

            <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
              <p
                className="reveal-auto max-w-2xl text-[18px] leading-[1.65] text-[var(--foreground)]/75"
                style={{ animationDelay: '220ms' }}
              >
                {project.description}
              </p>
              <div
                className="reveal-auto flex flex-wrap items-start gap-2"
                style={{ animationDelay: '300ms' }}
              >
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--hairline)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/65"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Visual placeholder block */}
        <section className="relative">
          <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
            <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-sm border border-[var(--hairline)] bg-[var(--foreground)]/[0.015]">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(245,243,238,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(245,243,238,0.06) 1px, transparent 1px)',
                  backgroundSize: '64px 64px',
                }}
              />
              <span className="font-display text-[clamp(6rem,18vw,16rem)] font-medium leading-none tracking-[-0.05em] text-[var(--foreground)]/[0.06]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="absolute bottom-6 left-6 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
                ◆ Reel placeholder — drop video here
              </span>
              <span className="absolute right-6 top-6 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
                {project.year}
              </span>
            </div>
          </div>
        </section>

        {/* Outputs */}
        <section className="py-24 lg:py-32">
          <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
            <div className="grid gap-10 border-t border-[var(--hairline)] pt-12 lg:grid-cols-[1fr_2fr] lg:gap-24">
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
                ({t.project.outputs_label})
              </p>
              <div className="flex flex-wrap gap-y-3 gap-x-10 font-display text-[clamp(1.6rem,3.4vw,2.4rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--foreground)]">
                {project.outputs.map((o) => (
                  <span key={o} className="flex items-baseline gap-3">
                    <span aria-hidden="true" className="text-[var(--foreground)]/30">
                      +
                    </span>
                    {o}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Assignment / Solution / Context */}
        <section className="pb-32">
          <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
            {[
              { label: t.project.assignment_label, body: project.assignment },
              { label: t.project.solution_label, body: project.solution },
              { label: t.project.context_label, body: project.context },
            ].map((block, i) => (
              <div
                key={block.label}
                className="grid gap-10 border-t border-[var(--hairline)] py-16 lg:grid-cols-[1fr_2fr] lg:gap-24 lg:py-20"
              >
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
                    ({String(i + 1).padStart(2, '0')}) {block.label}
                  </p>
                </div>
                <p className="max-w-3xl text-[clamp(1.05rem,1.6vw,1.35rem)] leading-[1.55] text-[var(--foreground)]/80">
                  {block.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Collaborators */}
        <section className="border-t border-[var(--hairline)] py-24 lg:py-32">
          <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
            <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-24">
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
                ({t.project.collaborators_label})
              </p>
              <ul className="grid gap-4">
                {project.collaborators.map((c) => (
                  <li
                    key={c.role + c.name}
                    className="flex flex-col gap-1 border-b border-[var(--hairline)] pb-4 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                  >
                    <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/45">
                      {c.role}
                    </span>
                    <span className="font-display text-[clamp(1.1rem,2vw,1.5rem)] tracking-[-0.015em] text-[var(--foreground)]">
                      {c.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Marquee divider */}
        <div className="border-y border-[var(--hairline)] py-5 font-mono text-[12px] uppercase tracking-[0.32em] text-[var(--foreground)]/55">
          <Marquee
            items={[
              t.project.next_project,
              next.title,
              `(${String(((index + 1) % projects.length) + 1).padStart(2, '0')}/${tot})`,
              t.brand.name,
            ]}
          />
        </div>

        {/* Next project */}
        <section className="py-24 lg:py-36">
          <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
            <Link
              href={`/works/${next.id}`}
              className="group block border-t border-[var(--hairline)] pt-12"
              data-cursor="view"
              data-cursor-label={t.project.next_project}
            >
              <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
                ({t.project.next_project})
              </p>
              <div className="flex flex-wrap items-baseline justify-between gap-6">
                <h2 className="font-display text-[clamp(2.6rem,9vw,8rem)] font-medium leading-[0.95] tracking-[-0.04em] text-[var(--foreground)]/85 transition-[transform,color] duration-500 group-hover:translate-x-2 group-hover:text-[var(--foreground)]">
                  {next.title}
                </h2>
                <span className="font-mono text-[clamp(1rem,1.6vw,1.4rem)] text-[var(--foreground)]/55">
                  {next.year} ↗
                </span>
              </div>
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
