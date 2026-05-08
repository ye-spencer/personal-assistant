import Link from "next/link";
import { tools } from "@/lib/tools/registry";
import { auth, signOut } from "@/auth";

export async function Sidebar() {
  const session = await auth();

  return (
    <aside className="flex flex-col gap-2 w-20 border-r border-zinc-200 dark:border-zinc-800 py-4 bg-zinc-50 dark:bg-zinc-950">
      <Link
        href="/"
        className="flex items-center justify-center w-12 h-12 mx-auto rounded-xl bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-sm"
        title="Home"
      >
        PA
      </Link>

      <div className="h-px bg-zinc-200 dark:bg-zinc-800 mx-3 my-2" />

      <nav className="flex flex-col gap-2">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.slug}`}
            title={`${tool.label} — ${tool.description}`}
            className="flex items-center justify-center w-12 h-12 mx-auto rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {tool.token}
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-2 px-2">
        {session?.user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt={session.user.name ?? "user"}
            className="w-10 h-10 rounded-full"
          />
        ) : null}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/signin" });
          }}
        >
          <button
            type="submit"
            className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
