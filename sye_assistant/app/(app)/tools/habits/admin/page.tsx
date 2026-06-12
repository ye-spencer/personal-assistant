import { getAnalytics, listAllHabits } from "@/lib/habits/actions";
import { AdminClient } from "./admin-client";

export default async function HabitsAdminPage() {
  const [allHabits, analytics] = await Promise.all([
    listAllHabits(),
    getAnalytics(),
  ]);
  return <AdminClient habits={allHabits} analytics={analytics} />;
}
