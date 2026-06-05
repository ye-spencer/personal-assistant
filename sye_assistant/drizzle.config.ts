import type { Config } from "drizzle-kit";
import { dbEnv } from "./lib/db/env";

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: dbEnv.DATABASE_URL,
  },
  strict: true,
} satisfies Config;
