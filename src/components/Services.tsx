'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import AmbientParticles, { type HighlightRect } from './AmbientParticles';

// Each clip is paired with its service by item number. Videos live in
// /public/services and are H.264 yuv420p with no audio, ~720p, ≈1-2MB each.
// We never preload until the user opens the panel.
const SERVICE_VIDEOS: Record<string, string> = {
  '01': '/services/01-simulations.mp4',
  '02': '/services/02-full-cycle.mp4',
  '03': '/services/03-product-viz.mp4',
  '04': '/services/04-automation.mp4',
  '05': '/services/05-mentoring.mp4',
};

function ServiceRow({
  service,
  index,
  isVisible,
  onHover,
}: {
  service: { number: string; title: string; description: string; tools: string[]; price?: string };
  index: number;
  isVisible: boolean;
  onHover?: (el: HTMLElement | null) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  // Every row starts collapsed — the hover preview alone is enough of an
  // invitation to click through.
  const [open, setOpen] = useState(false);
  // We mount the <video> the first time the panel opens and leave it
  // mounted afterwards so re-opening is instant.
  const [hasOpened, setHasOpened] = useState(false);
  const [hovering, setHovering] = useState(false);
  const previewRef = useRef<HTMLVideoElement>(null);

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) setHasOpened(true);
      return next;
    });
  }, []);

  const videoSrc = SERVICE_VIDEOS[service.number];

  // Hover preview: only play while the row is collapsed AND the pointer
  // is inside it. When the row is opened the full video below takes
  // over, so we hide the preview to avoid duplicate playback.
  const showPreview = hovering && !open && Boolean(videoSrc);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    if (showPreview) {
      el.play().catch(() => {
        /* autoplay blocked — ignore */
      });
    } else {
      el.pause();
    }
  }, [showPreview]);

  return (
    <div
      ref={rowRef}
      className={`group transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
      style={{ transitionDelay: `${200 + index * 110}ms` }}
      onMouseEnter={() => {
        setHovering(true);
        onHover?.(rowRef.current);
      }}
      onMouseLeave={() => {
        setHovering(false);
        onHover?.(null);
      }}
    >
      <button
        onClick={handleToggle}
        className="relative flex w-full items-center gap-6 overflow-hidden border-t border-[var(--hairline)] py-9 text-left lg:gap-14 lg:py-11"
        data-cursor="hover"
      >
        {/* Hover-only video preview — sits behind the title at ~50%
            opacity. Hidden when the row is expanded. Right side only
            so the title stays legible. */}
        {videoSrc ? (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 right-0 hidden w-[55%] md:block ${
              showPreview ? 'opacity-50' : 'opacity-0'
            } transition-opacity duration-500`}
          >
            <span className="absolute inset-0 [mask-image:linear-gradient(to_right,transparent_0%,#000_22%,#000_100%)]">
              <video
                ref={previewRef}
                className="h-full w-full object-cover"
                src={videoSrc}
                muted
                loop
                playsInline
                preload="none"
              />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-transparent to-transparent" />
          </span>
        ) : null}

        <span className="relative shrink-0 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
          <span className="text-[var(--accent)]">({service.number})</span>
        </span>

        <h3 className="relative flex-1 font-display text-[clamp(1.3rem,2.6vw,2rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--foreground)]/80 transition-colors duration-300 group-hover:text-[var(--foreground)]">
          {service.title}
        </h3>

        {/* Indicative starting price — shown when the row provides one.
            Sits between the title and the toggle so it's the first
            thing the visitor reads next to the service name. */}
        {service.price ? (
          <span className="relative hidden shrink-0 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/55 transition-colors duration-300 group-hover:text-[var(--accent)] md:inline-block">
            {service.price}
          </span>
        ) : null}

        <span
          aria-hidden="true"
          className={`relative shrink-0 font-mono text-[18px] transition-[transform,color] duration-500 ${
            open ? 'rotate-45 text-[var(--accent)]' : 'text-[var(--foreground)]/35'
          }`}
        >
          +
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? 'max-h-[640px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="grid gap-10 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:pl-[calc(2rem+5rem)]">
          <div className="flex flex-col gap-8">
            <p className="max-w-xl text-[15px] leading-[1.75] text-[var(--foreground)]/55">
              {service.description}
            </p>
            {/* Price echo inside the expanded panel — needed because the
                inline pill on the title row is hidden on mobile widths,
                and we still want a clear "from N ₽ / from $M" anchor on
                small screens. */}
            {service.price ? (
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--accent)] md:hidden">
                {service.price}
              </p>
            ) : null}
            <div className="flex flex-wrap items-start gap-2">
              {service.tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-[var(--hairline)] px-3 py-[6px] font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--foreground)]/55"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {videoSrc ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-sm border border-[var(--hairline)] bg-[var(--foreground)]/[0.02]">
              {hasOpened ? (
                <>
                  <video
                    key={videoSrc}
                    className="absolute inset-0 h-full w-full object-cover"
                    src={videoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[var(--background)]/55 via-transparent to-transparent" />
                  <div className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-20 [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.04)_0px,rgba(255,255,255,0.04)_1px,transparent_1px,transparent_3px)]" />
                  <span className="pointer-events-none absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
                    <span className="text-[var(--accent)]">◆</span>{' '}
                    {service.number} · Loop
                  </span>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Services() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);

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

  // Translate a hovered row's DOM rect into section-local coordinates
  // so the AmbientParticles canvas (which is pinned to the section)
  // can brighten particles in the row's neighbourhood.
  const handleRowHover = (el: HTMLElement | null) => {
    if (!el || !sectionRef.current) {
      setHighlight(null);
      return;
    }
    const tr = el.getBoundingClientRect();
    const sr = sectionRef.current.getBoundingClientRect();
    setHighlight({
      x: tr.left - sr.left,
      y: tr.top - sr.top,
      w: tr.width,
      h: tr.height,
    });
  };

  return (
    <section id="services" ref={sectionRef} className="relative py-32 lg:py-44">
      <AmbientParticles highlight={highlight} count={220} seed={202} />
      <div className="relative z-10 mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
        <div
          className={`mb-20 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between ${
            shown ? 'reveal is-in' : 'reveal'
          }`}
        >
          <div className="max-w-2xl">
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
              <span className="accent-diamond">◆</span> {t.services.section_label}
            </p>
            <h2 className="font-display text-[clamp(2.6rem,7vw,6rem)] font-medium leading-[0.98] tracking-[-0.04em] text-[var(--foreground)]">
              {t.services.title}
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-[1.7] text-[var(--foreground)]/45">
            {t.services.subtitle}
          </p>
        </div>

        <div>
          {t.services.items.map((service, i) => (
            <ServiceRow
              key={service.number}
              service={service}
              index={i}
              isVisible={shown}
              onHover={handleRowHover}
            />
          ))}
          <div className="border-t border-[var(--hairline)]" />
        </div>
      </div>
    </section>
  );
}
