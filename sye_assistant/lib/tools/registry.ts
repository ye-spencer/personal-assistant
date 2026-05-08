export type Tool = {
  id: string;
  label: string;
  /** Short text shown inside the sidebar token (1–2 chars). */
  token: string;
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
    token: "BD",
    slug: "birthdays",
    description: "Birthdays from Google Calendar + gift brainstorming.",
  },
  {
    id: "notes",
    label: "Notes",
    token: "MD",
    slug: "notes",
    description: "Obsidian-style markdown storage.",
  },
] as const;

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}
