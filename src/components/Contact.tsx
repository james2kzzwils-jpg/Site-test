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
      { threshold: 0.02 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  return (
    <section id="contact" ref={sectionRef} className="py-40 lg:py-56">
      <div className="mx-auto max-w-[1400px] px-8 lg:px-16">
        <div
          className={`mb-20 transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1] tracking-[-0.03em] text-white">
            {t.contact.title}
          </h2>
          <p className="mt-8 max-w-md text-[16px] leading-[1.7] text-white/25">
            {t.contact.subtitle}
          </p>
        </div>

        <div className="grid gap-20 lg:grid-cols-[1fr_1.2fr] lg:gap-32">
          <div
            className={`transition-all duration-1000 delay-200 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <div className="space-y-10">
              <div>
                <p className="mb-2 text-[12px] tracking-wide text-white/15 uppercase">Email</p>
                <p className="text-[16px] text-white/50">{t.contact.info.email}</p>
              </div>
              <div>
                <p className="mb-2 text-[12px] tracking-wide text-white/15 uppercase">Telegram</p>
                <p className="text-[16px] text-white/50">{t.contact.info.telegram}</p>
              </div>
              <div>
                <p className="mb-2 text-[12px] tracking-wide text-white/15 uppercase">Location</p>
                <p className="text-[16px] text-white/50">{t.contact.info.location}</p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className={`space-y-10 transition-all duration-1000 delay-300 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <div>
              <label className="mb-3 block text-[12px] tracking-wide text-white/15 uppercase">
                {t.contact.form.name}
              </label>
              <input
                type="text"
                className="w-full border-b border-white/[0.06] bg-transparent pb-4 text-[16px] text-white outline-none transition-colors duration-300 placeholder:text-white/10 focus:border-white/20"
                placeholder={t.contact.form.name}
              />
            </div>

            <div>
              <label className="mb-3 block text-[12px] tracking-wide text-white/15 uppercase">
                {t.contact.form.email}
              </label>
              <input
                type="email"
                className="w-full border-b border-white/[0.06] bg-transparent pb-4 text-[16px] text-white outline-none transition-colors duration-300 placeholder:text-white/10 focus:border-white/20"
                placeholder={t.contact.form.email}
              />
            </div>

            <div>
              <label className="mb-3 block text-[12px] tracking-wide text-white/15 uppercase">
                {t.contact.form.project_type}
              </label>
              <select className="w-full appearance-none border-b border-white/[0.06] bg-transparent pb-4 text-[16px] text-white/40 outline-none transition-colors duration-300 focus:border-white/20">
                {Object.values(t.contact.form.project_types).map((type) => (
                  <option key={type} className="bg-[#0a0a0a] text-white">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-3 block text-[12px] tracking-wide text-white/15 uppercase">
                {t.contact.form.message}
              </label>
              <textarea
                rows={4}
                className="w-full resize-none border-b border-white/[0.06] bg-transparent pb-4 text-[16px] text-white outline-none transition-colors duration-300 placeholder:text-white/10 focus:border-white/20"
                placeholder={t.contact.form.message}
              />
            </div>

            <div className="pt-6">
              <button
                type="submit"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl bg-white px-14 py-7 text-[18px] font-semibold text-[#0a0a0a] transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(0,240,255,0.2)] sm:px-20 sm:py-8 sm:text-[22px] lg:min-w-[280px] lg:px-24 lg:py-9 lg:text-[24px]"
              >
                <span className="relative z-10">{t.contact.form.send}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-cyan-300 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
