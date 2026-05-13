'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Marquee from '@/components/Marquee';
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * Tiny editorial monogram badge used in place of full brand SVGs.
 * Stays minimal and on-brand; works at any size; no extra requests.
 */
function PlatformBadge({
  href,
  label,
  monogram,
}: {
  href: string;
  label: string;
  monogram: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="group/badge inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/55 transition-[color,border-color,background-color] duration-300 hover:border-[var(--accent)] hover:bg-[var(--accent)]/[0.06] hover:text-[var(--accent)]"
      data-cursor="hover"
    >
      <span
        aria-hidden="true"
        className="flex h-5 w-5 items-center justify-center rounded-full border border-current font-display text-[10px] tracking-normal"
      >
        {monogram}
      </span>
      {label}
      <span aria-hidden="true" className="text-current/60 group-hover/badge:text-[var(--accent)]">
        ↗
      </span>
    </a>
  );
}

/** Bento text card — index + label + body */
function BentoText({
  idx,
  label,
  body,
  className = '',
}: {
  idx: string;
  label: string;
  body: string;
  className?: string;
}) {
  return (
    <article
      className={`flex flex-col justify-between gap-10 rounded-sm border border-[var(--hairline)] bg-[var(--foreground)]/[0.012] p-8 lg:p-10 ${className}`}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
        <span className="text-[var(--accent)]">({idx})</span> {label}
      </p>
      <p className="text-[clamp(1.05rem,1.3vw,1.25rem)] leading-[1.55] text-[var(--foreground)]/82">
        {body}
      </p>
    </article>
  );
}

