import { fileURLToPath } from "node:url";
import { type Dataset, loadDataset, readDataDir } from "@ffvii/data";
import { buildSeedRows, connect, seed } from "@ffvii/db";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "./app.ts";

// Integration tests against a real, freshly seeded Postgres (`pnpm db:up && pnpm db:migrate`).

const DATA_DIR = fileURLToPath(new URL("../../../data/", import.meta.url));
const { db, close } = connect();
const dataset: Dataset = loadDataset(await readDataDir(DATA_DIR)).dataset;
let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
  await seed(db, buildSeedRows(dataset));
  app = await buildApp({ db });
});

afterAll(async () => {
  await app.close();
  await close();
});

async function get(url: string) {
  const response = await app.inject({ method: "GET", url });
  const body: any = response.body === "" ? null : response.json();
  return { status: response.statusCode, body, response };
}

describe("basics", () => {
  it("reports health without caching", async () => {
    const { status, body, response } = await get("/health");
    expect(status).toBe(200);
    expect(body).toEqual({ status: "ok" });
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("marks data responses cacheable", async () => {
    const { response } = await get("/reference");
    expect(response.headers["cache-control"]).toBe("public, max-age=300");
  });

  it("serves OpenAPI docs for every route", async () => {
    const { status, body } = await get("/docs/json");
    expect(status).toBe(200);
    expect(Object.keys(body.paths).sort()).toEqual([
      "/compare/{id}",
      "/differences",
      "/entities",
      "/entities/{id}",
      "/health",
      "/network/{id}",
      "/play-order/{title}",
      "/reference",
      "/search",
      "/timeline",
    ]);
  });

  it("answers unknown routes and bad parameters with JSON errors", async () => {
    expect(await get("/nope")).toMatchObject({ status: 404, body: { error: "not_found" } });
    expect(await get("/timeline?titles=og,zz")).toMatchObject({
      status: 400,
      body: { error: "bad_request" },
    });
    expect((await get("/entities?kind=titan")).status).toBe(400);
    expect((await get("/network/character_cloud_strife?depth=4")).status).toBe(400);
    expect((await get("/search")).status).toBe(400);
  });
});

describe("reference and entities", () => {
  it("returns the reference bundle", async () => {
    const { body } = await get("/reference");
    expect(body.titles.map((t: { code: string }) => t.code)).toEqual([
      "og",
      "remake",
      "intermission",
      "rebirth",
    ]);
    expect(body.segments).toHaveLength(dataset.segments.length);
  });

  it("lists and filters entities", async () => {
    expect((await get("/entities")).body.items).toHaveLength(dataset.entities.size);
    const { body } = await get("/entities?kind=location&title=intermission");
    expect(body.items.map((e: { id: string }) => e.id)).toEqual([
      "location_midgar",
      "location_sector_7",
    ]);
  });

  it("returns one entity, or 404", async () => {
    const { status, body } = await get("/entities/event_nibelheim_incident");
    expect(status).toBe(200);
    expect(body.event.start).toEqual({ earliest: -5, latest: -5 });
    expect(body.appearances.map((a: { title: string }) => a.title)).toEqual([
      "og",
      "remake",
      "rebirth",
    ]);
    expect(await get("/entities/character_nobody")).toMatchObject({
      status: 404,
      body: { error: "not_found" },
    });
  });

  it("redirects retired IDs and reports removed ones", async () => {
    await db.execute(sql`
      insert into id_redirects (old_id, new_id) values
        ('character_aeris', 'character_aerith_gainsborough'),
        ('character_gone', null)
    `);
    const { status, response } = await get("/compare/character_aeris?titles=og,remake");
    expect(status).toBe(308);
    expect(response.headers.location).toBe(
      "/compare/character_aerith_gainsborough?titles=og,remake",
    );
    expect(await get("/entities/character_gone")).toMatchObject({
      status: 404,
      body: { error: "removed" },
    });
    await db.execute(
      sql`delete from id_redirects where old_id in ('character_aeris', 'character_gone')`,
    );
  });
});

describe("timeline, comparison, network and search", () => {
  it("returns the timeline for the chosen titles", async () => {
    const all = (await get("/timeline")).body.items;
    expect(all[0].id).toBe("event_nibelheim_incident");
    const intermission = (await get("/timeline?titles=intermission")).body.items;
    expect(intermission.map((e: { id: string }) => e.id)).toEqual(["event_sector_7_plate_fall"]);
  });

  it("returns a title's play order", async () => {
    const { body } = await get("/play-order/rebirth?kind=event");
    expect(body.items.map((i: { id: string }) => i.id)).toEqual([
      "event_nibelheim_incident",
      "event_aerith_death",
    ]);
  });

  it("compares titles with derived statuses", async () => {
    const { body } = await get("/compare/event_cloud_memories_restored?titles=og,remake,rebirth");
    expect(body.columns.map((c: { status: string }) => c.status)).toEqual([
      "depicted",
      "not_yet_reached",
      "not_yet_reached",
    ]);
  });

  it("lists differences with filters", async () => {
    const { body } = await get("/differences?titles=og,remake&category=participants");
    expect(body.items.map((d: { id: string }) => d.id)).toEqual([
      "event_sector_7_plate_fall:rude_fights",
    ]);
  });

  it("returns a network slice", async () => {
    const { body } = await get("/network/location_nibelheim?depth=2&titles=og");
    expect(body.center).toBe("location_nibelheim");
    expect(body.nodes.map((n: { id: string }) => n.id)).toContain("character_sephiroth");
    expect(await get("/network/character_nobody")).toMatchObject({ status: 404 });
  });

  it("searches", async () => {
    const { body } = await get("/search?q=aeris");
    expect(body.items[0]).toMatchObject({ id: "character_aerith_gainsborough", reason: "name" });
  });
});

describe("every entity, every endpoint", () => {
  // Responses are checked against their schemas before they're sent; a mismatch is a 500.
  it("serves every entity through every per-entity endpoint", async () => {
    for (const id of dataset.entities.keys()) {
      for (const url of [`/entities/${id}`, `/compare/${id}`, `/network/${id}?depth=2`]) {
        const { status, body } = await get(url);
        expect({ url, status, body: status === 200 ? "ok" : body }).toEqual({
          url,
          status: 200,
          body: "ok",
        });
      }
    }
  });

  it("serves every title's play order", async () => {
    for (const title of ["og", "remake", "intermission", "rebirth"]) {
      expect((await get(`/play-order/${title}`)).status).toBe(200);
    }
  });
});
