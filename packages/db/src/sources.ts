import {
  type Certainty,
  type DifferenceCategory,
  type EdgeType,
  type Framing,
  type Locator,
  type QuestionKind,
  type SourceKind,
  type SourceRole,
  type StoredStatus,
  type TitleCode,
} from "@ffvii/shared";
import { sql } from "drizzle-orm";
import type { Db } from "./client.ts";
import { type EntityRef, relationshipLabel } from "./queries.ts";

// The archive (docs/decisions/0012-archive-and-sources.md): the titles as sources — each unit
// with the facts that cite it — and the research log behind the facts.

// ─── Units of the titles ──────────────────────────────────────────────────────

export interface SourceUnit {
  /** The original's segment ID, a chapter number as text, or a part's key (`unitOf`). */
  key: string;
  name: string;
  /** The original's disc; null for chaptered titles. */
  disc: number | null;
  position: number;
}

export interface CatalogueUnit extends SourceUnit {
  /** Citations of this unit, and the distinct entities and worlds they back. */
  citations: number;
  subjects: number;
}

export interface CatalogueTitle {
  code: TitleCode;
  units: CatalogueUnit[];
}

const UNITS = sql`(
  select 'og'::title_code as title, id as key, name, disc, position::real as position
  from og_segments
  union all
  select title, key, name, null, position from title_units
)`;

/** Every unit of every title, in play order, with how much of the dataset cites it. */
export async function sourceCatalogue(db: Db): Promise<CatalogueTitle[]> {
  const rows = await db.execute<CatalogueUnit & { title: TitleCode } & Record<string, unknown>>(sql`
    select u.title, u.key, u.name, u.disc, u.position,
      count(c.*)::int as citations,
      count(distinct coalesce(c.entity_id, c.world))::int as subjects
    from ${UNITS} u
    join titles t on t.code = u.title
    left join citations c on c.title = u.title and c.unit = u.key
    group by u.title, u.key, u.name, u.disc, u.position, t.position
    order by t.position, u.position
  `);
  const titles = new Map<TitleCode, CatalogueUnit[]>();
  for (const { title, ...unit } of rows) {
    const units = titles.get(title) ?? [];
    units.push(unit);
    titles.set(title, units);
  }
  const codes = await db.execute<{ code: TitleCode }>(
    sql`select code from titles order by position`,
  );
  return codes.map(({ code }) => ({ code, units: titles.get(code) ?? [] }));
}

export interface CitedAppearance {
  entity: EntityRef;
  world: string;
  status: StoredStatus;
  role: string | null;
  summary: string;
  certainty: Certainty;
  /** Whether the appearance's own sources cite this unit (not just a depiction). */
  cited: boolean;
  /** Depictions set in this unit. */
  depictions: { framing: Framing; note: string | null }[];
  /** Scenes named by the citations, to help find the moment. */
  scenes: string[];
}

export interface CitedDifference {
  id: string;
  entity: EntityRef;
  from: { title: TitleCode; world: string };
  to: { title: TitleCode; world: string };
  category: DifferenceCategory;
  magnitude: "minor" | "major";
  summary: string;
  certainty: Certainty;
  scenes: string[];
}

export interface CitedRelationship {
  id: string;
  type: EdgeType;
  label: string;
  source: EntityRef;
  target: EntityRef;
  world: string;
  certainty: Certainty;
  scenes: string[];
}

export interface CitedWorld {
  id: string;
  name: string;
  certainty: Certainty;
  scenes: string[];
}

export interface SourceUnitDetail {
  title: TitleCode;
  unit: SourceUnit & { summary: string | null };
  previous: SourceUnit | null;
  next: SourceUnit | null;
  appearances: CitedAppearance[];
  differences: CitedDifference[];
  relationships: CitedRelationship[];
  worlds: CitedWorld[];
}

const SCENES = sql`coalesce(
  json_agg(distinct c.scene) filter (where c.scene is not null), '[]'
)`;

