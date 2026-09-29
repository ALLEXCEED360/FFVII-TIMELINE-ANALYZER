import type { StoredStatus } from "./appearances.ts";
import type { DifferenceCategory } from "./differences.ts";
import { MAIN_WORLD } from "./ids.ts";
import { type CoverageIndex, type DisplayStatus, displayStatus } from "./status.ts";
import { TITLES_IN_ORDER, type TitleCode } from "./titles.ts";

// The Divergence view (docs/features/divergence.md): from a pivot event, where do the titles — and
// the worlds inside the Remake series — part ways? Pure, so the API and tests share one definition.

/** What the computation needs to know about each event. */
export interface DivergenceEvent {
  id: string;
  name: string;
  /** Earliest in-universe year, and `seq`, for ordering (chronology.md §3). */
  start: number;
  seq: number | null;
  importance: number;
  ogSegment: string | undefined;
  appearances: { title: TitleCode; world: string; status: StoredStatus }[];
  differences: {
    id: string;
    from: { title: TitleCode; world: string };
    to: { title: TitleCode; world: string };
    category: DifferenceCategory;
    magnitude: "minor" | "major";
  }[];
}

/** A line on the map: a title's main world, or another world inside a title. */
export interface Branch {
  title: TitleCode;
  world: string;
}

export type Marking =
  /** Shown here and by the other branches that show it, with no documented difference. */
  | "shared"
  /** Shown here and elsewhere, with documented differences involving this branch. */
  | "changed"
  /** Shown here; a branch that covers this part of the story doesn't show it (or it's new). */
  | "only_here"
  /** Shown here; the other branches haven't reached this part of the story yet. */
  | "not_yet_retold"
  | "omitted"
  | "not_yet_reached"
  | "undocumented";

export interface Station {
  eventId: string;
  marking: Marking;
  /** Differences between this branch and another branch in the view. */
  differences: { id: string; category: DifferenceCategory; magnitude: "minor" | "major" }[];
  /** Other branches (as `title/world`) that cover this part of the story but don't show it. */
  missingIn: string[];
}

export interface Divergence {
  pivot: string;
  branches: Branch[];
  /** Events before the pivot, in in-universe order: the common history. */
  trunk: { eventId: string; stations: Record<string, Station | null> }[];
  /** The pivot and every event after it, in in-universe order, with each branch's station. */
  events: { eventId: string; stations: Record<string, Station | null> }[];
}

export function branchKey(branch: Branch): string {
  return `${branch.title}/${branch.world}`;
}

function compareEvents(a: DivergenceEvent, b: DivergenceEvent): number {
  return (
    a.start - b.start ||
    (a.seq ?? Number.MAX_SAFE_INTEGER) - (b.seq ?? Number.MAX_SAFE_INTEGER) ||
    a.id.localeCompare(b.id)
  );
}

const SHOWN: ReadonlySet<DisplayStatus> = new Set(["depicted", "referenced"]);
const COVERS_BUT_MISSING: ReadonlySet<DisplayStatus> = new Set(["omitted", "undocumented"]);

/** A branch's status for an event: derived for a title's main world, stored (or absent) for others. */
function statusOn(event: DivergenceEvent, branch: Branch, index: CoverageIndex): DisplayStatus {
  if (branch.world === MAIN_WORLD) {
    return displayStatus(
      { appearances: event.appearances, ogSegment: event.ogSegment },
      branch.title,
      index,
    );
  }
  return (
    event.appearances.find((a) => a.title === branch.title && a.world === branch.world)?.status ??
    "absent"
  );
}

/** The branches another branch is compared with: other titles' main worlds, or, for another
 *  world, the main world of its own title. */
function counterparts(branch: Branch, branches: readonly Branch[]): Branch[] {
  if (branch.world !== MAIN_WORLD) return [{ title: branch.title, world: MAIN_WORLD }];
  return branches.filter((b) => b.world === MAIN_WORLD && b.title !== branch.title);
}

