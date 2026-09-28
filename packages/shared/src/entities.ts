import { z } from "zod";
import { AppearanceSchema, appearanceKey } from "./appearances.ts";
import { WhenSchema } from "./chronology.ts";
import { DifferenceSchema } from "./differences.ts";
import { EdgeInFileSchema } from "./edges.ts";
import { NotesSchema } from "./facts.ts";
import { type EntityKind, EntityIdSchema, idOfKind, kindOfId } from "./ids.ts";

// One YAML file per entity (docs/model/appearances.md §1, docs/conventions/ids.md).

const entityShape = {
  id: EntityIdSchema,
  name: z.string().trim().min(1),
  aliases: z.array(z.string().trim().min(1)).optional(),
  /** One or two title-neutral sentences: what this is. */
  summary: z.string().trim().min(1),
  appearances: z.array(AppearanceSchema).min(1, "an entity appears in at least one title"),
  differences: z.array(DifferenceSchema).default([]),
  relationships: z.array(EdgeInFileSchema).default([]),
  notes: NotesSchema.optional(),
};

interface EntityLike {
  id: string;
  appearances: { title: string; world: string; role?: string | undefined }[];
  differences: { key: string }[];
}

/** Rules every entity follows, whatever its kind. */
function checkEntity(kind: EntityKind, entity: EntityLike, ctx: z.RefinementCtx): void {
  const issue = (path: PropertyKey[], message: string) => {
    ctx.addIssue({ code: "custom", path, message });
  };

  if (kindOfId(entity.id) !== kind) issue(["id"], `a ${kind} ID must start with \`${kind}_\``);

  const seen = new Set<string>();
  entity.appearances.forEach((appearance, index) => {
    const key = appearanceKey(appearance.title, appearance.world);
    if (seen.has(key)) {
      issue(
        ["appearances", index],
        `two appearances for ${appearance.title} in ${appearance.world}`,
      );
    }
    seen.add(key);
    if (kind !== "character" && appearance.role !== undefined) {
      issue(["appearances", index, "role"], "only characters have a role");
    }
  });

  const keys = new Set<string>();
  entity.differences.forEach((difference, index) => {
    if (keys.has(difference.key)) {
      issue(["differences", index, "key"], `duplicate key \`${difference.key}\``);
    }
    keys.add(difference.key);
  });
}

export const EventFileSchema = z
  .strictObject({
    ...entityShape,
    when: WhenSchema,
    /** Order among events with the same resolved date (chronology.md §3). */
    seq: z.int().positive().optional(),
    /** 1 = minor, 3 = pivotal. */
    importance: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    arc: idOfKind("arc"),
  })
  .superRefine((entity, ctx) => {
    checkEntity("event", entity, ctx);
  });

function plainEntity(kind: EntityKind) {
  return z.strictObject(entityShape).superRefine((entity, ctx) => {
    checkEntity(kind, entity, ctx);
  });
}

export const CharacterFileSchema = plainEntity("character");
export const LocationFileSchema = plainEntity("location");
export const OrganizationFileSchema = plainEntity("organization");

/** Kinds stored as one file per entity, and the folder each lives in. */
export const ENTITY_FILE_KINDS = {
  character: { folder: "characters", schema: CharacterFileSchema },
  event: { folder: "events", schema: EventFileSchema },
  location: { folder: "locations", schema: LocationFileSchema },
  organization: { folder: "organizations", schema: OrganizationFileSchema },
} as const;

export type FileEntityKind = keyof typeof ENTITY_FILE_KINDS;

export type EventFile = z.infer<typeof EventFileSchema>;
export type PlainEntityFile = z.infer<typeof CharacterFileSchema>;

export type Entity =
  | ({ kind: "event" } & EventFile)
  | ({ kind: "character" | "location" | "organization" } & PlainEntityFile);
