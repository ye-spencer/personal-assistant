import { NextResponse } from "next/server";
import { env } from "@/env";
import { emailService } from "@/lib/email/service";
import { getLessonsOfTheDay } from "@/lib/lessons/daily";
import { getBirthdayDigest } from "@/lib/people/daily";
import { getRemindersDueToday, purgePastReminders } from "@/lib/reminders/daily";

// Vercel Cron hits this with `Authorization: Bearer <CRON_SECRET>`. Same route
// can be invoked manually from a terminal with curl for testing.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dailyLessons = await getLessonsOfTheDay();
  const birthdays = await getBirthdayDigest(now);
  const dueReminders = await getRemindersDueToday(now);
  await emailService.sendMorningDigest({
    lessons: dailyLessons,
    birthdays,
    reminders: dueReminders,
    date: now,
  });

  // Clean up after the email is sent: today's reminders were just delivered,
  // and anything strictly before today is now past and can be removed.
  const purged = await purgePastReminders(now);

  return NextResponse.json({
    ok: true,
    sentAt: now.toISOString(),
    lessonIds: dailyLessons.map((l) => l.id),
    birthdaysSoon: birthdays.soon.length,
    giftBirthdaysUpcoming: birthdays.giftingUpcoming.length,
    remindersDue: dueReminders.length,
    remindersPurged: purged,
  });
}
