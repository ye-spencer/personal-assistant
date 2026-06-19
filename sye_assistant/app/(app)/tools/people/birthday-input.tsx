"use client";

import { MONTH_NAMES } from "@/lib/people/format";

export type BirthdayValue = {
  month: number | null;
  day: number | null;
  year: number | null;
};

const fieldClass =
  "px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600";

function num(value: string): number | null {
  if (value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Month + day (a pair) with an independently optional year. Leave it all blank
// for no birthday; fill month + day and skip year for a year-unknown birthday.
export function BirthdayInput({
  value,
  onChange,
}: {
  value: BirthdayValue;
  onChange: (next: BirthdayValue) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={value.month ?? ""}
        onChange={(e) => onChange({ ...value, month: num(e.target.value) })}
        className={fieldClass}
      >
        <option value="">Month</option>
        {MONTH_NAMES.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={1}
        max={31}
        placeholder="Day"
        value={value.day ?? ""}
        onChange={(e) => onChange({ ...value, day: num(e.target.value) })}
        className={`${fieldClass} w-20`}
      />
      <input
        type="number"
        placeholder="Year (optional)"
        value={value.year ?? ""}
        onChange={(e) => onChange({ ...value, year: num(e.target.value) })}
        className={`${fieldClass} w-36`}
      />
    </div>
  );
}
