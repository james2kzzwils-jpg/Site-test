'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

const gradients = [
  'from-cyan-400/20 via-blue-500/10 to-violet-500/20',
  'from-violet-500/20 via-purple-400/10 to-pink-400/20',
  'from-emerald-400/20 via-teal-400/10 to-cyan-400/20',
  'from-amber-400/20 via-orange-400/10 to-red-400/20',
  'from-blue-400/20 via-indigo-400/10 to-purple-400/20',
  'from-rose-400/20 via-pink-400/10 to-violet-400/20',
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
  const cardRef = useRef<HTMLDivElement>(null);
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
    <div
      ref={cardRef}
      className={`group relative cursor-pointer overflow-hidden rounded-3xl transition-all duration-1000 ${
        isHero ? 'col-span-full' : ''
      } ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div
        className="relative overflow-hidden"
        style={{ height: isHero ? '520px' : '440px' }}
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
          <div className="mb-4 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/[0.08] px-4 py-1.5 text-[11px] tracking-wide text-white/50 backdrop-blur-sm"
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
    <section id="works" ref={sectionRef} className="py-32 lg:py-48">
      <div className="mx-auto max-w-[1400px] px-8 lg:px-16">
        <div
          className={`mb-24 transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1] tracking-[-0.03em] text-white">
            {t.works.title}
          </h2>
          <p className="mt-6 max-w-lg text-[16px] leading-[1.7] text-white/25">
            {t.works.subtitle}
          </p>
        </div>

        <div
          className={`mb-16 flex flex-wrap gap-3 transition-all duration-1000 delay-200 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {filterKeys.map((key) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`rounded-full px-6 py-3 text-[13px] transition-all duration-300 ${
                activeFilter === key
                  ? 'bg-white text-[#0a0a0a]'
                  : 'bg-white/[0.04] text-white/30 hover:bg-white/[0.08] hover:text-white/50'
              }`}
            >
              {t.works.filters[key]}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
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
