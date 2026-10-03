import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import type { TitleCode } from "../../api/client";
import { TITLE_ORDER } from "../../lib/reference";

// The timeline's settings live in the URL, so any view can be shared or bookmarked:
// /timeline?titles=og,rebirth&key=1&event=event_x, or /timeline?view=play&game=rebirth

export type TimelineView = "story" | "play";

export interface TimelineParams {
  /** The games whose marks show beside each event (story order). */
  titles: TitleCode[];
  /** In the order it happens, or in the order one game shows it. */
  view: TimelineView;
  /** The game whose order the play view follows. */
  game: TitleCode;
  /** Only the key moments (importance 3). */
  keyOnly: boolean;
  /** The selected event, shown in its window. */
  event: string | null;
}

export const DEFAULT_TITLES: readonly TitleCode[] = TITLE_ORDER;

const isTitle = (value: string | null): value is TitleCode =>
  TITLE_ORDER.includes(value as TitleCode);

/** A query value, treating an empty one (`?event=`) as absent. */
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
  const game = search.get("game");
  return {
    titles: titles.length > 0 ? titles : [...DEFAULT_TITLES],
    view: search.get("view") === "play" ? "play" : "story",
    game: isTitle(game) ? game : "og",
    // `major` is what earlier links called it.
    keyOnly: search.get("key") === "1" || search.get("major") === "1",
    event: nonEmpty(search.get("event")),
  };
}

/** Writes settings back, leaving defaults out so URLs stay short. */
export function timelineSearch(params: TimelineParams): URLSearchParams {
  const search = new URLSearchParams();
  if (params.titles.join(",") !== DEFAULT_TITLES.join(",")) {
    search.set("titles", params.titles.join(","));
  }
  if (params.view === "play") {
    search.set("view", "play");
    if (params.game !== "og") search.set("game", params.game);
  }
  if (params.keyOnly) search.set("key", "1");
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
