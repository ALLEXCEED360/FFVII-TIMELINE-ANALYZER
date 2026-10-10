import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import type { EdgeCategory } from "../../api/client";
import { ENTITY_KINDS, type EntityKind } from "../../lib/paths";
import { type TellingChoice, parseTellingChoice, setTellingChoice } from "../../lib/tellings";

// The network view's settings live in the URL, so any view can be shared:
// /network/character/cloud-strife?depth=2&in=trilogy&categories=event&show=character&expand=…&to=…&node=…

export const EDGE_CATEGORY_ORDER: readonly EdgeCategory[] = ["structural", "event", "causal"];

export interface NetworkParams {
  depth: 1 | 2 | 3;
  tellings: TellingChoice;
  categories: EdgeCategory[];
  /** The kinds of thing shown (the centre, and a path being followed, always are). */
  kinds: EntityKind[];
  /** Entities whose own neighbourhoods are added to the view. */
  expand: string[];
  /** A path target: highlights the strongest path from the centre to this entity. */
  to: string | null;
  /** The selected entity. */
  node: string | null;
}

const ID = /^[a-z]+_[a-z0-9_]+$/;

function list(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export function parseNetworkParams(search: URLSearchParams): NetworkParams {
  const depth = Number(search.get("depth"));
  const categories = EDGE_CATEGORY_ORDER.filter((c) => list(search.get("categories")).includes(c));
  const kinds = ENTITY_KINDS.filter((k) => list(search.get("show")).includes(k));
  const to = search.get("to");
  const node = search.get("node");
  return {
    depth: depth === 2 || depth === 3 ? depth : 1,
    tellings: parseTellingChoice(search),
    categories: categories.length > 0 ? categories : [...EDGE_CATEGORY_ORDER],
    kinds: kinds.length > 0 ? kinds : [...ENTITY_KINDS],
    expand: [...new Set(list(search.get("expand")).filter((id) => ID.test(id)))],
    to: to && ID.test(to) ? to : null,
    node: node && ID.test(node) ? node : null,
  };
}

/** Writes settings back, leaving defaults out so URLs stay short. */
export function networkSearch(params: NetworkParams): URLSearchParams {
  const search = setTellingChoice(new URLSearchParams(), params.tellings);
  if (params.depth !== 1) search.set("depth", String(params.depth));
  if (params.categories.length !== EDGE_CATEGORY_ORDER.length) {
    search.set("categories", params.categories.join(","));
  }
  if (params.kinds.length !== ENTITY_KINDS.length) search.set("show", params.kinds.join(","));
  if (params.expand.length > 0) search.set("expand", params.expand.join(","));
  if (params.to) search.set("to", params.to);
  if (params.node) search.set("node", params.node);
  return search;
}

/** The usual view, which Reset goes back to. */
export const USUAL_VIEW = {
  depth: 1,
  tellings: "both",
  categories: [...EDGE_CATEGORY_ORDER],
  kinds: [...ENTITY_KINDS],
} satisfies Partial<NetworkParams>;

export function isUsualView(params: NetworkParams): boolean {
  return (
    params.depth === USUAL_VIEW.depth &&
    params.tellings === USUAL_VIEW.tellings &&
    params.categories.length === USUAL_VIEW.categories.length &&
    params.kinds.length === USUAL_VIEW.kinds.length
  );
}

/** Adds or removes an item, keeping at least one. */
export function toggle<T>(items: readonly T[], item: T, order: readonly T[]): T[] {
  const next = items.includes(item) ? items.filter((i) => i !== item) : [...items, item];
  return next.length > 0 ? order.filter((o) => next.includes(o)) : [...items];
}

export function useNetworkParams() {
  const [search, setSearch] = useSearchParams();
  const params = useMemo(() => parseNetworkParams(search), [search]);
  const update = useCallback(
    (change: Partial<NetworkParams>) => {
      setSearch(networkSearch({ ...parseNetworkParams(search), ...change }), {
        // Selecting a node shouldn't fill the history with Back steps.
        replace: Object.keys(change).every((key) => key === "node"),
      });
    },
    [search, setSearch],
  );
  return { params, update };
}
