import { notFound } from "next/navigation";
import { getContact, listContactNotes } from "@/lib/people/actions";
import { ContactDetail } from "./contact-detail";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contactId = Number(id);
  if (!Number.isInteger(contactId)) notFound();

  const contact = await getContact(contactId);
  if (!contact) notFound();

  const notes = await listContactNotes(contactId);
  return <ContactDetail contact={contact} initialNotes={notes} />;
}
