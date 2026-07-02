CREATE TABLE "gift_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"brainstorm" text DEFAULT '' NOT NULL,
	"purchased" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" RENAME COLUMN "birthday" TO "birth_month";--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "birth_day" integer;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "birth_year" integer;--> statement-breakpoint
ALTER TABLE "gift_plans" ADD CONSTRAINT "gift_plans_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gift_plans_contact" ON "gift_plans" USING btree ("contact_id");