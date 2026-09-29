import { z } from "zod";
import { EntityIdSchema, QuestionIdSchema, SourceIdSchema, WorldIdSchema } from "./ids.ts";
import { LocatorSchema } from "./locators.ts";
import { TitleCodeSchema } from "./titles.ts";

// The research log in data/research/ (canon-and-sources.md §4): what was used to find and check
// the facts, and what is still open. Facts cite the games themselves; this records the evidence.

/** How a source was used: as evidence for facts, or only to find where something happens. */
export const SOURCE_ROLES = ["evidence", "locating"] as const;
export type SourceRole = (typeof SOURCE_ROLES)[number];

export const SOURCE_KINDS = [
  "play",
  "footage",
  "transcript",
  "walkthrough",
  "chapter_list",
  "press",
] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

/** Evidence levels, best first (canon-and-sources.md §4). Other kinds can only locate. */
export const EVIDENCE_LEVEL: Partial<Record<SourceKind, 1 | 2 | 3>> = {
  play: 1,
  footage: 2,
  transcript: 3,
};

const IsoDateSchema = z.iso.date();

export const ResearchSourcesSchema = z.array(
  z
    .strictObject({
      id: SourceIdSchema,
      name: z.string().trim().min(1),
      kind: z.enum(SOURCE_KINDS),
      role: z.enum(SOURCE_ROLES),
      /** The titles it covers; omitted when it isn't about one of them (e.g. an announcement). */
      covers: z.array(TitleCodeSchema).min(1).optional(),
      /** What it was used for, in a sentence. */
      usedFor: z.string().trim().min(1),
      url: z.url({ protocol: /^https$/ }).optional(),
      accessed: IsoDateSchema.optional(),
      /** Limits worth knowing, e.g. an incomplete transcript. */
      notes: z.string().trim().min(1).optional(),
    })
    .refine((source) => source.role === "locating" || EVIDENCE_LEVEL[source.kind] !== undefined, {
      path: ["role"],
      message: "only play, footage and transcripts can be evidence; other sources only locate",
    }),
);
export type ResearchSources = z.infer<typeof ResearchSourcesSchema>;
export type ResearchSource = ResearchSources[number];

export const QUESTION_KINDS = ["needs_footage", "not_in_dataset", "structure"] as const;
export type QuestionKind = (typeof QUESTION_KINDS)[number];

export const OpenQuestionsSchema = z.array(
  z.strictObject({
    id: QuestionIdSchema,
    kind: z.enum(QUESTION_KINDS),
    /** The question in a line. */
    summary: z.string().trim().min(1),
    /** What is known, what isn't, and how to settle it. */
    details: z.string().trim().min(1),
    /** Entities and worlds it concerns; their pages show the question. */
    entities: z.array(EntityIdSchema).min(1).optional(),
    worlds: z.array(WorldIdSchema).min(1).optional(),
    /** Where in the titles to look. */
    sources: z.array(LocatorSchema).min(1).optional(),
  }),
);
export type OpenQuestions = z.infer<typeof OpenQuestionsSchema>;
export type OpenQuestion = OpenQuestions[number];
