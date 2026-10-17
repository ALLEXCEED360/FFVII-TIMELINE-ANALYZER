CREATE TABLE "seed_state" (
	"id" integer PRIMARY KEY NOT NULL,
	"fingerprint" text NOT NULL,
	"seeded_at" timestamp with time zone DEFAULT now() NOT NULL
);
