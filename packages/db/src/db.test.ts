import { fileURLToPath } from "node:url";
import { type Dataset, loadDataset, readDataDir } from "@ffvii/data";
import {
  CoverageIndex,
  MAIN_WORLD,
  TITLES_IN_ORDER,
  type TitleCode,
  compareChronologically,
  displayStatus,
  ogSegmentOf,
} from "@ffvii/shared";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { filterGraph, neighborhood as graphNeighborhood } from "@ffvii/graph-core";
import { listDifferences, listEntities, reference } from "./catalog.ts";
import { connect } from "./client.ts";
import { loadGraph } from "./graph.ts";
import { comparison, entity, neighborhood, playOrder, search, timeline } from "./queries.ts";
import { buildSeedRows, seed } from "./seed.ts";

// Integration tests against a real Postgres (`pnpm db:up && pnpm db:migrate` first). They
// reseed the database from data/, which is safe: the database is a derived copy. Each query is
// checked against the same answer computed directly from the data files.

const DATA_DIR = fileURLToPath(new URL("../../../data/", import.meta.url));
const { db, close } = connect();

let dataset: Dataset;

beforeAll(async () => {
  dataset = loadDataset(await readDataDir(DATA_DIR)).dataset;
  await seed(db, buildSeedRows(dataset));
});

afterAll(async () => {
  await close();
});

function count(table: string) {
  return db
    .execute<{ n: number }>(sql`select count(*)::int as n from ${sql.identifier(table)}`)
    .then(([row]) => row?.n);
}

describe("seed", () => {
  it("stores every entity, appearance, difference and relationship", async () => {
    const entities = [...dataset.entities.values()].map((l) => l.entity);
    expect(await count("entities")).toBe(entities.length);
    expect(await count("appearances")).toBe(entities.flatMap((e) => e.appearances).length);
    expect(await count("differences")).toBe(entities.flatMap((e) => e.differences).length);
    expect(await count("edges")).toBe(dataset.edges.length);
    expect(await count("og_segments")).toBe(dataset.segments.length);
  });

  it("can be run again without duplicating anything", async () => {
    await seed(db, buildSeedRows(dataset));
    expect(await count("edges")).toBe(dataset.edges.length);
  });

  it("rejects a relationship whose endpoint doesn't appear in its title (foreign key)", async () => {
    const edge = await db.execute<{ id: string }>(sql`select id from edges limit 1`);
    await expect(
      db.execute(sql`
        insert into edge_titles (edge_id, title, world, source_id, target_id, sources, certainty)
        values (${edge[0]?.id ?? ""}, 'intermission', 'world_main',
                'character_sephiroth', 'event_aerith_death', '[]', 'stated')
      `),
    ).rejects.toThrow();
  });

  it("rejects a difference without appearances on both sides (foreign key)", async () => {
    await expect(
      db.execute(sql`
        insert into differences (id, entity_id, key, from_title, from_world, to_title, to_world,
          category, magnitude, summary, sources, certainty)
        values ('event_cloud_memories_restored:x', 'event_cloud_memories_restored', 'x',
          'og', 'world_main', 'rebirth', 'world_main', 'presentation', 'minor', '…', '[]', 'stated')
      `),
    ).rejects.toThrow();
  });
});

describe("timeline", () => {
  it("orders events exactly as the shared chronology does", async () => {
    const expected = [...dataset.entities.values()]
      .map((l) => l.entity)
      .flatMap((e) => (e.kind === "event" ? [e] : []))
      .sort(compareChronologically)
      .map((e) => e.id);
    expect((await timeline(db)).map((e) => e.id)).toEqual(expected);
  });

  it("keeps only events shown in the chosen titles, with only those appearances", async () => {
    const events = await timeline(db, { titles: ["intermission"] });
    expect(events.map((e) => e.id)).toEqual(["event_sector_7_plate_fall"]);
    expect(events[0]?.appearances.map((a) => a.title)).toEqual(["intermission"]);
  });

  it("gives each appearance its primary framing", async () => {
    const [nibelheim] = (await timeline(db, { titles: ["og", "rebirth"] })).filter(
      (e) => e.id === "event_nibelheim_incident",
    );
    expect(nibelheim?.start).toEqual({ earliest: -5, latest: -5 });
    expect(nibelheim?.appearances.map((a) => [a.title, a.framing])).toEqual([
      ["og", "false_account"],
      ["rebirth", "disputed_account"],
    ]);
  });
});

