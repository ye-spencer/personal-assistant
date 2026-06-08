# Tools

Product intent for each tool in the sidebar. Implementation lives under `app/(app)/tools/<slug>/`; this file is the spec.

---

## People

A lightweight personal CRM for the people in the user's life. The tool tracks notes, check-in history, gift history, and a derived relationship-strength score — surfacing relationships that are going cold so the user can re-engage. Birthdays are one supported field on a contact, not the organizing concept.

- **Contacts:** the core entity. Each contact has a name, free-form notes, an optional closeness tier, an optional birthday, and a derived **relationship strength** score (see below). Add / edit / delete contacts from inside the tool — no external source of truth is required.
- **Views:**
  - **All contacts** — searchable/sortable list. Sort by name, last-contacted, relationship strength, or next birthday.
  - **Stale list** — contacts the user hasn't reached out to in a configurable window (default 60 days); prompts to re-engage. The default landing view.
  - **Upcoming birthdays** — secondary view; next 30 / 60 / 90 days for contacts who have a birthday set.
  - **Per-contact detail page** — all fields, notes, gift log, check-in history, and an "I reached out today" button.
- **Per-contact data:**
  - Free-form notes (markdown ok) — context the user wants to remember about the person.
  - **Check-in log** — dated entries of "reached out" events (call, text, in person, etc.) with an optional short note. This is the primary signal the tool runs on.
  - **Gift log** — dated entries of gifts given (and optionally received), with notes on reaction. Used to avoid duplicates and to brainstorm future gifts; LLM-assisted suggestion is allowed but optional.
- **Periodic check-in prompts:** the app periodically asks the user "have you reached out to X recently?" for contacts going stale, prioritizing those with a higher closeness tier. Answering yes appends to the check-in log; answering no leaves the staleness intact. Cadence and delivery (in-app prompt vs. email) is an open question — default to in-app prompts on the dashboard until told otherwise.
- **Relationship strength:** a derived score per contact, computed from check-in frequency and recency, weighted by closeness tier. Surfaced on the contact list and detail page; not user-editable directly, but the tier and weighting that feed it are.
- **Birthdays:** an optional date field on a contact. Can be entered manually, or seeded from a designated Google Calendar (read-only scope) when the user opts in. Calendar is a *source*, not the source of truth.
- **Auth dependency:** none for the core CRM. Google Calendar scope on the Google OAuth token is required *only* if the user enables birthday sync.
- **Storage:** structured rows. Tables roughly: `contacts` (id, name, birthday, tier, notes, created_at), `check_ins` (id, contact_id, occurred_on, channel, notes), `gifts` (id, contact_id, given_on, description, notes). Fits the same SQLite/Postgres store as the other tools.

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
- **Resurfacing:** one random lesson per day is selected and surfaced in **both** places:
  - On the dashboard, in a "Lesson of the day" panel alongside the tool grid.
  - In the morning email blast (same email that carries the Reminders digest — one outbound email per day, not two).
  Selection strategy is uniform random for the first pass; spaced repetition / oldest-first can come later.
- **Storage:** Postgres via Drizzle (same `DATABASE_URL` as Habits). Table `lessons` (id, body, created_at, updated_at).

---

## Reminders

Quick, dated reminders about things to follow up on with people (e.g. "ask Sam about their race on 2026-06-12").

- **Capture:** input box at top of the page accepts a free-text blurb + date (and optional time).
- **All-reminders view:** chronological list, edit/delete per row.
- **Daily email digest:** every morning the user gets an email listing reminders due that day.
- **Dashboard panel:** the home page shows today's reminders alongside the tool grid.
- **Storage:** structured rows (id, body, due_at, created_at) — same SQLite store as Lessons is fine.

---

## Habits

Spreadsheet-style daily habit tracker. Columns are habits, rows are dates; checking a cell marks that habit done for that day.

- **Main view:** grid of the most recent 14 days (rows) × habits (columns) with a checkbox in each cell. Today's row sits at the top. Rows are **date-derived, not stored** — the grid renders the real last N calendar days from today and advances automatically each day, so there is no "add day" button or `days` table. A "Show older" control expands the window (14 → 28 → 60). Any visible cell (incl. past days) is editable for backfill. Habits are grouped into three colored **tiers** (1/2/3).
- **Analytics view:** per-habit summary — completion rate over the last 7/30 days, current streak, longest streak, total completions. Lives on the admin page. Scope is "at-a-glance" (numbers only) rather than full charting.
- **Add habit:** input at the top of the admin page to create a habit (name, tier, optional description).
- **Edit habit:** rename, edit description, change tier, reorder, or archive an existing habit. Archiving hides it from the grid going forward but preserves historical entries; archived habits can be restored or permanently deleted.
- **Storage:** structured rows. Two tables: `habits` (id, name, description, tier, sort_order, created_at, archived_at) and `habit_entries` (id, habit_id, done_on date, created_at) with a unique index on `(habit_id, done_on)`. Entries are **presence-based**: a row exists iff the habit was done that day (no `done` boolean) — checking inserts, unchecking deletes. Postgres via Drizzle with `DATABASE_URL` from env.

---

## Cross-cutting requirements (not yet built)

The Lessons and Reminders tools both need infrastructure that doesn't exist yet:

1. **Outbound email.** Resend. Single recipient is `ALLOWED_EMAIL`. `RESEND_API_KEY` in env.
2. **Scheduled jobs.** Vercel Cron, defined in `vercel.json`, hitting internal route handlers under `/api/cron/*` protected by a shared `CRON_SECRET` header.
3. **Persistence.** Postgres via Drizzle, using the same `DATABASE_URL` already set up for Habits. One DB across all tools.

Raise these explicitly the first time either tool's backend is touched — don't silently pick a stack.
