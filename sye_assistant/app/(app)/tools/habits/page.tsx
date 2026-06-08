import Link from "next/link";
import { Settings } from "lucide-react";
import { getEntryKeys, listActiveHabits } from "@/lib/habits/actions";
import { lastNDates } from "@/lib/habits/dates";
import { HabitsGrid, FETCH_DAYS } from "./habits-grid";

export default async function HabitsPage() {
  const habits = await listActiveHabits();
  const since = lastNDates(FETCH_DAYS).at(-1)!;
  const entryKeys = habits.length > 0 ? await getEntryKeys(since) : [];

  return (
    <div className="p-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Habits</h1>
          <p className="text-sm text-zinc-500">
            Check off a habit for the day. Today is on top; any day in view is
            editable.
          </p>
        </div>
        <Link
          href="/tools/habits/admin"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-sm"
        >
          <Settings className="w-4 h-4" />
          Edit habits
        </Link>
      </header>

      {habits.length === 0 ? (
        <div className="p-6 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500">
          No habits yet —{" "}
          <Link href="/tools/habits/admin" className="underline">
            add your first one
          </Link>
          .
        </div>
      ) : (
        <HabitsGrid habits={habits} initialEntryKeys={entryKeys} />
      )}
    </div>
  );
}
