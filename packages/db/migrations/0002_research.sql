CREATE TYPE "public"."citation_kind" AS ENUM('appearance', 'depiction', 'difference', 'relationship', 'world');--> statement-breakpoint
CREATE TYPE "public"."question_kind" AS ENUM('needs_footage', 'not_in_dataset', 'structure');--> statement-breakpoint
CREATE TYPE "public"."source_kind" AS ENUM('play', 'footage', 'transcript', 'walkthrough', 'chapter_list', 'press');--> statement-breakpoint
CREATE TYPE "public"."source_role" AS ENUM('evidence', 'locating');--> statement-breakpoint
CREATE TABLE "citations" (
	"title" "title_code" NOT NULL,
	"unit" text NOT NULL,
	"kind" "citation_kind" NOT NULL,
	"entity_id" text,
	"world" text,
	"depiction" smallint,
	"difference_id" text,
	"edge_id" text,
	"scene" text,
	"optional" boolean NOT NULL,
	CONSTRAINT "citations_shape" CHECK (case "citations"."kind"
        when 'world' then "citations"."world" is not null and "citations"."entity_id" is null
        when 'difference' then "citations"."difference_id" is not null
        when 'relationship' then "citations"."edge_id" is not null
        when 'depiction' then "citations"."depiction" is not null and "citations"."world" is not null
        else "citations"."entity_id" is not null and "citations"."world" is not null
      end)
);
--> statement-breakpoint
CREATE TABLE "open_question_entities" (
	"question_id" text NOT NULL,
	"entity_id" text NOT NULL,
	CONSTRAINT "open_question_entities_question_id_entity_id_pk" PRIMARY KEY("question_id","entity_id")
);
--> statement-breakpoint
CREATE TABLE "open_question_worlds" (
	"question_id" text NOT NULL,
	"world_id" text NOT NULL,
	CONSTRAINT "open_question_worlds_question_id_world_id_pk" PRIMARY KEY("question_id","world_id")
);
--> statement-breakpoint
CREATE TABLE "open_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"position" smallint NOT NULL,
	"kind" "question_kind" NOT NULL,
	"summary" text NOT NULL,
	"details" text NOT NULL,
	"sources" jsonb,
	CONSTRAINT "open_questions_position_unique" UNIQUE("position")
);
--> statement-breakpoint
CREATE TABLE "research_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"position" smallint NOT NULL,
	"name" text NOT NULL,
	"kind" "source_kind" NOT NULL,
	"role" "source_role" NOT NULL,
	"covers" "title_code"[] NOT NULL,
	"used_for" text NOT NULL,
	"url" text,
	"accessed" date,
	"notes" text,
	CONSTRAINT "research_sources_position_unique" UNIQUE("position")
);
--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_title_titles_code_fk" FOREIGN KEY ("title") REFERENCES "public"."titles"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_world_worlds_id_fk" FOREIGN KEY ("world") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_difference_id_differences_id_fk" FOREIGN KEY ("difference_id") REFERENCES "public"."differences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_edge_id_edges_id_fk" FOREIGN KEY ("edge_id") REFERENCES "public"."edges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_question_entities" ADD CONSTRAINT "open_question_entities_question_id_open_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."open_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_question_entities" ADD CONSTRAINT "open_question_entities_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_question_worlds" ADD CONSTRAINT "open_question_worlds_question_id_open_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."open_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_question_worlds" ADD CONSTRAINT "open_question_worlds_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "citations_unit_idx" ON "citations" USING btree ("title","unit");--> statement-breakpoint
CREATE INDEX "open_question_entities_entity_idx" ON "open_question_entities" USING btree ("entity_id");