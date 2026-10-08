import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

// The divergence view's settings live in the URL, so any view can be shared:
// /divergence/event/aerith-death?worlds=1&node=event_cloud_memories_restored

export interface DivergenceParams {
  /** Whether other worlds (e.g. the world where Zack survives) get their own branches. */
  worlds: boolean;
  /** The selected event, shown in the inspector. */
  node: string | null;
}

const ID = /^[a-z]+_[a-z0-9_]+$/;

export function parseDivergenceParams(search: URLSearchParams): DivergenceParams {
  const node = search.get("node");
  return {
    worlds: search.get("worlds") === "1",
    node: node && ID.test(node) ? node : null,
  };
}

/** Writes settings back, leaving defaults out so URLs stay short. */
export function divergenceSearch(params: DivergenceParams): URLSearchParams {
  const search = new URLSearchParams();
  if (params.worlds) search.set("worlds", "1");
  if (params.node) search.set("node", params.node);
  return search;
}

export function useDivergenceParams() {
  const [search, setSearch] = useSearchParams();
  const params = useMemo(() => parseDivergenceParams(search), [search]);
  const update = useCallback(
    (change: Partial<DivergenceParams>) => {
      setSearch(divergenceSearch({ ...parseDivergenceParams(search), ...change }), {
        replace: true,
      });
    },
    [search, setSearch],
  );
  return { params, update };
}
