import { type Db, network } from "@ffvii/db";
import { TitleCodeSchema } from "@ffvii/shared";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  EdgeCategoryEnum,
  EdgeTypeEnum,
  EntityId,
  EntityRef,
  ErrorBody,
  Titles,
} from "../schemas.ts";
import { NOT_FOUND } from "./redirects.ts";

const Network = z.object({
  center: z.string(),
  nodes: z.array(EntityRef.extend({ depth: z.number().describe("Steps from the centre.") })),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      type: EdgeTypeEnum,
      category: EdgeCategoryEnum,
      label: z.string(),
      weight: z.number().describe("Cost in shortest-path search; lower is a stronger link."),
      titles: z.array(TitleCodeSchema).describe("Which requested titles establish it."),
    }),
  ),
});

export const networkRoutes: FastifyPluginCallbackZod<{ db: Db }> = (app, { db }, done) => {
  app.get(
    "/network/:id",
    {
      schema: {
        tags: ["network"],
        summary: "An entity's neighbourhood in the relationship graph",
        description:
          "Every entity within `depth` relationships of `id`, and the relationships among them, following only relationships that one of `titles` establishes.",
        params: z.object({ id: EntityId }),
        querystring: z.object({
          depth: z.coerce.number().int().min(1).max(3).default(1),
          titles: Titles,
        }),
        response: { 200: Network, 404: ErrorBody },
      },
    },
    async ({ params: { id }, query: { depth, titles } }, reply) => {
      const found = await network(db, { id, depth, titles });
      return found ?? reply.code(404).send(NOT_FOUND);
    },
  );
  done();
};
