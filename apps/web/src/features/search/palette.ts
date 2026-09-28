import type { Arc, TitleCode } from "../../api/client";
import { type EntityKind, KIND_LABELS, entityPath, isEntityKind } from "../../lib/paths";

// Turns search results into the palette's groups (blueprint §26: Characters, Events, Locations,
// Organizations, Arcs). Pure, so it's tested without a browser.

export interface SearchHit {
  id: string;
  kind: string;
  name: string;
  reason: "name" | "summary" | "appearance" | "connection";
  detail: string | null;
  score: number;
}

export type GroupKey = EntityKind | "arc";

export interface PaletteItem {
  key: string;
  href: string;
  label: string;
  /** Why it matched, when that isn't obvious from the name. */
  hint: string | null;
}

export interface PaletteGroup {
  key: GroupKey;
  label: string;
  items: PaletteItem[];
}

/** A short explanation of why a result matched. */
export function matchHint(hit: SearchHit, titleName: (code: TitleCode) => string): string | null {
  switch (hit.reason) {
    case "name":
      return hit.detail && hit.detail !== hit.name ? `Also known as ${hit.detail}` : null;
    case "summary":
      return "Matches its description";
    case "appearance":
      return hit.detail
        ? `In ${titleName(hit.detail as TitleCode)}'s version`
        : "In one title's version";
    case "connection":
      return hit.detail ? `Connected to ${hit.detail}` : "Through a connection";
  }
}

/** Arcs whose name or summary contains every term (arcs aren't entities, so they're matched here). */
export function matchArcs(arcs: readonly Arc[], terms: readonly string[]): Arc[] {
  if (terms.length === 0) return [];
  return arcs.filter((arc) => {
    const text = `${arc.name} ${arc.summary}`.toLowerCase();
    return terms.every((term) => text.includes(term));
  });
}

/**
 * Groups hits by kind. Groups are ordered by their best hit, so the top result is always in the
 * first group; arcs come last. Within a group, the API's ranking is kept.
 */
export function buildGroups(
  hits: readonly SearchHit[],
  arcs: readonly Arc[],
  terms: readonly string[],
  titleName: (code: TitleCode) => string,
): PaletteGroup[] {
  const byKind = new Map<EntityKind, { best: number; items: PaletteItem[] }>();
  for (const hit of hits) {
    if (!isEntityKind(hit.kind)) continue;
    const group = byKind.get(hit.kind) ?? { best: hit.score, items: [] };
    group.best = Math.max(group.best, hit.score);
    group.items.push({
      key: hit.id,
      href: entityPath(hit.id),
      label: hit.name,
      hint: matchHint(hit, titleName),
    });
    byKind.set(hit.kind, group);
  }

  const groups: PaletteGroup[] = [...byKind.entries()]
    .sort((a, b) => b[1].best - a[1].best)
    .map(([kind, { items }]) => ({ key: kind, label: KIND_LABELS[kind].many, items }));

  const arcItems = matchArcs(arcs, terms).map((arc) => ({
    key: arc.id,
    href: `/timeline?arc=${arc.id}`,
    label: arc.name,
    hint: "Arc — opens the timeline",
  }));
  if (arcItems.length > 0) groups.push({ key: "arc", label: "Arcs", items: arcItems });
  return groups;
}