/** One unit of a title and every fact that cites it; undefined if there's no such unit. */
export async function sourceUnit(
  db: Db,
  title: TitleCode,
  key: string,
): Promise<SourceUnitDetail | undefined> {
  const units = await db.execute<SourceUnit & Record<string, unknown>>(sql`
    select key, name, disc, position from ${UNITS} u where u.title = ${title} order by position
  `);
  const index = units.findIndex((u) => u.key === key);
  const unit = units[index];
  if (unit === undefined) return undefined;
  const [segment] =
    title === "og"
      ? await db.execute<{ summary: string }>(
          sql`select summary from og_segments where id = ${key}`,
        )
      : [];
  const cites = sql`c.title = ${title} and c.unit = ${key}`;

  const appearances = await db.execute<CitedAppearance & Record<string, unknown>>(sql`
    select json_build_object('id', e.id, 'kind', e.kind, 'name', e.name) as entity,
      a.world, a.status, a.role, a.summary, a.certainty,
      bool_or(c.kind = 'appearance') as cited,
      coalesce((
        select json_agg(json_build_object('framing', d.framing, 'note', d.note) order by d.position)
        from depictions d
        where d.entity_id = a.entity_id and d.title = a.title and d.world = a.world
          and d.position in (
            select c2.depiction from citations c2
            where c2.title = ${title} and c2.unit = ${key} and c2.kind = 'depiction'
              and c2.entity_id = a.entity_id and c2.world = a.world
          )
      ), '[]') as depictions,
      ${SCENES} as scenes
    from citations c
    join appearances a on a.entity_id = c.entity_id and a.title = c.title and a.world = c.world
    join entities e on e.id = a.entity_id
    join worlds w on w.id = a.world
    where ${cites} and c.kind in ('appearance', 'depiction')
    group by e.id, a.entity_id, a.title, a.world, w.position
    order by e.kind, w.position, e.name
  `);

  const differences = await db.execute<CitedDifference & Record<string, unknown>>(sql`
    select d.id, json_build_object('id', e.id, 'kind', e.kind, 'name', e.name) as entity,
      json_build_object('title', d.from_title, 'world', d.from_world) as "from",
      json_build_object('title', d.to_title, 'world', d.to_world) as "to",
      d.category, d.magnitude, d.summary, d.certainty, ${SCENES} as scenes
    from citations c
    join differences d on d.id = c.difference_id
    join entities e on e.id = d.entity_id
    where ${cites} and c.kind = 'difference'
    group by d.id, e.id
    order by e.name, d.key
  `);

  const relationships = await db.execute<
    Omit<CitedRelationship, "label"> & Record<string, unknown>
  >(sql`
    select x.id, x.type,
      json_build_object('id', s.id, 'kind', s.kind, 'name', s.name) as source,
      json_build_object('id', t.id, 'kind', t.kind, 'name', t.name) as target,
      et.world, et.certainty, ${SCENES} as scenes
    from citations c
    join edges x on x.id = c.edge_id
    join edge_titles et on et.edge_id = x.id and et.title = c.title
    join entities s on s.id = x.source_id
    join entities t on t.id = x.target_id
    where ${cites} and c.kind = 'relationship'
    group by x.id, s.id, t.id, et.world, et.certainty
    order by x.category, s.name, x.type, t.name
  `);

  const worlds = await db.execute<CitedWorld & Record<string, unknown>>(sql`
    select w.id, w.name, w.certainty, ${SCENES} as scenes
    from citations c join worlds w on w.id = c.world
    where ${cites} and c.kind = 'world'
    group by w.id
    order by w.position
  `);

  return {
    title,
    unit: { ...unit, summary: segment?.summary ?? null },
    previous: units[index - 1] ?? null,
    next: units[index + 1] ?? null,
    appearances: [...appearances],
    differences: [...differences],
    relationships: relationships.map((r) => ({ ...r, label: relationshipLabel(r.type, "out") })),
    worlds: [...worlds],
  };
}

// ─── Research log ─────────────────────────────────────────────────────────────

export interface ResearchSourceRow {
  id: string;
  name: string;
  kind: SourceKind;
  role: SourceRole;
  covers: TitleCode[];
  usedFor: string;
  url: string | null;
  accessed: string | null;
  notes: string | null;
}

export interface OpenQuestionRow {
  id: string;
  kind: QuestionKind;
  summary: string;
  details: string;
  sources: Locator[];
  entities: EntityRef[];
  worlds: { id: string; name: string }[];
}

/** A fact that isn't stated outright: inferred or ambiguous, with the note that explains it. */
export interface Interpretation {
  kind: "appearance" | "difference" | "relationship" | "world";
  certainty: Exclude<Certainty, "stated">;
  notes: string;
  /** The entity (or world) the fact belongs to. */
  subject: { id: string; name: string; kind: string };
  /** The titles the fact is about. */
  titles: TitleCode[];
  /** What the fact says, in a line. */
  label: string;
  sources: Locator[];
}

