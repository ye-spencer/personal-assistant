# Tools

Product intent for each tool in the sidebar. Implementation lives under `app/(app)/tools/<slug>/`; this file is the spec.

---

## Birthdays

Pulls upcoming birthdays from a Google Calendar and helps brainstorm gift ideas per contact.

- **Source of truth:** a designated Google Calendar (read-only scope).
- **Views:** upcoming list (next 30/60/90 days), per-contact detail page.
- **Per-contact:** free-form gift-idea notes, optionally LLM-assisted brainstorming.
- **Auth dependency:** requires Google Calendar scope on the Google OAuth token.

---

## Notes

Obsidian-style markdown storage and editing.

- **Storage:** `.md` files on disk (preserves the "readable outside the app" property — confirm filesystem path with user before first write).
- **Views:** file tree, editor pane (markdown source + preview).
- **Operations:** create, rename, delete, edit, link between notes.

---

## Lessons

A capture-and-resurface log for ideas the user has learned.

- **Capture:** input box pinned at the top of the page; submit creates a new lesson (a few sentences of free text).
- **Edit:** each lesson row has an inline edit button.
- **All-lessons view:** chronological list of every lesson ever entered.
- **Shuffle view:** an in-app mode that surfaces one random lesson at a time with a "next" control, for on-demand browsing independent of the scheduled resurfacing.
- **Resurfacing:** periodically the user receives a lesson — either by email or surfaced on the dashboard. Cadence and selection strategy (random / spaced repetition / oldest-first) is an open question; default to "random one per day via email" until told otherwise.
- **Storage:** structured rows (id, body, created_at, updated_at) — fits a small SQLite table.

---

## Reminders

Quick, dated reminders about things to follow up on with people (e.g. "ask Sam about their race on 2026-06-12").

- **Capture:** input box at top of the page accepts a free-text blurb + date (and optional time).
- **All-reminders view:** chronological list, edit/delete per row.
- **Daily email digest:** every morning the user gets an email listing reminders due that day.
- **Dashboard panel:** the home page shows today's reminders alongside the tool grid.
- **Storage:** structured rows (id, body, due_at, created_at) — same SQLite store as Lessons is fine.

---

## Cross-cutting requirements (not yet built)

The Lessons and Reminders tools both need infrastructure that doesn't exist yet:

1. **Outbound email.** No SMTP/Resend/Postmark integration is wired up. Pick a provider before either tool's email path goes live. Resend is the path of least resistance; the `ALLOWED_EMAIL` env var is already the only recipient.
2. **Scheduled jobs.** "Every morning" and "every once in a while" both require a cron. On Vercel, that's `vercel.json` cron triggers hitting an internal route handler protected by a shared secret. Self-hosted, that's a system cron + `curl`.
3. **Persistence.** No DB exists yet. Lessons and Reminders both want a small relational store; SQLite via Drizzle is the lowest-friction option for a single-user app and avoids running a separate DB process.

Raise these explicitly the first time either tool's backend is touched — don't silently pick a stack.
