// Date helpers for the habit grid. Rows are date-derived (not stored): the grid
// always renders the real last N calendar days based on today, so it advances
// automatically. Anchored to UTC for the same reason as lib/lessons/daily.ts —
// the server component and any future cron must agree on "today".

// How many days of entries the page fetches up front. Lives here (a plain
// module) rather than in the "use client" grid so Server Components can import
// it as a real value — a "use client" export reaches the server as an opaque
// client reference, not the number.
export const FETCH_DAYS = 60;

// YYYY-MM-DD in UTC.
export function dateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

// The last `n` date keys, most-recent first (today on top, matching grid order).
export function lastNDates(n: number, from: Date = new Date()): string[] {
  const out: string[] = [];
  const base = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - i);
    out.push(dateKey(d));
  }
  return out;
}
