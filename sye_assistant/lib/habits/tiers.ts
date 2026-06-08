// Shared tier metadata for the habit grid and admin UI. Three fixed tiers, each
// with its own color. Class strings are literals so Tailwind's scanner keeps
// them.

export const TIERS = [1, 2, 3] as const;

export type TierMeta = {
  label: string;
  /** Text color for the tier's column/section header. */
  header: string;
  /** Filled checkbox cell. */
  checked: string;
  /** Small color dot / accent. */
  dot: string;
};

export const TIER_META: Record<number, TierMeta> = {
  1: {
    label: "Tier 1",
    header: "text-emerald-700 dark:text-emerald-400",
    checked: "bg-emerald-500 border-emerald-500 text-white",
    dot: "bg-emerald-500",
  },
  2: {
    label: "Tier 2",
    header: "text-amber-700 dark:text-amber-400",
    checked: "bg-amber-500 border-amber-500 text-white",
    dot: "bg-amber-500",
  },
  3: {
    label: "Tier 3",
    header: "text-sky-700 dark:text-sky-400",
    checked: "bg-sky-500 border-sky-500 text-white",
    dot: "bg-sky-500",
  },
};

export function tierMeta(tier: number): TierMeta {
  return TIER_META[tier] ?? TIER_META[1];
}
