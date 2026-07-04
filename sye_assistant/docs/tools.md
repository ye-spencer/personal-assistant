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

### Implemented (v1)

A deliberately minimal first cut — contacts + per-contact notes + birthdays — laying the schema groundwork for the rest of the spec above. Built:

- **Tables** (Postgres via Drizzle, same `DATABASE_URL`):
  - `contacts` (id, first_name, middle_name, last_name, **birth_month / birth_day / birth_year** (all nullable `integer`), how_we_met, info, gift_planning `boolean`, created_at, updated_at). `id` is the stable handle other tools (gift planning) will reference. **Birthday is year-optional:** month+day are set together (or both null); year is independently optional, so a birthday can be known without the year.
  - `contact_notes` (id, contact_id → contacts ON DELETE CASCADE, body, created_at, updated_at). Timestamped free-form notes, Lessons-style but scoped to one person.
  - `gift_plans` (id, contact_id → contacts ON DELETE CASCADE, brainstorm text, purchased text, updated_at; unique index on contact_id). One upserted row per contact: a freeform gift-idea brainstorm and a freeform log of gifts actually given.
- **"Mark them" → `gift_planning` flag.** A per-contact boolean the user toggles to opt a contact into the gift-planning workflow. Shown as a gift icon in the list/detail. Future gift-planning app reads contacts where `gift_planning = true` (and, where present, birth_month/birth_day).
- **List view** (`/tools/people`): contact count, add-person form, and a search box. **Search is client-side, case-insensitive substring** matching against first name, last name, and the full "first middle last" string (so "bob", "smith", and "bob s" all match "Bob Smith"). Small single-user dataset, so the full list loads and filters in the browser.
- **Gift-planning tab** (`/tools/people/gifts`): a secondary tab listing every contact marked `gift_planning = true`, **ordered by soonest upcoming birthday** (year-agnostic; contacts with no birthday sort to the end). Each gets a card with two freeform textareas — "Gift ideas / brainstorm" and "Gifts given" — saved (upserted) to `gift_plans`. Top-level tab bar switches between People and Gift planning.
- **Morning email birthdays** (`lib/people/daily.ts` → `getBirthdayDigest`, rendered in the daily digest): two sections — **Birthdays — next 2 days** for *all* contacts (the 2-day window absorbs UTC day-boundary skew so a birthday is never missed), and **Gift planning — next 2 months** for *gift-planning* contacts only (starting after the 2-day window, which already covers them). Upcoming-birthday math is year-agnostic and UTC-anchored (`daysUntilBirthday` in `lib/people/format.ts`). Empty sections are omitted.
- **Detail view** (`/tools/people/[id]`): all fields with inline edit/delete, plus a notes section — a top textarea where Enter adds a note (Shift+Enter for a newline), and each note is editable/deletable.
- **Not yet built** (still spec-only above): check-in log, relationship-strength score, closeness tier, stale list, upcoming-birthdays views, periodic check-in prompts, and Google Calendar birthday sync. No auth/users table — the app is single-user (`ALLOWED_EMAIL`); "user" in the original ask maps to a `contact` row.

---

## Notes

Obsidian-style markdown storage and editing.

- **Storage:** markdown documents. Original spec called for `.md` files on disk; **v1 uses MongoDB instead** (see below) — the canonical stored form is still raw markdown, just in a document store rather than the filesystem.
- **Views:** searchable note list, rendered preview, source editor.
- **Operations:** create, delete, edit. (Rename = editing the title. Inter-note linking is not yet built.)

### Implemented (v1)

A two-pane markdown notebook backed by MongoDB (the one tool not on Postgres — the rest of the app stays on `DATABASE_URL`).

