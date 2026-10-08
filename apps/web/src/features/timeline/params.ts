import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import {
  type Telling,
  type TellingChoice,
  parseTellingChoice,
  setTellingChoice,
} from "../../lib/tellings";

// The timeline's settings live in the URL, so any view can be shared:
// /timeline?in=trilogy&key=1&event=event_x, or /timeline?view=play&game=trilogy

export type TimelineView = "story" | "play";

export interface TimelineParams {
  /** Whose marks show beside each event (story order). */
  tellings: TellingChoice;
  /** In the order it happens, or in the order one telling shows it. */
  view: TimelineView;
  /** The telling whose order the play view follows. */
  game: Telling;
  /** Only the key moments (importance 3). */
  keyOnly: boolean;
  /** The selected event, shown in its window. */
  event: string | null;
}

/** A query value, treating an empty one (`?event=`) as absent. */
function nonEmpty(value: string | null): string | null {
  return value === "" ? null : value;
}

/** Reads timeline settings from a query string, ignoring anything invalid. */
export function parseTimelineParams(search: URLSearchParams): TimelineParams {
  const game = search.get("game");
  return {
    tellings: parseTellingChoice(search),
    view: search.get("view") === "play" ? "play" : "story",
    // Older links named a game; any of the trilogy's means the trilogy.
    game: game === null || game === "og" ? "og" : "trilogy",
    // `major` is what earlier links called it.
    keyOnly: search.get("key") === "1" || search.get("major") === "1",
    event: nonEmpty(search.get("event")),
  };
}

/** Writes settings back, leaving defaults out so URLs stay short. */
export function timelineSearch(params: TimelineParams): URLSearchParams {
  const search = setTellingChoice(new URLSearchParams(), params.tellings);
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
  return { params, update };
}
