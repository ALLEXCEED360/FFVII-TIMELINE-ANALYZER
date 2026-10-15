import { type Db, entity, listEntities, loadCoverageIndex } from "@ffvii/db";
import { TITLES_IN_ORDER, TitleCodeSchema, displayStatus } from "@ffvii/shared";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  Appearance,
  Difference,
  DisplayStatusEnum,
  EntityId,
  EntityInfo,
  EntityKindEnum,
  EntityRef,
  ErrorBody,
  Relationship,
} from "../schemas.ts";
import { NOT_FOUND, redirectRetired } from "./redirects.ts";

const EntityDetail = EntityInfo.extend({
  appearances: z.array(Appearance).describe("One per title and world, in release order."),
  differences: z.array(Difference),
  relationships: z.array(Relationship),
  statuses: z
    .record(TitleCodeSchema, DisplayStatusEnum)
    .describe(
      "Each title's status for it in the main world, stored or derived: a title that retells this part of the story without recording it is `undocumented`, not `absent`.",
    ),
});

export const entityRoutes: FastifyPluginCallbackZod<{ db: Db }> = (app, { db }, done) => {
  app.get(
    "/entities",
    {
      schema: {
        tags: ["entities"],
        summary: "List entities, optionally one kind or only those a title shows",
        querystring: z.object({
          kind: EntityKindEnum.optional(),
          title: TitleCodeSchema.optional().describe("Only entities this title shows."),
        }),
        response: {
          200: z.object({
            items: z.array(
              EntityRef.extend({
                summary: z.string(),
                titles: z.array(TitleCodeSchema).describe("Titles it appears in."),
              }),
            ),
          }),
        },
      },
    },
    async ({ query: { kind, title } }) => ({ items: await listEntities(db, { kind, title }) }),
  );

  app.get(
    "/entities/:id",
    {
      schema: {
        tags: ["entities"],
        summary: "One entity: its appearances in every title, differences and relationships",
        params: z.object({ id: EntityId }),
        response: { 200: EntityDetail, 404: ErrorBody },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const found = await entity(db, id);
      if (found === undefined) return reply.code(404).send(NOT_FOUND);
      if ("redirectTo" in found) {
        return redirectRetired(request, reply, { oldId: id, newId: found.redirectTo });
      }
      const index = await loadCoverageIndex(db);
      const subject = { appearances: found.appearances, ogSegment: found.ogSegmentId ?? undefined };
      const statuses = Object.fromEntries(
        TITLES_IN_ORDER.map((title) => [title, displayStatus(subject, title, index)]),
      ) as Record<(typeof TITLES_IN_ORDER)[number], ReturnType<typeof displayStatus>>;
      return { ...found, statuses };
    },
  );
  done();
};