describe("playOrder", () => {
  it("lists a title's events in the order the player sees them", async () => {
    const og = await playOrder(db, { title: "og", kind: "event" });
    expect(og.map((item) => item.id)).toEqual([
      "event_mako_reactor_1_bombing",
      "event_sector_7_plate_fall",
      "event_nibelheim_incident",
      "event_aerith_death",
      "event_cloud_memories_restored",
    ]);
  });

  it("places Rebirth's interlude before chapter 1, in its own world", async () => {
    const zack = await playOrder(db, { title: "rebirth", world: "world_zack_survives" });
    expect(zack.every((item) => item.playPosition < 1)).toBe(true);
    expect(zack.map((item) => item.id)).toContain("character_cloud_strife");
  });
});

describe("entity", () => {
  it("returns appearances, differences and both directions of relationships", async () => {
    const found = await entity(db, "character_aerith_gainsborough");
    if (found === undefined || "redirectTo" in found) throw new Error("not found");
    expect(found.aliases).toEqual(["Aeris", "Aeris Gainsborough"]);
    expect(found.appearances.map((a) => a.title)).toEqual([
      "og",
      "remake",
      "intermission",
      "rebirth",
    ]);
    const killed = found.relationships.find((r) => r.type === "killed");
    expect(killed).toMatchObject({
      direction: "in",
      label: "killed by",
      other: { id: "character_sephiroth" },
    });
    expect(killed?.titles.map((t) => t.title)).toEqual(["og", "rebirth"]);
  });

  it("returns undefined for an unknown ID", async () => {
    expect(await entity(db, "character_nobody")).toBeUndefined();
  });
});

describe("comparison", () => {
  it("derives the same statuses as the shared package does from the files", async () => {
    const index = new CoverageIndex(dataset.segments, dataset.coverage);
    for (const { entity: e } of dataset.entities.values()) {
      const result = await comparison(db, e.id);
      if (result === undefined || "redirectTo" in result) throw new Error(e.id);
      const subject = { appearances: e.appearances, ogSegment: ogSegmentOf(e.appearances) };
      const expected = TITLES_IN_ORDER.map((title) => displayStatus(subject, title, index));
      expect(
        result.columns.map((c) => c.status),
        e.id,
      ).toEqual(expected);
    }
  });

  it("keeps only differences and relationship evidence for the chosen titles", async () => {
    const result = await comparison(db, "event_aerith_death", ["og", "rebirth"]);
    if (result === undefined || "redirectTo" in result) throw new Error("not found");
    expect(result.columns.map((c) => [c.title, c.status, c.changed])).toEqual([
      ["og", "depicted", false],
      ["rebirth", "depicted", true],
    ]);
    expect(result.differences.map((d) => d.key)).toEqual(["after_death", "blocked_blade"]);
    expect(result.relationships.every((r) => r.shared)).toBe(true);

    // Remake doesn't show Aerith's death, so it doesn't make relationships version-specific.
    const withRemake = await comparison(db, "event_aerith_death", ["og", "remake", "rebirth"]);
    if (withRemake === undefined || "redirectTo" in withRemake) throw new Error("not found");
    expect(withRemake.relationships.every((r) => r.shared)).toBe(true);

    // Rebirth doesn't show Cloud's recovered memories, so Tifa's link to that event is judged
    // in OG alone: not a difference.
    const tifa = await comparison(db, "character_tifa_lockhart", ["og", "rebirth"]);
    if (tifa === undefined || "redirectTo" in tifa) throw new Error("not found");
    const memories = tifa.relationships.find((r) => r.other.id === "event_cloud_memories_restored");
    expect(memories).toMatchObject({ applicable: ["og"], shared: true });

    // Remake only mentions Nibelheim, so it can't be said to leave out Cloud's hometown.
    const cloud = await comparison(db, "character_cloud_strife", ["og", "remake"]);
    if (cloud === undefined || "redirectTo" in cloud) throw new Error("not found");
    const hometown = cloud.relationships.find((r) => r.type === "hometown");
    expect(hometown).toMatchObject({ applicable: ["og"], shared: true });

    // Rebirth shows the plate fall only in another world, where Tifa doesn't appear.
    const plate = tifa.relationships.find((r) => r.other.id === "event_sector_7_plate_fall");
    expect(plate).toMatchObject({ applicable: ["og"], shared: true });

    // Remake depicts both Sector 7 and Midgar but doesn't establish the link: version-specific.
    const sector = await comparison(db, "location_sector_7", ["og", "remake"]);
    if (sector === undefined || "redirectTo" in sector) throw new Error("not found");
    const partOf = sector.relationships.find((r) => r.type === "part_of");
    expect(partOf).toMatchObject({ applicable: ["og", "remake"], shared: false });

    const ogOnly = await comparison(db, "event_mako_reactor_1_bombing", ["og", "rebirth"]);
    if (ogOnly === undefined || "redirectTo" in ogOnly) throw new Error("not found");
    expect(ogOnly.columns.map((c) => c.status)).toEqual(["depicted", "absent"]);
    expect(ogOnly.differences).toEqual([]);
  });

  it("separates other-world appearances", async () => {
    const result = await comparison(db, "character_cloud_strife", ["remake"]);
    if (result === undefined || "redirectTo" in result) throw new Error("not found");
    expect(result.columns[0]?.appearance?.world).toBe(MAIN_WORLD);
    expect(result.columns[0]?.otherWorlds.map((a) => a.world)).toEqual(["world_zack_survives"]);
  });
});

