CREATE TABLE "reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"body" text NOT NULL,
	"due_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
