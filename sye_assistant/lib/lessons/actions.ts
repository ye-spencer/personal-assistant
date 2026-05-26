"use server";

import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { lessons, type Lesson } from "@/lib/db/schema";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

function revalidateLessonViews() {
  revalidatePath("/tools/lessons");
  revalidatePath("/");
}

export async function createLesson(body: string): Promise<Lesson> {
  await requireAuth();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Lesson body cannot be empty");
  const [row] = await db.insert(lessons).values({ body: trimmed }).returning();
  revalidateLessonViews();
  return row;
}

export async function updateLesson(id: number, body: string): Promise<Lesson> {
  await requireAuth();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Lesson body cannot be empty");
  const [row] = await db
    .update(lessons)
    .set({ body: trimmed, updatedAt: new Date() })
    .where(eq(lessons.id, id))
    .returning();
  if (!row) throw new Error("Lesson not found");
  revalidateLessonViews();
  return row;
}

export async function deleteLesson(id: number): Promise<void> {
  await requireAuth();
  await db.delete(lessons).where(eq(lessons.id, id));
  revalidateLessonViews();
}

export async function listLessons(): Promise<Lesson[]> {
  await requireAuth();
  return db.select().from(lessons).orderBy(asc(lessons.createdAt));
}

export async function getRandomLesson(): Promise<Lesson | null> {
  await requireAuth();
  const [row] = await db
    .select()
    .from(lessons)
    .orderBy(sql`random()`)
    .limit(1);
  return row ?? null;
}
