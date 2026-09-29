// Readable URLs for entities (blueprint §39): `character_cloud_strife` ↔ `/character/cloud-strife`.
// IDs are `<kind>_<slug>` (docs/conventions/ids.md); the path swaps underscores for hyphens.

export const ENTITY_KINDS = ["character", "event", "location", "organization"] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

export const KIND_LABELS: Record<EntityKind, { one: string; many: string }> = {
  character: { one: "Character", many: "Characters" },
  event: { one: "Event", many: "Events" },
  location: { one: "Location", many: "Locations" },
  organization: { one: "Organization", many: "Organizations" },
};

export function isEntityKind(value: string | undefined): value is EntityKind {
  return (ENTITY_KINDS as readonly (string | undefined)[]).includes(value);
}

export function kindOf(id: string): EntityKind | undefined {
  return ENTITY_KINDS.find((kind) => id.startsWith(`${kind}_`));
}

/** `/character/cloud-strife` for `character_cloud_strife`. */
export function entityPath(id: string): string {
  const kind = kindOf(id);
  if (kind === undefined) return `/explore?q=${encodeURIComponent(id)}`;
  return `/${kind}/${id.slice(kind.length + 1).replaceAll("_", "-")}`;
}

/** `/compare/character/cloud-strife` — the entity's comparison view. */
export function comparePath(id: string): string {
  return `/compare${entityPath(id)}`;
}

/** The entity ID a `/:kind/:slug` path names, or undefined if the path can't be one. */
export function idFromPath(kind: string | undefined, slug: string | undefined): string | undefined {
  if (!isEntityKind(kind) || !slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return undefined;
  return `${kind}_${slug.replaceAll("-", "_")}`;
}
