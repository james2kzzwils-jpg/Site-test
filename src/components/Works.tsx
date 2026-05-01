'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

const gradients = [
  'from-cyan-500/30 via-blue-600/20 to-violet-600/30',
  'from-violet-600/30 via-purple-500/20 to-pink-500/30',
  'from-emerald-500/30 via-teal-500/20 to-cyan-500/30',
  'from-amber-500/30 via-orange-500/20 to-red-500/30',
  'from-blue-500/30 via-indigo-500/20 to-purple-500/30',
  'from-rose-500/30 via-pink-500/20 to-violet-500/30',
];

function ParallaxCard({
  project,
  index,
  gradient,
  viewLabel,
}: {
  project: { id: string; title: string; category: string; tags: string[]; description: string };
  index: number;
  gradient: string;
  viewLabel: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  const handleScroll = useCallback(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
    setOffset((progress - 0.5) * 60);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const isWide = index % 3 === 0;

  return (
    <div
      ref={cardRef}
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0f0f0f] transition-all duration-700 hover:border-cyan-400/15 ${
        isWide ? 'md:col-span-2' : ''
      }`}
    >
      <div className="relative overflow-hidden" style={{ height: isWide ? '420px' : '360px' }}>
        <div
          className={`absolute inset-x-0 h-[130%] bg-gradient-to-br ${gradient} transition-transform duration-100`}
          style={{ transform: `translateY(${offset}px)`, top: '-15%' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="select-none font-mono text-[140px] font-black leading-none text-white/[0.04] transition-all duration-700 group-hover:text-white/[0.08] group-hover:scale-110">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent opacity-80" />

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="mb-4 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 font-mono text-[11px] tracking-wide text-white/60 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
          <h3 className="font-mono text-2xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-cyan-400 lg:text-3xl">
            {project.title}
          </h3>
        </div>
      </div>

      <div className="p-8 pt-5">
        <p className="mb-6 max-w-xl text-[14px] leading-[1.7] text-white/40">
          {project.description}
        </p>
        <button className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.15em] text-cyan-400/80 transition-all duration-300 hover:text-cyan-400 hover:gap-3">
          {viewLabel}
          <span className="text-lg leading-none">→</span>
        </button>
      </div>
    </div>
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
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const filterKeys = Object.keys(t.works.filters) as Array<keyof typeof t.works.filters>;
  const projects = t.works.projects.filter(
    (p) => activeFilter === 'all' || p.category === activeFilter
  );

  return (
    <section id="works" ref={sectionRef} className="relative py-40">
      <div className="mx-auto max-w-[1400px] px-8 lg:px-12">
        <div
          className={`mb-20 max-w-3xl transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <span className="mb-6 inline-block font-mono text-[11px] tracking-[0.2em] text-cyan-400/70 uppercase">
            {'// '}{t.works.title}
          </span>
          <h2 className="mb-6 font-mono text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-white">
            {t.works.title}
          </h2>
          <p className="max-w-2xl text-[15px] leading-[1.8] text-white/35">
            {t.works.subtitle}
          </p>
        </div>

        <div
          className={`mb-14 flex flex-wrap gap-3 transition-all duration-1000 delay-200 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {filterKeys.map((key) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`rounded-full border px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] transition-all duration-300 ${
                activeFilter === key
                  ? 'border-cyan-400/30 bg-cyan-400/[0.08] text-cyan-400'
                  : 'border-white/[0.06] text-white/35 hover:border-white/15 hover:text-white/60'
              }`}
            >
              {t.works.filters[key]}
            </button>
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {projects.map((project, i) => (
            <ParallaxCard
              key={project.id}
              project={project}
              index={i}
              gradient={gradients[i % gradients.length]}
              viewLabel={t.works.view_project}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
