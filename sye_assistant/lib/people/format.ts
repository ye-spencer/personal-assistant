import type { Contact } from "@/lib/db/schema";

export function fullName(c: {
  firstName: string;
  middleName: string;
  lastName: string;
}): string {
  return [c.firstName, c.middleName, c.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}

// Case-insensitive substring match. A contact matches if the query appears in
// the first name, the last name, or the full "first middle last" string — so
// "bob" matches "Bob", "Smith" matches "Bob Smith", and "bob s" matches the
// full name. Empty query matches everything.
export function matchesQuery(c: Contact, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystacks = [c.firstName, c.lastName, fullName(c)].map((s) =>
    s.toLowerCase(),
  );
  return haystacks.some((h) => h.includes(q));
}

type Birthday = {
  birthMonth: number | null;
  birthDay: number | null;
  birthYear: number | null;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MONTH_NAMES = MONTHS;

export function hasBirthday(c: Birthday): boolean {
  return c.birthMonth != null && c.birthDay != null;
}

// "March 14, 1990" with year, "March 14" without. Empty string if no birthday.
export function formatBirthday(c: Birthday): string {
  if (!hasBirthday(c)) return "";
  const month = MONTHS[(c.birthMonth as number) - 1] ?? "";
  const md = `${month} ${c.birthDay}`.trim();
  return c.birthYear ? `${md}, ${c.birthYear}` : md;
}

// "Mar 14" — compact form for list rows. Empty string if no birthday.
export function formatBirthdayShort(c: Birthday): string {
  if (!hasBirthday(c)) return "";
  const month = MONTHS[(c.birthMonth as number) - 1]?.slice(0, 3) ?? "";
  return `${month} ${c.birthDay}`.trim();
}

// Whole days until the next occurrence of this month/day (0 = today, 1 =
// tomorrow), ignoring the birth year. null if no birthday. Anchored to UTC to
// match todayKey() and the rest of the app's date math.
export function daysUntilBirthday(
  c: Birthday,
  from: Date = new Date(),
): number | null {
  if (!hasBirthday(c)) return null;
  const month = (c.birthMonth as number) - 1;
  const day = c.birthDay as number;
  const today = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  let next = Date.UTC(from.getUTCFullYear(), month, day);
  if (next < today) next = Date.UTC(from.getUTCFullYear() + 1, month, day);
  return Math.round((next - today) / 86_400_000);
}
