"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  Check,
  Gift,
  MessageCircle,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import {
  addContactNote,
  deleteContact,
  deleteContactNote,
  updateContact,
  updateContactNote,
  type ContactFields,
} from "@/lib/people/actions";
import { formatBirthday, fullName } from "@/lib/people/format";
import type { Contact, ContactNote } from "@/lib/db/schema";
import { BirthdayInput } from "../birthday-input";

function toFields(c: Contact): ContactFields {
  return {
    firstName: c.firstName,
    middleName: c.middleName,
    lastName: c.lastName,
    birthMonth: c.birthMonth,
    birthDay: c.birthDay,
    birthYear: c.birthYear,
    howWeMet: c.howWeMet,
    info: c.info,
    giftPlanning: c.giftPlanning,
    reachoutable: c.reachoutable,
  };
}

export function ContactDetail({
  contact,
  initialNotes,
}: {
  contact: Contact;
  initialNotes: ContactNote[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ContactFields>(() => toFields(contact));

  const [noteDraft, setNoteDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteEdit, setNoteEdit] = useState("");

  function saveContact() {
    if (!form.firstName.trim() && !form.lastName.trim()) return;
    startTransition(async () => {
      await updateContact(contact.id, form);
      setEditing(false);
      router.refresh();
    });
  }

  function handleDeleteContact() {
    if (!confirm(`Delete ${fullName(contact) || "this contact"}?`)) return;
    startTransition(async () => {
      await deleteContact(contact.id);
      router.push("/tools/people");
    });
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteDraft.trim()) return;
    const body = noteDraft;
    setNoteDraft("");
    startTransition(async () => {
      await addContactNote(contact.id, body);
      router.refresh();
    });
  }

  function handleNoteKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter submits; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNote(e);
    }
  }

  function saveNoteEdit(id: number) {
    if (!noteEdit.trim()) return;
    startTransition(async () => {
      await updateContactNote(id, noteEdit);
      setEditingNoteId(null);
      setNoteEdit("");
      router.refresh();
    });
  }

  function handleDeleteNote(id: number) {
    if (!confirm("Delete this note?")) return;
    startTransition(async () => {
      await deleteContactNote(id);
      router.refresh();
    });
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/tools/people"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        All people
      </Link>

      {/* Profile card */}
      {editing ? (
        <div className="mb-8 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="First name">
              <input
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Middle name">
              <input
                value={form.middleName}
                onChange={(e) =>
                  setForm({ ...form, middleName: e.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Last name">
              <input
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Birthday">
            <BirthdayInput
              value={{
                month: form.birthMonth,
                day: form.birthDay,
                year: form.birthYear,
              }}
              onChange={(b) =>
                setForm({
                  ...form,
                  birthMonth: b.month,
                  birthDay: b.day,
                  birthYear: b.year,
                })
              }
            />
          </Field>
          <Field label="How we met">
            <input
              value={form.howWeMet}
              onChange={(e) => setForm({ ...form, howWeMet: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Other info">
            <textarea
              value={form.info}
              onChange={(e) => setForm({ ...form, info: e.target.value })}
              rows={3}
              className={`${inputClass} resize-y`}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={form.giftPlanning}
              onChange={(e) =>
                setForm({ ...form, giftPlanning: e.target.checked })
              }
            />
            Include in gift planning
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={form.reachoutable}
              onChange={(e) =>
                setForm({ ...form, reachoutable: e.target.checked })
              }
            />
            Reach-outable (nudge me to keep in touch)
          </label>
          <div className="flex justify-between">
            <button
              onClick={handleDeleteContact}
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setForm(toFields(contact));
                  setEditing(false);
                }}
                className="px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={saveContact}
                disabled={
                  pending ||
                  (!form.firstName.trim() && !form.lastName.trim())
                }
                className="px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-sm font-medium disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              {fullName(contact) || "(no name)"}
              {contact.giftPlanning && (
                <Gift
                  className="w-5 h-5 text-zinc-400"
                  aria-label="In gift planning"
                />
              )}
              {contact.reachoutable && (
                <MessageCircle
                  className="w-5 h-5 text-zinc-400"
                  aria-label="Reach-outable"
                />
              )}
            </h1>
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-sm"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          </div>
          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Detail label="Birthday">{formatBirthday(contact) || "—"}</Detail>
            <Detail label="How we met">{contact.howWeMet || "—"}</Detail>
            <div className="sm:col-span-2">
              <Detail label="Other info">
                {contact.info ? (
                  <span className="whitespace-pre-wrap">{contact.info}</span>
                ) : (
                  "—"
                )}
              </Detail>
            </div>
          </dl>
        </div>
      )}

      {/* Notes */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Notes</h2>
        <form onSubmit={handleAddNote} className="mb-4">
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onKeyDown={handleNoteKeyDown}
            placeholder="Add a note… (Enter to save, Shift+Enter for a new line)"
            rows={2}
            className={`${inputClass} resize-y`}
          />
        </form>

        <ul className="flex flex-col gap-3">
          {initialNotes.length === 0 ? (
            <li className="text-sm text-zinc-500">No notes yet.</li>
          ) : (
            initialNotes.map((note) => (
              <li
                key={note.id}
                className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                {editingNoteId === note.id ? (
                  <div>
                    <textarea
                      value={noteEdit}
                      onChange={(e) => setNoteEdit(e.target.value)}
                      rows={3}
                      className={inputClass}
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingNoteId(null);
                          setNoteEdit("");
                        }}
                        className="p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => saveNoteEdit(note.id)}
                        disabled={!noteEdit.trim() || pending}
                        className="p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 items-start">
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                      <p className="mt-1 text-[11px] text-zinc-400">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingNoteId(note.id);
                          setNoteEdit(note.body);
                        }}
                        title="Edit"
                        className="p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
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
      </section>
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
