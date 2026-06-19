import { asc, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { contacts, type Contact } from "@/lib/db/schema";
import { daysUntilBirthday } from "./format";

export type UpcomingBirthday = { contact: Contact; inDays: number };

// Birthdays within the next NEAR_DAYS (inclusive of today) are shown for
// everyone. The window is >1 day so a timezone skew at the UTC day boundary
// can't make us miss someone's birthday.
const NEAR_DAYS = 2;

export type BirthdayDigest = {
  // Everyone with a birthday in the next NEAR_DAYS, regardless of gift flag.
  soon: UpcomingBirthday[];
  // Gift-planning contacts with a birthday later in the next `months` (after the
  // `soon` window, which already covers them). Soonest first.
  giftingUpcoming: UpcomingBirthday[];
};

// Birthdays for the morning email: the next couple days for everyone, plus the
// next N months of birthdays for people the user is gifting.
export async function getBirthdayDigest(
  now: Date = new Date(),
  months = 2,
): Promise<BirthdayDigest> {
  const rows = await db
    .select()
    .from(contacts)
    .where(isNotNull(contacts.birthMonth))
    .orderBy(asc(contacts.firstName), asc(contacts.lastName), asc(contacts.id));

  const withDays = rows
    .map((c) => ({ contact: c, inDays: daysUntilBirthday(c, now) }))
    .filter((x): x is UpcomingBirthday => x.inDays != null);

  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const cutoffUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() + months,
    now.getUTCDate(),
  );
  const windowDays = Math.round((cutoffUTC - todayUTC) / 86_400_000);

  return {
    soon: withDays
      .filter((x) => x.inDays <= NEAR_DAYS)
      .sort((a, b) => a.inDays - b.inDays),
    giftingUpcoming: withDays
      .filter(
        (x) =>
          x.contact.giftPlanning &&
          x.inDays > NEAR_DAYS &&
          x.inDays <= windowDays,
      )
      .sort((a, b) => a.inDays - b.inDays),
  };
}
