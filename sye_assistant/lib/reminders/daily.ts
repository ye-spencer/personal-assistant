import { asc, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { reminders, type Reminder } from "@/lib/db/schema";
import { todayKey } from "./dates";

// Reminders due on the given day (default today, in APP_TIME_ZONE) — the set
// that goes into the morning email.
export async function getRemindersDueToday(
  now: Date = new Date(),
): Promise<Reminder[]> {
  return db
    .select()
    .from(reminders)
    .where(eq(reminders.dueOn, todayKey(now)))
    .orderBy(asc(reminders.id));
}

// Delete reminders whose due date is strictly before today, so the table only
// holds today + future. Called by the morning cron *after* the email is built,
// so a reminder always gets its email on its due day before being removed.
// Returns how many were deleted.
export async function purgePastReminders(now: Date = new Date()): Promise<number> {
  const deleted = await db
    .delete(reminders)
    .where(lt(reminders.dueOn, todayKey(now)))
    .returning({ id: reminders.id });
  return deleted.length;
}
