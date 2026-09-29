import { type Db, divergenceEvents, loadCoverageIndex } from "@ffvii/db";
import {
  DifferenceCategorySchema,
  type TitleCode,
  TitleCodeSchema,
  branchKey,
  computeDivergence,
  divergencePoints,
} from "@ffvii/shared";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { EntityId, ErrorBody, MagnitudeEnum, Titles } from "../schemas.ts";
import { NOT_FOUND } from "./redirects.ts";

// The Divergence view (docs/features/divergence.md, decision 0011): computed in the shared package
// from every event's appearances and differences.

const DEFAULT_TITLES: TitleCode[] = ["og", "remake", "rebirth"];

const DivergenceTitles = Titles.refine(
  (titles) => titles === undefined || titles.length >= 2,
  "compare at least two titles",
);

const EventRef = z.object({
  id: z.string(),
  name: z.string(),
  start: z.number().describe("Earliest in-universe year; 0 is the year the story begins."),
  importance: z.number(),
});

const Station = z.object({
  marking: z
    .enum([
      "shared",
      "changed",
      "only_here",
      "not_yet_retold",
      "omitted",
      "not_yet_reached",
      "undocumented",
    ])
    .describe("How this branch shows the event, relative to the other branches."),
  differences: z.array(
    z.object({ id: z.string(), category: DifferenceCategorySchema, magnitude: MagnitudeEnum }),
  ),
  missingIn: z
    .array(z.string())
    .describe("Branches (`title/world`) that cover this part of the story but don't show it."),
});

const Row = z.object({
  event: EventRef,
  stations: z
    .array(Station.nullable())
    .describe("One per branch, in the order of `branches`; null if that branch doesn't show it."),
});

const Divergence = z.object({
  pivot: EventRef,
  branches: z.array(z.object({ key: z.string(), title: TitleCodeSchema, world: z.string() })),
  trunk: z.array(Row).describe("Events before the pivot: the common history."),
  events: z.array(Row).describe("The pivot and everything after it, per branch."),
});

export const divergenceRoutes: FastifyPluginCallbackZod<{ db: Db }> = (app, { db }, done) => {
  app.get(
    "/divergence",
    {
      schema: {
        tags: ["divergence"],
        summary: "Divergence points: events where the chosen titles differ",
        querystring: z.object({ titles: DivergenceTitles }),
        response: {
          200: z.object({
            items: z.array(EventRef.extend({ differences: z.number(), major: z.number() })),
          }),
        },
      },
    },
    async ({ query }) => {
      const events = await divergenceEvents(db);
      const byId = new Map(events.map((e) => [e.id, e]));
      return {
        items: divergencePoints(events, query.titles ?? DEFAULT_TITLES).flatMap((point) => {
          const event = byId.get(point.eventId);
          return event
            ? [
                {
                  id: event.id,
                  name: event.name,
                  start: event.start,
                  importance: event.importance,
                  differences: point.differences,
                  major: point.major,
                },
              ]
            : [];
        }),
      };
    },
  );

  app.get(
    "/divergence/:id",
    {
      schema: {
        tags: ["divergence"],
        summary: "Where the chosen titles — and optionally worlds — part ways around an event",
        description:
          "Events before the pivot form the trunk; from the pivot on, each title (and, with `worlds=true`, each other world it shows) is a branch. Each station is marked relative to the other branches: shared, changed, only here, not yet retold, omitted, not yet reached or undocumented.",
        params: z.object({ id: EntityId }),
        querystring: z.object({
          titles: DivergenceTitles,
          worlds: z.stringbool().default(false).describe("Add other worlds as branches."),
        }),
        response: { 200: Divergence, 404: ErrorBody },
      },
    },
    async ({ params: { id }, query }, reply) => {
      const events = await divergenceEvents(db);
      const result = computeDivergence(
        events,
        id,
        query.titles ?? DEFAULT_TITLES,
        await loadCoverageIndex(db),
        { worlds: query.worlds },
      );
      if (!result) return reply.code(404).send(NOT_FOUND);
      const byId = new Map(events.map((e) => [e.id, e]));
      const ref = (eventId: string) => {
        const e = byId.get(eventId);
        if (!e) throw new Error(`unknown event ${eventId}`);
        return { id: e.id, name: e.name, start: e.start, importance: e.importance };
      };
      const keys = result.branches.map(branchKey);
      const row = (r: (typeof result.events)[number]) => ({
        event: ref(r.eventId),
        stations: keys.map((key) => r.stations[key] ?? null),
      });
      return {
        pivot: ref(result.pivot),
        branches: result.branches.map((b) => ({ key: branchKey(b), ...b })),
        trunk: result.trunk.map(row),
        events: result.events.map(row),
      };
    },
  );
  done();
};
