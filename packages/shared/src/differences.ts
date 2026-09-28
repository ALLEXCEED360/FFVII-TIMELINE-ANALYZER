import { z } from "zod";
import { checkFact, factShape } from "./facts.ts";
import { EntityIdSchema, KeySchema, MAIN_WORLD, WorldIdSchema } from "./ids.ts";
import { TitleCodeSchema } from "./titles.ts";

// How two titles present the same entity differently (docs/model/appearances.md §5).

export const DIFFERENCE_CATEGORIES = [
  "presentation",
  "participants",
  "setting",
  "chronology",
  "outcome",
  "role",
  "relationship",
  "context",
  "gameplay",
] as const;
export const DifferenceCategorySchema = z.enum(DIFFERENCE_CATEGORIES);
export type DifferenceCategory = z.infer<typeof DifferenceCategorySchema>;

export const SideSchema = z.strictObject({
  title: TitleCodeSchema,
  world: WorldIdSchema.default(MAIN_WORLD),
});
export type Side = z.infer<typeof SideSchema>;

export const DifferenceSchema = z
  .strictObject({
    key: KeySchema,
    from: SideSchema,
    to: SideSchema,
    category: DifferenceCategorySchema,
    magnitude: z.enum(["minor", "major"]),
    /** One neutral sentence: "In X …; in Y …" (canon-and-sources.md §11). */
    summary: z.string().trim().min(1),
    related: z.array(EntityIdSchema).optional(),
    ...factShape,
  })
  .superRefine((difference, ctx) => {
    checkFact(difference, ctx);
    const { from, to } = difference;
    if (from.title === to.title && from.world === to.world) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: "a difference needs two different titles, or two worlds of one title",
      });
    }
    for (const side of ["from", "to"] as const) {
      const title = difference[side].title;
      if (!difference.sources.some((source) => source.title === title)) {
        ctx.addIssue({
          code: "custom",
          path: ["sources"],
          message: `cite both sides — nothing cites \`${title}\` (${side})`,
        });
      }
    }
    difference.sources.forEach((source, index) => {
      if (source.title !== from.title && source.title !== to.title) {
        ctx.addIssue({
          code: "custom",
          path: ["sources", index, "title"],
          message: `citations must be from \`${from.title}\` or \`${to.title}\``,
        });
      }
    });
  });
export type Difference = z.infer<typeof DifferenceSchema>;
