import Link from "next/link";
import { tools } from "@/lib/tools/registry";

export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Personal Assistant</h1>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
        {tools.map((tool) => (
          <li key={tool.id}>
            <Link
              href={`/tools/${tool.slug}`}
              className="block p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <div className="font-medium">{tool.label}</div>
              <div className="text-sm text-zinc-500">{tool.description}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
