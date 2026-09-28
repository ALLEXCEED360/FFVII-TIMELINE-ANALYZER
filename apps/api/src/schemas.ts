import {
  CertaintySchema,
  DateRefSchema,
  DifferenceCategorySchema,
  EDGE_CATEGORIES,
  EDGE_TYPE_NAMES,
  ENTITY_FILE_KINDS,
  type EdgeType,
  type FileEntityKind,
  FramingSchema,
  LocatorSchema,
  StoredStatusSchema,
  TITLES_IN_ORDER,
  TitleCodeSchema,
  WhenSchema,
} from "@ffvii/shared";
import { z } from "zod";

// Request parameters and response bodies. Every response is checked against its schema before it
// is sent, and unknown fields are stripped (docs/decisions/0006-api-design.md).

// ─── Parameters ───────────────────────────────────────────────────────────────

export const EntityKindEnum = z.enum(
  Object.keys(ENTITY_FILE_KINDS) as [FileEntityKind, ...FileEntityKind[]],
);
export const EdgeTypeEnum = z.enum(EDGE_TYPE_NAMES as [EdgeType, ...EdgeType[]]);
export const EdgeCategoryEnum = z.enum(EDGE_CATEGORIES);
export const MagnitudeEnum = z.enum(["minor", "major"]);

export const EntityId = z
  .string()
  .min(1)
  .max(100)
  .describe("An entity ID, e.g. `character_cloud_strife`.");

/** `?titles=og,rebirth` — a comma-separated list of title codes, defaulting to all of them. */
export const Titles = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  )
  .pipe(z.array(TitleCodeSchema).min(1, "list at least one title"))
  .transform((titles) => TITLES_IN_ORDER.filter((code) => titles.includes(code)))
  .optional()
  .describe("Comma-separated title codes (`og,remake,intermission,rebirth`). Defaults to all.");

// ─── Bodies ───────────────────────────────────────────────────────────────────

export const ErrorBody = z.object({ error: z.string(), message: z.string() });

export const EntityRef = z.object({ id: z.string(), kind: EntityKindEnum, name: z.string() });

export const YearBounds = z.object({ earliest: z.number(), latest: z.number() });

export const Depiction = z.object({
  locator: LocatorSchema,
  framing: FramingSchema,
  seq: z.number().nullable(),
  isPrimary: z.boolean(),
  note: z.string().nullable(),
  playPosition: z.number(),
});

export const Appearance = z.object({
  title: TitleCodeSchema,
  world: z.string(),
  status: StoredStatusSchema,
  summary: z.string(),
  role: z.string().nullable(),
  when: WhenSchema.nullable(),
  playPosition: z.number().nullable(),
  sources: z.array(LocatorSchema),
  certainty: CertaintySchema,
  notes: z.string().nullable(),
  depictions: z.array(Depiction),
});

const Side = z.object({ title: TitleCodeSchema, world: z.string() });

export const Difference = z.object({
  id: z.string(),
  key: z.string(),
  from: Side,
  to: Side,
  category: DifferenceCategorySchema,
  magnitude: MagnitudeEnum,
  summary: z.string(),
  sources: z.array(LocatorSchema),
  certainty: CertaintySchema,
  notes: z.string().nullable(),
  related: z.array(EntityRef),
});

export const Relationship = z.object({
  id: z.string(),
  type: EdgeTypeEnum,
  category: EdgeCategoryEnum,
  direction: z.enum(["out", "in"]),
  label: z.string().describe("Read from this entity's side, e.g. `took part in` or `killed by`."),
  other: EntityRef,
  attributes: z.record(z.string(), z.unknown()),
  from: DateRefSchema.nullable(),
  until: DateRefSchema.nullable(),
  titles: z.array(
    z.object({
      title: TitleCodeSchema,
      world: z.string(),
      sources: z.array(LocatorSchema),
      certainty: CertaintySchema,
      notes: z.string().nullable(),
    }),
  ),
});

export const EventInfo = z.object({
  when: WhenSchema,
  start: YearBounds,
  end: YearBounds,
  seq: z.number().nullable(),
  importance: z.number(),
  arc: z.object({ id: z.string(), name: z.string() }),
});

export const EntityInfo = EntityRef.extend({
  aliases: z.array(z.string()),
  summary: z.string(),
  notes: z.string().nullable(),
  ogSegmentId: z.string().nullable(),
  event: EventInfo.nullable(),
});

export const DisplayStatusEnum = z.enum([
  "depicted",
  "referenced",
  "omitted",
  "not_yet_reached",
  "undocumented",
  "absent",
]);
