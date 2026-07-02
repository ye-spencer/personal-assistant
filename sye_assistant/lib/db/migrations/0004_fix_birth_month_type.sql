-- 0003 generated a RENAME of "birthday" (date) -> "birth_month", leaving the
-- column as `date` even though the schema declares it `integer`. drizzle's
-- snapshot already records `integer`, so `generate` won't emit a fix. Convert
-- the column to integer, preserving the month if any date value was present.
ALTER TABLE "contacts" ALTER COLUMN "birth_month" SET DATA TYPE integer USING EXTRACT(MONTH FROM "birth_month")::integer;
