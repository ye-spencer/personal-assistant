import { listLessons } from "@/lib/lessons/actions";
import { LessonsClient } from "./lessons-client";

export default async function LessonsPage() {
  const lessons = await listLessons();
  return <LessonsClient initialLessons={lessons} />;
}
