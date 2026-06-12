"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  archiveHabit,
  createHabit,
  deleteHabit,
  moveHabit,
  setHabitTier,
  unarchiveHabit,
  updateHabit,
} from "@/lib/habits/actions";
import type { HabitAnalytics } from "@/lib/habits/types";
import { TIERS, tierMeta } from "@/lib/habits/tiers";
import type { Habit } from "@/lib/db/schema";

export function AdminClient({
  habits,
  analytics,
}: {
  habits: Habit[];
  analytics: HabitAnalytics[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [newTier, setNewTier] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const active = habits.filter((h) => !h.archivedAt);
  const archived = habits.filter((h) => h.archivedAt);

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const n = name;
    const d = description;
    const t = newTier;
    setName("");
    setDescription("");
    run(() => createHabit(n, t, d));
  }

  function startEdit(habit: Habit) {
    setEditingId(habit.id);
    setEditName(habit.name);
    setEditDescription(habit.description);
  }

  function saveEdit(id: number) {
    if (!editName.trim()) return;
    const n = editName;
    const d = editDescription;
    run(() => updateHabit(id, n, d));
    setEditingId(null);
  }

  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-6">
        <Link
          href="/tools/habits"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to grid
        </Link>
        <h1 className="text-2xl font-semibold">Edit habits</h1>
        <p className="text-sm text-zinc-500">
          Add, rename, reorder, and archive habits, and see at-a-glance stats.
        </p>
      </header>

      <form onSubmit={handleCreate} className="mb-8 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New habit name"
            className="flex-1 min-w-48 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />
          <select
            value={newTier}
            onChange={(e) => setNewTier(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {tierMeta(t).label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!name.trim() || pending}
            className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-sm font-medium disabled:opacity-50"
          >
            Add habit
          </button>
        </div>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 text-sm"
        />
      </form>

      <section className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
          Habits
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-zinc-500">No active habits yet.</p>
        ) : (
          TIERS.map((tier) => {
            const items = active.filter((h) => h.tier === tier);
            if (items.length === 0) return null;
            return (
              <div key={tier} className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${tierMeta(tier).dot}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${tierMeta(tier).header}`}>
                    {tierMeta(tier).label}
                  </span>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {items.map((habit, idx) =>
                    editingId === habit.id ? (
                      <li
                        key={habit.id}
                        className="flex flex-col gap-2 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800"
                      >
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(habit.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                          placeholder="Habit name"
                          className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                        />
                        <input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(habit.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          placeholder="Description (optional)"
                          className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEdit(habit.id)}
                            disabled={!editName.trim() || pending}
                            className="px-2 py-1 rounded bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-xs font-medium disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </li>
                    ) : (
                      <li
                        key={habit.id}
                        className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800"
                      >
                        <div className="flex flex-col">
                          <button
                            onClick={() => run(() => moveHabit(habit.id, "up"))}
                            disabled={idx === 0 || pending}
                            title="Move up"
                            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => run(() => moveHabit(habit.id, "down"))}
                            disabled={idx === items.length - 1 || pending}
                            title="Move down"
                            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="block text-sm truncate">{habit.name}</span>
                          {habit.description ? (
                            <span className="block text-xs text-zinc-500 truncate">
                              {habit.description}
                            </span>
                          ) : null}
                        </div>

                        <select
                          value={habit.tier}
                          onChange={(e) =>
                            run(() => setHabitTier(habit.id, Number(e.target.value)))
                          }
                          title="Tier"
                          className="px-1.5 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                        >
                          {TIERS.map((t) => (
                            <option key={t} value={t}>
                              {tierMeta(t).label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => startEdit(habit)}
                          title="Edit"
                          className="p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => run(() => archiveHabit(habit.id))}
                          title="Archive"
                          className="p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            );
          })
        )}
      </section>

      {archived.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
            Archived
          </h2>
          <ul className="flex flex-col gap-1.5">
            {archived.map((habit) => (
              <li
                key={habit.id}
                className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <span className="flex-1 text-sm text-zinc-500">
                  {habit.name}{" "}
                  <span className="text-xs">({tierMeta(habit.tier).label})</span>
                </span>
                <button
                  onClick={() => run(() => unarchiveHabit(habit.id))}
                  title="Restore"
                  className="p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <ArchiveRestore className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Permanently delete "${habit.name}" and all its history?`,
                      )
                    )
                      run(() => deleteHabit(habit.id));
                  }}
                  title="Delete permanently"
                  className="p-1.5 rounded text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
          Analytics
        </h2>
        {analytics.length === 0 ? (
          <p className="text-sm text-zinc-500">No active habits to analyze.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2 font-medium">Habit</th>
                  <th className="px-3 py-2 font-medium text-right">7d</th>
                  <th className="px-3 py-2 font-medium text-right">30d</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((a) => (
                  <tr
                    key={a.habit.id}
                    className="border-t border-zinc-200 dark:border-zinc-800"
                  >
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${tierMeta(a.habit.tier).dot}`}
                        />
                        {a.habit.name}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {Math.round(a.rate7 * 100)}%
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {Math.round(a.rate30 * 100)}%
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{a.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
