"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/tools/people", label: "People" },
  { href: "/tools/people/gifts", label: "Gift planning" },
];

export function PeopleTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-2 text-sm border-b-2 -mb-px ${
              active
                ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
