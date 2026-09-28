import { type Db, reference } from "@ffvii/db";
import { CertaintySchema, LocatorSchema, TitleCodeSchema } from "@ffvii/shared";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";

const Reference = z.object({
  titles: z.array(
    z.object({
      code: TitleCodeSchema,
      name: z.string(),
      shortName: z.string(),
      released: z.string(),
      series: z.enum(["original", "remake"]),
      units: z.array(z.object({ key: z.string(), name: z.string(), position: z.number() })),
      coverage: z
        .object({
          from: z.string(),
          to: z.string(),
          segments: z.array(z.string()),
          notes: z.string().nullable(),
        })
        .nullable()
        .describe("The original segments this title retells; null if it retells none."),
    }),
  ),
  segments: z.array(
    z.object({ id: z.string(), name: z.string(), disc: z.number(), summary: z.string() }),
  ),
  arcs: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      summary: z.string(),
      og: z.object({ from: z.string(), to: z.string() }),
      chapters: z.record(z.string(), z.tuple([z.number(), z.number()])),
    }),
  ),
  eras: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      start: z.number(),
      end: z.number(),
      weight: z.number(),
    }),
  ),
  worlds: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      summary: z.string(),
      firstShown: LocatorSchema.nullable(),
      branchesFrom: z.string().nullable(),
      sources: z.array(LocatorSchema).nullable(),
      certainty: CertaintySchema.nullable(),
      notes: z.string().nullable(),
    }),
  ),
});

export const referenceRoutes: FastifyPluginCallbackZod<{ db: Db }> = (app, { db }, done) => {
  app.get(
    "/reference",
    {
      schema: {
        tags: ["reference"],
        summary: "Titles, original segments, arcs, eras and worlds",
        description:
          "Everything needed to label and lay out the rest of the data. It changes only when the dataset is redeployed.",
        response: { 200: Reference },
      },
    },
    () => reference(db),
  );
  done();
};
