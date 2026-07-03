"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  createReminder,
  deleteReminder,
  updateReminder,
} from "@/lib/reminders/actions";
import type { Reminder } from "@/lib/db/schema";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// All date math works on plain "YYYY-MM-DD" strings via Date.UTC of their parts,
// so it never touches the browser's timezone — the server already decided what
// calendar day each reminder is due and what "today" is (in APP_TIME_ZONE).
function parts(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

function daysBetween(from: string, to: string): number {
  const a = parts(from);
  const b = parts(to);
  return Math.round(
    (Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000,
  );
}

function relativeLabel(dueOn: string, today: string): string {
  const n = daysBetween(today, dueOn);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  return `In ${n} days`;
}

function weekdayLabel(key: string): string {
  const { y, m, d } = parts(key);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function RemindersClient({
  initialReminders,
  today,
}: {
  initialReminders: Reminder[];
  today: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [dueOn, setDueOn] = useState(today);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editDue, setEditDue] = useState("");

  const reminders = initialReminders;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !dueOn) return;
    const b = body;
    const d = dueOn;
    setBody("");
    setDueOn(today);
    startTransition(async () => {
      await createReminder(b, d);
      router.refresh();
    });
  }

  function startEdit(r: Reminder) {
    setEditingId(r.id);
    setEditBody(r.body);
    setEditDue(r.dueOn);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditBody("");
    setEditDue("");
  }

  function handleSaveEdit(id: number) {
    if (!editBody.trim() || !editDue) return;
    const b = editBody;
    const d = editDue;
    startTransition(async () => {
      await updateReminder(id, b, d);
      cancelEdit();
      router.refresh();
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this reminder?")) return;
    startTransition(async () => {
      await deleteReminder(id);
      router.refresh();
    });
  }

  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Reminders</h1>
        <p className="text-sm text-zinc-500">
          Jot something down with a date. It shows up in your morning email on
          that day, then clears itself out.
        </p>
      </header>

      <form
        onSubmit={handleCreate}
        className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-start"
      >
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Remind me to…"
          className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
        />
        <input
          type="date"
          value={dueOn}
          min={today}
          onChange={(e) => setDueOn(e.target.value)}
          className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={!body.trim() || !dueOn || pending}
          className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
        Upcoming ({reminders.length})
      </h2>

      <ul className="flex flex-col gap-2">
        {reminders.length === 0 ? (
          <li className="text-sm text-zinc-500">
            Nothing upcoming. Add a reminder above.
          </li>
        ) : (
          reminders.map((r) => {
            const { m, d } = parts(r.dueOn);
            const isToday = r.dueOn === today;
            return (
              <li
                key={r.id}
                className="flex items-stretch gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
              >
                <div
                  className={`flex flex-col items-center justify-center px-3 py-2 w-16 shrink-0 ${
                    isToday
                      ? "bg-amber-500 text-white"
                      : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wide">
                    {MONTHS[m - 1]}
                  </span>
                  <span className="text-lg font-semibold leading-none">{d}</span>
                  <span className="text-[10px] opacity-80">
                    {weekdayLabel(r.dueOn)}
                  </span>
                </div>

                {editingId === r.id ? (
                  <div className="flex-1 p-2">
                    <input
                      type="text"
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <input
                        type="date"
                        value={editDue}
                        min={today}
                        onChange={(e) => setEditDue(e.target.value)}
                        className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(r.id)}
                          disabled={!editBody.trim() || !editDue || pending}
                          className="px-3 py-1 rounded bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center gap-3 py-2 pr-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm break-words">{r.body}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-400">
                        {relativeLabel(r.dueOn, today)}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(r)}
                        title="Edit"
                        className="p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        title="Delete"
                        className="p-1.5 rounded text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
