import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import type { TitleCode } from "../../api/client";
import { TITLE_ORDER } from "../../lib/reference";
import type { TimelineView } from "./layout";

// The timeline's settings live in the URL, so any view can be shared or bookmarked:
// /timeline?titles=og,rebirth&view=play&layout=list&arc=arc_midgar&major=1&event=event_x

export type TimelineLayoutMode = "chart" | "list";

export interface TimelineParams {
  titles: TitleCode[];
  view: TimelineView;
  layout: TimelineLayoutMode;
  /** Only events in this arc. */
  arc: string | null;
  /** Only the most important events (importance 3). */
  majorOnly: boolean;
  /** The selected event, shown in the inspector. */
  event: string | null;
}

export const DEFAULT_TITLES: readonly TitleCode[] = ["og", "remake", "rebirth"];

/** A query value, treating an empty one (`?arc=`) as absent. */
function nonEmpty(value: string | null): string | null {
  return value === "" ? null : value;
}

/** Reads timeline settings from a query string, ignoring anything invalid. */
export function parseTimelineParams(search: URLSearchParams): TimelineParams {
  const titlesParam = search.get("titles");
  const titles =
    titlesParam === null
      ? [...DEFAULT_TITLES]
      : TITLE_ORDER.filter((code) => titlesParam.split(",").includes(code));
  return {
    titles: titles.length > 0 ? titles : [...DEFAULT_TITLES],
    view: search.get("view") === "play" ? "play" : "world",
    layout: search.get("layout") === "list" ? "list" : "chart",
    arc: nonEmpty(search.get("arc")),
    majorOnly: search.get("major") === "1",
    event: nonEmpty(search.get("event")),
  };
}

/** Writes settings back, leaving defaults out so URLs stay short. */
export function timelineSearch(params: TimelineParams): URLSearchParams {
  const search = new URLSearchParams();
  const defaultTitles = params.titles.join(",") === DEFAULT_TITLES.join(",");
  if (!defaultTitles) search.set("titles", params.titles.join(","));
  if (params.view === "play") search.set("view", "play");
  if (params.layout === "list") search.set("layout", "list");
  if (params.arc) search.set("arc", params.arc);
  if (params.majorOnly) search.set("major", "1");
  if (params.event) search.set("event", params.event);
  return search;
}

export function useTimelineParams() {
  const [search, setSearch] = useSearchParams();
  const params = useMemo(() => parseTimelineParams(search), [search]);
  const update = useCallback(
    (change: Partial<TimelineParams>) => {
      setSearch(timelineSearch({ ...parseTimelineParams(search), ...change }), {
        // Selecting an event shouldn't bury the Back button under history entries.
        replace: Object.keys(change).every((key) => key === "event"),
      });
    },
    [search, setSearch],
  );
  const toggleTitle = useCallback(
    (code: TitleCode) => {
      const next = params.titles.includes(code)
        ? params.titles.filter((t) => t !== code)
        : TITLE_ORDER.filter((t) => t === code || params.titles.includes(t));
      if (next.length > 0) update({ titles: next });
    },
    [params.titles, update],
  );
  return { params, update, toggleTitle };
}
