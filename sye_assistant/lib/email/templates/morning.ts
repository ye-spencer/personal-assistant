import type { Lesson } from "@/lib/db/schema";
import type { BirthdayDigest, UpcomingBirthday } from "@/lib/people/daily";
import { formatBirthdayShort, fullName } from "@/lib/people/format";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function relativeDays(n: number): string {
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  return `in ${n} days`;
}

// Pure renderer — no side effects, no Resend dependency. Keeps the template
// testable in isolation and lets the service decide how to send.
//
// Structured section-per-tool. Reminders / etc. get appended as additional
// sections when those tools ship; the layout doesn't need to change.
export function renderMorningEmail(parts: {
  lesson: Lesson | null;
  birthdays: BirthdayDigest;
  date: Date;
}): { subject: string; html: string; text: string } {
  const dateLabel = parts.date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const subject = `Morning — ${dateLabel}`;

  const lessonHtml = parts.lesson
    ? `<p style="white-space:pre-wrap;margin:0">${escapeHtml(parts.lesson.body)}</p>`
    : `<p style="margin:0;color:#71717a">No lessons captured yet.</p>`;

  const lessonText = parts.lesson
    ? parts.lesson.body
    : "No lessons captured yet.";

  const { soon, giftingUpcoming } = parts.birthdays;

  // Birthdays in the next couple days (everyone) — name and how soon.
  const soonLine = (b: UpcomingBirthday) =>
    `${fullName(b.contact)} (${relativeDays(b.inDays)})`;

  const soonSectionHtml =
    soon.length > 0
      ? section(
          "Birthdays — next 2 days",
          `<ul style="margin:0;padding-left:18px">${soon
            .map((b) => `<li>${escapeHtml(soonLine(b))}</li>`)
            .join("")}</ul>`,
        )
      : "";

  // Gift-planning birthdays in the next two months — name, date, how soon.
  const giftLine = (b: UpcomingBirthday) =>
    `${fullName(b.contact)} — ${formatBirthdayShort(b.contact)} (${relativeDays(b.inDays)})`;

  const giftSectionHtml =
    giftingUpcoming.length > 0
      ? section(
          "Gift planning — next 2 months",
          `<ul style="margin:0;padding-left:18px">${giftingUpcoming
            .map((b) => `<li>${escapeHtml(giftLine(b))}</li>`)
            .join("")}</ul>`,
        )
      : "";

  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#18181b">
  <h1 style="font-size:18px;margin:0 0 24px 0;color:#71717a;font-weight:500">${dateLabel}</h1>
  <section style="margin-bottom:24px">
    <h2 style="font-size:12px;letter-spacing:0.05em;text-transform:uppercase;color:#71717a;margin:0 0 8px 0">Lesson of the day</h2>
    ${lessonHtml}
  </section>
  ${soonSectionHtml}
  ${giftSectionHtml}
</body></html>`;

  const textParts = [dateLabel, "", "LESSON OF THE DAY", lessonText];
  if (soon.length > 0) {
    textParts.push(
      "",
      "BIRTHDAYS — NEXT 2 DAYS",
      ...soon.map((b) => `- ${soonLine(b)}`),
    );
  }
  if (giftingUpcoming.length > 0) {
    textParts.push(
      "",
      "GIFT PLANNING — NEXT 2 MONTHS",
      ...giftingUpcoming.map((b) => `- ${giftLine(b)}`),
    );
  }
  const text = textParts.join("\n") + "\n";

  return { subject, html, text };
}

function section(title: string, body: string): string {
  return `<section style="margin-bottom:24px">
    <h2 style="font-size:12px;letter-spacing:0.05em;text-transform:uppercase;color:#71717a;margin:0 0 8px 0">${title}</h2>
    ${body}
  </section>`;
}
