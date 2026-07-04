import type { ObjectId } from "mongodb";

// Shape stored in MongoDB. `body` is the raw markdown source — that's the
// canonical form we persist; HTML is derived at render time, never stored.
export type NoteDoc = {
  _id: ObjectId;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

// Plain, serializable shape handed to client components. ObjectId becomes a
// string `id`; Dates become ISO strings so they survive the server→client
// boundary.
export type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};
