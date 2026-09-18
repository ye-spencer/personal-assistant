import type { Contact, Lesson } from "@/lib/db/schema";
import type { BirthdayDigest, UpcomingBirthday } from "@/lib/people/daily";
import type { DueReminder } from "@/lib/reminders/daily";
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
  lessons: Lesson[];
  birthdays: BirthdayDigest;
  // Everything due today — one-off reminders and any recurring reminders that
  // fire today, already merged by the caller. Only the text matters here.
  reminders: DueReminder[];
  reachOut: Contact | null;
  date: Date;
}): { subject: string; html: string; text: string } {
  const dateLabel = parts.date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const subject = `Morning — ${dateLabel}`;

  const lessonHtml =
    parts.lessons.length > 0
      ? `<ul style="margin:0;padding-left:18px">${parts.lessons
          .map(
            (l) =>
              `<li style="white-space:pre-wrap;margin:0 0 8px 0">${escapeHtml(l.body)}</li>`,
          )
          .join("")}</ul>`
      : `<p style="margin:0;color:#71717a">No lessons captured yet.</p>`;

  const lessonText =
    parts.lessons.length > 0
      ? parts.lessons.map((l) => `- ${l.body}`).join("\n")
      : "No lessons captured yet.";

  // Reminders due today — the whole point of the tool. Shown near the top.
  const remindersSectionHtml =
    parts.reminders.length > 0
      ? section(
          "Reminders — today",
          `<ul style="margin:0;padding-left:18px">${parts.reminders
            .map((r) => `<li>${escapeHtml(r.body)}</li>`)
            .join("")}</ul>`,
        )
      : "";

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

  // A random person worth reaching out to — name, plus how-we-met / info to jog
  // the memory if they're set.
  const reachOutLine = (c: Contact): string => {
    const context = [c.howWeMet, c.info].map((s) => s.trim()).filter(Boolean)[0];
    return context ? `${fullName(c)} — ${context}` : fullName(c);
  };

  const reachOutSectionHtml = parts.reachOut
    ? section(
        "Reach out to",
        `<p style="margin:0">${escapeHtml(reachOutLine(parts.reachOut))}</p>`,
      )
    : "";

  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#18181b">
  <h1 style="font-size:18px;margin:0 0 24px 0;color:#71717a;font-weight:500">${dateLabel}</h1>
  <section style="margin-bottom:24px">
    <h2 style="font-size:12px;letter-spacing:0.05em;text-transform:uppercase;color:#71717a;margin:0 0 8px 0">Lessons of the day</h2>
    ${lessonHtml}
  </section>
  ${remindersSectionHtml}
  ${reachOutSectionHtml}
  ${soonSectionHtml}
  ${giftSectionHtml}
</body></html>`;

  const textParts = [dateLabel, "", "LESSONS OF THE DAY", lessonText];
  if (parts.reminders.length > 0) {
    textParts.push(
      "",
      "REMINDERS — TODAY",
      ...parts.reminders.map((r) => `- ${r.body}`),
    );
  }
  if (parts.reachOut) {
    textParts.push("", "REACH OUT TO", reachOutLine(parts.reachOut));
  }
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