export interface Research {
  sources: ResearchSourceRow[];
  questions: OpenQuestionRow[];
  /** Every fact by certainty: appearances, differences, relationships per title, worlds. */
  certainty: Record<Certainty, number>;
  interpretations: Interpretation[];
}

const QUESTION_FIELDS = sql`
  q.id, q.kind, q.summary, q.details, coalesce(q.sources, '[]') as sources,
  coalesce((
    select json_agg(json_build_object('id', e.id, 'kind', e.kind, 'name', e.name) order by e.name)
    from open_question_entities qe join entities e on e.id = qe.entity_id
    where qe.question_id = q.id
  ), '[]') as entities,
  coalesce((
    select json_agg(json_build_object('id', w.id, 'name', w.name) order by w.position)
    from open_question_worlds qw join worlds w on w.id = qw.world_id
    where qw.question_id = q.id
  ), '[]') as worlds
`;

/** Open questions about one entity. */
export async function openQuestionsAbout(db: Db, entityId: string): Promise<OpenQuestionRow[]> {
  const rows = await db.execute<OpenQuestionRow & Record<string, unknown>>(sql`
    select ${QUESTION_FIELDS} from open_questions q
    where exists (
      select 1 from open_question_entities qe
      where qe.question_id = q.id and qe.entity_id = ${entityId}
    )
    order by q.position
  `);
  return [...rows];
}

/** The research log, and how the dataset's facts divide by certainty. */
export async function research(db: Db): Promise<Research> {
  const sources = await db.execute<ResearchSourceRow & Record<string, unknown>>(sql`
    select id, name, kind, role, covers, used_for as "usedFor", url, accessed::text as accessed, notes
    from research_sources order by position
  `);
  const questions = await db.execute<OpenQuestionRow & Record<string, unknown>>(
    sql`select ${QUESTION_FIELDS} from open_questions q order by q.position`,
  );

  const counts = await db.execute<{ certainty: Certainty; count: number }>(sql`
    select certainty, count(*)::int as count from (
      select certainty from appearances
      union all select certainty from differences
      union all select certainty from edge_titles
      union all select certainty from worlds where certainty is not null
    ) f
    group by certainty
  `);
  const certainty: Record<Certainty, number> = { stated: 0, inferred: 0, ambiguous: 0 };
  for (const row of counts) certainty[row.certainty] = row.count;

  const interpretations = await db.execute<
    Omit<Interpretation, "label"> & { type: EdgeType | null; label: string } & Record<
        string,
        unknown
      >
  >(sql`
    select kind, certainty, notes, subject, titles, label, type, sources from (
      select 'appearance' as kind, a.certainty, a.notes,
        json_build_object('id', e.id, 'name', e.name, 'kind', e.kind) as subject,
        json_build_array(a.title) as titles, coalesce(a.role, a.summary) as label,
        null as type, a.sources, e.name as sort_name, 1 as sort_kind
      from appearances a join entities e on e.id = a.entity_id
      where a.certainty <> 'stated'
      union all
      select 'difference', d.certainty, d.notes,
        json_build_object('id', e.id, 'name', e.name, 'kind', e.kind),
        json_build_array(d.from_title, d.to_title), d.summary, null, d.sources, e.name, 2
      from differences d join entities e on e.id = d.entity_id
      where d.certainty <> 'stated'
      union all
      select 'relationship', et.certainty, et.notes,
        json_build_object('id', s.id, 'name', s.name, 'kind', s.kind),
        json_build_array(et.title), t.name, x.type::text, et.sources, s.name, 3
      from edge_titles et
      join edges x on x.id = et.edge_id
      join entities s on s.id = x.source_id
      join entities t on t.id = x.target_id
      where et.certainty <> 'stated'
      union all
      select 'world', w.certainty, w.notes,
        json_build_object('id', w.id, 'name', w.name, 'kind', 'world'),
        '[]'::json, w.summary, null, w.sources, w.name, 4
      from worlds w
      where w.certainty is not null and w.certainty <> 'stated'
    ) f
    order by sort_kind, sort_name
  `);

  return {
    sources: [...sources],
    questions: [...questions],
    certainty,
    interpretations: interpretations.map(({ type, label, ...fact }) => ({
      ...fact,
      // A relationship reads from its source: "<label> <target>", e.g. "killed Aerith".
      label: type === null ? label : `${relationshipLabel(type, "out")} ${label}`,
    })),
  };
}
