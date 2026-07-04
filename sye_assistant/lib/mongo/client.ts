import { MongoClient, type Db, type Collection } from "mongodb";
import { env } from "@/env";
import type { NoteDoc } from "@/lib/notes/types";

// One MongoClient per process, cached on globalThis so Next's dev HMR doesn't
// open a new connection pool on every reload (mirrors lib/db/client.ts for pg).
const globalForMongo = globalThis as unknown as {
  __mongoClientPromise?: Promise<MongoClient>;
};

const clientPromise =
  globalForMongo.__mongoClientPromise ??
  new MongoClient(env.MONGODB_URI).connect();

if (process.env.NODE_ENV !== "production") {
  globalForMongo.__mongoClientPromise = clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(env.MONGODB_DB);
}

export async function notesCollection(): Promise<Collection<NoteDoc>> {
  const database = await getDb();
  return database.collection<NoteDoc>("notes");
}