/** Bento visual placeholder — for moodboard / breakdown / final frame */
function BentoVisual({
  label,
  caption,
  aspect = 'aspect-[4/3]',
  className = '',
  big = false,
}: {
  label: string;
  caption?: string;
  aspect?: string;
  className?: string;
  big?: boolean;
}) {
  return (
    <div
      className={`relative flex ${aspect} flex-col justify-between overflow-hidden rounded-sm border border-[var(--hairline)] bg-[var(--foreground)]/[0.015] p-6 lg:p-8 ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(245,243,238,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(245,243,238,0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <span className="relative font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
        <span className="accent-diamond">◆</span> {label}
      </span>
      {big && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-[clamp(4rem,12vw,10rem)] font-medium leading-none tracking-[-0.05em] text-[var(--accent)]/[0.10]"
        >
          ◆
        </span>
      )}
      {caption && (
        <span className="relative font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
          {caption}
        </span>
      )}
    </div>
  );
}

/**
 * Vertical media gallery used for moodboard, experiments and the main
 * Behance gallery. Picks <img> vs <video> by file extension and keeps the
 * source aspect ratio so frames don't get cropped.
 *
 * `kind` only affects the small index label on each tile so the same
 * component can render three sections without colliding numbering.
 */
function ProjectGallery({
  label,
  items,
  title,
  kind,
}: {
  label: string;
  items: readonly string[];
  title: string;
  kind: 'moodboard' | 'experiments' | 'gallery';
}) {
  const total = items.length;
  return (
    <section className="relative pb-24 lg:pb-32" data-gallery={kind}>
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
        <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
          <span className="accent-diamond">◆</span> {label}
        </p>
        <div className="flex flex-col gap-3 sm:gap-4">
          {items.map((src, i) => {
            const isVideo = src.toLowerCase().endsWith('.mp4');
            const key = `${src}-${i}`;
            return (
              <figure
                key={key}
                className="relative overflow-hidden rounded-sm border border-[var(--hairline)] bg-[var(--foreground)]/[0.012]"
              >
                {isVideo ? (
                  <video
                    className="block h-auto w-full"
                    src={src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={`${title} — ${label} ${i + 1}`}
                    className="block h-auto w-full"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <figcaption className="pointer-events-none absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/55">
                  <span className="text-[var(--accent)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>{' '}
                  / {String(total).padStart(2, '0')}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function ProjectDetail({ slug }: { slug: string }) {
  const { t } = useLanguage();
  const heroRef = useRef<HTMLElement>(null);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [slug]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
                <span className="text-[var(--accent)]">({idx}/{tot})</span>{' '}
                <span className="accent-diamond">◆</span> {project.client}
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
                className="reveal-auto flex flex-col gap-5"
                style={{ animationDelay: '300ms' }}
              >
                <div className="flex flex-wrap items-start gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[var(--hairline)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/65"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {project.links.behance ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <PlatformBadge
                      href={project.links.behance}
                      label="Behance"
                      monogram="Be"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* Cover frame — shows the imported Behance cover if the project
            has one; otherwise falls back to the grid placeholder. */}
        <section className="relative">
          <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
            <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-sm border border-[var(--hairline)] bg-[var(--foreground)]/[0.015]">
              {project.cover ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.cover}
                    alt={project.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="eager"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--background)]/45 via-transparent to-transparent"
                  />
                </>
              ) : (
                <>
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, rgba(245,243,238,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(245,243,238,0.06) 1px, transparent 1px)',
                      backgroundSize: '64px 64px',
                    }}
                  />
                  <span className="font-display text-[clamp(6rem,18vw,16rem)] font-medium leading-none tracking-[-0.05em] text-[var(--accent)]/[0.12]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </>
              )}
              <span className="absolute bottom-6 left-6 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/55">
                <span className="accent-diamond">◆</span> {project.client}
              </span>
              <span className="absolute right-6 top-6 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/55">
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
                    <span aria-hidden="true" className="text-[var(--accent)]">
                      +
                    </span>
                    {o}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bento — Assignment / Solution / Process / Context with visual cells */}
        <section className="pb-24 lg:pb-32">
          <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
            <div className="grid grid-cols-12 gap-3 sm:gap-4">
              <BentoText
                idx="01"
                label={t.project.assignment_label}
                body={project.assignment}
                className="col-span-12 lg:col-span-8"
              />
              <BentoVisual
                label="Moodboard"
                caption="01 / Reference"
                aspect="aspect-[4/5] lg:aspect-auto lg:min-h-[360px]"
                className="col-span-12 lg:col-span-4 lg:row-span-2"
              />

              <BentoText
                idx="02"
                label={t.project.solution_label}
                body={project.solution}
                className="col-span-12 lg:col-span-8"
              />

              <BentoVisual
                label="Breakdown"
                caption="Process — Frame 01"
                aspect="aspect-[16/7]"
                className="col-span-12 lg:col-span-7"
                big
              />
              <BentoVisual
                label="Frame"
                caption="Process — Frame 02"
                aspect="aspect-square"
                className="col-span-6 lg:col-span-5"
              />

              <BentoText
                idx="03"
                label={t.project.context_label}
                body={project.context}
                className="col-span-12 lg:col-span-7"
              />
              <BentoVisual
                label="Frame"
                caption="Process — Frame 03"
                aspect="aspect-square lg:aspect-auto lg:min-h-full"
                className="col-span-6 lg:col-span-5"
              />
            </div>
          </div>
        </section>

        {/* Moodboard — reference images and references collected before the
            project even starts. Rendered as a masonry-ish column flow so the
            mixed aspect ratios stack without forced cropping. */}
        {project.moodboard && project.moodboard.length > 0 ? (
          <ProjectGallery
            label={t.project.moodboard_label}
            items={project.moodboard}
            title={project.title}
            kind="moodboard"
          />
        ) : null}

        {/* Experiments — extra explorations and look tests that sit alongside
            the final gallery but aren't part of the published cut. */}
        {project.experiments && project.experiments.length > 0 ? (
          <ProjectGallery
            label={t.project.experiments_label}
            items={project.experiments}
            title={project.title}
            kind="experiments"
          />
        ) : null}

        {/* Final gallery — every imported render / loop in the same order
            the project ships on its source (behance.net, deliverable, etc).
            Stacked single-column to preserve the original framing. */}
        {project.gallery && project.gallery.length > 0 ? (
          <ProjectGallery
            label={t.project.gallery_label}
            items={project.gallery}
            title={project.title}
            kind="gallery"
          />
        ) : null}

        {/* Closing render — full bleed */}
        <section className="relative pb-24 lg:pb-32">
          <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
              <span className="accent-diamond">◆</span> Final Frame
            </p>
            <div className="relative flex aspect-[21/9] items-end overflow-hidden rounded-sm border border-[var(--hairline)] bg-[var(--foreground)]/[0.015]">
              {project.cover ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.cover}
                    alt={project.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--background)]/55 via-[var(--background)]/10 to-transparent"
                  />
                </>
              ) : (
                <>
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, rgba(245,243,238,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(245,243,238,0.06) 1px, transparent 1px)',
                      backgroundSize: '80px 80px',
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-[clamp(8rem,22vw,22rem)] font-medium leading-none tracking-[-0.05em] text-[var(--accent)]/[0.10]"
                  >
                    ◆
                  </span>
                </>
              )}
              <div className="relative z-10 flex w-full items-end justify-between p-8 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/70">
                <span>
                  <span className="text-[var(--accent)]">+</span> {project.title}
                </span>
                <span>{project.year}</span>
              </div>
            </div>
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
                  {next.year} <span className="text-[var(--accent)]">↗</span>
                </span>
              </div>
            </Link>
          </div>
        </section>

        <Footer />
      </main>

      {/* Floating back-to-top — visible only after the visitor has
          scrolled past the hero. Anchored to the left edge so it stays
          clear of the custom cursor canvas on the right. */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label={t.project.back_to_works}
        className={`fixed bottom-8 left-8 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-[var(--background)]/85 font-mono text-[14px] text-[var(--foreground)]/80 backdrop-blur transition-[opacity,transform,background-color,border-color] duration-300 hover:border-[var(--accent)] hover:bg-[var(--accent)]/[0.08] hover:text-[var(--accent)] ${
          showTop
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0'
        }`}
        data-cursor="hover"
      >
        ↑
      </button>
    </>
  );
}
