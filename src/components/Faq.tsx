'use client';

import { useRef, useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

function FaqRow({
  item,
  index,
  open,
  onToggle,
}: {
  item: { q: string; a: string };
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-t border-[var(--foreground)]/12 last:border-b">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group flex w-full items-start gap-6 py-7 text-left lg:py-8"
      >
        <span className="mt-1 font-mono text-[11px] tabular-nums text-[var(--foreground)]/35">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h3 className="flex-1 font-display text-[clamp(1.15rem,2.2vw,1.6rem)] font-medium leading-[1.25] tracking-[-0.02em] text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
          {item.q}
        </h3>
        <span
          className={`mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--foreground)]/20 text-[var(--foreground)]/60 transition-all duration-300 ${
            open ? 'rotate-45 border-[var(--accent)] text-[var(--accent)]' : 'group-hover:border-[var(--foreground)]/40'
          }`}
          aria-hidden
        >
          +
        </span>
      </button>
      <div
        className={`grid overflow-hidden transition-all duration-400 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0">
          <p className="max-w-3xl pb-8 pl-[2.75rem] text-[15px] leading-[1.75] text-[var(--foreground)]/55 lg:text-[16px]">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

const VISIBLE_COUNT = 5;

export default function Faq() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [showAll, setShowAll] = useState(false);

  const items = t.faq.items;
  const visibleItems = showAll ? items : items.slice(0, VISIBLE_COUNT);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="faq" ref={sectionRef} className="relative py-14 sm:py-24 lg:py-36">
      <div className="relative z-10 mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
        <div
          className={`mb-16 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between ${
            shown ? 'reveal is-in' : 'reveal'
          }`}
        >
          <div className="max-w-2xl">
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
              <span className="accent-diamond">◆</span> {t.faq.section_label}
            </p>
            <h2 className="font-display text-[clamp(2.6rem,7vw,6rem)] font-medium leading-[0.98] tracking-[-0.04em] text-[var(--foreground)]">
              {t.faq.title}
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-[1.7] text-[var(--foreground)]/45">
            {t.faq.subtitle}
          </p>
        </div>

        <div className={`mx-auto ${shown ? 'reveal is-in' : 'reveal'}`}>
          {visibleItems.map((item, i) => (
            <FaqRow
              key={i}
              item={item}
              index={i}
              open={openIndex === i}
              onToggle={() => setOpenIndex((prev) => (prev === i ? null : i))}
            />
          ))}

          {items.length > VISIBLE_COUNT && (
            <button
              type="button"
              onClick={() => {
                setShowAll((s) => {
                  const next = !s;
                  if (!next && openIndex !== null && openIndex >= VISIBLE_COUNT) {
                    setOpenIndex(null);
                  }
                  return next;
                });
              }}
              className="group flex w-full items-center justify-center gap-3 border-b border-[var(--foreground)]/12 py-6 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/45 transition-colors duration-300 hover:bg-[var(--foreground)]/[0.015] hover:text-[var(--foreground)]/70"
              data-cursor="hover"
            >
              <span className="accent-diamond transition-transform duration-300 group-hover:rotate-90">
                ◆
              </span>
              {showAll
                ? t.faq.show_less
                : `${t.faq.show_all} (${String(items.length).padStart(2, '0')})`}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
