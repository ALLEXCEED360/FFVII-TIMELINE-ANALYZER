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
      "/divergence",
      "/divergence/{id}",
      "/entities",
      "/entities/{id}",
      "/health",
      "/network/metrics",
      "/network/path",
      "/network/{id}",
      "/play-order/{title}",
      "/reference",
      "/research",
      "/search",
      "/sources",
      "/sources/{title}/{unit}",
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
    expect(
      (await get("/entities/event_aerith_death")).body.openQuestions.map(
        (q: { id: string }) => q.id,
      ),
    ).toEqual(["question_aerith_death_rebirth_visuals", "question_aerith_funeral_og"]);
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

  it("filters a network slice by relationship category", async () => {
    const { body } = await get("/network/character_cloud_strife?depth=1&categories=structural");
    expect(body.edges.map((e: { type: string }) => e.type)).toEqual(["hometown"]);
    expect((await get("/network/character_cloud_strife?categories=nope")).status).toBe(400);
  });

  it("finds the strongest path between two entities", async () => {
    const { body } = await get(
      "/network/path?from=character_tifa_lockhart&to=character_aerith_gainsborough",
    );
    expect(body.found).toBe(true);
    expect(body.nodes[0].id).toBe("character_tifa_lockhart");
    expect(body.nodes.at(-1).id).toBe("character_aerith_gainsborough");
    expect(body.edges).toHaveLength(body.nodes.length - 1);
  });

  it("routes around avoided entities, and reports when there's no path", async () => {
    const direct = (
      await get("/network/path?from=character_sephiroth&to=character_aerith_gainsborough")
    ).body;
    expect(direct).toMatchObject({ found: true, cost: 1 });
    const around = (
      await get(
        "/network/path?from=character_sephiroth&to=character_aerith_gainsborough&categories=structural",
      )
    ).body;
    expect(around).toEqual({ found: false, cost: null, nodes: [], edges: [] });
    expect(
      (
        await get(
          "/network/path?from=character_sephiroth&to=character_aerith_gainsborough&avoid=character_sephiroth",
        )
      ).status,
    ).toBe(400);
    expect((await get("/network/path?from=character_nobody&to=character_sephiroth")).status).toBe(
      404,
    );
  });

  it("reports groups and degree centrality", async () => {
    const { body } = await get("/network/metrics");
    expect(body.nodeCount).toBe(dataset.entities.size);
    expect(body.edgeCount).toBe(dataset.edges.length);
    expect(body.components[0].size).toBe(dataset.entities.size);
    expect(body.centrality[0]).toMatchObject({ id: "character_cloud_strife", degree: 6 });

    // INTERmission shows 7 of the entities; only Sector 7 and Midgar are linked there.
    const intermission = (await get("/network/metrics?titles=intermission")).body;
    expect(intermission.nodeCount).toBe(7);
    expect(intermission.components[0].members.map((m: { id: string }) => m.id)).toEqual([
      "location_midgar",
      "location_sector_7",
    ]);

    // An entity the chosen titles don't show stands alone rather than disappearing.
    const alone = (await get("/network/event_nibelheim_incident?titles=intermission")).body;
    expect(alone.nodes.map((n: { id: string }) => n.id)).toEqual(["event_nibelheim_incident"]);
  });

  it("lists divergence points and splits the titles around a pivot", async () => {
    const points = (await get("/divergence")).body.items.map((p: { id: string }) => p.id);
    expect(points).toEqual([
      "event_nibelheim_incident",
      "event_mako_reactor_1_bombing",
      "event_sector_7_plate_fall",
      "event_aerith_death",
    ]);

    const { body } = await get("/divergence/event_aerith_death?titles=og,rebirth");
    expect(body.branches.map((b: { key: string }) => b.key)).toEqual([
      "og/world_main",
      "rebirth/world_main",
    ]);
    expect(body.trunk.map((r: { event: { id: string } }) => r.event.id)).toEqual([
      "event_nibelheim_incident",
      "event_mako_reactor_1_bombing",
      "event_sector_7_plate_fall",
    ]);
    const [pivot, memories] = body.events;
    expect(pivot.stations.map((s: { marking: string }) => s.marking)).toEqual([
      "changed",
      "changed",
    ]);
    expect(memories.event.id).toBe("event_cloud_memories_restored");
    expect(memories.stations.map((s: { marking: string } | null) => s?.marking ?? null)).toEqual([
      "not_yet_retold",
      "not_yet_reached",
    ]);
  });

  it("adds world branches on request, and rejects a single title or unknown event", async () => {
    const { body } = await get(
      "/divergence/event_sector_7_plate_fall?titles=og,remake,rebirth&worlds=true",
    );
    expect(body.branches.map((b: { key: string }) => b.key)).toContain(
      "rebirth/world_zack_survives",
    );
    expect((await get("/divergence/event_aerith_death?titles=og")).status).toBe(400);
    expect((await get("/divergence/event_nothing")).status).toBe(404);
  });

  it("searches", async () => {
    const { body } = await get("/search?q=aeris");
    expect(body.items[0]).toMatchObject({ id: "character_aerith_gainsborough", reason: "name" });
  });
});

