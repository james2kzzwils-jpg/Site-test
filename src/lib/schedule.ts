/**
 * Schedule configuration — edit this file to update availability.
 *
 * freeDays: array of weekday numbers (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * that are always free by default.
 *
 * busyDates: array of specific ISO date strings (YYYY-MM-DD) that override
 * a normally-free day as busy.
 *
 * extraFreeDates: array of specific ISO date strings that mark a normally-busy
 * day as free.
 *
 * calendlyUrl: link to Calendly booking page.
 */

export const schedule = {
  /** Weekdays that are always free (0=Sun, 1=Mon, ..., 6=Sat) */
  freeDays: [2, 3, 5] as number[], // Tuesday, Wednesday, Friday

  /** Specific dates that are busy even if they fall on a free day */
  busyDates: [] as string[], // e.g. ['2026-07-18']

  /** Specific dates that are free even if they fall on a busy day */
  extraFreeDates: [] as string[], // e.g. ['2026-07-22']

  /** Calendly booking URL */
  calendlyUrl: 'https://calendly.com/aepov',

  /** How many months to show (current + next N) */
  monthsAhead: 2,
};

/** Check if a given date is available */
export function isDateFree(date: Date): boolean {
  const dateStr = date.toISOString().slice(0, 10);
  const day = date.getDay();

  // Explicit overrides take priority
  if (schedule.busyDates.includes(dateStr)) return false;
  if (schedule.extraFreeDates.includes(dateStr)) return true;

  // Default: free if it's a free weekday
  return schedule.freeDays.includes(day);
}

/** Check if a date is in the past */
export function isPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}