describe("neighborhood", () => {
  /** The same walk, done in memory over the data files. */
  function expectedNeighborhood(id: string, depth: number, titles: readonly TitleCode[]) {
    const links = dataset.edges
      .map((l) => l.edge)
      .filter((edge) => titles.some((title) => title in edge.titles));
    const found = new Map([[id, 0]]);
    let frontier = [id];
    for (let d = 1; d <= depth; d++) {
      const next: string[] = [];
      for (const node of frontier) {
        for (const edge of links) {
          const other =
            edge.source === node ? edge.target : edge.target === node ? edge.source : null;
          if (other !== null && !found.has(other)) {
            found.set(other, d);
            next.push(other);
          }
        }
      }
      frontier = next;
    }
    return found;
  }

  it.each([
    ["event_aerith_death", 1, TITLES_IN_ORDER],
    ["event_aerith_death", 2, TITLES_IN_ORDER],
    ["location_midgar", 3, ["og"] as const],
    ["character_cloud_strife", 2, ["remake"] as const],
  ])("matches an in-memory walk from %s (depth %i)", async (id, depth, titles) => {
    const result = await neighborhood(db, { id, depth, titles });
    expect(Object.fromEntries(result)).toEqual(
      Object.fromEntries(expectedNeighborhood(id, depth, titles)),
    );
  });
});

describe("search", () => {
  it("finds names, aliases and typos", async () => {
    expect((await search(db, { q: "cloud" })).results[0]?.id).toBe("character_cloud_strife");
    expect((await search(db, { q: "Aeris" })).results[0]).toMatchObject({
      id: "character_aerith_gainsborough",
      reason: "name",
      detail: "Aeris",
    });
    expect((await search(db, { q: "sephirot" })).results[0]?.id).toBe("character_sephiroth");
    // A typo still finds long names that contain the word.
    const typo = (await search(db, { q: "nibelhiem" })).results.map((r) => r.id);
    expect(typo).toContain("location_nibelheim");
    expect(typo).toContain("event_nibelheim_incident");
  });

  it("needs every word to match, numbers included", async () => {
    const { results } = await search(db, { q: "sector 7" });
    expect(results[0]?.id).toBe("location_sector_7");
    expect((await search(db, { q: "reactor 1" })).results[0]?.id).toBe(
      "event_mako_reactor_1_bombing",
    );
  });

  it("matches summaries and connections", async () => {
    const lifestream = await search(db, { q: "lifestream" });
    expect(lifestream.results.map((r) => r.id)).toContain("event_cloud_memories_restored");
    const byConnection = await search(db, { q: "nibelheim" });
    expect(byConnection.results.map((r) => r.id)).toContain("character_tifa_lockhart");
  });

  it("returns nothing for empty input", async () => {
    expect(await search(db, { q: "  " })).toEqual({ terms: [], results: [] });
  });
});

