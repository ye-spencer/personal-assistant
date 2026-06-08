"use server";

import { and, asc, count, eq, gte, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { habitEntries, habits, type Habit } from "@/lib/db/schema";
import { dateKey, lastNDates } from "./dates";
import type { HabitAnalytics } from "./types";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

function revalidate() {
  revalidatePath("/tools/habits");
  revalidatePath("/tools/habits/admin");
}

const habitOrder = [asc(habits.tier), asc(habits.sortOrder), asc(habits.id)];

export async function listActiveHabits(): Promise<Habit[]> {
  await requireAuth();
  return db.select().from(habits).where(isNull(habits.archivedAt)).orderBy(...habitOrder);
}

export async function listAllHabits(): Promise<Habit[]> {
  await requireAuth();
  return db.select().from(habits).orderBy(...habitOrder);
}

// Entries on/after `since` (YYYY-MM-DD), as a set of "habitId:dateKey" keys the
// grid can look cells up in directly.
export async function getEntryKeys(since: string): Promise<string[]> {
  await requireAuth();
  const rows = await db
    .select({ habitId: habitEntries.habitId, doneOn: habitEntries.doneOn })
    .from(habitEntries)
    .where(gte(habitEntries.doneOn, since));
  return rows.map((r) => `${r.habitId}:${r.doneOn}`);
}

export async function toggleEntry(
  habitId: number,
  day: string,
  done: boolean,
): Promise<void> {
  await requireAuth();
  if (done) {
    await db
      .insert(habitEntries)
      .values({ habitId, doneOn: day })
      .onConflictDoNothing();
  } else {
    await db
      .delete(habitEntries)
      .where(and(eq(habitEntries.habitId, habitId), eq(habitEntries.doneOn, day)));
  }
  revalidate();
}

function clampTier(tier: number): number {
  return tier < 1 ? 1 : tier > 3 ? 3 : tier;
}

async function nextSortOrder(tier: number): Promise<number> {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${habits.sortOrder}), -1)` })
    .from(habits)
    .where(eq(habits.tier, tier));
  return (row?.max ?? -1) + 1;
}

export async function createHabit(
  name: string,
  tier: number,
  description = "",
): Promise<Habit> {
  await requireAuth();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Habit name cannot be empty");
  const t = clampTier(tier);
  const [row] = await db
    .insert(habits)
    .values({
      name: trimmed,
      description: description.trim(),
      tier: t,
      sortOrder: await nextSortOrder(t),
    })
    .returning();
  revalidate();
  return row;
}

export async function updateHabit(
  id: number,
  name: string,
  description: string,
): Promise<void> {
  await requireAuth();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Habit name cannot be empty");
  await db
    .update(habits)
    .set({ name: trimmed, description: description.trim() })
    .where(eq(habits.id, id));
  revalidate();
}

export async function setHabitTier(id: number, tier: number): Promise<void> {
  await requireAuth();
  const t = clampTier(tier);
  await db
    .update(habits)
    .set({ tier: t, sortOrder: await nextSortOrder(t) })
    .where(eq(habits.id, id));
  revalidate();
}

// Renumber the habit's tier with the target swapped one slot in `dir`. Robust to
// tied sort_order values (defaults are all 0 until first reordered).
export async function moveHabit(id: number, dir: "up" | "down"): Promise<void> {
  await requireAuth();
  const [habit] = await db.select().from(habits).where(eq(habits.id, id));
  if (!habit) return;
  const list = await db
    .select()
    .from(habits)
    .where(eq(habits.tier, habit.tier))
    .orderBy(asc(habits.sortOrder), asc(habits.id));
  const idx = list.findIndex((h) => h.id === id);
  const target = dir === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= list.length) return;
  [list[idx], list[target]] = [list[target], list[idx]];
  await Promise.all(
    list.map((h, i) =>
      db.update(habits).set({ sortOrder: i }).where(eq(habits.id, h.id)),
    ),
  );
  revalidate();
}

export async function archiveHabit(id: number): Promise<void> {
  await requireAuth();
  await db.update(habits).set({ archivedAt: new Date() }).where(eq(habits.id, id));
  revalidate();
}

export async function unarchiveHabit(id: number): Promise<void> {
  await requireAuth();
  await db.update(habits).set({ archivedAt: null }).where(eq(habits.id, id));
  revalidate();
}

export async function deleteHabit(id: number): Promise<void> {
  await requireAuth();
  await db.delete(habits).where(eq(habits.id, id));
  revalidate();
}

const ANALYTICS_WINDOW = 90;

function currentStreak(done: Set<string>, today = new Date()): number {
  // Grace day: if today isn't marked yet, start counting from yesterday so an
  // unmarked "today" doesn't zero out an active streak.
  const cursor = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  if (!done.has(dateKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (done.has(dateKey(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function longestStreak(done: Set<string>, windowDays: string[]): number {
  let best = 0;
  let run = 0;
  // windowDays is most-recent first; direction doesn't matter for a max run.
  for (const day of windowDays) {
    if (done.has(day)) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

export async function getAnalytics(): Promise<HabitAnalytics[]> {
  await requireAuth();
  const active = await db
    .select()
    .from(habits)
    .where(isNull(habits.archivedAt))
    .orderBy(...habitOrder);
  if (active.length === 0) return [];

  const since = lastNDates(ANALYTICS_WINDOW).at(-1)!;
  const entries = await db
    .select({ habitId: habitEntries.habitId, doneOn: habitEntries.doneOn })
    .from(habitEntries)
    .where(gte(habitEntries.doneOn, since));

  const byHabit = new Map<number, Set<string>>();
  for (const e of entries) {
    let set = byHabit.get(e.habitId);
    if (!set) byHabit.set(e.habitId, (set = new Set()));
    set.add(e.doneOn);
  }

  const totals = await db
    .select({ habitId: habitEntries.habitId, total: count() })
    .from(habitEntries)
    .groupBy(habitEntries.habitId);
  const totalByHabit = new Map(totals.map((t) => [t.habitId, Number(t.total)]));

  const last7 = lastNDates(7);
  const last30 = lastNDates(30);
  const window = lastNDates(ANALYTICS_WINDOW);

  return active.map((habit) => {
    const done = byHabit.get(habit.id) ?? new Set<string>();
    const hit = (days: string[]) => days.filter((d) => done.has(d)).length / days.length;
    return {
      habit,
      rate7: hit(last7),
      rate30: hit(last30),
      currentStreak: currentStreak(done),
      longestStreak: longestStreak(done, window),
      total: totalByHabit.get(habit.id) ?? 0,
    };
  });
}
