import type { DivergenceView, TitleCode } from "../../api/client";
import type { Marking } from "../../lib/plain";
import { TELLING, type Telling, tellingFor } from "../../lib/tellings";

// The API draws a line per game; the site follows two tellings. This folds the Remake Trilogy's
// games (and any other world they share) into one line each, keeping the most telling marking
// and which of its games tell the moment.

type ApiRow = DivergenceView["trunk"][number];
type ApiStation = NonNullable<ApiRow["stations"][number]>;

export interface Line {
  key: string;
  telling: Telling;
  world: string;
  name: string;
  color: string;
}

export interface Station extends ApiStation {
  /** The games of the line that show the moment. */
  in: TitleCode[];
}

export interface Row {
  event: ApiRow["event"];
  stations: (Station | null)[];
}

export interface SplitData {
  pivot: DivergenceView["pivot"];
  lines: Line[];
  trunk: Row[];
  events: Row[];
}

/** Most telling first, as a moment's marking for a whole line. */
const RANK: readonly Marking[] = [
  "changed",
  "only_here",
  "not_yet_retold",
  "shared",
  "omitted",
  "undocumented",
  "not_yet_reached",
];
const SHOWN: ReadonlySet<Marking> = new Set(["changed", "only_here", "not_yet_retold", "shared"]);

export function byTelling(view: DivergenceView, worldName: (id: string) => string): SplitData {
  const groups = new Map<string, { line: Line; members: { index: number; title: TitleCode }[] }>();
  view.branches.forEach((branch, index) => {
    const telling = tellingFor(branch.title);
    const key = `${telling}/${branch.world}`;
    const group = groups.get(key) ?? {
      line: {
        key,
        telling,
        world: branch.world,
        name:
          branch.world === "world_main"
            ? TELLING[telling].name
            : `${TELLING[telling].short} · ${worldName(branch.world)}`,
        color: TELLING[telling].color,
      },
      members: [],
    };
    group.members.push({ index, title: branch.title });
    groups.set(key, group);
  });
  const lines = [...groups.values()];

  const merge = (row: ApiRow): Row => ({
    event: row.event,
    stations: lines.map(({ members }) => {
      const present = members.flatMap(({ index, title }) => {
        const station = row.stations[index];
        return station ? [{ station, title }] : [];
      });
      if (present.length === 0) return null;
      const marking =
        RANK.find((m) => present.some((p) => p.station.marking === m)) ??
        present[0]?.station.marking ??
        "undocumented";
      const differences = [
        ...new Map(present.flatMap((p) => p.station.differences).map((d) => [d.id, d])).values(),
      ];
      return {
        marking,
        differences,
        missingIn: [...new Set(present.flatMap((p) => p.station.missingIn))],
        in: present.filter((p) => SHOWN.has(p.station.marking)).map((p) => p.title),
      };
    }),
  });

  return {
    pivot: view.pivot,
    lines: lines.map((g) => g.line),
    trunk: view.trunk.map(merge),
    events: view.events.map(merge),
  };
}
