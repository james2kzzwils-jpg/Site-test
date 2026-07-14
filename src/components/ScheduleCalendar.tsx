'use client';

import { useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { schedule, isDateFree, isPast } from '@/lib/schedule';

/**
 * Interactive availability calendar.
 *
 * - Past dates are grayed out.
 * - Free days glow green (accent).
 * - Clicking a free day opens Calendly.
 * - Current month + next N months shown.
 */

const DAY_NAMES_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAY_NAMES_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_NAMES_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function MonthGrid({ year, month, isRu }: { year: number; month: number; isRu: boolean }) {
  const days = useMemo(() => getMonthDays(year, month), [year, month]);
  const dayNames = isRu ? DAY_NAMES_RU : DAY_NAMES_EN;
  const monthNames = isRu ? MONTH_NAMES_RU : MONTH_NAMES_EN;
  const startDow = days[0].getDay(); // 0=Sun

  const blanks = Array.from({ length: startDow }, (_, i) => i);

  return (
    <div className="flex flex-col">
      {/* Month header */}
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/60">
        {monthNames[month]} {year}
      </p>

      {/* Day headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {dayNames.map((d) => (
          <span
            key={d}
            className="text-center font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--foreground)]/30"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {blanks.map((i) => (
          <span key={`blank-${i}`} />
        ))}
        {days.map((date) => {
          const past = isPast(date);
          const free = !past && isDateFree(date);
          const today =
            date.toISOString().slice(0, 10) ===
            new Date().toISOString().slice(0, 10);

          return (
            <button
              key={date.getDate()}
              type="button"
              disabled={past || !free}
              onClick={() => {
                if (free) {
                  const dateStr = date.toISOString().slice(0, 10);
                  window.open(
                    `${schedule.calendlyUrl}?date=${dateStr}`,
                    '_blank',
                  );
                }
              }}
              className={`relative flex h-8 w-full items-center justify-center rounded-sm font-mono text-[11px] transition-all duration-200 ${
                past
                  ? 'cursor-default text-[var(--foreground)]/15'
                  : free
                  ? 'cursor-pointer border border-[var(--accent)]/30 bg-[var(--accent)]/[0.08] text-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)] hover:bg-[var(--accent)]/[0.18] hover:shadow-[0_0_16px_var(--accent-glow)]'
                  : 'cursor-default text-[var(--foreground)]/35'
              } ${today ? 'ring-1 ring-[var(--foreground)]/30' : ''}`}
              data-cursor={free ? 'hover' : undefined}
            >
              {date.getDate()}
              {free && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ScheduleCalendar() {
  const { t, locale } = useLanguage();
  const isRu = locale === 'ru';

  const months = useMemo(() => {
    const now = new Date();
    const result: { year: number; month: number }[] = [];
    for (let i = 0; i <= schedule.monthsAhead; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      result.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    return result;
  }, []);

  const scheduleT = (t as unknown as Record<string, Record<string, string>>).schedule;

  return (
    <section className="py-14 sm:py-24 lg:py-36">
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
        <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
          <span className="accent-diamond">◆</span>{' '}
          {scheduleT?.section_label || 'Schedule'}
        </p>
        <h2 className="mb-4 font-display text-[clamp(2rem,5vw,4rem)] font-medium leading-[1] tracking-[-0.035em] text-[var(--foreground)]">
          {scheduleT?.title || 'Availability'}
        </h2>
        <p className="mb-12 max-w-xl text-[15px] leading-[1.7] text-[var(--foreground)]/45">
          {scheduleT?.subtitle ||
            'Green dates are open for new projects. Click to book a call.'}
        </p>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {months.map(({ year, month }) => (
            <MonthGrid key={`${year}-${month}`} year={year} month={month} isRu={isRu} />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm border border-[var(--accent)]/30 bg-[var(--accent)]/[0.08]" />
            {scheduleT?.legend_free || 'Available — click to book'}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-[var(--foreground)]/[0.06]" />
            {scheduleT?.legend_busy || 'Busy'}
          </span>
        </div>
      </div>
    </section>
  );
}
