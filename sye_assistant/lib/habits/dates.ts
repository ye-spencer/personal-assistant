// Date helpers for the habit grid. Rows are date-derived (not stored): the grid
// always renders the real last N calendar days based on today, so it advances
// automatically. Anchored to UTC for the same reason as lib/lessons/daily.ts —
// the server component and any future cron must agree on "today".

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
