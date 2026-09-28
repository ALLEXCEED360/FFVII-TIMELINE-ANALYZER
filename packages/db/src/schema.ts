import {
  DIFFERENCE_CATEGORIES,
  EDGE_CATEGORIES,
  EDGE_TYPE_NAMES,
  ENTITY_FILE_KINDS,
  type EdgeType,
  type FileEntityKind,
  FRAMINGS,
  STORED_STATUSES,
  TITLE_CODES,
  type TitleCode,
} from "@ffvii/shared";
import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  customType,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
} from "drizzle-orm/pg-core";

// The database is a derived copy of data/ (docs/decisions/0005-database-schema.md).
// Every table is rebuilt by the seed script; nothing here is edited by hand.

const tsvector = customType<{ data: string }>({ dataType: () => "tsvector" });

const FILE_KINDS = Object.keys(ENTITY_FILE_KINDS) as [FileEntityKind, ...FileEntityKind[]];

export const entityKind = pgEnum("entity_kind", FILE_KINDS);
export const titleCode = pgEnum("title_code", TITLE_CODES);
export const series = pgEnum("series", ["original", "remake"]);
export const appearanceStatus = pgEnum("appearance_status", STORED_STATUSES);
export const framing = pgEnum("framing", FRAMINGS);
export const certainty = pgEnum("certainty", ["stated", "inferred", "ambiguous"]);
export const differenceCategory = pgEnum("difference_category", DIFFERENCE_CATEGORIES);
export const magnitude = pgEnum("magnitude", ["minor", "major"]);
export const edgeType = pgEnum("edge_type", EDGE_TYPE_NAMES as [EdgeType, ...EdgeType[]]);
export const edgeCategory = pgEnum("edge_category", EDGE_CATEGORIES);

// ─── Titles and reference data ────────────────────────────────────────────────

/** The released games (docs/model/titles-and-worlds.md §2), copied from the shared package. */
export const titles = pgTable("titles", {
  code: titleCode().primaryKey(),
  name: text().notNull(),
  shortName: text().notNull(),
  released: text().notNull(),
  series: series().notNull(),
  position: smallint().notNull().unique(),
});

/** Chapters and unnumbered parts of the chaptered titles, with their play-order position. */
export const titleUnits = pgTable(
  "title_units",
  {
    title: titleCode()
      .notNull()
      .references(() => titles.code),
    /** The chapter number as text, or a part's key (e.g. `interlude`). */
    key: text().notNull(),
    name: text().notNull(),
    position: real().notNull(),
  },
  (t) => [primaryKey({ columns: [t.title, t.key] })],
);

/** The original's story segments, in play order (canon-and-sources.md §10). */
export const ogSegments = pgTable("og_segments", {
  id: text().primaryKey(),
  position: smallint().notNull().unique(),
  name: text().notNull(),
  disc: smallint().notNull(),
  summary: text().notNull(),
});

/** Which segments each Remake-series title retells, as written (titles-and-worlds.md §4). */
export const coverage = pgTable("coverage", {
  title: titleCode()
    .primaryKey()
    .references(() => titles.code),
  fromSegment: text()
    .notNull()
    .references(() => ogSegments.id),
  toSegment: text()
    .notNull()
    .references(() => ogSegments.id),
  notes: text(),
});

/** Coverage expanded to one row per retold segment (the range minus its exceptions). */
export const coveredSegments = pgTable(
  "covered_segments",
  {
    title: titleCode()
      .notNull()
      .references(() => coverage.title, { onDelete: "cascade" }),
    segmentId: text()
      .notNull()
      .references(() => ogSegments.id),
  },
  (t) => [primaryKey({ columns: [t.title, t.segmentId] })],
);

export const arcs = pgTable("arcs", {
  id: text().primaryKey(),
  position: smallint().notNull().unique(),
  name: text().notNull(),
  summary: text().notNull(),
  ogFrom: text()
    .notNull()
    .references(() => ogSegments.id),
  ogTo: text()
    .notNull()
    .references(() => ogSegments.id),
  /** Remake-series chapter ranges, as written: `{ remake: [1, 18] }`. */
  chapters: jsonb().notNull().default({}),
});