describe("catalogue", () => {
  it("lists entities with the titles they appear in", async () => {
    const all = await listEntities(db);
    expect(all).toHaveLength(dataset.entities.size);
    const midgar = all.find((e) => e.id === "location_midgar");
    expect(midgar?.titles).toEqual(["og", "remake", "intermission", "rebirth"]);

    const events = await listEntities(db, { kind: "event", title: "intermission" });
    expect(events.map((e) => e.id)).toEqual(["event_sector_7_plate_fall"]);
  });

  it("lists differences for the chosen titles, filtered by category and magnitude", async () => {
    const all = await listDifferences(db);
    const count = [...dataset.entities.values()].flatMap((l) => l.entity.differences).length;
    expect(all).toHaveLength(count);
    // Events in in-universe order: Nibelheim, five years before the story, comes first.
    expect(all[0]?.entity.id).toBe("event_nibelheim_incident");

    const major = await listDifferences(db, { titles: ["og", "rebirth"], magnitude: "major" });
    expect(major.map((d) => d.id).sort()).toEqual([
      "event_aerith_death:after_death",
      "event_aerith_death:blocked_blade",
      "event_nibelheim_incident:framing",
    ]);
    expect(await listDifferences(db, { titles: ["og", "remake"], category: "outcome" })).toEqual(
      [],
    );
  });

  it("returns the reference bundle", async () => {
    const ref = await reference(db);
    expect(ref.titles.map((t) => t.code)).toEqual(["og", "remake", "intermission", "rebirth"]);
    const rebirth = ref.titles.find((t) => t.code === "rebirth");
    expect(rebirth?.units[0]).toMatchObject({ key: "interlude", position: 0.5 });
    expect(rebirth?.coverage?.segments[0]).toBe("og_kalm");
    expect(ref.titles.find((t) => t.code === "intermission")?.coverage).toBeNull();
    expect(ref.segments).toHaveLength(dataset.segments.length);
    expect(ref.worlds.map((w) => w.id)).toEqual(["world_main", "world_zack_survives"]);
  });
});

describe("loadGraph", () => {
  it("holds every entity and relationship, with the titles that establish each", async () => {
    const graph = await loadGraph(db);
    expect(graph.nodes.size).toBe(dataset.entities.size);
    expect(graph.edges).toHaveLength(dataset.edges.length);
    const killed = graph.edges.find((e) => e.type === "killed");
    expect(killed).toMatchObject({
      source: "character_sephiroth",
      target: "character_aerith_gainsborough",
      titles: ["og", "rebirth"],
      weight: 1,
    });
  });

  it("walks the same neighbourhoods as the SQL query, for every entity and title set", async () => {
    const graph = await loadGraph(db);
    const titleSets: (readonly TitleCode[])[] = [
      TITLES_IN_ORDER,
      ["og"],
      ["remake", "intermission"],
      ["rebirth"],
    ];
    for (const titles of titleSets) {
      const filtered = filterGraph(graph, { titles });
      for (const id of dataset.entities.keys()) {
        for (const depth of [1, 2, 3]) {
          // An entity none of the titles show has no neighbourhood in the filtered graph.
          const shown = graph.nodes.get(id)?.titles?.some((t) => titles.includes(t)) ?? false;
          const sqlAnswer = shown ? await neighborhood(db, { id, depth, titles }) : new Map();
          expect(
            Object.fromEntries(graphNeighborhood(filtered, id, depth)),
            `${id} ${titles.join()} ${String(depth)}`,
          ).toEqual(Object.fromEntries(sqlAnswer));
        }
      }
    }
  });
});
