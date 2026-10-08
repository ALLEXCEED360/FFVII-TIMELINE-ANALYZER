import type { Locator, TitleCode } from "../api/client";
import { isTitleCode } from "./reference";

// Readable URLs for entities: `character_cloud_strife` ↔ `/character/cloud-strife`.
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

/** `/network/character/cloud-strife` — the entity's relationship network. */
export function networkPath(id: string): string {
  return `/network${entityPath(id)}`;
}

/** `/divergence/event/aerith-death` — where the titles part ways around an event. */
export function divergencePath(id: string): string {
  return `/divergence${entityPath(id)}`;
}

/** The entity ID a `/:kind/:slug` path names, or undefined if the path can't be one. */
export function idFromPath(kind: string | undefined, slug: string | undefined): string | undefined {
  if (!isEntityKind(kind) || !slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return undefined;
  return `${kind}_${slug.replaceAll("-", "_")}`;
}

// ─── The archive: units of the titles as sources ──────────────────────────────
// /archive/og/kalm (segment og_kalm), /archive/remake/chapter-8, /archive/rebirth/interlude

/** `/archive/og` — a title's units. */
export function archiveTitlePath(title: TitleCode): string {
  return `/archive/${title}`;
}

/** The path of a unit, keyed as in the reference data: segment ID, chapter number or part key. */
export function unitPath(title: TitleCode, key: string): string {
  const slug = /^\d+$/.test(key) ? `chapter-${key}` : key.replace(/^og_/, "").replaceAll("_", "-");
  return `${archiveTitlePath(title)}/${slug}`;
}

/** The unit page a citation points into. */
export function sourcePath(locator: Locator): string {
  if ("segment" in locator) return unitPath(locator.title, locator.segment);
  if ("chapter" in locator) return unitPath(locator.title, String(locator.chapter));
  return unitPath(locator.title, locator.part);
}

/** The title and unit key a `/archive/:title/:unit` path names, or undefined. */
export function unitFromPath(
  title: string | undefined,
  slug: string | undefined,
): { title: TitleCode; key: string } | undefined {
  if (title === undefined || !isTitleCode(title) || !slug) return undefined;
  const chapter = /^chapter-([1-9]\d*)$/.exec(slug);
  if (chapter?.[1] !== undefined) return { title, key: chapter[1] };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return undefined;
  const key = slug.replaceAll("-", "_");
  return { title, key: title === "og" ? `og_${key}` : key };
}
