import { type Db, entity, listEntities } from "@ffvii/db";
import { TitleCodeSchema } from "@ffvii/shared";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  Appearance,
  Difference,
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
      return found;
    },
  );
  done();
};
