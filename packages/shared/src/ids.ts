import { z } from "zod";

// Entity kinds and ID formats (docs/conventions/ids.md). The ID prefix determines the kind.

export const ENTITY_KINDS = ["character", "event", "location", "organization", "arc"] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

const SLUG = "[a-z0-9]+(_[a-z0-9]+)*";
const ID_PATTERN = new RegExp(`^(${ENTITY_KINDS.join("|")})_${SLUG}$`);

export const EntityIdSchema = z
  .string()
  .regex(ID_PATTERN, "IDs look like `<kind>_<slug>`, e.g. `character_cloud_strife`");
export type EntityId = z.infer<typeof EntityIdSchema>;

/** An ID that must belong to one specific kind, e.g. `idOfKind("event")`. */
export function idOfKind(kind: EntityKind) {
  return EntityIdSchema.refine((id) => kindOfId(id) === kind, `expected a ${kind} ID`);
}

export function kindOfId(id: string): EntityKind | undefined {
  return ENTITY_KINDS.find((kind) => id.startsWith(`${kind}_`));
}

/** A reference code with a fixed prefix, e.g. `world_main` or `og_kalm` (ids.md §2). */
function prefixedCode(prefix: string, example: string) {
  return z
    .string()
    .regex(new RegExp(`^${prefix}_${SLUG}$`), `expected \`${prefix}_<slug>\`, e.g. \`${example}\``);
}

export const WorldIdSchema = prefixedCode("world", "world_main");
export const SegmentIdSchema = prefixedCode("og", "og_kalm");
export const EraIdSchema = prefixedCode("era", "era_main_story");

export const MAIN_WORLD = "world_main";

/** A short lowercase key, unique within its parent (e.g. a difference's `key`). */
export const KeySchema = z
  .string()
  .regex(new RegExp(`^${SLUG}$`), "use lowercase words joined by `_`");
