"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { notesCollection } from "@/lib/mongo/client";
import type { Note, NoteDoc } from "./types";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

function serialize(doc: NoteDoc): Note {
  return {
    id: doc._id.toString(),
    title: doc.title,
    body: doc.body,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// Untitled is allowed so a brand-new note can be created before the user names
// it; a placeholder keeps the list readable.
function normalizeTitle(title: string): string {
  return title.trim() || "Untitled";
}

// Full docs (incl. body) are returned so the client can search over body and
// render on click without a second round-trip. Fine for a single-user store.
export async function listNotes(): Promise<Note[]> {
  await requireAuth();
  const col = await notesCollection();
  const docs = await col.find().sort({ updatedAt: -1 }).toArray();
  return docs.map(serialize);
}

export async function createNote(
  title: string,
  body: string,
): Promise<Note> {
  await requireAuth();
  const now = new Date();
  const doc: Omit<NoteDoc, "_id"> = {
    title: normalizeTitle(title),
    body: body ?? "",
    createdAt: now,
    updatedAt: now,
  };
  const col = await notesCollection();
  const { insertedId } = await col.insertOne(doc as NoteDoc);
  revalidatePath("/tools/notes");
  return serialize({ ...doc, _id: insertedId } as NoteDoc);
}

export async function updateNote(
  id: string,
  title: string,
  body: string,
): Promise<Note> {
  await requireAuth();
  const col = await notesCollection();
  const doc = await col.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { title: normalizeTitle(title), body, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!doc) throw new Error("Note not found");
  revalidatePath("/tools/notes");
  return serialize(doc);
}

export async function deleteNote(id: string): Promise<void> {
  await requireAuth();
  const col = await notesCollection();
  await col.deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/tools/notes");
}
