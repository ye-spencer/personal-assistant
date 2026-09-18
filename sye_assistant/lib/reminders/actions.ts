"use server";

import { asc, eq, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import {
  recurringReminders,
  reminders,
  type RecurringReminder,
  type Reminder,
} from "@/lib/db/schema";
import { todayKey } from "./dates";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

// Basic YYYY-MM-DD shape check. The value comes from a native <input type=date>,
// which already produces this format; this guards against empty/garbage input.
function normalizeDueOn(dueOn: string): string {
  const trimmed = dueOn.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error("A valid date is required");
  }
  return trimmed;
}

export async function createReminder(
  body: string,
  dueOn: string,
): Promise<Reminder> {
  await requireAuth();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Reminder text cannot be empty");
  const [row] = await db
    .insert(reminders)
    .values({ body: trimmed, dueOn: normalizeDueOn(dueOn) })
    .returning();
  revalidatePath("/tools/reminders");
  return row;
}

export async function updateReminder(
  id: number,
  body: string,
  dueOn: string,
): Promise<Reminder> {
  await requireAuth();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Reminder text cannot be empty");
  const [row] = await db
    .update(reminders)
    .set({ body: trimmed, dueOn: normalizeDueOn(dueOn), updatedAt: new Date() })
    .where(eq(reminders.id, id))
    .returning();
  if (!row) throw new Error("Reminder not found");
  revalidatePath("/tools/reminders");
  return row;
}

export async function deleteReminder(id: number): Promise<void> {
  await requireAuth();
  await db.delete(reminders).where(eq(reminders.id, id));
  revalidatePath("/tools/reminders");
}

// Upcoming = due today or later, in the app timezone. Passed reminders are
// filtered out here (and physically removed by the morning cron), so the list
// stays correct even between cron runs. Soonest first.
export async function listUpcomingReminders(): Promise<Reminder[]> {
  await requireAuth();
  return db
    .select()
    .from(reminders)
    .where(gte(reminders.dueOn, todayKey()))
    .orderBy(asc(reminders.dueOn), asc(reminders.id));
}

// ── Recurring reminders ────────────────────────────────────────────────────
// Durable "repeat every N days" definitions. These are never materialized into
// one-off `reminders` rows; whether they fire on a day is computed on the fly
// (see lib/reminders/recurring + dates).

function normalizeInterval(intervalDays: number): number {
  if (!Number.isInteger(intervalDays) || intervalDays < 1) {
    throw new Error("Repeat interval must be a whole number of days (1 or more)");
  }
  return intervalDays;
}

export async function createRecurringReminder(
  body: string,
  startOn: string,
  intervalDays: number,
): Promise<RecurringReminder> {
  await requireAuth();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Reminder text cannot be empty");
  const [row] = await db
    .insert(recurringReminders)
    .values({
      body: trimmed,
      startOn: normalizeDueOn(startOn),
      intervalDays: normalizeInterval(intervalDays),
    })
    .returning();
  revalidatePath("/tools/reminders");
  return row;
}

export async function updateRecurringReminder(
  id: number,
  body: string,
  startOn: string,
  intervalDays: number,
): Promise<RecurringReminder> {
  await requireAuth();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Reminder text cannot be empty");
  const [row] = await db
    .update(recurringReminders)
    .set({
      body: trimmed,
      startOn: normalizeDueOn(startOn),
      intervalDays: normalizeInterval(intervalDays),
      updatedAt: new Date(),
    })
    .where(eq(recurringReminders.id, id))
    .returning();
  if (!row) throw new Error("Recurring reminder not found");
  revalidatePath("/tools/reminders");
  return row;
}

export async function deleteRecurringReminder(id: number): Promise<void> {
  await requireAuth();
  await db.delete(recurringReminders).where(eq(recurringReminders.id, id));
  revalidatePath("/tools/reminders");
}

export async function listRecurringReminders(): Promise<RecurringReminder[]> {
  await requireAuth();
  return db
    .select()
    .from(recurringReminders)
    .orderBy(asc(recurringReminders.startOn), asc(recurringReminders.id));
}
