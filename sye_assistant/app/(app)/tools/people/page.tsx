import { listContacts } from "@/lib/people/actions";
import { PeopleClient } from "./people-client";

export default async function PeoplePage() {
  const contacts = await listContacts();
  return <PeopleClient initialContacts={contacts} />;
}
