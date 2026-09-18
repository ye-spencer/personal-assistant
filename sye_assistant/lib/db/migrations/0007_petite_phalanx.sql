CREATE TABLE "recurring_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"body" text NOT NULL,
	"start_on" date NOT NULL,
	"interval_days" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
