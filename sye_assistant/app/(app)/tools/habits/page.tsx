import { getToolBySlug } from "@/lib/tools/registry";

export default function HabitsPage() {
  const tool = getToolBySlug("habits")!;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">{tool.label}</h1>
      <p className="text-zinc-500">{tool.description}</p>
      <p className="mt-6 text-sm text-zinc-400">Not implemented yet.</p>
    </div>
  );
}
