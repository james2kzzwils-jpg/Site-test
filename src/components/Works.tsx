'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

const gradients = [
  'from-slate-800/40 via-gray-900/30 to-zinc-800/40',
  'from-zinc-800/40 via-neutral-900/30 to-stone-800/40',
  'from-gray-800/40 via-slate-900/30 to-zinc-800/40',
  'from-neutral-800/40 via-zinc-900/30 to-gray-800/40',
  'from-stone-800/40 via-gray-900/30 to-slate-800/40',
  'from-zinc-800/40 via-stone-900/30 to-neutral-800/40',
];

function ProjectCard({
  project,
  index,
  gradient,
}: {
  project: { id: string; title: string; category: string; tags: string[]; description: string };
  index: number;
  gradient: string;
}) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const handleScroll = useCallback(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
    setOffset((progress - 0.5) * 50);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const isHero = index === 0;

  return (
    <button
      ref={cardRef}
      type="button"
      className={`group relative w-full overflow-hidden rounded-3xl text-left transition-all duration-1000 hover:scale-[1.01] ${
        isHero ? 'col-span-full' : ''
      } ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div
        className="relative overflow-hidden"
        style={{ height: isHero ? '560px' : '480px' }}
      >
        <div
          className={`absolute inset-x-0 h-[130%] bg-gradient-to-br ${gradient}`}
          style={{ transform: `translateY(${offset}px)`, top: '-15%' }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="select-none text-[clamp(6rem,15vw,12rem)] font-bold leading-none text-white/[0.03] transition-all duration-700 group-hover:text-white/[0.06]">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-10 lg:p-12">
          <div className="mb-4 flex flex-wrap gap-3">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-xl bg-white/[0.08] px-6 py-3 text-[14px] tracking-wide text-white/50 backdrop-blur-sm transition-colors duration-300 group-hover:bg-white/[0.12]"
              >
                {tag}
              </span>
            ))}
          </div>
          <h3 className="text-[clamp(1.5rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-white transition-colors duration-500 group-hover:text-cyan-400">
            {project.title}
          </h3>
          {isHero && (
            <p className="mt-4 max-w-lg text-[14px] leading-[1.7] text-white/30">
              {project.description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

export default function Works() {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('all');
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

  const filterKeys = Object.keys(t.works.filters) as Array<keyof typeof t.works.filters>;
  const projects = t.works.projects.filter(
    (p) => activeFilter === 'all' || p.category === activeFilter
  );

  return (
    <section id="works" ref={sectionRef} className="py-40 lg:py-56">
      <div className="mx-auto max-w-[1400px] px-8 lg:px-16">
        <div
          className={`mb-20 transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1] tracking-[-0.03em] text-white">
            {t.works.title}
          </h2>
          <p className="mt-8 max-w-lg text-[16px] leading-[1.7] text-white/25">
            {t.works.subtitle}
          </p>
        </div>

        <div
          className={`mb-24 flex flex-wrap gap-4 sm:gap-5 lg:gap-6 transition-all duration-1000 delay-200 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {filterKeys.map((key) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`relative rounded-full px-12 py-5 text-[16px] font-medium tracking-wide transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] sm:px-16 sm:py-7 sm:text-[20px] lg:px-20 lg:py-8 lg:text-[24px] ${
                activeFilter === key
                  ? 'bg-white text-[#0a0a0a] shadow-[0_4px_24px_rgba(255,255,255,0.15)] scale-100'
                  : 'border border-white/15 bg-transparent text-white/40 hover:border-white/30 hover:text-white/70 hover:bg-white/[0.04] hover:shadow-[0_2px_16px_rgba(255,255,255,0.06)]'
              }`}
            >
              <span className="whitespace-nowrap">{t.works.filters[key]}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {projects.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={i}
              gradient={gradients[i % gradients.length]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