export const eras = pgTable("eras", {
  id: text().primaryKey(),
  position: smallint().notNull().unique(),
  name: text().notNull(),
  startYear: integer().notNull(),
  endYear: integer().notNull(),
  weight: real().notNull(),
});

/** In-story worlds (titles-and-worlds.md §3). Evidence columns are null for `world_main`. */
export const worlds = pgTable("worlds", {
  id: text().primaryKey(),
  position: smallint().notNull().unique(),
  name: text().notNull(),
  summary: text().notNull(),
  firstShown: jsonb(),
  /** The event where the world diverges, if known. */
  branchesFrom: text().references((): AnyPgColumn => entities.id),
  sources: jsonb(),
  certainty: certainty(),
  notes: text(),
});

// ─── Entities ─────────────────────────────────────────────────────────────────

/** Every entity, whatever its kind (docs/model/appearances.md §1). */
export const entities = pgTable(
  "entities",
  {
    id: text().primaryKey(),
    kind: entityKind().notNull(),
    name: text().notNull(),
    summary: text().notNull(),
    notes: text(),
    /** The original segment where the entity is shown — derived, for coverage-based statuses. */
    ogSegmentId: text().references(() => ogSegments.id),
    search: tsvector().generatedAlwaysAs(sql`to_tsvector('english', "name" || ' ' || "summary")`),
  },
  (t) => [
    index("entities_kind_idx").on(t.kind),
    index("entities_search_idx").using("gin", t.search),
  ],
);

/** Display names and aliases, for search (canon-and-sources.md §9). */
export const entityNames = pgTable(
  "entity_names",
  {
    entityId: text()
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    name: text().notNull(),
    isPrimary: boolean().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.entityId, t.name] }),
    index("entity_names_trgm_idx").using("gin", sql`lower(${t.name}) gin_trgm_ops`),
  ],
);

/**
 * Event-only fields. Years are resolved into integer bounds at seed time
 * (docs/model/chronology.md §2); `when` keeps the value as written.
 */
export const events = pgTable(
  "events",
  {
    entityId: text()
      .primaryKey()
      .references(() => entities.id, { onDelete: "cascade" }),
    when: jsonb().notNull(),
    startEarliest: integer().notNull(),
    startLatest: integer().notNull(),
    endEarliest: integer().notNull(),
    endLatest: integer().notNull(),
    seq: smallint(),
    importance: smallint().notNull(),
    arcId: text()
      .notNull()
      .references(() => arcs.id),
  },
  (t) => [
    index("events_order_idx").on(t.startEarliest, t.seq, t.entityId),
    check("events_importance_range", sql`${t.importance} between 1 and 3`),
  ],
);

/** How one title presents an entity, in one world (docs/model/appearances.md §2). */
export const appearances = pgTable(
  "appearances",
  {
    entityId: text()
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    title: titleCode()
      .notNull()
      .references(() => titles.code),
    world: text()
      .notNull()
      .references(() => worlds.id),
    status: appearanceStatus().notNull(),
    summary: text().notNull(),
    role: text(),
    /** A title-specific `when` override, as written and resolved (chronology.md §5). */
    when: jsonb(),
    startEarliest: integer(),
    startLatest: integer(),
    endEarliest: integer(),
    endLatest: integer(),
    /** Sortable position in the title's play order (from the primary depiction); null if omitted. */
    playPosition: real(),
    sources: jsonb().notNull(),
    certainty: certainty().notNull(),
    notes: text(),
    search: tsvector().generatedAlwaysAs(sql`to_tsvector('english', "summary")`),
  },
  (t) => [
    primaryKey({ columns: [t.entityId, t.title, t.world] }),
    index("appearances_title_idx").on(t.title, t.playPosition),
    index("appearances_search_idx").using("gin", t.search),
  ],
);

/** Where and how an appearance is shown (docs/model/appearances.md §4). */
export const depictions = pgTable(
  "depictions",
  {
    entityId: text().notNull(),
    title: titleCode().notNull(),
    world: text().notNull(),
    position: smallint().notNull(),
    locator: jsonb().notNull(),
    framing: framing().notNull(),
    seq: smallint(),
    isPrimary: boolean().notNull(),
    note: text(),
    playPosition: real().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.entityId, t.title, t.world, t.position] }),
    foreignKey({
      name: "depictions_appearance_fk",
      columns: [t.entityId, t.title, t.world],
      foreignColumns: [appearances.entityId, appearances.title, appearances.world],
    }).onDelete("cascade"),
  ],
);

