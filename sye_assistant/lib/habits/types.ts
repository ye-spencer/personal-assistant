import type { Habit } from "@/lib/db/schema";

// Kept out of actions.ts because a "use server" module may only export async
// functions at runtime; types live here so client components can import them.
export type HabitAnalytics = {
  habit: Habit;
  rate7: number; // 0..1
  rate30: number; // 0..1
  currentStreak: number;
  longestStreak: number;
  total: number;
};
