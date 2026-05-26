import { NextResponse } from "next/server";
import { env } from "@/env";
import { emailService } from "@/lib/email/service";
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
  await emailService.sendMorningDigest({ lesson, date: now });

  return NextResponse.json({
    ok: true,
    sentAt: now.toISOString(),
    lessonId: lesson?.id ?? null,
  });
}
