import {
  listRecurringReminders,
  listUpcomingReminders,
} from "@/lib/reminders/actions";
import { todayKey } from "@/lib/reminders/dates";
import { RemindersClient } from "./reminders-client";

export default async function RemindersPage() {
  const [reminders, recurring] = await Promise.all([
    listUpcomingReminders(),
    listRecurringReminders(),
  ]);
  return (
    <RemindersClient
      initialReminders={reminders}
      initialRecurring={recurring}
      today={todayKey()}
    />
  );
}
