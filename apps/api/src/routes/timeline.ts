import { type Db, playOrder, timeline } from "@ffvii/db";
import {
  FramingSchema,
  LocatorSchema,
  MAIN_WORLD,
  StoredStatusSchema,
  TitleCodeSchema,
} from "@ffvii/shared";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { EntityKindEnum, Titles, YearBounds } from "../schemas.ts";

const TimelineEvent = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string(),
  importance: z.number(),
  arcId: z.string(),
  seq: z.number().nullable(),
  start: YearBounds,
  end: YearBounds,
  appearances: z.array(
    z.object({
      title: TitleCodeSchema,
      world: z.string(),
      status: StoredStatusSchema,
      playPosition: z.number().nullable(),
      framing: FramingSchema.nullable(),
      start: YearBounds.nullable().describe("This title's own time, when it differs."),
      end: YearBounds.nullable(),
    }),
  ),
});

export const timelineRoutes: FastifyPluginCallbackZod<{ db: Db }> = (app, { db }, done) => {
  app.get(
    "/timeline",
    {
      schema: {
        tags: ["timeline"],
        summary: "Events in in-universe order, with how each title shows them",
        description:
          "Year 0 is the year the main story begins; earlier years are negative. Events sort by (earliest year, seq, id). Only events shown in at least one of `titles` are returned, each with its appearances in those titles.",
        querystring: z.object({ titles: Titles }),
        response: { 200: z.object({ items: z.array(TimelineEvent) }) },
      },
    },
    async ({ query: { titles } }) => ({ items: await timeline(db, { titles }) }),
  );

  app.get(
    "/play-order/:title",
    {
      schema: {
        tags: ["timeline"],
        summary: "What a title shows, in the order the player sees it",
        params: z.object({ title: TitleCodeSchema }),
        querystring: z.object({
          world: z.string().max(100).default(MAIN_WORLD),
          kind: EntityKindEnum.optional(),
        }),
        response: {
          200: z.object({
            items: z.array(
              z.object({
                id: z.string(),
                kind: EntityKindEnum,
                name: z.string(),
                status: StoredStatusSchema,
                playPosition: z.number(),
                framing: FramingSchema,
                locator: LocatorSchema,
              }),
            ),
          }),
        },
      },
    },
    async ({ params: { title }, query: { world, kind } }) => ({
      items: await playOrder(db, { title, world, kind }),
    }),
  );
  done();
};
