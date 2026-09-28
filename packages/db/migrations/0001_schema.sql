CREATE TYPE "public"."appearance_status" AS ENUM('depicted', 'referenced', 'omitted');--> statement-breakpoint
CREATE TYPE "public"."certainty" AS ENUM('stated', 'inferred', 'ambiguous');--> statement-breakpoint
CREATE TYPE "public"."difference_category" AS ENUM('presentation', 'participants', 'setting', 'chronology', 'outcome', 'role', 'relationship', 'context', 'gameplay');--> statement-breakpoint
CREATE TYPE "public"."edge_category" AS ENUM('structural', 'event', 'causal');--> statement-breakpoint
CREATE TYPE "public"."edge_type" AS ENUM('parent_of', 'sibling_of', 'spouse_of', 'member_of', 'leads', 'part_of', 'hometown', 'lives_in', 'based_at', 'controls', 'participated_in', 'occurred_at', 'sub_event_of', 'killed', 'caused', 'experimented_on', 'acted_through');--> statement-breakpoint
CREATE TYPE "public"."entity_kind" AS ENUM('character', 'event', 'location', 'organization');--> statement-breakpoint
CREATE TYPE "public"."framing" AS ENUM('direct', 'flashback', 'false_account', 'disputed_account', 'vision', 'mention', 'glimpse');--> statement-breakpoint
CREATE TYPE "public"."magnitude" AS ENUM('minor', 'major');--> statement-breakpoint
CREATE TYPE "public"."series" AS ENUM('original', 'remake');--> statement-breakpoint
CREATE TYPE "public"."title_code" AS ENUM('og', 'remake', 'intermission', 'rebirth');--> statement-breakpoint
CREATE TABLE "appearances" (
	"entity_id" text NOT NULL,
	"title" "title_code" NOT NULL,
	"world" text NOT NULL,
	"status" "appearance_status" NOT NULL,
	"summary" text NOT NULL,
	"role" text,
	"when" jsonb,
	"start_earliest" integer,
	"start_latest" integer,
	"end_earliest" integer,
	"end_latest" integer,
	"play_position" real,
	"sources" jsonb NOT NULL,
	"certainty" "certainty" NOT NULL,
	"notes" text,
	"search" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "summary")) STORED,
	CONSTRAINT "appearances_entity_id_title_world_pk" PRIMARY KEY("entity_id","title","world")
);
--> statement-breakpoint
CREATE TABLE "arcs" (
	"id" text PRIMARY KEY NOT NULL,
	"position" smallint NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL,
	"og_from" text NOT NULL,
	"og_to" text NOT NULL,
	"chapters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "arcs_position_unique" UNIQUE("position")
);
--> statement-breakpoint
CREATE TABLE "coverage" (
	"title" "title_code" PRIMARY KEY NOT NULL,
	"from_segment" text NOT NULL,
	"to_segment" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "covered_segments" (
	"title" "title_code" NOT NULL,
	"segment_id" text NOT NULL,
	CONSTRAINT "covered_segments_title_segment_id_pk" PRIMARY KEY("title","segment_id")
);
--> statement-breakpoint
CREATE TABLE "depictions" (
	"entity_id" text NOT NULL,
	"title" "title_code" NOT NULL,
	"world" text NOT NULL,
	"position" smallint NOT NULL,
	"locator" jsonb NOT NULL,
	"framing" "framing" NOT NULL,
	"seq" smallint,
	"is_primary" boolean NOT NULL,
	"note" text,
	"play_position" real NOT NULL,
	CONSTRAINT "depictions_entity_id_title_world_position_pk" PRIMARY KEY("entity_id","title","world","position")
);
--> statement-breakpoint
CREATE TABLE "difference_related" (
	"difference_id" text NOT NULL,
	"entity_id" text NOT NULL,
	CONSTRAINT "difference_related_difference_id_entity_id_pk" PRIMARY KEY("difference_id","entity_id")
);
--> statement-breakpoint
CREATE TABLE "differences" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"key" text NOT NULL,
	"from_title" "title_code" NOT NULL,
	"from_world" text NOT NULL,
	"to_title" "title_code" NOT NULL,
	"to_world" text NOT NULL,
	"category" "difference_category" NOT NULL,
	"magnitude" "magnitude" NOT NULL,
	"summary" text NOT NULL,
	"sources" jsonb NOT NULL,
	"certainty" "certainty" NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "edge_titles" (
	"edge_id" text NOT NULL,
	"title" "title_code" NOT NULL,
	"world" text NOT NULL,
	"source_id" text NOT NULL,
	"target_id" text NOT NULL,
	"sources" jsonb NOT NULL,
	"certainty" "certainty" NOT NULL,
	"notes" text,
	CONSTRAINT "edge_titles_edge_id_title_pk" PRIMARY KEY("edge_id","title")
);
--> statement-breakpoint
CREATE TABLE "edges" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"target_id" text NOT NULL,
	"type" "edge_type" NOT NULL,
	"category" "edge_category" NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"from_ref" jsonb,
	"until_ref" jsonb,
	"weight" real NOT NULL,
	CONSTRAINT "edges_no_self_loop" CHECK ("edges"."source_id" <> "edges"."target_id")
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "entity_kind" NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL,
	"notes" text,
	"og_segment_id" text,
	"search" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "name" || ' ' || "summary")) STORED
);
--> statement-breakpoint
CREATE TABLE "entity_names" (
	"entity_id" text NOT NULL,
	"name" text NOT NULL,
	"is_primary" boolean NOT NULL,
	CONSTRAINT "entity_names_entity_id_name_pk" PRIMARY KEY("entity_id","name")
);
--> statement-breakpoint
CREATE TABLE "eras" (
	"id" text PRIMARY KEY NOT NULL,
	"position" smallint NOT NULL,
	"name" text NOT NULL,
	"start_year" integer NOT NULL,
	"end_year" integer NOT NULL,
	"weight" real NOT NULL,
	CONSTRAINT "eras_position_unique" UNIQUE("position")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"entity_id" text PRIMARY KEY NOT NULL,
	"when" jsonb NOT NULL,
	"start_earliest" integer NOT NULL,
	"start_latest" integer NOT NULL,
	"end_earliest" integer NOT NULL,
	"end_latest" integer NOT NULL,
	"seq" smallint,
	"importance" smallint NOT NULL,
	"arc_id" text NOT NULL,
	CONSTRAINT "events_importance_range" CHECK ("events"."importance" between 1 and 3)
);
--> statement-breakpoint
CREATE TABLE "id_redirects" (
	"old_id" text PRIMARY KEY NOT NULL,
	"new_id" text
);
--> statement-breakpoint
CREATE TABLE "og_segments" (
	"id" text PRIMARY KEY NOT NULL,
	"position" smallint NOT NULL,
	"name" text NOT NULL,
	"disc" smallint NOT NULL,
	"summary" text NOT NULL,
	CONSTRAINT "og_segments_position_unique" UNIQUE("position")
);
--> statement-breakpoint
CREATE TABLE "title_units" (
	"title" "title_code" NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"position" real NOT NULL,
	CONSTRAINT "title_units_title_key_pk" PRIMARY KEY("title","key")
);
--> statement-breakpoint
CREATE TABLE "titles" (
	"code" "title_code" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"released" text NOT NULL,
	"series" "series" NOT NULL,
	"position" smallint NOT NULL,
	CONSTRAINT "titles_position_unique" UNIQUE("position")
);
--> statement-breakpoint
CREATE TABLE "worlds" (
	"id" text PRIMARY KEY NOT NULL,
	"position" smallint NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL,
	"first_shown" jsonb,
	"branches_from" text,
	"sources" jsonb,
	"certainty" "certainty",
	"notes" text,
	CONSTRAINT "worlds_position_unique" UNIQUE("position")
);
--> statement-breakpoint
ALTER TABLE "appearances" ADD CONSTRAINT "appearances_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appearances" ADD CONSTRAINT "appearances_title_titles_code_fk" FOREIGN KEY ("title") REFERENCES "public"."titles"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appearances" ADD CONSTRAINT "appearances_world_worlds_id_fk" FOREIGN KEY ("world") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arcs" ADD CONSTRAINT "arcs_og_from_og_segments_id_fk" FOREIGN KEY ("og_from") REFERENCES "public"."og_segments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arcs" ADD CONSTRAINT "arcs_og_to_og_segments_id_fk" FOREIGN KEY ("og_to") REFERENCES "public"."og_segments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage" ADD CONSTRAINT "coverage_title_titles_code_fk" FOREIGN KEY ("title") REFERENCES "public"."titles"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage" ADD CONSTRAINT "coverage_from_segment_og_segments_id_fk" FOREIGN KEY ("from_segment") REFERENCES "public"."og_segments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage" ADD CONSTRAINT "coverage_to_segment_og_segments_id_fk" FOREIGN KEY ("to_segment") REFERENCES "public"."og_segments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "covered_segments" ADD CONSTRAINT "covered_segments_title_coverage_title_fk" FOREIGN KEY ("title") REFERENCES "public"."coverage"("title") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "covered_segments" ADD CONSTRAINT "covered_segments_segment_id_og_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."og_segments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "depictions" ADD CONSTRAINT "depictions_appearance_fk" FOREIGN KEY ("entity_id","title","world") REFERENCES "public"."appearances"("entity_id","title","world") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "difference_related" ADD CONSTRAINT "difference_related_difference_id_differences_id_fk" FOREIGN KEY ("difference_id") REFERENCES "public"."differences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "difference_related" ADD CONSTRAINT "difference_related_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "differences" ADD CONSTRAINT "differences_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "differences" ADD CONSTRAINT "differences_from_appearance_fk" FOREIGN KEY ("entity_id","from_title","from_world") REFERENCES "public"."appearances"("entity_id","title","world") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "differences" ADD CONSTRAINT "differences_to_appearance_fk" FOREIGN KEY ("entity_id","to_title","to_world") REFERENCES "public"."appearances"("entity_id","title","world") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edge_titles" ADD CONSTRAINT "edge_titles_edge_id_edges_id_fk" FOREIGN KEY ("edge_id") REFERENCES "public"."edges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edge_titles" ADD CONSTRAINT "edge_titles_source_appearance_fk" FOREIGN KEY ("source_id","title","world") REFERENCES "public"."appearances"("entity_id","title","world") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edge_titles" ADD CONSTRAINT "edge_titles_target_appearance_fk" FOREIGN KEY ("target_id","title","world") REFERENCES "public"."appearances"("entity_id","title","world") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_source_id_entities_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_target_id_entities_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_og_segment_id_og_segments_id_fk" FOREIGN KEY ("og_segment_id") REFERENCES "public"."og_segments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_names" ADD CONSTRAINT "entity_names_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_arc_id_arcs_id_fk" FOREIGN KEY ("arc_id") REFERENCES "public"."arcs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "id_redirects" ADD CONSTRAINT "id_redirects_new_id_entities_id_fk" FOREIGN KEY ("new_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_units" ADD CONSTRAINT "title_units_title_titles_code_fk" FOREIGN KEY ("title") REFERENCES "public"."titles"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worlds" ADD CONSTRAINT "worlds_branches_from_entities_id_fk" FOREIGN KEY ("branches_from") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appearances_title_idx" ON "appearances" USING btree ("title","play_position");--> statement-breakpoint
CREATE INDEX "appearances_search_idx" ON "appearances" USING gin ("search");--> statement-breakpoint
CREATE INDEX "differences_entity_idx" ON "differences" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "edge_titles_title_idx" ON "edge_titles" USING btree ("title");--> statement-breakpoint
CREATE INDEX "edges_source_idx" ON "edges" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "edges_target_idx" ON "edges" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "entities_kind_idx" ON "entities" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "entities_search_idx" ON "entities" USING gin ("search");--> statement-breakpoint
CREATE INDEX "entity_names_trgm_idx" ON "entity_names" USING gin (lower("name") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "events_order_idx" ON "events" USING btree ("start_earliest","seq","entity_id");