function station(
  event: DivergenceEvent,
  branch: Branch,
  branches: readonly Branch[],
  index: CoverageIndex,
): Station | null {
  const status = statusOn(event, branch, index);
  const base = { eventId: event.id, differences: [], missingIn: [] };
  if (status === "absent") return null;
  if (!SHOWN.has(status)) return { ...base, marking: status as Marking };

  const others = counterparts(branch, branches).map((other) => ({
    other,
    status: statusOn(event, other, index),
  }));
  const shownElsewhere = others.filter((o) => SHOWN.has(o.status));
  const missingIn = others
    .filter((o) => COVERS_BUT_MISSING.has(o.status))
    .map((o) => branchKey(o.other));
  const aheadElsewhere = others.some((o) => o.status === "not_yet_reached");

  const involves = (side: { title: TitleCode; world: string }, b: Branch) =>
    side.title === b.title && side.world === b.world;
  const differences = event.differences
    .filter((d) =>
      shownElsewhere.some(
        ({ other }) =>
          (involves(d.from, branch) && involves(d.to, other)) ||
          (involves(d.from, other) && involves(d.to, branch)),
      ),
    )
    .map(({ id, category, magnitude }) => ({ id, category, magnitude }));

  let marking: Marking;
  if (shownElsewhere.length === 0) {
    marking = missingIn.length === 0 && aheadElsewhere ? "not_yet_retold" : "only_here";
  } else if (differences.length > 0) marking = "changed";
  else marking = missingIn.length > 0 ? "only_here" : "shared";
  return { eventId: event.id, marking, differences, missingIn };
}

/**
 * Where the chosen titles (and, if asked, the other worlds they show) part ways around a pivot
 * event. Returns null if the pivot isn't one of the events.
 */
export function computeDivergence(
  allEvents: readonly DivergenceEvent[],
  pivot: string,
  titles: readonly TitleCode[],
  index: CoverageIndex,
  { worlds = false }: { worlds?: boolean } = {},
): Divergence | null {
  const events = [...allEvents].sort(compareEvents);
  const at = events.findIndex((e) => e.id === pivot);
  if (at < 0) return null;

  const ordered = TITLES_IN_ORDER.filter((t) => titles.includes(t));
  const branches: Branch[] = ordered.flatMap((title) => {
    const main = { title, world: MAIN_WORLD };
    if (!worlds) return [main];
    const others = [
      ...new Set(
        events.flatMap((e) =>
          e.appearances
            .filter((a) => a.title === title && a.world !== MAIN_WORLD)
            .map((a) => a.world),
        ),
      ),
    ].sort();
    return [main, ...others.map((world) => ({ title, world }))];
  });

  const row = (event: DivergenceEvent) => ({
    eventId: event.id,
    stations: Object.fromEntries(
      branches.map((b) => [branchKey(b), station(event, b, branches, index)]),
    ),
  });
  // An event nobody in the view shows doesn't belong on the map.
  const onMap = (r: ReturnType<typeof row>) => Object.values(r.stations).some((s) => s !== null);

  return {
    pivot,
    branches,
    trunk: events.slice(0, at).map(row).filter(onMap),
    events: events
      .slice(at)
      .map(row)
      .filter((r) => r.eventId === pivot || onMap(r)),
  };
}

/** Events where the chosen titles differ: documented differences, or shown by some but not others. */
export function divergencePoints(
  allEvents: readonly DivergenceEvent[],
  titles: readonly TitleCode[],
): { eventId: string; differences: number; major: number }[] {
  const chosen = new Set(titles);
  return [...allEvents]
    .sort(compareEvents)
    .map((event) => {
      const relevant = event.differences.filter(
        (d) => chosen.has(d.from.title) && chosen.has(d.to.title),
      );
      return {
        eventId: event.id,
        differences: relevant.length,
        major: relevant.filter((d) => d.magnitude === "major").length,
      };
    })
    .filter((p) => p.differences > 0);
}
