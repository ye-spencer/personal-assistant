// Shared tier metadata for the habit grid and admin UI. Three fixed tiers, each
// with its own color. Class strings are literals so Tailwind's scanner keeps
// them.

export const TIERS = [1, 2, 3] as const;

export type TierMeta = {
  label: string;
  /** Background + text for the tier's section header (top row). */
  header: string;
  /** Filled checkbox cell. */
  checked: string;
  /** Small color dot / accent. */
  dot: string;
};

export const TIER_META: Record<number, TierMeta> = {
  1: {
    label: "Tier 1",
    header: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300/80",
    checked: "bg-emerald-700 border-emerald-700 text-white",
    dot: "bg-emerald-700",
  },
  2: {
    label: "Tier 2",
    header: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300/80",
    checked: "bg-amber-700 border-amber-700 text-white",
    dot: "bg-amber-700",
  },
  3: {
    label: "Tier 3",
    header: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300/80",
    checked: "bg-sky-700 border-sky-700 text-white",
    dot: "bg-sky-700",
  },
};

export function tierMeta(tier: number): TierMeta {
  return TIER_META[tier] ?? TIER_META[1];
}
