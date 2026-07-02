"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Cake, Check } from "lucide-react";
import { saveGiftPlan } from "@/lib/people/actions";
import { formatBirthdayShort, fullName } from "@/lib/people/format";
import type { Contact, GiftPlan } from "@/lib/db/schema";
import { PeopleTabs } from "../people-tabs";

type Entry = { contact: Contact; plan: GiftPlan | null };

export function GiftPlanningClient({ entries }: { entries: Entry[] }) {
  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">People</h1>
        <p className="text-sm text-zinc-500">
          Gift ideas for everyone marked &ldquo;Include in gift planning.&rdquo;
        </p>
      </header>

      <PeopleTabs />

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No one is marked for gift planning yet. Open a contact, hit Edit, and
          check &ldquo;Include in gift planning.&rdquo;
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {entries.map((entry) => (
            <GiftPlanCard key={entry.contact.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function GiftPlanCard({ entry }: { entry: Entry }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { contact, plan } = entry;

  const [brainstorm, setBrainstorm] = useState(plan?.brainstorm ?? "");
  const [purchased, setPurchased] = useState(plan?.purchased ?? "");

  const dirty =
    brainstorm !== (plan?.brainstorm ?? "") ||
    purchased !== (plan?.purchased ?? "");

  function save() {
    startTransition(async () => {
      await saveGiftPlan(contact.id, brainstorm, purchased);
      router.refresh();
    });
  }

  const birthday = formatBirthdayShort(contact);

  return (
    <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/tools/people/${contact.id}`}
          className="text-sm font-medium hover:underline"
        >
          {fullName(contact) || "(no name)"}
        </Link>
        {birthday && (
          <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
            <Cake className="w-3.5 h-3.5" />
            {birthday}
          </span>
        )}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">Gift ideas / brainstorm</span>
        <textarea
          value={brainstorm}
          onChange={(e) => setBrainstorm(e.target.value)}
          rows={3}
          placeholder="Things they might like…"
          className={`${inputClass} resize-y`}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">Gifts given</span>
        <textarea
          value={purchased}
          onChange={(e) => setPurchased(e.target.value)}
          rows={3}
          placeholder="What you ended up getting them…"
          className={`${inputClass} resize-y`}
        />
      </label>

      <div className="flex items-center justify-end gap-3">
        {!dirty && plan && (
          <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
            <Check className="w-3.5 h-3.5" />
            Saved
          </span>
        )}
        <button
          onClick={save}
          disabled={!dirty || pending}
          className="px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-sm font-medium disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600";
