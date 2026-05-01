'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

const gradients = [
  'from-cyan-400/20 to-violet-500/20',
  'from-violet-500/20 to-pink-500/20',
  'from-emerald-400/20 to-cyan-400/20',
  'from-orange-400/20 to-red-500/20',
  'from-blue-400/20 to-cyan-400/20',
  'from-pink-500/20 to-violet-500/20',
];

export default function Works() {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('all');
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

  const filterKeys = Object.keys(t.works.filters) as Array<keyof typeof t.works.filters>;
  const projects = t.works.projects.filter(
    (p) => activeFilter === 'all' || p.category === activeFilter
  );

  return (
    <section id="works" ref={sectionRef} className="relative py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div
          className={`mb-16 transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <span className="font-mono text-xs tracking-widest text-cyan-400 uppercase">
            {'// '}{t.works.title}
          </span>
          <h2 className="mt-4 font-mono text-4xl font-bold text-white sm:text-5xl">
            {t.works.title}
          </h2>
          <p className="mt-4 max-w-2xl font-mono text-sm text-white/40">
            {t.works.subtitle}
          </p>
        </div>

        <div className="mb-12 flex flex-wrap gap-3">
          {filterKeys.map((key) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`rounded-full border px-5 py-2 font-mono text-xs uppercase tracking-wider transition-all ${
                activeFilter === key
                  ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-400'
                  : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
              }`}
            >
              {t.works.filters[key]}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <div
              key={project.id}
              className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-[#111] transition-all duration-500 hover:border-cyan-400/20 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div
                className={`flex h-48 items-center justify-center bg-gradient-to-br ${
                  gradients[i % gradients.length]
                } transition-all duration-500 group-hover:scale-105`}
              >
                <div className="font-mono text-3xl font-bold text-white/10">
                  {project.id.split('-').map(w => w[0]).join('').toUpperCase()}
                </div>
              </div>

              <div className="p-6">
                <div className="mb-3 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-white/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="mb-2 font-mono text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  {project.title}
                </h3>
                <p className="mb-4 font-mono text-xs leading-relaxed text-white/40">
                  {project.description}
                </p>
                <button className="font-mono text-xs text-cyan-400/70 uppercase tracking-wider transition-colors hover:text-cyan-400">
                  {t.works.view_project} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
