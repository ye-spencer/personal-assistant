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
