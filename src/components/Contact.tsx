'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

// Calendly popup widget assets. Loaded lazily (once) the first time the
// Contact section is revealed so the booking modal opens instantly on
// click without shipping the script to every page on first paint.
const CALENDLY_CSS = 'https://assets.calendly.com/assets/external/widget.css';
const CALENDLY_JS = 'https://assets.calendly.com/assets/external/widget.js';

type CalendlyWindow = Window & {
  Calendly?: { initPopupWidget: (opts: { url: string }) => void };
};

function ensureCalendly(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve();
    if ((window as CalendlyWindow).Calendly) return resolve();

    if (!document.querySelector(`link[href="${CALENDLY_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = CALENDLY_CSS;
      document.head.appendChild(link);
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CALENDLY_JS}"]`
    );
    if (existing) {
      if ((window as CalendlyWindow).Calendly) resolve();
      else existing.addEventListener('load', () => resolve(), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = CALENDLY_JS;
    script.async = true;
    script.addEventListener('load', () => resolve(), { once: true });
    document.body.appendChild(script);
  });
}

/**
 * A single editorial CTA row — big display label + mono sub-line on the
 * left, an arrow that slides + turns accent on hover on the right.
 * Renders as <a> (telegram/email) or <button> (calendly popup).
 */
function ContactAction({
  title,
  desc,
  glyph,
  href,
  onClick,
}: {
  title: string;
  desc: string;
  glyph: string;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="flex min-w-0 flex-col gap-1.5">
        <span className="font-display text-[clamp(1.5rem,2.6vw,2.1rem)] font-medium tracking-[-0.02em] text-[var(--foreground)] transition-transform duration-500 group-hover:translate-x-2">
          {title}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40 transition-transform duration-500 group-hover:translate-x-2">
          {desc}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="ml-6 font-mono text-[clamp(1.3rem,2.4vw,1.8rem)] text-[var(--foreground)]/40 transition-[transform,color] duration-500 group-hover:translate-x-1 group-hover:text-[var(--accent)]"
      >
        {glyph}
      </span>
    </>
  );

  const className =
    'group flex w-full items-center justify-between border-t border-[var(--hairline)] py-7 text-left transition-colors duration-300 hover:border-[var(--foreground)]/45';

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noreferrer' : undefined}
        className={className}
        data-cursor="hover"
      >
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className} data-cursor="hover">
      {inner}
    </button>
  );
}

export default function Contact() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  const telegramUsername = t.contact.info.telegram.replace(/^@/, '');
  const telegramHref = 'https://t.me/' + telegramUsername;
  const emailHref = `mailto:${t.contact.info.email}`;
  const calendlyUrl = t.contact.info.calendly;
  const publicLocation = t.about.availability.location;

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          // Warm up the Calendly assets so the popup is instant.
          void ensureCalendly();
        }
      },
      { threshold: 0.04 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const openCalendly = useCallback(async () => {
    await ensureCalendly();
    const cal = (window as CalendlyWindow).Calendly;
    if (cal) cal.initPopupWidget({ url: calendlyUrl });
    else window.open(calendlyUrl, '_blank', 'noreferrer');
  }, [calendlyUrl]);

  return (
    <section id="contact" ref={sectionRef} className="py-14 sm:py-24 lg:py-36">
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
        <div className={shown ? 'reveal is-in' : 'reveal'}>
          <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
            <span className="accent-diamond">◆</span> {t.contact.section_label}
          </p>
          <h2 className="max-w-[1100px] font-display text-[clamp(2.6rem,8vw,7rem)] font-medium leading-[0.98] tracking-[-0.04em] text-[var(--foreground)]">
            {t.contact.title}
          </h2>
          <p className="mt-8 max-w-lg text-[16px] leading-[1.7] text-[var(--foreground)]/55">
            {t.contact.subtitle}
          </p>
        </div>

        <div className="mt-24 grid gap-16 border-t border-[var(--hairline)] pt-16 lg:grid-cols-[1fr_1.4fr] lg:gap-28">
          {/* Left — direct coordinates */}
          <div
            className={`flex flex-col gap-10 ${shown ? 'reveal is-in' : 'reveal'}`}
            style={{ transitionDelay: '180ms' }}
          >
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
                Email
              </p>
              <a
                href={emailHref}
                className="hover-line inline-block pb-1 font-display text-[18px] tracking-[-0.01em] text-[var(--foreground)]"
                data-cursor="hover"
              >
                {t.contact.info.email}
              </a>
            </div>
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
                Telegram
              </p>
              <a
                href={telegramHref}
                target="_blank"
                rel="noreferrer"
                className="hover-line inline-block pb-1 font-display text-[18px] tracking-[-0.01em] text-[var(--foreground)]"
                data-cursor="hover"
              >
                {t.contact.info.telegram}
              </a>
            </div>
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
                Location
              </p>
              <p className="font-display text-[18px] tracking-[-0.01em] text-[var(--foreground)]/70">
                {publicLocation}
              </p>
            </div>
            <div className="mt-8 flex items-center gap-3 border-t border-[var(--hairline)] pt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
              <span
                aria-hidden="true"
                className="h-[6px] w-[6px] animate-pulse rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent-glow)]"
              />
              {t.footer.available}
            </div>
          </div>

          {/* Right — pick-a-channel CTAs */}
          <div
            className={`flex flex-col ${shown ? 'reveal is-in' : 'reveal'}`}
            style={{ transitionDelay: '260ms' }}
          >
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
              {t.contact.actions.label}
            </p>
            <ContactAction
              title={t.contact.actions.telegram.title}
              desc={t.contact.actions.telegram.desc}
              glyph="↗"
              href={telegramHref}
            />
            <ContactAction
              title={t.contact.actions.email.title}
              desc={t.contact.actions.email.desc}
              glyph="↗"
              href={emailHref}
            />
            <ContactAction
              title={t.contact.actions.call.title}
              desc={t.contact.actions.call.desc}
              glyph="→"
              onClick={openCalendly}
            />
            <div className="border-t border-[var(--hairline)]" />
          </div>
        </div>
      </div>
    </section>
  );
}
