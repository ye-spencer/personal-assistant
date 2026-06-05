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

// Deterministic per-day selection. Same date → same lesson, on the dashboard
// and in the morning email. Switching algorithms (spaced repetition, etc.) is
// a localized change to this function.
export async function getLessonOfTheDay(
  dateKey: string = todayKey(),
): Promise<Lesson | null> {
  const rows = await db.select().from(lessons).orderBy(asc(lessons.id));
  if (rows.length === 0) return null;
  return rows[hash(dateKey) % rows.length];
}
