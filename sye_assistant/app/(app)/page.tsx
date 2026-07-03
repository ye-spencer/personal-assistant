import Link from "next/link";
import { Bell, Lightbulb } from "lucide-react";
import { tools } from "@/lib/tools/registry";
import { getLessonOfTheDay } from "@/lib/lessons/daily";
import { getRemindersDueToday } from "@/lib/reminders/daily";

export default async function Home() {
  const lessonOfTheDay = await getLessonOfTheDay();
  const remindersToday = await getRemindersDueToday();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Personal Assistant</h1>

      <section className="mb-8 max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
            Lesson of the day
          </h2>
        </div>
        {lessonOfTheDay ? (
          <Link
            href="/tools/lessons"
            className="block p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <p className="whitespace-pre-wrap">{lessonOfTheDay.body}</p>
            <p className="mt-2 text-[11px] text-zinc-400">
              Captured {new Date(lessonOfTheDay.createdAt).toLocaleDateString()}
            </p>
          </Link>
        ) : (
          <Link
            href="/tools/lessons"
            className="block p-5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            No lessons yet — capture your first one.
          </Link>
        )}
      </section>

      <section className="mb-8 max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
            Reminders — today
          </h2>
        </div>
        {remindersToday.length > 0 ? (
          <Link
            href="/tools/reminders"
            className="block p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <ul className="flex flex-col gap-2">
              {remindersToday.map((r) => (
                <li key={r.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span className="break-words">{r.body}</span>
                </li>
              ))}
            </ul>
          </Link>
        ) : (
          <Link
            href="/tools/reminders"
            className="block p-5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Nothing due today.
          </Link>
        )}
      </section>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
        {tools.map((tool) => (
          <li key={tool.id}>
            <Link
              href={`/tools/${tool.slug}`}
              className="block p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <div className="font-medium">{tool.label}</div>
              <div className="text-sm text-zinc-500">{tool.description}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
