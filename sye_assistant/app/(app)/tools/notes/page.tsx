import { listNotes } from "@/lib/notes/actions";
import { NotesClient } from "./notes-client";

export default async function NotesPage() {
  const notes = await listNotes();
  return <NotesClient initialNotes={notes} />;
}
