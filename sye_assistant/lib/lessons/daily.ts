import { asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { lessons, type Lesson } from "@/lib/db/schema";

// YYYY-MM-DD in UTC. The dashboard server component and the cron route both
// compute this independently and must agree, so anchor to UTC rather than any
// machine's local TZ.
export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

// FNV-1a 32-bit. Stable across processes / Node versions, unlike Math.random
// or anything seeded by the runtime.
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const DAILY_LESSON_COUNT = 3;

// Deterministic per-day selection. Same date → same lessons, on the dashboard
// and in the morning email. Each lesson is ranked by hashing the date with its
// id, so the day's picks are distinct and stable regardless of insertion
// order. Switching algorithms (spaced repetition, etc.) is a localized change
// to this function.
export async function getLessonsOfTheDay(
  dateKey: string = todayKey(),
  count: number = DAILY_LESSON_COUNT,
): Promise<Lesson[]> {
  const rows = await db.select().from(lessons).orderBy(asc(lessons.id));
  return rows
    .map((row) => ({ row, rank: hash(`${dateKey}:${row.id}`) }))
    .sort((a, b) => a.rank - b.rank || a.row.id - b.row.id)
    .slice(0, count)
    .map((entry) => entry.row);
}
