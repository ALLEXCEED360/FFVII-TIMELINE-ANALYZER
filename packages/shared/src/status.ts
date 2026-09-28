import { type Appearance, type StoredStatus, primaryDepiction } from "./appearances.ts";
import type { Difference } from "./differences.ts";
import { MAIN_WORLD } from "./ids.ts";
import type { Coverage, OgSegments } from "./reference.ts";
import { type TitleCode, isRemakeSeries } from "./titles.ts";

// Statuses the UI shows but the data never stores (docs/model/appearances.md §3).

export type DisplayStatus =
  | StoredStatus
  /** Beyond every Remake-series title's coverage — the story hasn't got there yet. */
  | "not_yet_reached"
  /** Inside this title's coverage, but nobody has entered the data yet. */
  | "undocumented"
  /** Nothing to say: the title doesn't cover it, or it simply isn't part of that title. */
  | "absent";

/** Segment order and coverage — what status derivation needs from the reference data. */
export class CoverageIndex {
  readonly #order: Map<string, number>;
  readonly #covered: Map<TitleCode, Set<string>>;
  /** Index of the last segment any title covers; -1 when nothing is covered. */
  readonly #frontier: number;

  constructor(segments: OgSegments, coverage: Coverage) {
    this.#order = new Map(segments.map((segment, index) => [segment.id, index]));
    this.#covered = new Map();
    let frontier = -1;
    for (const [title, range] of Object.entries(coverage) as [TitleCode, Coverage["remake"]][]) {
      if (range === undefined) continue;
      const from = this.index(range.from);
      const to = this.index(range.to);
      const except = new Set(range.except ?? []);
      const ids = segments
        .slice(from, to + 1)
        .map((segment) => segment.id)
        .filter((id) => !except.has(id));
      this.#covered.set(title, new Set(ids));
      frontier = Math.max(frontier, to);
    }
    this.#frontier = frontier;
  }

  /** Play-order index of a segment; -1 if unknown. */
  index(segment: string): number {
    return this.#order.get(segment) ?? -1;
  }

  covers(title: TitleCode, segment: string): boolean {
    return this.#covered.get(title)?.has(segment) ?? false;
  }

  hasCoverage(title: TitleCode): boolean {
    return this.#covered.has(title);
  }

  isBeyondFrontier(segment: string): boolean {
    return this.index(segment) > this.#frontier;
  }
}

/** The original segment where an entity is shown (its `og` appearance's play position). */
export function ogSegmentOf(appearances: readonly Appearance[]): string | undefined {
  const og = appearances.find((a) => a.title === "og" && a.world === MAIN_WORLD);
  if (og === undefined) return undefined;
  const at = primaryDepiction(og)?.at;
  return at !== undefined && "segment" in at ? at.segment : undefined;
}

/** What status derivation needs to know about an entity — available from files or the database. */
export interface StatusSubject {
  appearances: readonly Pick<Appearance, "title" | "world" | "status">[];
  /** The original segment where the entity is shown (see `ogSegmentOf`). */
  ogSegment: string | undefined;
}

/** What a title's column shows for an entity (main world). */
export function displayStatus(
  { appearances, ogSegment: segment }: StatusSubject,
  title: TitleCode,
  index: CoverageIndex,
): DisplayStatus {
  const own = appearances.find((a) => a.title === title && a.world === MAIN_WORLD);
  if (own !== undefined) return own.status;
  // Only titles that retell part of the original can be missing or behind (INTERmission can't).
  if (!isRemakeSeries(title) || !index.hasCoverage(title)) return "absent";

  if (segment === undefined) return "absent";
  if (index.covers(title, segment)) return "undocumented";
  if (index.isBeyondFrontier(segment)) return "not_yet_reached";
  return "absent";
}

/** New in the Remake series: appears there but not in the original (appearances.md §3). */
export function isNewInRemakeSeries(appearances: readonly Pick<Appearance, "title">[]): boolean {
  return (
    !appearances.some((a) => a.title === "og") && appearances.some((a) => isRemakeSeries(a.title))
  );
}

/** Whether any difference targets this title's appearance ("changed" badge). */
export function isChanged(
  differences: readonly { to: Pick<Difference["to"], "title"> }[],
  title: TitleCode,
): boolean {
  return differences.some((d) => d.to.title === title);
}
