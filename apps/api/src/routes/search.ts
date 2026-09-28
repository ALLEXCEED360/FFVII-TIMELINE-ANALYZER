import { type Db, search } from "@ffvii/db";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { EntityRef } from "../schemas.ts";

export const searchRoutes: FastifyPluginCallbackZod<{ db: Db }> = (app, { db }, done) => {
  app.get(
    "/search",
    {
      schema: {
        tags: ["search"],
        summary: "Find entities by name, summary or connection",
        description:
          "Every word must match the entity's names or aliases (typos tolerated), its summary, how a title presents it, or the name of an entity it's related to. Exact and prefix name matches rank first.",
        querystring: z.object({
          q: z.string().trim().min(1).max(100),
          limit: z.coerce.number().int().min(1).max(50).default(10),
        }),
        response: {
          200: z.object({
            terms: z.array(z.string()).describe("The words searched for."),
            items: z.array(
              EntityRef.extend({
                reason: z.enum(["name", "summary", "appearance", "connection"]),
                detail: z
                  .string()
                  .nullable()
                  .describe("The matched name, the title code, or the connected entity's name."),
                score: z.number(),
              }),
            ),
          }),
        },
      },
    },
    async ({ query: { q, limit } }) => {
      const { terms, results } = await search(db, { q, limit });
      return { terms, items: results };
    },
  );
  done();
};
