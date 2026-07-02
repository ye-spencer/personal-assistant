"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Cake, ChevronRight, Gift, Plus, Search } from "lucide-react";
import { createContact } from "@/lib/people/actions";
import { formatBirthdayShort, fullName, matchesQuery } from "@/lib/people/format";
import type { Contact } from "@/lib/db/schema";
import { BirthdayInput } from "./birthday-input";
import { PeopleTabs } from "./people-tabs";

const EMPTY_DRAFT = {
  firstName: "",
  middleName: "",
  lastName: "",
  birthMonth: null as number | null,
  birthDay: null as number | null,
  birthYear: null as number | null,
  howWeMet: "",
  info: "",
  giftPlanning: false,
};

export function PeopleClient({
  initialContacts,
}: {
  initialContacts: Contact[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const filtered = useMemo(
    () => initialContacts.filter((c) => matchesQuery(c, query)),
    [initialContacts, query],
  );

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.firstName.trim() && !draft.lastName.trim()) return;
    startTransition(async () => {
      const created = await createContact(draft);
      setDraft(EMPTY_DRAFT);
      setShowAdd(false);
      router.push(`/tools/people/${created.id}`);
    });
  }

  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">People</h1>
          <p className="text-sm text-zinc-500">
            {initialContacts.length}{" "}
            {initialContacts.length === 1 ? "contact" : "contacts"}. Search by
            first, last, or full name.
          </p>
        </div>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add person
        </button>
      </header>

      <PeopleTabs />

      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="First name">
              <input
                autoFocus
                value={draft.firstName}
                onChange={(e) =>
                  setDraft({ ...draft, firstName: e.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Middle name">
              <input
                value={draft.middleName}
                onChange={(e) =>
                  setDraft({ ...draft, middleName: e.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Last name">
              <input
                value={draft.lastName}
                onChange={(e) =>
                  setDraft({ ...draft, lastName: e.target.value })
                }
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Birthday">
            <BirthdayInput
              value={{
                month: draft.birthMonth,
                day: draft.birthDay,
                year: draft.birthYear,
              }}
              onChange={(b) =>
                setDraft({
                  ...draft,
                  birthMonth: b.month,
                  birthDay: b.day,
                  birthYear: b.year,
                })
              }
            />
          </Field>
          <Field label="How we met">
            <input
              value={draft.howWeMet}
              onChange={(e) => setDraft({ ...draft, howWeMet: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Other info">
            <textarea
              value={draft.info}
              onChange={(e) => setDraft({ ...draft, info: e.target.value })}
              rows={2}
              className={`${inputClass} resize-y`}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={draft.giftPlanning}
              onChange={(e) =>
                setDraft({ ...draft, giftPlanning: e.target.checked })
              }
            />
            Include in gift planning
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                pending ||
                (!draft.firstName.trim() && !draft.lastName.trim())
              }
              className="px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-sm font-medium disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people…"
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
        />
      </div>

      <ul className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <li className="text-sm text-zinc-500">
            {initialContacts.length === 0
              ? "No people yet. Add your first contact."
              : "No matches."}
          </li>
        ) : (
          filtered.map((c) => (
            <li key={c.id}>
              <Link
                href={`/tools/people/${c.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <span className="flex-1 text-sm font-medium">
                  {fullName(c) || "(no name)"}
                </span>
                {c.giftPlanning && (
                  <Gift
                    className="w-4 h-4 text-zinc-400"
                    aria-label="In gift planning"
                  />
                )}
                {formatBirthdayShort(c) && (
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                    <Cake className="w-3.5 h-3.5" />
                    {formatBirthdayShort(c)}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
              </Link>
            </li>
          ))
        )}
      </ul>
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
