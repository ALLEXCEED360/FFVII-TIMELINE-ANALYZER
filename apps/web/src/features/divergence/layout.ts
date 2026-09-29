import type { DivergenceView } from "../../api/client";

// Geometry for the divergence map, in abstract units: columns are events in story order, lanes are
// branches. The trunk (events before the pivot) is one line; at the pivot it forks into a lane per
// branch, and other worlds fork again from their title's lane. Pure, so it's tested without a DOM.

export type Marking = NonNullable<DivergenceView["events"][number]["stations"][number]>["marking"];

export interface Lane {
  key: string;
  title: DivergenceView["branches"][number]["title"];
  world: string;
  /** Row index; other worlds sit just below their title. */
  row: number;
  /** For another world: the lane it forks from. */
  parent: string | null;
}

export interface TrunkStop {
  eventId: string;
  column: number;
  /** "shared" when every branch shows it alike; otherwise "differs". */
  summary: "shared" | "differs";
}

export interface Stop {
  eventId: string;
  lane: string;
  column: number;
  marking: Marking;
}

export interface DivergenceLayout {
  columns: number;
  /** Column of the pivot; the trunk ends and the branches start here. */
  pivotColumn: number;
  lanes: Lane[];
  trunk: TrunkStop[];
  stops: Stop[];
  /** Column headers, in order. */
  headers: { eventId: string; name: string; column: number; pivot: boolean }[];
  /** The last column each lane reaches (where its line ends). */
  laneEnds: Record<string, number>;
}

export function layoutDivergence(view: DivergenceView): DivergenceLayout {
  const lanes: Lane[] = view.branches.map((branch, row) => ({
    key: branch.key,
    title: branch.title,
    world: branch.world,
    row,
    parent: branch.world === "world_main" ? null : `${branch.title}/world_main`,
  }));

  const trunk: TrunkStop[] = view.trunk.map((r, column) => ({
    eventId: r.event.id,
    column,
    summary: r.stations.every((s) => s === null || s.marking === "shared") ? "shared" : "differs",
  }));

  const pivotColumn = trunk.length;
  const stops: Stop[] = [];
  const laneEnds: Record<string, number> = {};
  view.events.forEach((r, i) => {
    const column = pivotColumn + i;
    r.stations.forEach((station, b) => {
      const lane = lanes[b];
      if (!station || !lane) return;
      stops.push({ eventId: r.event.id, lane: lane.key, column, marking: station.marking });
      laneEnds[lane.key] = column;
    });
  });
  for (const lane of lanes) laneEnds[lane.key] ??= pivotColumn;

  const headers = [
    ...view.trunk.map((r, column) => ({
      eventId: r.event.id,
      name: r.event.name,
      column,
      pivot: false,
    })),
    ...view.events.map((r, i) => ({
      eventId: r.event.id,
      name: r.event.name,
      column: pivotColumn + i,
      pivot: r.event.id === view.pivot.id,
    })),
  ];

  return {
    columns: view.trunk.length + view.events.length,
    pivotColumn,
    lanes,
    trunk,
    stops,
    headers,
    laneEnds,
  };
}

export const MARKING_LABELS: Record<Marking, string> = {
  shared: "Shared",
  changed: "Changed",
  only_here: "Only here",
  not_yet_retold: "Not yet retold elsewhere",
  omitted: "Omitted",
  not_yet_reached: "Not yet reached",
  undocumented: "Not yet documented",
};

export const MARKING_DESCRIPTIONS: Record<Marking, string> = {
  shared: "Shown here and by the other branches, with no documented difference.",
  changed: "Shown here and elsewhere, with documented differences.",
  only_here: "Shown here but not by a branch that covers this part of the story.",
  not_yet_retold: "Shown here; the other branches haven't reached this part of the story yet.",
  omitted: "This branch covers this part of the story and leaves it out.",
  not_yet_reached: "This branch hasn't reached this part of the story yet.",
  undocumented: "Covered by this branch, but not yet entered in the dataset.",
};
