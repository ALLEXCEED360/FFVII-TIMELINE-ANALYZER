import { type Db, comparison, listDifferences } from "@ffvii/db";
import { DifferenceCategorySchema, TitleCodeSchema } from "@ffvii/shared";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  Appearance,
  Difference,
  DisplayStatusEnum,
  EntityId,
  EntityInfo,
  EntityRef,
  ErrorBody,
  MagnitudeEnum,
  Relationship,
  Titles,
} from "../schemas.ts";
import { NOT_FOUND, redirectRetired } from "./redirects.ts";

const Comparison = z.object({
  entity: EntityInfo,
  isNew: z.boolean().describe("Appears in the Remake series but not in the original."),
  columns: z.array(
    z.object({
      title: TitleCodeSchema,
      status: DisplayStatusEnum.describe(
        "Stored (`depicted`, `referenced`, `omitted`) or derived (`not_yet_reached`, `undocumented`, `absent`) — docs/model/appearances.md §3.",
      ),
      changed: z.boolean().describe("A documented difference targets this title."),
      appearance: Appearance.nullable().describe("The main-world appearance, if any."),
      otherWorlds: z.array(Appearance),
    }),
  ),
  differences: z
    .array(Difference)
    .describe("Only those with both sides among the compared titles."),
  relationships: z.array(
    Relationship.extend({ shared: z.boolean().describe("Every compared title establishes it.") }),
  ),
});

export const compareRoutes: FastifyPluginCallbackZod<{ db: Db }> = (app, { db }, done) => {
  app.get(
    "/compare/:id",
    {
      schema: {
        tags: ["compare"],
        summary: "How the chosen titles present one entity, side by side",
        params: z.object({ id: EntityId }),
        querystring: z.object({ titles: Titles }),
        response: { 200: Comparison, 404: ErrorBody },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const found = await comparison(db, id, request.query.titles);
      if (found === undefined) return reply.code(404).send(NOT_FOUND);
      if ("redirectTo" in found) {
        return redirectRetired(request, reply, { oldId: id, newId: found.redirectTo });
      }
      return found;
    },
  );

  app.get(
    "/differences",
    {
      schema: {
        tags: ["compare"],
        summary: "Every documented difference between the chosen titles",
        description: "Events come first, in in-universe order; then other entities by name.",
        querystring: z.object({
          titles: Titles,
          category: DifferenceCategorySchema.optional(),
          magnitude: MagnitudeEnum.optional(),
        }),
        response: {
          200: z.object({ items: z.array(Difference.extend({ entity: EntityRef })) }),
        },
      },
    },
    async ({ query }) => ({ items: await listDifferences(db, query) }),
  );
  done();
};
