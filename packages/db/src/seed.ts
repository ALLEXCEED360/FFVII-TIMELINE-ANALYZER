import { createHash } from "node:crypto";
import type { Dataset } from "@ffvii/data";
import {
  type Appearance,
  type Depiction,
  EDGE_TYPES,
  type Edge,
  type EdgeInFile,
  type TitleCode,
  TITLES,
  TITLE_CODES,
  type TitleDefinition,
  type When,
  ogSegmentOf,
  playPosition,
  primaryDepiction,
  resolveWhen,
} from "@ffvii/shared";
import { sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { Db } from "./client.ts";
import * as t from "./schema.ts";

// Rebuilds every table from a validated dataset (docs/decisions/0005-database-schema.md).

type Insert<T extends PgTable> = T["$inferInsert"];

export interface SeedRows {
  titles: Insert<typeof t.titles>[];
  titleUnits: Insert<typeof t.titleUnits>[];
  ogSegments: Insert<typeof t.ogSegments>[];
  coverage: Insert<typeof t.coverage>[];
  coveredSegments: Insert<typeof t.coveredSegments>[];
  arcs: Insert<typeof t.arcs>[];
  eras: Insert<typeof t.eras>[];
  worlds: Insert<typeof t.worlds>[];
  entities: Insert<typeof t.entities>[];
  entityNames: Insert<typeof t.entityNames>[];
  events: Insert<typeof t.events>[];
  appearances: Insert<typeof t.appearances>[];
  depictions: Insert<typeof t.depictions>[];
  differences: Insert<typeof t.differences>[];
  differenceRelated: Insert<typeof t.differenceRelated>[];
  edges: Insert<typeof t.edges>[];
  edgeTitles: Insert<typeof t.edgeTitles>[];
  idRedirects: Insert<typeof t.idRedirects>[];
}

/** Fields every edge has; everything else on an edge is a type-specific attribute. */
const COMMON_EDGE_FIELDS = new Set(["type", "source", "target", "titles", "from", "until"]);

function timeRefs(edge: EdgeInFile) {
  return {
    from: "from" in edge ? (edge.from ?? null) : null,
    until: "until" in edge ? (edge.until ?? null) : null,
  };
}

/** A stable ID from the edge's identity: (source, type, target, from) — ids.md §7. */
export function edgeId(edge: Edge): string {
  const key = [edge.source, edge.type, edge.target, JSON.stringify(timeRefs(edge).from)];
  return `edge_${createHash("sha256").update(key.join("|")).digest("hex").slice(0, 16)}`;
}

function whenColumns(when: When) {
  const { start, end } = resolveWhen(when);
  return {
    startEarliest: start.earliest,
    startLatest: start.latest,
    endEarliest: end.earliest,
    endLatest: end.latest,
  };
}

/** Converts a validated dataset into table rows. Pure — no database access. */
export function buildSeedRows(dataset: Dataset): SeedRows {
  const segmentIndex = new Map(dataset.segments.map((segment, index) => [segment.id, index]));
  const position = (depiction: Depiction) =>
    playPosition(depiction.at, (id) => segmentIndex.get(id) ?? -1) + (depiction.seq ?? 0) / 1000;

  const rows: SeedRows = {
    titles: TITLE_CODES.map((code) => {
      const title = TITLES[code];
      return {
        code,
        name: title.name,
        shortName: title.shortName,
        released: title.released,
        series: title.series,
        position: title.order,
      };
    }),
    titleUnits: TITLE_CODES.flatMap((code) => {
      const units: TitleDefinition["units"] = TITLES[code].units;
      if (units.kind !== "chapters") return [];
      return [
        ...units.chapters.map((name, i) => ({
          title: code,
          key: String(i + 1),
          name,
          position: i + 1,
        })),
        ...units.parts.map((part) => ({
          title: code,
          key: part.key,
          name: part.name,
          position: part.before - 0.5,
        })),
      ];
    }),
    ogSegments: dataset.segments.map((segment, index) => ({ ...segment, position: index })),
    coverage: [],
    coveredSegments: [],
    arcs: dataset.arcs.map((arc, index) => ({
      id: arc.id,
      position: index,
      name: arc.name,
      summary: arc.summary,
      ogFrom: arc.og.from,
      ogTo: arc.og.to,
      chapters: arc.chapters ?? {},
    })),
    eras: dataset.eras.map((era, index) => ({
      id: era.id,
      position: index,
      name: era.name,
      startYear: era.start,
      endYear: era.end,
      weight: era.weight,
    })),
    worlds: dataset.worlds.map((world, index) => ({
      id: world.id,
      position: index,
      name: world.name,
      summary: world.summary,
      ...("firstShown" in world
        ? {
            firstShown: world.firstShown,
            branchesFrom: world.branchesFrom ?? null,
            sources: world.sources,
            certainty: world.certainty,
            notes: world.notes ?? null,
          }
        : {}),
    })),
    entities: [],
    entityNames: [],
    events: [],
    appearances: [],
    depictions: [],
    differences: [],
    differenceRelated: [],
    edges: [],
    edgeTitles: [],
    idRedirects: Object.entries(dataset.redirects).map(([oldId, newId]) => ({ oldId, newId })),
  };

  for (const [title, range] of Object.entries(dataset.coverage) as [
    TitleCode,
    NonNullable<Dataset["coverage"]["remake"]>,
  ][]) {
    rows.coverage.push({
      title,
      fromSegment: range.from,
      toSegment: range.to,
      notes: range.notes ?? null,
    });
    const from = segmentIndex.get(range.from) ?? 0;
    const to = segmentIndex.get(range.to) ?? -1;
    const except = new Set(range.except ?? []);
    for (const segment of dataset.segments.slice(from, to + 1)) {
      if (!except.has(segment.id)) rows.coveredSegments.push({ title, segmentId: segment.id });
    }
  }

  for (const { entity } of dataset.entities.values()) {
    const { id } = entity;
    rows.entities.push({
      id,
      kind: entity.kind,
      name: entity.name,
      summary: entity.summary,
      notes: entity.notes ?? null,
      ogSegmentId: ogSegmentOf(entity.appearances) ?? null,
    });

    for (const [name, isPrimary] of [
      [entity.name, true],
      ...(entity.aliases ?? []).map((alias) => [alias, false] as const),
    ] as const) {
      if (!rows.entityNames.some((row) => row.entityId === id && row.name === name)) {
        rows.entityNames.push({ entityId: id, name, isPrimary });
      }
    }

    if (entity.kind === "event") {
      rows.events.push({
        entityId: id,
        when: entity.when,
        ...whenColumns(entity.when),
        seq: entity.seq ?? null,
        importance: entity.importance,
        arcId: entity.arc,
      });
    }

    for (const appearance of entity.appearances) {
      rows.appearances.push(appearanceRow(id, appearance, position));
      const primary = primaryDepiction(appearance);
      appearance.depictions.forEach((depiction, index) => {
        rows.depictions.push({
          entityId: id,
          title: appearance.title,
          world: appearance.world,
          position: index,
          locator: depiction.at,
          framing: depiction.framing,
          seq: depiction.seq ?? null,
          isPrimary: depiction === primary,
          note: depiction.note ?? null,
          playPosition: position(depiction),
        });
      });
    }

    for (const difference of entity.differences) {
      const differenceId = `${id}:${difference.key}`;
      rows.differences.push({
        id: differenceId,
        entityId: id,
        key: difference.key,
        fromTitle: difference.from.title,
        fromWorld: difference.from.world,
        toTitle: difference.to.title,
        toWorld: difference.to.world,
        category: difference.category,
        magnitude: difference.magnitude,
        summary: difference.summary,
        sources: difference.sources,
        certainty: difference.certainty,
        notes: difference.notes ?? null,
      });
      for (const related of difference.related ?? []) {
        rows.differenceRelated.push({ differenceId, entityId: related });
      }
    }
  }

  for (const { edge } of dataset.edges) {
    const edgeRowId = edgeId(edge);
    const { from, until } = timeRefs(edge);
    const definition = EDGE_TYPES[edge.type];
    rows.edges.push({
      id: edgeRowId,
      sourceId: edge.source,
      targetId: edge.target,
      type: edge.type,
      category: definition.category,
      attributes: Object.fromEntries(
        Object.entries(edge).filter(([key]) => !COMMON_EDGE_FIELDS.has(key)),
      ),
      fromRef: from,
      untilRef: until,
      weight: definition.weight,
    });
    for (const [title, scope] of Object.entries(edge.titles)) {
      rows.edgeTitles.push({
        edgeId: edgeRowId,
        title: title as TitleCode,
        world: scope.world,
        sourceId: edge.source,
        targetId: edge.target,
        sources: scope.sources,
        certainty: scope.certainty,
        notes: scope.notes ?? null,
      });
    }
  }

  return rows;
}

function appearanceRow(
  entityId: string,
  appearance: Appearance,
  position: (depiction: Depiction) => number,
): Insert<typeof t.appearances> {
  const primary = primaryDepiction(appearance);
  return {
    entityId,
    title: appearance.title,
    world: appearance.world,
    status: appearance.status,
    summary: appearance.summary,
    role: appearance.role ?? null,
    when: appearance.when ?? null,
    ...(appearance.when === undefined ? {} : whenColumns(appearance.when)),
    playPosition: primary === undefined ? null : position(primary),
    sources: appearance.sources,
    certainty: appearance.certainty,
    notes: appearance.notes ?? null,
  };
}

const CHUNK = 500;

async function insertAll<T extends PgTable>(db: Db, table: T, values: Insert<T>[]) {
  for (let i = 0; i < values.length; i += CHUNK) {
    await db.insert(table).values(values.slice(i, i + CHUNK));
  }
}

/** Replaces the whole database contents in one transaction: either all of it lands, or none. */
export async function seed(db: Db, rows: SeedRows): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`
      truncate ${t.titles}, ${t.ogSegments}, ${t.worlds}, ${t.entities}, ${t.arcs}, ${t.eras},
        ${t.idRedirects} cascade
    `);
    const txDb = tx as unknown as Db;
    // Parents before children, so every foreign key already has its target.
    await insertAll(txDb, t.titles, rows.titles);
    await insertAll(txDb, t.titleUnits, rows.titleUnits);
    await insertAll(txDb, t.ogSegments, rows.ogSegments);
    await insertAll(txDb, t.coverage, rows.coverage);
    await insertAll(txDb, t.coveredSegments, rows.coveredSegments);
    await insertAll(txDb, t.arcs, rows.arcs);
    await insertAll(txDb, t.eras, rows.eras);
    await insertAll(txDb, t.entities, rows.entities);
    await insertAll(txDb, t.worlds, rows.worlds);
    await insertAll(txDb, t.entityNames, rows.entityNames);
    await insertAll(txDb, t.events, rows.events);
    await insertAll(txDb, t.appearances, rows.appearances);
    await insertAll(txDb, t.depictions, rows.depictions);
    await insertAll(txDb, t.differences, rows.differences);
    await insertAll(txDb, t.differenceRelated, rows.differenceRelated);
    await insertAll(txDb, t.edges, rows.edges);
    await insertAll(txDb, t.edgeTitles, rows.edgeTitles);
    await insertAll(txDb, t.idRedirects, rows.idRedirects);
  });
}
