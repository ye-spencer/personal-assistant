import { listGiftPlanning } from "@/lib/people/actions";
import { GiftPlanningClient } from "./gift-planning-client";

export default async function GiftPlanningPage() {
  const entries = await listGiftPlanning();
  return <GiftPlanningClient entries={entries} />;
}
