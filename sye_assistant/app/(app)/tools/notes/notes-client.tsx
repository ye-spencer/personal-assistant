"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { marked } from "marked";
import { FilePlus, Pencil, Save, Trash2, X } from "lucide-react";
import { createNote, deleteNote, updateNote } from "@/lib/notes/actions";
import type { Note } from "@/lib/notes/types";

export function NotesClient({ initialNotes }: { initialNotes: Note[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialNotes[0]?.id ?? null,
  );
  // `creating` = the current edit is a brand-new note not yet persisted. We
  // avoid writing an empty doc until the user actually saves.
  const [creating, setCreating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");

  const notes = initialNotes;
  const selected = notes.find((n) => n.id === selectedId) ?? null;

  // If the selected note disappears (e.g. deleted), drop the selection.
  useEffect(() => {
    if (selectedId && !notes.some((n) => n.id === selectedId)) {
      setSelectedId(null);
      setEditMode(false);
      setCreating(false);
    }
  }, [notes, selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q),
    );
  }, [notes, query]);

  const html = useMemo(
    () => (selected ? (marked.parse(selected.body) as string) : ""),
    [selected],
  );

  function selectNote(id: string) {
    if (editMode) return; // don't lose an in-progress edit on a stray click
    setSelectedId(id);
  }

  function startNew() {
    setCreating(true);
    setEditMode(true);
    setSelectedId(null);
    setDraftTitle("");
    setDraftBody("");
  }

  function startEdit() {
    if (!selected) return;
    setCreating(false);
    setEditMode(true);
    setDraftTitle(selected.title);
    setDraftBody(selected.body);
  }

  function cancelEdit() {
    setEditMode(false);
    setCreating(false);
    setDraftTitle("");
    setDraftBody("");
  }

  function handleSave() {
    const title = draftTitle;
    const body = draftBody;
    startTransition(async () => {
      if (creating) {
        const created = await createNote(title, body);
        setSelectedId(created.id);
      } else if (selectedId) {
        await updateNote(selectedId, title, body);
      }
      setEditMode(false);
      setCreating(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!selectedId) return;
    if (!confirm("Delete this note?")) return;
    const id = selectedId;
    startTransition(async () => {
      await deleteNote(id);
      setSelectedId(null);
      setEditMode(false);
      router.refresh();
    });
  }

  const canSave =
    editMode && !pending && (draftTitle.trim() !== "" || draftBody.trim() !== "");

  return (
    <div className="flex h-full">
      {/* Left: search + scrollable note list */}
      <aside className="w-72 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
          <button
            onClick={startNew}
            disabled={pending}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-sm font-medium disabled:opacity-50"
          >
            <FilePlus className="w-4 h-4" />
            New note
          </button>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />
        </div>

        <ul className="flex-1 overflow-auto p-2 flex flex-col gap-1">
          {filtered.length === 0 ? (
            <li className="px-2 py-3 text-sm text-zinc-500">
              {notes.length === 0 ? "No notes yet." : "No matches."}
            </li>
          ) : (
            filtered.map((note) => (
              <li key={note.id}>
                <button
                  onClick={() => selectNote(note.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    note.id === selectedId
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <span className="block font-medium truncate">
                    {note.title}
                  </span>
                  <span className="block text-[11px] text-zinc-400">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>

      {/* Right: toolbar + rendered note / editor */}
      <section className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 p-3 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={startEdit}
            disabled={editMode || !selected || pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-sm font-medium disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={cancelEdit}
            disabled={!editMode || pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <div className="ml-auto">
            <button
              onClick={handleDelete}
              disabled={!selected || editMode || pending}
              title="Delete note"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {editMode ? (
            <div className="h-full flex flex-col p-6 gap-3">
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Title"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              />
              <textarea
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                placeholder="Write markdown here…"
                className="flex-1 w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              />
            </div>
          ) : selected ? (
            <article className="p-6">
              <h1 className="text-2xl font-semibold mb-4">{selected.title}</h1>
              <div
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </article>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-zinc-400">
              Select a note, or create a new one.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