/** How two titles present the same entity differently (docs/model/appearances.md §5). */
export const differences = pgTable(
  "differences",
  {
    /** `<entity id>:<key>` (ids.md §7). */
    id: text().primaryKey(),
    entityId: text()
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    key: text().notNull(),
    fromTitle: titleCode().notNull(),
    fromWorld: text().notNull(),
    toTitle: titleCode().notNull(),
    toWorld: text().notNull(),
    category: differenceCategory().notNull(),
    magnitude: magnitude().notNull(),
    summary: text().notNull(),
    sources: jsonb().notNull(),
    certainty: certainty().notNull(),
    notes: text(),
  },
  (t) => [
    index("differences_entity_idx").on(t.entityId),
    foreignKey({
      name: "differences_from_appearance_fk",
      columns: [t.entityId, t.fromTitle, t.fromWorld],
      foreignColumns: [appearances.entityId, appearances.title, appearances.world],
    }).onDelete("cascade"),
    foreignKey({
      name: "differences_to_appearance_fk",
      columns: [t.entityId, t.toTitle, t.toWorld],
      foreignColumns: [appearances.entityId, appearances.title, appearances.world],
    }).onDelete("cascade"),
  ],
);

/** Other entities a difference involves. */
export const differenceRelated = pgTable(
  "difference_related",
  {
    differenceId: text()
      .notNull()
      .references(() => differences.id, { onDelete: "cascade" }),
    entityId: text()
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.differenceId, t.entityId] })],
);

// ─── Relationships ────────────────────────────────────────────────────────────

/** Relationships (docs/model/relationships.md). Both endpoints are real foreign keys. */
export const edges = pgTable(
  "edges",
  {
    /** Derived from (source, type, target, from) by the seed script. */
    id: text().primaryKey(),
    sourceId: text()
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    targetId: text()
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    type: edgeType().notNull(),
    category: edgeCategory().notNull(),
    /** Type-specific attributes such as `role`, `kind`, `title`, `in`. */
    attributes: jsonb().notNull().default({}),
    /** `from` / `until` as written (a date or an event reference). */
    fromRef: jsonb(),
    untilRef: jsonb(),
    weight: real().notNull(),
  },
  (t) => [
    index("edges_source_idx").on(t.sourceId),
    index("edges_target_idx").on(t.targetId),
    check("edges_no_self_loop", sql`${t.sourceId} <> ${t.targetId}`),
  ],
);

/**
 * The titles that establish each relationship, with their evidence (relationships.md §3). The
 * endpoints are repeated so the database can check both appear in that title and world.
 */
export const edgeTitles = pgTable(
  "edge_titles",
  {
    edgeId: text()
      .notNull()
      .references(() => edges.id, { onDelete: "cascade" }),
    title: titleCode().notNull(),
    world: text().notNull(),
    sourceId: text().notNull(),
    targetId: text().notNull(),
    sources: jsonb().notNull(),
    certainty: certainty().notNull(),
    notes: text(),
  },
  (t) => [
    primaryKey({ columns: [t.edgeId, t.title] }),
    index("edge_titles_title_idx").on(t.title),
    foreignKey({
      name: "edge_titles_source_appearance_fk",
      columns: [t.sourceId, t.title, t.world],
      foreignColumns: [appearances.entityId, appearances.title, appearances.world],
    }).onDelete("cascade"),
    foreignKey({
      name: "edge_titles_target_appearance_fk",
      columns: [t.targetId, t.title, t.world],
      foreignColumns: [appearances.entityId, appearances.title, appearances.world],
    }).onDelete("cascade"),
  ],
);

export const idRedirects = pgTable("id_redirects", {
  oldId: text().primaryKey(),
  newId: text().references(() => entities.id, { onDelete: "cascade" }),
});

export type { EdgeType, TitleCode };
