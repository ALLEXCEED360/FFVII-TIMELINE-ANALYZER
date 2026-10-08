import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import type { EdgeCategory, TitleCode } from "../../api/client";
import { TITLE_ORDER } from "../../lib/reference";

// The network view's settings live in the URL, so any view can be shared:
// /network/character/cloud-strife?depth=2&titles=og,rebirth&categories=event&expand=…&to=…&node=…

export const EDGE_CATEGORY_ORDER: readonly EdgeCategory[] = ["structural", "event", "causal"];

export interface NetworkParams {
  depth: 1 | 2 | 3;
  titles: TitleCode[];
  categories: EdgeCategory[];
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
  const titles = TITLE_ORDER.filter((t) => list(search.get("titles")).includes(t));
  const categories = EDGE_CATEGORY_ORDER.filter((c) => list(search.get("categories")).includes(c));
  const to = search.get("to");
  const node = search.get("node");
  return {
    depth: depth === 2 || depth === 3 ? depth : 1,
    titles: titles.length > 0 ? titles : [...TITLE_ORDER],
    categories: categories.length > 0 ? categories : [...EDGE_CATEGORY_ORDER],
    expand: [...new Set(list(search.get("expand")).filter((id) => ID.test(id)))],
    to: to && ID.test(to) ? to : null,
    node: node && ID.test(node) ? node : null,
  };
}

/** Writes settings back, leaving defaults out so URLs stay short. */
export function networkSearch(params: NetworkParams): URLSearchParams {
  const search = new URLSearchParams();
  if (params.depth !== 1) search.set("depth", String(params.depth));
  if (params.titles.length !== TITLE_ORDER.length) search.set("titles", params.titles.join(","));
  if (params.categories.length !== EDGE_CATEGORY_ORDER.length) {
    search.set("categories", params.categories.join(","));
  }
  if (params.expand.length > 0) search.set("expand", params.expand.join(","));
  if (params.to) search.set("to", params.to);
  if (params.node) search.set("node", params.node);
  return search;
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
