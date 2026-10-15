import { type Db, sourceCatalogue, sourceUnit } from "@ffvii/db";
import {
  DifferenceCategorySchema,
  FramingSchema,
  StoredStatusSchema,
  TitleCodeSchema,
} from "@ffvii/shared";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { EdgeTypeEnum, EntityRef, ErrorBody, MagnitudeEnum } from "../schemas.ts";

// The archive (docs/decisions/0012-archive-and-sources.md): the titles as sources, unit by unit.

const Unit = z.object({
  key: z.string().describe("The original's segment ID, a chapter number, or a part's key."),
  name: z.string(),
  disc: z.number().nullable().describe("The original's disc; null for chaptered titles."),
  position: z.number(),
});

const Scenes = z.array(z.string()).describe("Scenes named by the citations.");
const Optional = z
  .boolean()
  .describe("Only in some playthroughs: every citation here is optional.");
const Side = z.object({ title: TitleCodeSchema, world: z.string() });

const SourceUnitDetail = z.object({
  title: TitleCodeSchema,
  unit: Unit.extend({ summary: z.string().nullable() }),
  previous: Unit.nullable(),
  next: Unit.nullable(),
  appearances: z.array(
    z.object({
      entity: EntityRef,
      world: z.string(),
      status: StoredStatusSchema,
      role: z.string().nullable(),
      summary: z.string(),
      cited: z.boolean().describe("The appearance's own sources cite this unit."),
      optional: Optional,
      depictions: z
        .array(z.object({ framing: FramingSchema, note: z.string().nullable() }))
        .describe("Depictions set in this unit."),
      scenes: Scenes,
    }),
  ),
  differences: z.array(
    z.object({
      id: z.string(),
      entity: EntityRef,
      from: Side,
      to: Side,
      category: DifferenceCategorySchema,
      magnitude: MagnitudeEnum,
      summary: z.string(),
      scenes: Scenes,
    }),
  ),
  relationships: z.array(
    z.object({
      id: z.string(),
      type: EdgeTypeEnum,
      label: z.string(),
      source: EntityRef,
      target: EntityRef,
      world: z.string(),
      role: z.string().nullable().describe("What the source did in it."),
      optional: Optional,
      scenes: Scenes,
    }),
  ),
  worlds: z.array(z.object({ id: z.string(), name: z.string(), scenes: Scenes })),
});

export const sourceRoutes: FastifyPluginCallbackZod<{ db: Db }> = (app, { db }, done) => {
  app.get(
    "/sources",
    {
      schema: {
        tags: ["archive"],
        summary: "Every unit of every title, with how many citations point into it",
        response: {
          200: z.object({
            titles: z.array(
              z.object({
                code: TitleCodeSchema,
                units: z.array(
                  Unit.extend({
                    citations: z.number(),
                    subjects: z.number().describe("Distinct entities and worlds cited."),
                  }),
                ),
              }),
            ),
          }),
        },
      },
    },
    async () => ({ titles: await sourceCatalogue(db) }),
  );

  app.get(
    "/sources/:title/:unit",
    {
      schema: {
        tags: ["archive"],
        summary: "One unit of a title (segment, chapter or part) and every fact that cites it",
        params: z.object({ title: TitleCodeSchema, unit: z.string().min(1).max(100) }),
        response: { 200: SourceUnitDetail, 404: ErrorBody },
      },
    },
    async ({ params: { title, unit } }, reply) => {
      const found = await sourceUnit(db, title, unit);
      return found ?? reply.code(404).send({ error: "not_found", message: "No such unit." });
    },
  );

  done();
};
