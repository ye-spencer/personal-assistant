import { signIn } from "@/auth";

export default function SignInPage() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <h1 className="text-xl font-semibold">Personal Assistant</h1>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 font-medium"
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
}
