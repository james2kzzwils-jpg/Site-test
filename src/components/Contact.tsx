'use client';

import { useRef, useState, useEffect, type FormEvent } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Contact() {
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

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  return (
    <section id="contact" ref={sectionRef} className="py-32 lg:py-44">
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
        <div className={shown ? 'reveal is-in' : 'reveal'}>
          <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
            ◆ {t.contact.section_label}
          </p>
          <h2 className="max-w-[1100px] font-display text-[clamp(2.6rem,8vw,7rem)] font-medium leading-[0.98] tracking-[-0.04em] text-[var(--foreground)]">
            {t.contact.title}
          </h2>
          <p className="mt-8 max-w-lg text-[16px] leading-[1.7] text-[var(--foreground)]/55">
            {t.contact.subtitle}
          </p>
        </div>

        <div className="mt-24 grid gap-16 border-t border-[var(--hairline)] pt-16 lg:grid-cols-[1fr_1.4fr] lg:gap-28">
          <div
            className={`flex flex-col gap-10 ${
              shown ? 'reveal is-in' : 'reveal'
            }`}
            style={{ transitionDelay: '180ms' }}
          >
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
                Email
              </p>
              <a
                href={`mailto:${t.contact.info.email}`}
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
                href={`https://t.me/${t.contact.info.telegram.replace(/^@/, '')}`}
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
                {t.contact.info.location}
              </p>
            </div>
            <div className="mt-8 border-t border-[var(--hairline)] pt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
              {t.footer.available}
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className={`flex flex-col gap-10 ${
              shown ? 'reveal is-in' : 'reveal'
            }`}
            style={{ transitionDelay: '260ms' }}
          >
            <div>
              <label
                htmlFor="contactName"
                className="mb-3 block font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40"
              >
                {t.contact.form.name}
              </label>
              <input
                id="contactName"
                type="text"
                className="w-full border-b border-[var(--hairline)] bg-transparent pb-3 font-display text-[18px] tracking-[-0.01em] text-[var(--foreground)] outline-none transition-colors duration-300 placeholder:text-[var(--foreground)]/15 focus:border-[var(--foreground)]/60"
                placeholder={t.contact.form.name}
              />
            </div>

            <div>
              <label
                htmlFor="contactEmail"
                className="mb-3 block font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40"
              >
                {t.contact.form.email}
              </label>
              <input
                id="contactEmail"
                type="email"
                className="w-full border-b border-[var(--hairline)] bg-transparent pb-3 font-display text-[18px] tracking-[-0.01em] text-[var(--foreground)] outline-none transition-colors duration-300 placeholder:text-[var(--foreground)]/15 focus:border-[var(--foreground)]/60"
                placeholder={t.contact.form.email}
              />
            </div>

            <div>
              <label
                htmlFor="contactProjectType"
                className="mb-3 block font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40"
              >
                {t.contact.form.project_type}
              </label>
              <select
                id="contactProjectType"
                className="w-full appearance-none border-b border-[var(--hairline)] bg-transparent pb-3 font-display text-[18px] tracking-[-0.01em] text-[var(--foreground)]/80 outline-none transition-colors duration-300 focus:border-[var(--foreground)]/60"
              >
                {Object.values(t.contact.form.project_types).map((type) => (
                  <option key={type} className="bg-[#050505] text-[var(--foreground)]">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="contactMessage"
                className="mb-3 block font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40"
              >
                {t.contact.form.message}
              </label>
              <textarea
                id="contactMessage"
                rows={4}
                className="w-full resize-none border-b border-[var(--hairline)] bg-transparent pb-3 font-display text-[18px] tracking-[-0.01em] text-[var(--foreground)] outline-none transition-colors duration-300 placeholder:text-[var(--foreground)]/15 focus:border-[var(--foreground)]/60"
                placeholder={t.contact.form.message}
              />
            </div>

            <button
              type="submit"
              className="group inline-flex items-center justify-between border-t border-[var(--hairline)] pt-8 text-left transition-colors duration-300 hover:border-[var(--foreground)]/50"
              data-cursor="hover"
            >
              <span className="font-display text-[clamp(1.6rem,3vw,2.4rem)] font-medium tracking-[-0.02em] text-[var(--foreground)] transition-transform duration-500 group-hover:translate-x-2">
                {t.contact.form.send}
              </span>
              <span
                aria-hidden="true"
                className="font-mono text-[clamp(1.4rem,2.6vw,2rem)] text-[var(--foreground)]/40 transition-[transform,color] duration-500 group-hover:translate-x-1 group-hover:text-[var(--foreground)]"
              >
                ↗
              </span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
