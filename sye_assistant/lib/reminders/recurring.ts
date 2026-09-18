import { asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { recurringReminders, type RecurringReminder } from "@/lib/db/schema";
import { isRecurringDueOn, todayKey } from "./dates";

// Recurring reminders that fire on the given day (default today, in
// APP_TIME_ZONE) — the ones that join the morning email. There are only ever a
// handful of definitions, so we fetch them all and filter with the pure date
// math rather than encoding the modulo in SQL.
export async function getRecurringDueToday(
  now: Date = new Date(),
): Promise<RecurringReminder[]> {
  const day = todayKey(now);
  const all = await db
    .select()
    .from(recurringReminders)
    .orderBy(asc(recurringReminders.id));
  return all.filter((r) => isRecurringDueOn(r.startOn, r.intervalDays, day));
}
