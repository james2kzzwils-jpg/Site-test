'use client';

import { useRef, useState, useEffect, type FormEvent } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Contact() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  return (
    <section id="contact" ref={sectionRef} className="relative py-40">
      <div className="mx-auto max-w-[1400px] px-8 lg:px-12">
        <div className="grid gap-20 lg:grid-cols-[1fr_1.2fr]">
          <div
            className={`transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <span className="mb-6 inline-block font-mono text-[11px] tracking-[0.2em] text-cyan-400/70 uppercase">
              {'// '}{t.nav.contact}
            </span>
            <h2 className="mb-6 font-mono text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-white">
              {t.contact.title}
            </h2>
            <p className="max-w-md text-[15px] leading-[1.8] text-white/35">
              {t.contact.subtitle}
            </p>

            <div className="mt-16 space-y-8">
              <div className="flex items-center gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <span className="font-mono text-[11px] text-cyan-400/70">@</span>
                </div>
                <span className="font-mono text-[14px] text-white/60">{t.contact.info.email}</span>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <span className="font-mono text-[11px] text-cyan-400/70">TG</span>
                </div>
                <span className="font-mono text-[14px] text-white/60">{t.contact.info.telegram}</span>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <span className="font-mono text-[11px] text-cyan-400/70">◎</span>
                </div>
                <span className="font-mono text-[14px] text-white/60">{t.contact.info.location}</span>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className={`space-y-7 transition-all duration-1000 delay-200 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <div>
              <label className="mb-3 block font-mono text-[11px] uppercase tracking-[0.15em] text-white/30">
                {t.contact.form.name}
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-white/[0.06] bg-[#0f0f0f] px-5 py-4 font-mono text-[14px] text-white placeholder-white/15 outline-none transition-all duration-300 focus:border-cyan-400/20 focus:bg-[#111]"
                placeholder={t.contact.form.name}
              />
            </div>

            <div>
              <label className="mb-3 block font-mono text-[11px] uppercase tracking-[0.15em] text-white/30">
                {t.contact.form.email}
              </label>
              <input
                type="email"
                className="w-full rounded-xl border border-white/[0.06] bg-[#0f0f0f] px-5 py-4 font-mono text-[14px] text-white placeholder-white/15 outline-none transition-all duration-300 focus:border-cyan-400/20 focus:bg-[#111]"
                placeholder={t.contact.form.email}
              />
            </div>

            <div>
              <label className="mb-3 block font-mono text-[11px] uppercase tracking-[0.15em] text-white/30">
                {t.contact.form.project_type}
              </label>
              <select className="w-full appearance-none rounded-xl border border-white/[0.06] bg-[#0f0f0f] px-5 py-4 font-mono text-[14px] text-white/50 outline-none transition-all duration-300 focus:border-cyan-400/20 focus:bg-[#111]">
                {Object.values(t.contact.form.project_types).map((type) => (
                  <option key={type} className="bg-[#0f0f0f]">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-3 block font-mono text-[11px] uppercase tracking-[0.15em] text-white/30">
                {t.contact.form.message}
              </label>
              <textarea
                rows={5}
                className="w-full resize-none rounded-xl border border-white/[0.06] bg-[#0f0f0f] px-5 py-4 font-mono text-[14px] text-white placeholder-white/15 outline-none transition-all duration-300 focus:border-cyan-400/20 focus:bg-[#111]"
                placeholder={t.contact.form.message}
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-white py-4.5 font-mono text-[12px] font-semibold uppercase tracking-[0.15em] text-[#0a0a0a] transition-all duration-500 hover:bg-cyan-400"
            >
              {t.contact.form.send}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