- **Storage:** MongoDB collection `notes`, database from `MONGODB_DB` (default `sye_assistant`), connection from `MONGODB_URI`. Documents: `{ _id, title, body (raw markdown), createdAt, updatedAt }`. **Body is stored as markdown**; HTML is derived at render time and never persisted. Connection is a globalThis-cached `MongoClient` (`lib/mongo/client.ts`), mirroring the pg client's HMR-safe pattern. Env wired through `env.ts` (`MONGODB_URI` required, `MONGODB_DB` optional).
- **Page** (`/tools/notes`): left column = a **New note** button, a **simple search** box (client-side, case-insensitive substring over title *and* body), and a scrollable note list (most-recently-updated first). Right pane renders the selected note's markdown to HTML (via `marked`, styled by a lightweight `.markdown-body` block in `globals.css` — no typography plugin).
- **Edit flow:** an **Edit** button in the top-left toolbar switches the right pane into an editor (title input + monospace markdown textarea). **Save** is disabled until edit mode is on; **Cancel** discards the draft and returns to the rendered view. **New note** opens the editor on a blank draft and only writes to Mongo on Save (no empty docs). A **Delete** button (toolbar right) removes the selected note. Server actions in `lib/notes/actions.ts` serialize `ObjectId`/`Date` to strings for the client.
- **Not yet built** (still spec-only above): inter-note linking, and any rename UX beyond editing the title field.

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

### Implemented (v1)

A deliberately minimal first cut — text + date, list, email, auto-cleanup. Built:

- **Table** `reminders` (Postgres via Drizzle, same `DATABASE_URL`): `id`, `body`, `due_on` (`date`, no time), `created_at`, `updated_at`. **Date-only on purpose:** the user picks a calendar day, so there's no time-of-day and no per-row timezone ambiguity.
- **Timezone.** "Today"/"upcoming"/"passed" are anchored to a real IANA zone (`APP_TIME_ZONE` env var, optional, defaults to `America/New_York`) via `lib/reminders/dates.ts` → `todayKey`, *not* UTC. Anchoring to UTC would wrongly flip a reminder due today to "passed" between ~8pm and midnight Eastern. The morning cron runs at 10:00 UTC (early-morning ET), so the email lands on the correct local day.
- **Page** (`/tools/reminders`): one text input + native date picker + Add, then an "Upcoming" list (due today or later, soonest first) with a colored month/day/weekday badge per row (today highlighted). Each row has inline edit (text + date) and delete. Distinct date-badge card styling to differentiate from Lessons.
- **Morning email** (`lib/reminders/daily.ts`): a "Reminders — today" section listing every reminder whose `due_on` equals today. Wired through `renderMorningEmail` / `sendMorningDigest`, alongside the lesson and birthdays.
- **Auto-removal.** After the email is built, the cron calls `purgePastReminders`, deleting rows with `due_on < today`. So a reminder always gets its email on its due day, then is cleaned up — the table only ever holds today + future. The page list also filters to `due_on >= today`, so the UI is correct even between cron runs.
- **Dashboard panel** (`app/(app)/page.tsx`): a "Reminders — today" panel alongside the Lesson-of-the-day panel and tool grid, listing reminders whose `due_on` is today (empty state when none). Uses the same `getRemindersDueToday` as the email.
- **Not yet built** (still spec-only above): optional time-of-day.

---

## Habits

Spreadsheet-style daily habit tracker. Columns are habits, rows are dates; checking a cell marks that habit done for that day.

- **Main view:** grid of the most recent 14 days (rows) × habits (columns) with a checkbox in each cell. Today's row sits at the top. Rows are **date-derived, not stored** — the grid renders the real last N calendar days from today and advances automatically each day, so there is no "add day" button or `days` table. A "Show older" control expands the window (14 → 28 → 60). Any visible cell (incl. past days) is editable for backfill. Habits are grouped into three colored **tiers** (1/2/3).
- **Analytics view:** per-habit summary — completion rate over the last 7/30 days and total completions. Lives on the admin page. Scope is "at-a-glance" (numbers only) rather than full charting. Deliberately excludes streaks and any window-dependent stats that get inaccurate or expensive to maintain as history grows; the kept stats are all cheap to derive on the fly.
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
