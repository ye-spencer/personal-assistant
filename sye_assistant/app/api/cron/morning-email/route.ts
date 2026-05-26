import { NextResponse } from "next/server";
import { env } from "@/env";
import { sendEmail } from "@/lib/email/send";
import { renderMorningEmail } from "@/lib/email/morning";
import { getLessonOfTheDay } from "@/lib/lessons/daily";

// Vercel Cron hits this with `Authorization: Bearer <CRON_SECRET>`. Same route
// can be invoked manually from a terminal with curl for testing.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const lesson = await getLessonOfTheDay();
  const { subject, html, text } = renderMorningEmail({ lesson, date: now });
  await sendEmail({ subject, html, text });

  return NextResponse.json({
    ok: true,
    sentAt: now.toISOString(),
    lessonId: lesson?.id ?? null,
  });
}
