// Centralized env access. Import from here instead of reading process.env
// directly so missing config fails at startup, not at the first request that
// happens to need it.

const required = [
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "ALLOWED_EMAIL",
  "DATABASE_URL",
  "RESEND_API_KEY",
  "RESEND_FROM",
  "CRON_SECRET",
] as const;

type RequiredKey = (typeof required)[number];

const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  throw new Error(
    `Missing required env vars: ${missing.join(", ")}. See .env.example.`,
  );
}

export const env: Record<RequiredKey, string> & { APP_TIME_ZONE: string } = {
  AUTH_SECRET: process.env.AUTH_SECRET!,
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID!,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET!,
  ALLOWED_EMAIL: process.env.ALLOWED_EMAIL!.toLowerCase(),
  DATABASE_URL: process.env.DATABASE_URL!,
  RESEND_API_KEY: process.env.RESEND_API_KEY!,
  RESEND_FROM: process.env.RESEND_FROM!,
  CRON_SECRET: process.env.CRON_SECRET!,
  // IANA timezone that defines "today" for date-only features (reminders).
  // Optional — defaults to US Eastern, which matches the 10:00 UTC morning cron.
  APP_TIME_ZONE: process.env.APP_TIME_ZONE || "America/New_York",
};
