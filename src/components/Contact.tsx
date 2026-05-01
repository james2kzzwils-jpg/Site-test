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
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  return (
    <section id="contact" ref={sectionRef} className="relative py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2">
          <div
            className={`transition-all duration-700 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <span className="font-mono text-xs tracking-widest text-cyan-400 uppercase">
              {'// '}{t.nav.contact}
            </span>
            <h2 className="mt-4 font-mono text-4xl font-bold text-white sm:text-5xl">
              {t.contact.title}
            </h2>
            <p className="mt-4 max-w-md font-mono text-sm leading-relaxed text-white/40">
              {t.contact.subtitle}
            </p>

            <div className="mt-12 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <span className="font-mono text-xs text-cyan-400">@</span>
                </div>
                <div>
                  <p className="font-mono text-sm text-white">{t.contact.info.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <span className="font-mono text-xs text-cyan-400">TG</span>
                </div>
                <div>
                  <p className="font-mono text-sm text-white">{t.contact.info.telegram}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <span className="font-mono text-xs text-cyan-400">◎</span>
                </div>
                <div>
                  <p className="font-mono text-sm text-white">{t.contact.info.location}</p>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className={`space-y-6 transition-all duration-700 delay-200 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div>
              <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-white/40">
                {t.contact.form.name}
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 font-mono text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-cyan-400/30"
                placeholder={t.contact.form.name}
              />
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-white/40">
                {t.contact.form.email}
              </label>
              <input
                type="email"
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 font-mono text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-cyan-400/30"
                placeholder={t.contact.form.email}
              />
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-white/40">
                {t.contact.form.project_type}
              </label>
              <select className="w-full appearance-none rounded-xl border border-white/10 bg-[#111] px-4 py-3 font-mono text-sm text-white/60 outline-none transition-colors focus:border-cyan-400/30">
                {Object.values(t.contact.form.project_types).map((type) => (
                  <option key={type} className="bg-[#111]">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-white/40">
                {t.contact.form.message}
              </label>
              <textarea
                rows={5}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#111] px-4 py-3 font-mono text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-cyan-400/30"
                placeholder={t.contact.form.message}
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-cyan-400 py-4 font-mono text-sm font-medium text-black transition-all hover:bg-cyan-300"
            >
              {t.contact.form.send}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
