import { env } from "@/env";

// Reminders are date-only (`due_on`). To decide what's "today", "upcoming", or
// "passed" we must anchor to a real timezone, not UTC — otherwise a reminder
// due today would flip to "passed" between ~8pm and midnight US Eastern, when
// UTC has already rolled to the next calendar day. The morning cron runs at
// 10:00 UTC (early morning ET), so the email lands on the correct local day.

// Today's calendar date as YYYY-MM-DD in APP_TIME_ZONE. `en-CA` formats dates
// as YYYY-MM-DD, which sorts and compares as plain strings — matching how
// Drizzle returns `date` columns, so no Date parsing is needed anywhere.
export function todayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: env.APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// Whole calendar days from `from` to `to`, both "YYYY-MM-DD". Computed via
// Date.UTC of the parts so it never touches the local timezone — the keys are
// already the correct calendar days (see todayKey). Positive when `to` is later.
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round(
    (Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000,
  );
}

// Advance a "YYYY-MM-DD" key by n days.
function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(t);
}

// Does a recurring reminder (anchored at `startOn`, repeating every
// `intervalDays` days) fire on `day`? True when `day` is on or after the anchor
// and lands exactly on a multiple of the interval.
export function isRecurringDueOn(
  startOn: string,
  intervalDays: number,
  day: string,
): boolean {
  if (intervalDays < 1) return false;
  const delta = daysBetween(startOn, day);
  return delta >= 0 && delta % intervalDays === 0;
}

// The first day on or after `day` that the recurring reminder fires. If `day` is
// before the anchor, that's the anchor itself; otherwise round the elapsed span
// up to the next whole interval.
export function nextOccurrenceOnOrAfter(
  startOn: string,
  intervalDays: number,
  day: string,
): string {
  const delta = daysBetween(startOn, day);
  if (delta <= 0) return startOn;
  const steps = Math.ceil(delta / intervalDays);
  return addDays(startOn, steps * intervalDays);
}
