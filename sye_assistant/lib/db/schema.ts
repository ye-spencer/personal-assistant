import {
  boolean,
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;

// Dated follow-up reminders. `body` is the free-text blurb; `dueOn` is a
// calendar date (no time — the user picks a date). Date-only is timezone-
// agnostic on purpose: "due June 12" means the same day everywhere, and the
// app decides what "today" is in the user's timezone (see lib/reminders/dates).
// Reminders are surfaced in the morning email on their due day and deleted the
// day after (lib/reminders/daily.ts), so the table only ever holds today + future.
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  body: text("body").notNull(),
  dueOn: date("due_on").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;

// Habits the user tracks. Columns in the tracker grid. `tier` (1|2|3) groups
// habits into colored sections; `sortOrder` orders them within a tier.
// `archivedAt` hides a habit from the grid while preserving its history.
export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  tier: integer("tier").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

// One row per (habit, day) the habit was completed. Presence == done; there is
// no `done` boolean — unchecking a cell deletes the row. Sparse by design.
export const habitEntries = pgTable(
  "habit_entries",
  {
    id: serial("id").primaryKey(),
    habitId: integer("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    doneOn: date("done_on").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("habit_entries_habit_day").on(t.habitId, t.doneOn)],
);

export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type HabitEntry = typeof habitEntries.$inferSelect;

// People in the user's life — a lightweight personal CRM. One row per contact,
// the stable entity other tools (e.g. gift planning) can reference by `id`.
// Birthday is split into month/day/year so the year can be unknown: month+day
// are set together (or both null), year is independently optional. `giftPlanning`
// is the user-set "mark" flag: contacts opted into the gift-planning workflow.
// `reachoutable` is a similar mark: people the user is close enough to that
// they're worth a nudge to reach out to — the morning email picks one at random.
// Free-form per-contact notes live in `contactNotes`; `howWeMet` and `info` are
// single fixed fields on the contact.
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  birthMonth: integer("birth_month"),
  birthDay: integer("birth_day"),
  birthYear: integer("birth_year"),
  howWeMet: text("how_we_met").notNull().default(""),
  info: text("info").notNull().default(""),
  giftPlanning: boolean("gift_planning").notNull().default(false),
  reachoutable: boolean("reachoutable").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Timestamped free-form notes about a contact, like Lessons but scoped to one
// person. Deleting a contact cascades to its notes.
export const contactNotes = pgTable("contact_notes", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// One gift-planning sheet per contact: a freeform brainstorm of potential gift
// ideas and a freeform log of what was actually given. Only meaningful for
// contacts with `giftPlanning = true`, but the row is keyed by contact and
// upserted on save. One row per contact (unique index).
export const giftPlans = pgTable(
  "gift_plans",
  {
    id: serial("id").primaryKey(),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    brainstorm: text("brainstorm").notNull().default(""),
    purchased: text("purchased").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("gift_plans_contact").on(t.contactId)],
);

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type ContactNote = typeof contactNotes.$inferSelect;
export type GiftPlan = typeof giftPlans.$inferSelect;