describe("archive", () => {
  it("lists every unit of every title with its citation count", async () => {
    const { status, body } = await get("/sources");
    expect(status).toBe(200);
    const units = (code: string) =>
      body.titles.find((t: { code: string }) => t.code === code).units as {
        key: string;
        disc: number | null;
        citations: number;
      }[];
    expect(body.titles.map((t: { code: string }) => t.code)).toEqual([
      "og",
      "remake",
      "intermission",
      "rebirth",
    ]);
    expect(units("og")).toHaveLength(dataset.segments.length);
    expect(units("og")[0]).toMatchObject({ key: "og_reactor_1", disc: 1 });
    // Rebirth's interlude comes before chapter 1.
    expect(
      units("rebirth")
        .map((u) => u.key)
        .slice(0, 2),
    ).toEqual(["interlude", "1"]);

    // Every locator in the dataset is counted exactly once.
    const total = body.titles
      .flatMap((t: { units: { citations: number }[] }) => t.units)
      .reduce((sum: number, u: { citations: number }) => sum + u.citations, 0);
    const locators = [...dataset.entities.values()].flatMap(({ entity }) => [
      ...entity.appearances.flatMap((a) => [...a.sources, ...a.depictions.map((d) => d.at)]),
      ...entity.differences.flatMap((d) => d.sources),
    ]);
    const edgeLocators = dataset.edges.flatMap(({ edge }) =>
      Object.values(edge.titles).flatMap((scope) => scope.sources),
    );
    const worldLocators = dataset.worlds.flatMap((w) => ("sources" in w ? w.sources : []));
    expect(total).toBe(locators.length + edgeLocators.length + worldLocators.length);
  });

  it("returns a unit with every fact that cites it, or 404", async () => {
    const { status, body } = await get("/sources/rebirth/14");
    expect(status).toBe(200);
    expect(body.unit).toMatchObject({ key: "14", name: "End of the World", disc: null });
    expect(body.previous.key).toBe("13");
    expect(body.next).toBeNull();
    expect(body.appearances.find((a: any) => a.entity.id === "event_aerith_death")).toMatchObject({
      world: "world_main",
      certainty: "ambiguous",
      cited: true,
    });
    expect(body.differences.map((d: { id: string }) => d.id)).toContain(
      "event_aerith_death:after_death",
    );
    expect(body.worlds.map((w: { id: string }) => w.id)).toEqual(["world_zack_survives"]);

    const segment = await get("/sources/og/og_kalm");
    expect(segment.body.unit.summary).toEqual(expect.any(String));
    expect(await get("/sources/og/og_nowhere")).toMatchObject({
      status: 404,
      body: { error: "not_found" },
    });
    expect((await get("/sources/crisis_core/1")).status).toBe(400);
  });

  it("serves every unit, citing exactly the facts the catalogue counts", async () => {
    const titles = (await get("/sources")).body.titles as {
      code: string;
      units: { key: string; citations: number }[];
    }[];
    for (const { code, units } of titles) {
      for (const unit of units) {
        const { status, body } = await get(`/sources/${code}/${unit.key}`);
        const lists: unknown[][] = [
          body.appearances,
          body.differences,
          body.relationships,
          body.worlds,
        ];
        const facts = lists.reduce((sum, list) => sum + list.length, 0);
        expect({ url: `${code}/${unit.key}`, status, cited: facts > 0 }).toEqual({
          url: `${code}/${unit.key}`,
          status: 200,
          cited: unit.citations > 0,
        });
      }
    }
  });

  it("returns the research log and the facts that aren't stated outright", async () => {
    const { status, body } = await get("/research");
    expect(status).toBe(200);
    expect(body.sources).toHaveLength(dataset.researchSources.length);
    expect(body.questions.map((q: { id: string }) => q.id)).toEqual(
      dataset.openQuestions.map((q) => q.id),
    );
    expect(
      body.questions.find((q: { id: string }) => q.id === "question_zack_last_stand").worlds,
    ).toEqual([{ id: "world_zack_survives", name: "Zack survives" }]);
    const { stated, inferred, ambiguous } = body.certainty as {
      stated: number;
      inferred: number;
      ambiguous: number;
    };
    expect(stated).toBeGreaterThan(0);
    expect(body.interpretations).toHaveLength(inferred + ambiguous);
    expect(body.interpretations.every((f: { certainty: string }) => f.certainty !== "stated")).toBe(
      true,
    );
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
