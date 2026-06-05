// DB-only env access. Imported by both the runtime client and drizzle-kit's
// config (which runs outside Next.js and doesn't auto-load `.env.local`).
//
// Keeping this narrow — just DATABASE_URL — means migrations don't fail when an
// unrelated app secret (Resend, Auth, etc.) is missing.

// `loadEnvFile` is a no-op if the file doesn't exist; safe to call in prod
// where the platform injects env vars directly.
try {
  process.loadEnvFile?.(".env.local");
} catch {
  // file missing — env vars must come from the environment
}

if (!process.env.DATABASE_URL) {
  throw new Error("Missing required env var: DATABASE_URL");
}

export const dbEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
};
