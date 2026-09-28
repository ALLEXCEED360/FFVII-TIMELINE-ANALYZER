import { z } from "zod";
import { WhenSchema } from "./chronology.ts";
import { checkFact, factShape } from "./facts.ts";
import { MAIN_WORLD, WorldIdSchema } from "./ids.ts";
import { type Locator, LocatorSchema } from "./locators.ts";
import { TitleCodeSchema } from "./titles.ts";

// How one title presents an entity, in one world (docs/model/appearances.md §2–4).

export const FRAMINGS = [
  "direct",
  "flashback",
  "false_account",
  "disputed_account",
  "vision",
  "mention",
  "glimpse",
] as const;
export const FramingSchema = z.enum(FRAMINGS);
export type Framing = z.infer<typeof FramingSchema>;

export const DepictionSchema = z.strictObject({
  at: LocatorSchema,
  framing: FramingSchema,
  /** Orders several depictions in the same chapter or segment. */
  seq: z.int().positive().optional(),
  /** Marks this depiction as the appearance's play position (default: the first). */
  primary: z.literal(true).optional(),
  note: z.string().trim().min(1).optional(),
});
export type Depiction = z.infer<typeof DepictionSchema>;

export const STORED_STATUSES = ["depicted", "referenced", "omitted"] as const;
export const StoredStatusSchema = z.enum(STORED_STATUSES);
export type StoredStatus = z.infer<typeof StoredStatusSchema>;

export const AppearanceSchema = z
  .strictObject({
    title: TitleCodeSchema,
    world: WorldIdSchema.default(MAIN_WORLD),
    status: StoredStatusSchema,
    summary: z.string().trim().min(1),
    depictions: z.array(DepictionSchema).default([]),
    /** Only when this title places the entity at a different in-universe time (chronology.md §5). */
    when: WhenSchema.optional(),
    /** Characters only: their role in this title, in a short phrase. */
    role: z.string().trim().min(1).optional(),
    ...factShape,
  })
  .superRefine((appearance, ctx) => {
    checkFact(appearance, ctx);
    const issue = (path: PropertyKey[], message: string) => {
      ctx.addIssue({ code: "custom", path, message });
    };

    if (appearance.status === "omitted") {
      if (appearance.depictions.length > 0) {
        issue(["depictions"], "an omitted appearance has no depictions");
      }
    } else if (appearance.depictions.length === 0) {
      issue(["depictions"], `a ${appearance.status} appearance needs at least one depiction`);
    }

    appearance.depictions.forEach((depiction, index) => {
      if (depiction.at.title !== appearance.title) {
        issue(["depictions", index, "at", "title"], `must be \`${appearance.title}\``);
      }
    });
    appearance.sources.forEach((source, index) => {
      if (source.title !== appearance.title) {
        issue(["sources", index, "title"], `must be \`${appearance.title}\``);
      }
    });
    if (appearance.depictions.filter((d) => d.primary).length > 1) {
      issue(["depictions"], "only one depiction can be `primary`");
    }
  });
export type Appearance = z.infer<typeof AppearanceSchema>;

/** The depiction that sets the appearance's play position (appearances.md §4). */
export function primaryDepiction(appearance: Appearance): Depiction | undefined {
  return appearance.depictions.find((d) => d.primary) ?? appearance.depictions[0];
}

export function appearanceKey(title: string, world: string): string {
  return `${title}/${world}`;
}

/** Every locator an appearance mentions — its citations and its depictions. */
export function locatorsOf(appearance: Appearance): Locator[] {
  return [...appearance.sources, ...appearance.depictions.map((d) => d.at)];
}
