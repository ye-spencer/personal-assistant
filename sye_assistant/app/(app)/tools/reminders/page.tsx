import { listUpcomingReminders } from "@/lib/reminders/actions";
import { todayKey } from "@/lib/reminders/dates";
import { RemindersClient } from "./reminders-client";

export default async function RemindersPage() {
  const reminders = await listUpcomingReminders();
  return <RemindersClient initialReminders={reminders} today={todayKey()} />;
}
