"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleEntry } from "@/lib/habits/actions";
import { dateKey, lastNDates } from "@/lib/habits/dates";
import { TIERS, tierMeta } from "@/lib/habits/tiers";
import type { Habit } from "@/lib/db/schema";

// How many days of entries the page fetches up front. "Show older" steps up to
// this without a refetch.
export const FETCH_DAYS = 60;
const STEPS = [14, 28, FETCH_DAYS];

function cellKey(habitId: number, day: string) {
  return `${habitId}:${day}`;
}

function formatDay(key: string) {
  const d = new Date(`${key}T00:00:00Z`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function HabitsGrid({
  habits,
  initialEntryKeys,
}: {
  habits: Habit[];
  initialEntryKeys: string[];
}) {
  const [entries, setEntries] = useState(() => new Set(initialEntryKeys));
  const [visible, setVisible] = useState(14);
  const [, startTransition] = useTransition();

  const today = dateKey();
  const days = lastNDates(visible);
  const groups = TIERS.map((tier) => ({
    tier,
    items: habits.filter((h) => h.tier === tier),
  })).filter((g) => g.items.length > 0);

  function toggle(habitId: number, day: string) {
    const key = cellKey(habitId, day);
    const willBeDone = !entries.has(key);
    setEntries((prev) => {
      const next = new Set(prev);
      if (willBeDone) next.add(key);
      else next.delete(key);
      return next;
    });
    startTransition(async () => {
      try {
        await toggleEntry(habitId, day, willBeDone);
      } catch {
        // revert on failure
        setEntries((prev) => {
          const next = new Set(prev);
          if (willBeDone) next.delete(key);
          else next.add(key);
          return next;
        });
      }
    });
  }

  const nextStep = STEPS.find((s) => s > visible);

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="sticky left-0 z-10 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-left font-medium text-zinc-500 border-b border-r border-zinc-200 dark:border-zinc-800"
              >
                Day
              </th>
              {groups.map((g) => (
                <th
                  key={g.tier}
                  colSpan={g.items.length}
                  className={`px-2 py-1.5 text-center text-xs font-semibold uppercase tracking-wide border-b border-l border-zinc-200 dark:border-zinc-800 ${tierMeta(g.tier).header}`}
                >
                  {tierMeta(g.tier).label}
                </th>
              ))}
            </tr>
            <tr>
              {groups.flatMap((g) =>
                g.items.map((habit, hi) => (
                  <th
                    key={habit.id}
                    className={`px-2 py-2 align-bottom font-medium text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800 ${hi === 0 ? "border-l" : ""}`}
                    title={habit.description ? `${habit.name} — ${habit.description}` : habit.name}
                  >
                    <span className="block max-w-[6rem] truncate">{habit.name}</span>
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const isToday = day === today;
              return (
                <tr
                  key={day}
                  className={isToday ? "bg-zinc-50 dark:bg-zinc-900/50" : undefined}
                >
                  <td
                    className={`sticky left-0 z-10 whitespace-nowrap px-3 py-1.5 text-zinc-600 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 ${isToday ? "bg-zinc-100 dark:bg-zinc-900 font-medium text-zinc-900 dark:text-zinc-100" : "bg-white dark:bg-zinc-950"}`}
                  >
                    {formatDay(day)}
                  </td>
                  {groups.flatMap((g) =>
                    g.items.map((habit, hi) => {
                      const checked = entries.has(cellKey(habit.id, day));
                      return (
                        <td
                          key={habit.id}
                          className={`text-center px-2 py-1 ${hi === 0 ? "border-l border-zinc-200 dark:border-zinc-800" : ""}`}
                        >
                          <button
                            type="button"
                            onClick={() => toggle(habit.id, day)}
                            aria-pressed={checked}
                            aria-label={`${habit.name} on ${formatDay(day)}`}
                            className={`inline-flex items-center justify-center w-6 h-6 rounded border transition-colors ${
                              checked
                                ? tierMeta(g.tier).checked
                                : "border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                          >
                            {checked ? <Check className="w-4 h-4" /> : null}
                          </button>
                        </td>
                      );
                    }),
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {nextStep ? (
        <div className="mt-4">
          <button
            onClick={() => setVisible(nextStep)}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-sm"
          >
            Show older ({nextStep} days)
          </button>
        </div>
      ) : null}
    </div>
  );
}
