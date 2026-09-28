import { z } from "zod";
import { SegmentIdSchema } from "./ids.ts";
import { TitleCodeSchema, chapterCount, partsOf } from "./titles.ts";

// Where in a title something is shown (docs/canon-and-sources.md §5).

const extras = {
  /** Free text to help a reader find the moment, e.g. "the Kalm inn flashback". */
  scene: z.string().trim().min(1).optional(),
  /** Optional side content, cited where it becomes available. */
  optional: z.literal(true).optional(),
};

const OgLocatorSchema = z.strictObject({
  title: z.literal("og"),
  disc: z.int().min(1).max(3),
  segment: SegmentIdSchema,
  ...extras,
});

const ChapterLocatorSchema = z.strictObject({
  title: TitleCodeSchema.exclude(["og"]),
  chapter: z.int().positive(),
  ...extras,
});

const PartLocatorSchema = z.strictObject({
  title: TitleCodeSchema.exclude(["og"]),
  part: z.string().trim().min(1),
  ...extras,
});

export const LocatorSchema = z
  .union([OgLocatorSchema, ChapterLocatorSchema, PartLocatorSchema])
  .superRefine((locator, ctx) => {
    if ("chapter" in locator) {
      const count = chapterCount(locator.title);
      if (count !== undefined && locator.chapter > count) {
        ctx.addIssue({
          code: "custom",
          path: ["chapter"],
          message: `${locator.title} has ${String(count)} chapters`,
        });
      }
    }
    if ("part" in locator && !partsOf(locator.title).some((part) => part.key === locator.part)) {
      const known = partsOf(locator.title).map((part) => `\`${part.key}\``);
      ctx.addIssue({
        code: "custom",
        path: ["part"],
        message: `${locator.title} has ${known.length > 0 ? `only these parts: ${known.join(", ")}` : "no unnumbered parts"}`,
      });
    }
  });
export type Locator = z.infer<typeof LocatorSchema>;

export const SourcesSchema = z.array(LocatorSchema).min(1, "cite at least one locator");

/**
 * A sortable play position within a title. For the original, pass the segment's index in play
 * order (from the segment list); chaptered titles place unnumbered parts just before their chapter.
 */
export function playPosition(locator: Locator, segmentIndex: (id: string) => number): number {
  if ("segment" in locator) return segmentIndex(locator.segment);
  if ("chapter" in locator) return locator.chapter;
  const part = partsOf(locator.title).find((p) => p.key === locator.part);
  return (part?.before ?? 0) - 0.5;
}

/** A short human label, e.g. "Rebirth ch. 12" or "OG disc 1 · og_kalm". */
export function formatLocator(locator: Locator): string {
  if ("segment" in locator) return `og disc ${String(locator.disc)} · ${locator.segment}`;
  if ("chapter" in locator) return `${locator.title} ch. ${String(locator.chapter)}`;
  return `${locator.title} ${locator.part}`;
}
