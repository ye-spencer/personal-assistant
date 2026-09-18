"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Repeat, Trash2 } from "lucide-react";
import {
  createRecurringReminder,
  createReminder,
  deleteRecurringReminder,
  deleteReminder,
  updateRecurringReminder,
  updateReminder,
} from "@/lib/reminders/actions";
import type { RecurringReminder, Reminder } from "@/lib/db/schema";

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

function addDays(key: string, n: number): string {
  const { y, m, d } = parts(key);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  const yy = t.getUTCFullYear();
  const mm = String(t.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(t.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// First day on or after `day` that a reminder anchored at `startOn` and
// repeating every `intervalDays` days fires. Mirrors lib/reminders/dates.
function nextOccurrenceOnOrAfter(
  startOn: string,
  intervalDays: number,
  day: string,
): string {
  const delta = daysBetween(startOn, day);
  if (delta <= 0) return startOn;
  const steps = Math.ceil(delta / intervalDays);
  return addDays(startOn, steps * intervalDays);
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

function intervalLabel(intervalDays: number): string {
  if (intervalDays === 1) return "Every day";
  if (intervalDays === 7) return "Every week";
  return `Every ${intervalDays} days`;
}

// A single row in the unified "Upcoming" list: either a one-off reminder or the
// next occurrence of a recurring reminder. Sorted together by date.
type UpcomingItem =
  | { kind: "once"; dueOn: string; reminder: Reminder }
  | { kind: "recurring"; dueOn: string; recurring: RecurringReminder };

export function RemindersClient({
  initialReminders,
  initialRecurring,
  today,
}: {
  initialReminders: Reminder[];
  initialRecurring: RecurringReminder[];
  today: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // One-off create + edit
  const [body, setBody] = useState("");
  const [dueOn, setDueOn] = useState(today);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editDue, setEditDue] = useState("");

  // Recurring create + edit
  const [recBody, setRecBody] = useState("");
  const [recStart, setRecStart] = useState(today);
  const [recInterval, setRecInterval] = useState("7");
  const [editingRecId, setEditingRecId] = useState<number | null>(null);
  const [editRecBody, setEditRecBody] = useState("");
  const [editRecStart, setEditRecStart] = useState("");
  const [editRecInterval, setEditRecInterval] = useState("");

  const reminders = initialReminders;
  const recurring = initialRecurring;

  // Merge one-off reminders with each recurring reminder's next occurrence,
  // sorted by date (one-offs win ties so an edit target stays put).
  const upcoming: UpcomingItem[] = [
    ...reminders.map(
      (r): UpcomingItem => ({ kind: "once", dueOn: r.dueOn, reminder: r }),
    ),
    ...recurring.map(
      (r): UpcomingItem => ({
        kind: "recurring",
        dueOn: nextOccurrenceOnOrAfter(r.startOn, r.intervalDays, today),
        recurring: r,
      }),
    ),
  ].sort((a, b) => {
    if (a.dueOn !== b.dueOn) return a.dueOn < b.dueOn ? -1 : 1;
    if (a.kind !== b.kind) return a.kind === "once" ? -1 : 1;
    return 0;
  });

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

  function handleCreateRecurring(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(recInterval);
    if (!recBody.trim() || !recStart || !Number.isInteger(n) || n < 1) return;
    const b = recBody;
    const s = recStart;
    setRecBody("");
    setRecStart(today);
    setRecInterval("7");
    startTransition(async () => {
      await createRecurringReminder(b, s, n);
      router.refresh();
    });
  }

  function startEditRecurring(r: RecurringReminder) {
    setEditingRecId(r.id);
    setEditRecBody(r.body);
    setEditRecStart(r.startOn);
    setEditRecInterval(String(r.intervalDays));
  }

  function cancelEditRecurring() {
    setEditingRecId(null);
    setEditRecBody("");
    setEditRecStart("");
    setEditRecInterval("");
  }

  function handleSaveRecurring(id: number) {
    const n = Number(editRecInterval);
    if (!editRecBody.trim() || !editRecStart || !Number.isInteger(n) || n < 1)
      return;
    const b = editRecBody;
    const s = editRecStart;
    startTransition(async () => {
      await updateRecurringReminder(id, b, s, n);
      cancelEditRecurring();
      router.refresh();
    });
  }

  function handleDeleteRecurring(id: number) {
    if (!confirm("Delete this recurring reminder?")) return;
    startTransition(async () => {
      await deleteRecurringReminder(id);
      router.refresh();
    });
  }

  const inputClass =
    "px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500";

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
          className={`flex-1 ${inputClass}`}
        />
        <input
          type="date"
          value={dueOn}
          min={today}
          onChange={(e) => setDueOn(e.target.value)}
          className={inputClass}
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
        Upcoming ({upcoming.length})
      </h2>

      <ul className="flex flex-col gap-2">
        {upcoming.length === 0 ? (
          <li className="text-sm text-zinc-500">
            Nothing upcoming. Add a reminder above.
          </li>
        ) : (
          upcoming.map((item) => {
            const { m, d } = parts(item.dueOn);
            const isToday = item.dueOn === today;
            const dateChip = (
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
                  {weekdayLabel(item.dueOn)}
                </span>
              </div>
            );

            // Recurring next-occurrence: read-only here (edit it in the
            // Recurring section below), marked with a repeat icon.
            if (item.kind === "recurring") {
              const r = item.recurring;
              return (
                <li
                  key={`rec-${r.id}`}
                  className="flex items-stretch gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                >
                  {dateChip}
                  <div className="flex flex-1 items-center gap-3 py-2 pr-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm break-words flex items-center gap-1.5">
                        <Repeat className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                        <span>{r.body}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-zinc-400">
                        {relativeLabel(item.dueOn, today)} ·{" "}
                        {intervalLabel(r.intervalDays).toLowerCase()}
                      </p>
                    </div>
                  </div>
                </li>
              );
            }

            const r = item.reminder;
            return (
              <li
                key={`r-${r.id}`}
                className="flex items-stretch gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
              >
                {dateChip}

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

      {/* ── Recurring reminders ─────────────────────────────────────────── */}
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-1">
          <Repeat className="w-4 h-4 text-zinc-500" />
          <h2 className="text-lg font-semibold">Recurring</h2>
        </div>
        <p className="text-sm text-zinc-500 mb-4">
          Repeats every N days starting on a date, showing up in your email each
          time it comes around. Its next occurrence also appears in Upcoming
          above.
        </p>

        <form
          onSubmit={handleCreateRecurring}
          className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start"
        >
          <input
            type="text"
            value={recBody}
            onChange={(e) => setRecBody(e.target.value)}
            placeholder="Remind me to…"
            className={`flex-1 ${inputClass}`}
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <label className="text-sm text-zinc-500">every</label>
            <input
              type="number"
              min={1}
              value={recInterval}
              onChange={(e) => setRecInterval(e.target.value)}
              className={`w-16 ${inputClass}`}
            />
            <label className="text-sm text-zinc-500">days, from</label>
          </div>
          <input
            type="date"
            value={recStart}
            onChange={(e) => setRecStart(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={
              !recBody.trim() ||
              !recStart ||
              !(Number(recInterval) >= 1) ||
              pending
            }
            className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            Add
          </button>
        </form>

        <ul className="flex flex-col gap-2">
          {recurring.length === 0 ? (
            <li className="text-sm text-zinc-500">
              No recurring reminders yet.
            </li>
          ) : (
            recurring.map((r) => {
              const next = nextOccurrenceOnOrAfter(
                r.startOn,
                r.intervalDays,
                today,
              );
              return (
                <li
                  key={r.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3"
                >
                  {editingRecId === r.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={editRecBody}
                        onChange={(e) => setEditRecBody(e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-zinc-500">every</span>
                        <input
                          type="number"
                          min={1}
                          value={editRecInterval}
                          onChange={(e) => setEditRecInterval(e.target.value)}
                          className="w-16 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500 text-sm"
                        />
                        <span className="text-sm text-zinc-500">days, from</span>
                        <input
                          type="date"
                          value={editRecStart}
                          onChange={(e) => setEditRecStart(e.target.value)}
                          className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500 text-sm"
                        />
                        <div className="flex gap-2 ml-auto">
                          <button
                            onClick={cancelEditRecurring}
                            className="px-3 py-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveRecurring(r.id)}
                            disabled={
                              !editRecBody.trim() ||
                              !editRecStart ||
                              !(Number(editRecInterval) >= 1) ||
                              pending
                            }
                            className="px-3 py-1 rounded bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm break-words">{r.body}</p>
                        <p className="mt-0.5 text-[11px] text-zinc-400">
                          {intervalLabel(r.intervalDays)} · next{" "}
                          {MONTHS[parts(next).m - 1]} {parts(next).d} (
                          {relativeLabel(next, today).toLowerCase()})
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => startEditRecurring(r)}
                          title="Edit"
                          className="p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecurring(r.id)}
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
    </div>
  );
}
