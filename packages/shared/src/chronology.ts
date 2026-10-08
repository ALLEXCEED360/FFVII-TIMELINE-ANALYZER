import { z } from "zod";
import { idOfKind } from "./ids.ts";

// In-universe time (docs/model/chronology.md). Year 0 is the year the main story begins;
// earlier years are negative. There are no months or days.

export const YearSchema = z.strictObject({
  year: z.int(),
  /** The title gives the figure loosely ("about 2,000 years ago"). */
  approx: z.literal(true).optional(),
});
export type Year = z.infer<typeof YearSchema>;

export const InUniverseDateSchema = z.union([
  YearSchema,
  z
    .strictObject({ between: z.tuple([YearSchema, YearSchema]) })
    .refine(({ between: [a, b] }) => a.year < b.year, "a range must run from earlier to later"),
]);
export type InUniverseDate = z.infer<typeof InUniverseDateSchema>;

export const WhenSchema = z.union([
  InUniverseDateSchema,
  z
    .strictObject({ start: InUniverseDateSchema, end: InUniverseDateSchema })
    .refine(
      ({ start, end }) => resolveDate(end).earliest >= resolveDate(start).earliest,
      "an event can't end before it starts",
    ),
]);
export type When = z.infer<typeof WhenSchema>;

/** A date or a reference to an event's start or end (relationships.md §2). */
export const DateRefSchema = z.union([
  InUniverseDateSchema,
  z.strictObject({ event: idOfKind("event"), at: z.enum(["start", "end"]).optional() }),
]);
export type DateRef = z.infer<typeof DateRefSchema>;

/** An inclusive range of years. */
export interface YearRange {
  earliest: number;
  latest: number;
}

export function resolveDate(date: InUniverseDate): YearRange {
  if ("between" in date) return { earliest: date.between[0].year, latest: date.between[1].year };
  return { earliest: date.year, latest: date.year };
}

export interface ResolvedWhen {
  start: YearRange;
  end: YearRange;
}

export function resolveWhen(when: When): ResolvedWhen {
  if ("start" in when) return { start: resolveDate(when.start), end: resolveDate(when.end) };
  const range = resolveDate(when);
  return { start: range, end: range };
}

export interface Chronological {
  id: string;
  when: When;
  seq?: number | undefined;
}

/** Sort order for events: (earliest, seq, id) — chronology.md §3. */
export function compareChronologically(a: Chronological, b: Chronological): number {
  const byStart = resolveWhen(a.when).start.earliest - resolveWhen(b.when).start.earliest;
  if (byStart !== 0) return byStart;
  const bySeq = (a.seq ?? Number.MAX_SAFE_INTEGER) - (b.seq ?? Number.MAX_SAFE_INTEGER);
  if (bySeq !== 0) return bySeq;
  return a.id.localeCompare(b.id);
}
