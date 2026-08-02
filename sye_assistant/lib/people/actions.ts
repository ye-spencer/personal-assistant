"use server";

import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import {
  contactNotes,
  contacts,
  giftPlans,
  type Contact,
  type ContactNote,
  type GiftPlan,
} from "@/lib/db/schema";
import { daysUntilBirthday } from "@/lib/people/format";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

function revalidateList() {
  revalidatePath("/tools/people");
}

function revalidateContact(id: number) {
  revalidatePath("/tools/people");
  revalidatePath("/tools/people/gifts");
  revalidatePath(`/tools/people/${id}`);
}

// Fields the user can set on a contact. Server actions take this whole shape so
// the detail form can save every field in one round-trip. Birthday is split:
// month+day travel together (both set or both null); year is independently
// optional so a birthday can be known without the year.
export type ContactFields = {
  firstName: string;
  middleName: string;
  lastName: string;
  birthMonth: number | null;
  birthDay: number | null;
  birthYear: number | null;
  howWeMet: string;
  info: string;
  giftPlanning: boolean;
  reachoutable: boolean;
};

function clamp(n: number | null, min: number, max: number): number | null {
  if (n == null || !Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  return i < min ? min : i > max ? max : i;
}

function normalize(fields: ContactFields): ContactFields {
  const month = clamp(fields.birthMonth, 1, 12);
  const day = clamp(fields.birthDay, 1, 31);
  const hasMonthDay = month != null && day != null;
  return {
    firstName: fields.firstName.trim(),
    middleName: fields.middleName.trim(),
    lastName: fields.lastName.trim(),
    birthMonth: hasMonthDay ? month : null,
    birthDay: hasMonthDay ? day : null,
    birthYear: hasMonthDay ? clamp(fields.birthYear, 1, 9999) : null,
    howWeMet: fields.howWeMet.trim(),
    info: fields.info.trim(),
    giftPlanning: fields.giftPlanning,
    reachoutable: fields.reachoutable,
  };
}

export async function listContacts(): Promise<Contact[]> {
  await requireAuth();
  return db
    .select()
    .from(contacts)
    .orderBy(asc(contacts.firstName), asc(contacts.lastName), asc(contacts.id));
}

export async function getContact(id: number): Promise<Contact | null> {
  await requireAuth();
  const [row] = await db.select().from(contacts).where(eq(contacts.id, id));
  return row ?? null;
}

export async function createContact(fields: ContactFields): Promise<Contact> {
  await requireAuth();
  const v = normalize(fields);
  if (!v.firstName && !v.lastName)
    throw new Error("A contact needs at least a first or last name");
  const [row] = await db.insert(contacts).values(v).returning();
  revalidateList();
  return row;
}

export async function updateContact(
  id: number,
  fields: ContactFields,
): Promise<Contact> {
  await requireAuth();
  const v = normalize(fields);
  if (!v.firstName && !v.lastName)
    throw new Error("A contact needs at least a first or last name");
  const [row] = await db
    .update(contacts)
    .set({ ...v, updatedAt: new Date() })
    .where(eq(contacts.id, id))
    .returning();
  if (!row) throw new Error("Contact not found");
  revalidateContact(id);
  return row;
}

export async function deleteContact(id: number): Promise<void> {
  await requireAuth();
  await db.delete(contacts).where(eq(contacts.id, id));
  revalidateList();
}

// --- Notes ---------------------------------------------------------------

export async function listContactNotes(
  contactId: number,
): Promise<ContactNote[]> {
  await requireAuth();
  return db
    .select()
    .from(contactNotes)
    .where(eq(contactNotes.contactId, contactId))
    .orderBy(desc(contactNotes.createdAt));
}

export async function addContactNote(
  contactId: number,
  body: string,
): Promise<ContactNote> {
  await requireAuth();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Note cannot be empty");
  const [row] = await db
    .insert(contactNotes)
    .values({ contactId, body: trimmed })
    .returning();
  revalidateContact(contactId);
  return row;
}

export async function updateContactNote(
  id: number,
  body: string,
): Promise<ContactNote> {
  await requireAuth();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Note cannot be empty");
  const [row] = await db
    .update(contactNotes)
    .set({ body: trimmed, updatedAt: new Date() })
    .where(eq(contactNotes.id, id))
    .returning();
  if (!row) throw new Error("Note not found");
  revalidateContact(row.contactId);
  return row;
}

export async function deleteContactNote(id: number): Promise<void> {
  await requireAuth();
  const [row] = await db
    .delete(contactNotes)
    .where(eq(contactNotes.id, id))
    .returning();
  if (row) revalidateContact(row.contactId);
}

// --- Gift planning -------------------------------------------------------

// Contacts marked for gift planning, each paired with their saved plan (null
// until first save). Powers the "Gift planning" tab. Ordered by soonest
// upcoming birthday; contacts without a birthday fall to the end (keeping their
// name order, since the query is name-sorted and the sort below is stable).
export async function listGiftPlanning(): Promise<
  { contact: Contact; plan: GiftPlan | null }[]
> {
  await requireAuth();
  const rows = await db
    .select()
    .from(contacts)
    .leftJoin(giftPlans, eq(giftPlans.contactId, contacts.id))
    .where(eq(contacts.giftPlanning, true))
    .orderBy(asc(contacts.firstName), asc(contacts.lastName), asc(contacts.id));
  const now = new Date();
  return rows
    .map((r) => ({ contact: r.contacts, plan: r.gift_plans }))
    .sort((a, b) => {
      const da = daysUntilBirthday(a.contact, now);
      const db_ = daysUntilBirthday(b.contact, now);
      if (da == null && db_ == null) return 0;
      if (da == null) return 1;
      if (db_ == null) return -1;
      return da - db_;
    });
}

// Upsert the single gift plan for a contact.
export async function saveGiftPlan(
  contactId: number,
  brainstorm: string,
  purchased: string,
): Promise<void> {
  await requireAuth();
  await db
    .insert(giftPlans)
    .values({ contactId, brainstorm, purchased })
    .onConflictDoUpdate({
      target: giftPlans.contactId,
      set: { brainstorm, purchased, updatedAt: new Date() },
    });
  revalidateContact(contactId);
}
