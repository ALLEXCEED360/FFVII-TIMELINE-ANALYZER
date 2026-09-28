import { z } from "zod";
import { checkFact, factShape } from "./facts.ts";
import {
  EntityIdSchema,
  EraIdSchema,
  MAIN_WORLD,
  SegmentIdSchema,
  WorldIdSchema,
  idOfKind,
} from "./ids.ts";
import { LocatorSchema } from "./locators.ts";
import { TitleCodeSchema } from "./titles.ts";

// Reference data in data/reference/ and data/id-redirects.yaml.

/** The original's project-defined story segments, in play order (canon-and-sources.md §10). */
export const OgSegmentsSchema = z.array(
  z.strictObject({
    id: SegmentIdSchema,
    name: z.string().trim().min(1),
    disc: z.int().min(1).max(3),
    /** What the segment covers, in a sentence. */
    summary: z.string().trim().min(1),
    /** The whole segment is optional side content. */
    optional: z.literal(true).optional(),
  }),
);
export type OgSegments = z.infer<typeof OgSegmentsSchema>;

/** A range of original segments, inclusive, in play order. */
export const SegmentRangeSchema = z.strictObject({
  from: SegmentIdSchema,
  to: SegmentIdSchema,
});
export type SegmentRange = z.infer<typeof SegmentRangeSchema>;

/** Which original segments each Remake-series title retells (titles-and-worlds.md §4). */
export const CoverageSchema = z.partialRecord(
  TitleCodeSchema.exclude(["og"]),
  z.strictObject({
    ...SegmentRangeSchema.shape,
    /** Segments inside the range that this title doesn't retell. */
    except: z.array(SegmentIdSchema).optional(),
    notes: z.string().trim().min(1).optional(),
  }),
);
export type Coverage = z.infer<typeof CoverageSchema>;

/** Project-defined story arcs (canon-and-sources.md §10). */
export const ArcsSchema = z.array(
  z.strictObject({
    id: idOfKind("arc"),
    name: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    og: SegmentRangeSchema,
    /** Remake-series chapters that retell the arc, as inclusive [first, last]. */
    chapters: z
      .partialRecord(
        TitleCodeSchema.exclude(["og"]),
        z.tuple([z.int().positive(), z.int().positive()]),
      )
      .optional(),
  }),
);
export type Arcs = z.infer<typeof ArcsSchema>;

/** Eras for the timeline's scale (chronology.md §6). Years are inclusive. */
export const ErasSchema = z.array(
  z
    .strictObject({
      id: EraIdSchema,
      name: z.string().trim().min(1),
      start: z.int(),
      end: z.int(),
      /** Share of the timeline's width, relative to the other eras. */
      weight: z.number().positive(),
    })
    .refine((era) => era.start <= era.end, "an era can't end before it starts"),
);
export type Eras = z.infer<typeof ErasSchema>;

/** In-story worlds (titles-and-worlds.md §3). `world_main` needs no evidence; others do. */
export const WorldsSchema = z.array(
  z.union([
    z.strictObject({
      id: z.literal(MAIN_WORLD),
      name: z.string().trim().min(1),
      summary: z.string().trim().min(1),
    }),
    z
      .strictObject({
        id: WorldIdSchema,
        name: z.string().trim().min(1),
        summary: z.string().trim().min(1),
        firstShown: LocatorSchema,
        /** The event where this world diverges, if a title makes that clear. */
        branchesFrom: idOfKind("event").optional(),
        ...factShape,
      })
      .superRefine(checkFact),
  ]),
);
export type Worlds = z.infer<typeof WorldsSchema>;

/** Retired IDs → their replacement, or null if removed (ids.md §6). */
export const IdRedirectsSchema = z.record(EntityIdSchema, EntityIdSchema.nullable());
export type IdRedirects = z.infer<typeof IdRedirectsSchema>;
