"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Shuffle, Trash2 } from "lucide-react";
import {
  createLesson,
  deleteLesson,
  updateLesson,
} from "@/lib/lessons/actions";
import type { Lesson } from "@/lib/db/schema";

type View = "all" | "shuffle";

export function LessonsClient({ initialLessons }: { initialLessons: Lesson[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<View>("all");
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [shuffleIndex, setShuffleIndex] = useState(() =>
    initialLessons.length > 0
      ? Math.floor(Math.random() * initialLessons.length)
      : 0,
  );

  const lessons = initialLessons;
  const sortedNewestFirst = [...lessons].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const body = draft;
    setDraft("");
    startTransition(async () => {
      await createLesson(body);
      router.refresh();
    });
  }

  function startEdit(lesson: Lesson) {
    setEditingId(lesson.id);
    setEditDraft(lesson.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  function handleSaveEdit(id: number) {
    if (!editDraft.trim()) return;
    const body = editDraft;
    startTransition(async () => {
      await updateLesson(id, body);
      setEditingId(null);
      setEditDraft("");
      router.refresh();
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this lesson?")) return;
    startTransition(async () => {
      await deleteLesson(id);
      router.refresh();
    });
  }

  function nextShuffle() {
    if (lessons.length <= 1) return;
    let next = shuffleIndex;
    while (next === shuffleIndex) {
      next = Math.floor(Math.random() * lessons.length);
    }
    setShuffleIndex(next);
  }

  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Lessons</h1>
        <p className="text-sm text-zinc-500">
          Capture ideas you&apos;ve learned. One gets resurfaced each day on
          the dashboard and in the morning email.
        </p>
      </header>

      <form onSubmit={handleCreate} className="mb-6">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What did you learn?"
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 resize-y"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={!draft.trim() || pending}
            className="px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-sm font-medium disabled:opacity-50"
          >
            Add lesson
          </button>
        </div>
      </form>

      <div className="mb-4 flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {(["all", "shuffle"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px ${
              view === v
                ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            {v === "all" ? `All (${lessons.length})` : "Shuffle"}
          </button>
        ))}
      </div>

      {view === "all" ? (
        <ul className="flex flex-col gap-3">
          {sortedNewestFirst.length === 0 ? (
            <li className="text-sm text-zinc-500">No lessons yet.</li>
          ) : (
            sortedNewestFirst.map((lesson) => (
              <li
                key={lesson.id}
                className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                {editingId === lesson.id ? (
                  <div>
                    <textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      rows={3}
                      className="w-full px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(lesson.id)}
                        disabled={!editDraft.trim() || pending}
                        className="px-3 py-1 rounded bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-sm font-medium disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 items-start">
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap text-sm">{lesson.body}</p>
                      <p className="mt-1 text-[11px] text-zinc-400">
                        {new Date(lesson.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(lesson)}
                        title="Edit"
                        className="p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(lesson.id)}
                        title="Delete"
                        className="p-1.5 rounded text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      ) : (
        <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 min-h-32 flex flex-col">
          {lessons.length === 0 ? (
            <p className="text-sm text-zinc-500">No lessons to shuffle yet.</p>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-sm flex-1">
                {lessons[shuffleIndex]?.body}
              </p>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-[11px] text-zinc-400">
                  {lessons[shuffleIndex] &&
                    new Date(lessons[shuffleIndex].createdAt).toLocaleDateString()}
                </p>
                <button
                  onClick={nextShuffle}
                  disabled={lessons.length <= 1}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-sm disabled:opacity-50"
                >
                  <Shuffle className="w-4 h-4" />
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
