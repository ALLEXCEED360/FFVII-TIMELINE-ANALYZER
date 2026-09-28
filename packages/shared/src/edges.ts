import { z } from "zod";
import { DateRefSchema } from "./chronology.ts";
import type { EdgeType } from "./edge-types.ts";
import { checkFact, factShape } from "./facts.ts";
import { EntityIdSchema, MAIN_WORLD, WorldIdSchema, idOfKind } from "./ids.ts";
import { type TitleCode, TitleCodeSchema } from "./titles.ts";

// Relationships as written in an entity's file: the file's entity is the source
// (docs/model/relationships.md §2–3). Kind rules are checked by the validator.

/** The evidence for an edge in one title. */
export const TitleScopeSchema = z
  .strictObject({ world: WorldIdSchema.default(MAIN_WORLD), ...factShape })
  .superRefine(checkFact);
export type TitleScope = z.infer<typeof TitleScopeSchema>;

const TitlesSchema = z
  .partialRecord(TitleCodeSchema, TitleScopeSchema)
  .superRefine((titles, ctx) => {
    const entries = Object.entries(titles);
    if (entries.length === 0) {
      ctx.addIssue({ code: "custom", message: "list at least one title that establishes this" });
    }
    for (const [title, scope] of entries) {
      scope.sources.forEach((source, index) => {
        if (source.title !== title) {
          ctx.addIssue({
            code: "custom",
            path: [title, "sources", index, "title"],
            message: `must be \`${title}\``,
          });
        }
      });
    }
  });

const common = { target: EntityIdSchema, titles: TitlesSchema };
const time = { from: DateRefSchema.optional(), until: DateRefSchema.optional() };
const optionalText = z.string().trim().min(1).optional();

/** An edge type that may carry `from` / `until`. */
function timedEdge<T extends EdgeType, A extends z.ZodRawShape>(type: T, attributes: A) {
  return z.strictObject({ type: z.literal(type), ...common, ...time, ...attributes });
}

/** An edge type with no time bounds of its own. */
function plainEdge<T extends EdgeType, A extends z.ZodRawShape>(type: T, attributes: A) {
  return z.strictObject({ type: z.literal(type), ...common, ...attributes });
}

export const EDGE_SCHEMAS = [
  // Structural
  plainEdge("parent_of", { kind: z.enum(["biological", "adoptive"]) }),
  plainEdge("sibling_of", {}),
  timedEdge("spouse_of", {}),
  timedEdge("member_of", { role: optionalText }),
  timedEdge("leads", { title: optionalText }),
  timedEdge("part_of", {}),
  plainEdge("hometown", {}),
  timedEdge("lives_in", {}),
  timedEdge("based_at", {}),
  timedEdge("controls", {}),
  // Event
  plainEdge("participated_in", { role: optionalText }),
  plainEdge("occurred_at", {}),
  plainEdge("sub_event_of", {}),
  plainEdge("killed", { in: idOfKind("event").optional() }),
  // Causal and experimental
  plainEdge("caused", {}),
  timedEdge("experimented_on", {}),
  timedEdge("acted_through", {}),
] as const;

export const EdgeInFileSchema = z.discriminatedUnion("type", EDGE_SCHEMAS);
export type EdgeInFile = z.infer<typeof EdgeInFileSchema>;

/** An edge with its source filled in from the file it was written in. */
export type Edge = EdgeInFile & { source: string };

/** The titles that establish an edge, in no particular order. */
export function edgeTitles(edge: EdgeInFile): TitleCode[] {
  return Object.keys(edge.titles) as TitleCode[];
}
