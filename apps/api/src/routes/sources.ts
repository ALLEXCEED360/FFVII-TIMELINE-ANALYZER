import { type Db, research, sourceCatalogue, sourceUnit } from "@ffvii/db";
import {
  CertaintySchema,
  DifferenceCategorySchema,
  FramingSchema,
  LocatorSchema,
  SOURCE_KINDS,
  SOURCE_ROLES,
  StoredStatusSchema,
  TitleCodeSchema,
} from "@ffvii/shared";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { EdgeTypeEnum, EntityRef, ErrorBody, MagnitudeEnum, OpenQuestion } from "../schemas.ts";

// The archive (docs/decisions/0012-archive-and-sources.md): the titles as sources, unit by unit,
// and the research log.

const Unit = z.object({
  key: z.string().describe("The original's segment ID, a chapter number, or a part's key."),
  name: z.string(),
  disc: z.number().nullable().describe("The original's disc; null for chaptered titles."),
  position: z.number(),
});

const Scenes = z.array(z.string()).describe("Scenes named by the citations.");
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
      certainty: CertaintySchema,
      cited: z.boolean().describe("The appearance's own sources cite this unit."),
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
      certainty: CertaintySchema,
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
      certainty: CertaintySchema,
      scenes: Scenes,
    }),
  ),
  worlds: z.array(
    z.object({ id: z.string(), name: z.string(), certainty: CertaintySchema, scenes: Scenes }),
  ),
});

const Research = z.object({
  sources: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      kind: z.enum(SOURCE_KINDS),
      role: z.enum(SOURCE_ROLES),
      covers: z.array(TitleCodeSchema),
      usedFor: z.string(),
      url: z.string().nullable(),
      accessed: z.string().nullable(),
      notes: z.string().nullable(),
    }),
  ),
  questions: z.array(OpenQuestion),
  certainty: z
    .object({ stated: z.number(), inferred: z.number(), ambiguous: z.number() })
    .describe("Facts by certainty: appearances, differences, relationships per title, worlds."),
  interpretations: z
    .array(
      z.object({
        kind: z.enum(["appearance", "difference", "relationship", "world"]),
        certainty: z.enum(["inferred", "ambiguous"]),
        notes: z.string(),
        subject: z.object({ id: z.string(), name: z.string(), kind: z.string() }),
        titles: z.array(TitleCodeSchema),
        label: z.string(),
        sources: z.array(LocatorSchema),
      }),
    )
    .describe("Facts that are inferred or ambiguous, with the notes that explain them."),
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

  app.get(
    "/research",
    {
      schema: {
        tags: ["archive"],
        summary: "The research log: sources used, open questions, and facts by certainty",
        response: { 200: Research },
      },
    },
    async () => research(db),
  );
  done();
};
