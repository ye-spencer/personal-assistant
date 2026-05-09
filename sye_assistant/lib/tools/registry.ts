import {
  Bell,
  Cake,
  Lightbulb,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";

export type Tool = {
  id: string;
  label: string;
  /** Lucide icon shown as the sidebar token. */
  icon: LucideIcon;
  /** Route segment under /tools/. */
  slug: string;
  description: string;
};

// Single source of truth for the sidebar. Adding a tool = adding an entry here
// + a folder under app/(app)/tools/<slug>/. Order in this array is the order
// shown in the sidebar.
export const tools: readonly Tool[] = [
  {
    id: "birthdays",
    label: "Birthdays",
    icon: Cake,
    slug: "birthdays",
    description: "Birthdays from Google Calendar + gift brainstorming.",
  },
  {
    id: "notes",
    label: "Notes",
    icon: NotebookPen,
    slug: "notes",
    description: "Obsidian-style markdown storage.",
  },
  {
    id: "lessons",
    label: "Lessons",
    icon: Lightbulb,
    slug: "lessons",
    description: "Capture lessons learned and resurface them over time.",
  },
  {
    id: "reminders",
    label: "Reminders",
    icon: Bell,
    slug: "reminders",
    description: "Dated follow-up reminders with a daily email digest.",
  },
] as const;

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}
