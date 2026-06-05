import type { Lesson } from "@/lib/db/schema";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Pure renderer — no side effects, no Resend dependency. Keeps the template
// testable in isolation and lets the service decide how to send.
//
// Structured section-per-tool. Reminders / etc. get appended as additional
// sections when those tools ship; the layout doesn't need to change.
export function renderMorningEmail(parts: {
  lesson: Lesson | null;
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

  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#18181b">
  <h1 style="font-size:18px;margin:0 0 24px 0;color:#71717a;font-weight:500">${dateLabel}</h1>
  <section style="margin-bottom:24px">
    <h2 style="font-size:12px;letter-spacing:0.05em;text-transform:uppercase;color:#71717a;margin:0 0 8px 0">Lesson of the day</h2>
    ${lessonHtml}
  </section>
</body></html>`;

  const text = `${dateLabel}

LESSON OF THE DAY
${lessonText}
`;

  return { subject, html, text };
}
