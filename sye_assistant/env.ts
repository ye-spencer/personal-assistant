// Centralized env access. Import from here instead of reading process.env
// directly so missing config fails at startup, not at the first request that
// happens to need it.

const required = [
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "ALLOWED_EMAIL",
] as const;

type RequiredKey = (typeof required)[number];

const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  throw new Error(
    `Missing required env vars: ${missing.join(", ")}. See .env.example.`,
  );
}

export const env: Record<RequiredKey, string> = {
  AUTH_SECRET: process.env.AUTH_SECRET!,
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID!,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET!,
  ALLOWED_EMAIL: process.env.ALLOWED_EMAIL!.toLowerCase(),
};
