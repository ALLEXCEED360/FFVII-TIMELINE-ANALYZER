import {
  type Certainty,
  CoverageIndex,
  type Coverage,
  type DateRef,
  type DifferenceCategory,
  type DisplayStatus,
  EDGE_TYPES,
  type EdgeCategory,
  type EdgeType,
  type FileEntityKind,
  type Framing,
  type Locator,
  MAIN_WORLD,
  type OgSegments,
  type StoredStatus,
  TITLES_IN_ORDER,
  type TitleCode,
  type When,
  displayStatus,
  isChanged,
  isNewInRemakeSeries,
} from "@ffvii/shared";
import { type SQL, sql } from "drizzle-orm";
import type { Db } from "./client.ts";
import { parseQuery } from "./search-query.ts";

// The read queries behind the API (docs/decisions/0005-database-schema.md). Anything the shared
// package already knows how to derive (statuses, labels) is derived there, not re-implemented in SQL.

export interface YearBounds {
  earliest: number;
  latest: number;
}

/** A JSON array of title codes, for `title::text in (select jsonb_array_elements_text(…))`. */
function titleList(titles: readonly TitleCode[]): SQL {
  return sql`(select jsonb_array_elements_text(${JSON.stringify(titles)}::jsonb))`;
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export interface TimelineAppearance {
  title: TitleCode;
  world: string;
  status: StoredStatus;
  /** Position in the title's play order; null for omitted appearances. */
  playPosition: number | null;
  /** Framing of the primary depiction. */
  framing: Framing | null;
  /** This title's own in-universe time, when it differs from the event's (chronology.md §5). */
  start: YearBounds | null;
  end: YearBounds | null;
}

export interface TimelineEvent {
  id: string;
  name: string;
  summary: string;
  importance: number;
  arcId: string;
  seq: number | null;
  start: YearBounds;
  end: YearBounds;
  appearances: TimelineAppearance[];
}

/**
 * Events in in-universe order — (earliest start, seq, id), chronology.md §3 — that appear in any
 * of the given titles, each with its appearances in those titles (in release order).
 */
export async function timeline(
  db: Db,
  { titles = TITLES_IN_ORDER }: { titles?: readonly TitleCode[] } = {},
): Promise<TimelineEvent[]> {
  const rows = await db.execute<TimelineEvent & Record<string, unknown>>(sql`
    select e.id, e.name, e.summary, ev.importance, ev.arc_id as "arcId", ev.seq,
      json_build_object('earliest', ev.start_earliest, 'latest', ev.start_latest) as start,
      json_build_object('earliest', ev.end_earliest, 'latest', ev.end_latest) as "end",
      (
        select json_agg(json_build_object(
          'title', a.title,
          'world', a.world,
          'status', a.status,
          'playPosition', a.play_position,
          'framing', d.framing,
          'start', case when a.start_earliest is not null then
            json_build_object('earliest', a.start_earliest, 'latest', a.start_latest) end,
          'end', case when a.end_earliest is not null then
            json_build_object('earliest', a.end_earliest, 'latest', a.end_latest) end
        ) order by t.position, w.position)
        from appearances a
        join titles t on t.code = a.title
        join worlds w on w.id = a.world
        left join depictions d
          on d.entity_id = a.entity_id and d.title = a.title and d.world = a.world and d.is_primary
        where a.entity_id = e.id and a.title::text in ${titleList(titles)}
      ) as appearances
    from events ev
    join entities e on e.id = ev.entity_id
    where exists (
      select 1 from appearances a
      where a.entity_id = e.id and a.title::text in ${titleList(titles)}
    )
    order by ev.start_earliest, ev.seq nulls last, e.id
  `);
  return [...rows];
}

export interface PlayOrderItem {
  id: string;
  kind: FileEntityKind;
  name: string;
  status: StoredStatus;
  playPosition: number;
  framing: Framing;
  locator: Locator;
}

/** What a title shows, in the order the player sees it (chronology.md §7). Omitted entities are left out. */
export async function playOrder(
  db: Db,
  {
    title,
    world = MAIN_WORLD,
    kind,
  }: { title: TitleCode; world?: string; kind?: FileEntityKind | undefined },
): Promise<PlayOrderItem[]> {
  const rows = await db.execute<PlayOrderItem & Record<string, unknown>>(sql`
    select a.entity_id as id, e.kind, e.name, a.status, a.play_position as "playPosition",
           d.framing, d.locator
    from appearances a
    join entities e on e.id = a.entity_id
    join depictions d
      on d.entity_id = a.entity_id and d.title = a.title and d.world = a.world and d.is_primary
    where a.title = ${title} and a.world = ${world} and a.status <> 'omitted'
      and (${kind ?? null}::entity_kind is null or e.kind = ${kind ?? null}::entity_kind)
    order by a.play_position, a.entity_id
  `);
  return [...rows];
}

// ─── One entity ───────────────────────────────────────────────────────────────

export interface EntityRef {
  id: string;
  kind: FileEntityKind;
  name: string;
}

export interface DepictionDetail {
  locator: Locator;
  framing: Framing;
  seq: number | null;
  isPrimary: boolean;
  note: string | null;
  playPosition: number;
}

export interface AppearanceDetail {
  title: TitleCode;
  world: string;
  status: StoredStatus;
  summary: string;
  role: string | null;
  when: When | null;
  playPosition: number | null;
  sources: Locator[];
  certainty: Certainty;
  notes: string | null;
  depictions: DepictionDetail[];
}

export interface DifferenceDetail {
  id: string;
  key: string;
  from: { title: TitleCode; world: string };
  to: { title: TitleCode; world: string };
  category: DifferenceCategory;
  magnitude: "minor" | "major";
  summary: string;
  sources: Locator[];
  certainty: Certainty;
  notes: string | null;
  related: EntityRef[];
}

export interface RelationshipTitle {
  title: TitleCode;
  world: string;
  sources: Locator[];
  certainty: Certainty;
  notes: string | null;
}

export interface RelationshipDetail {
  id: string;
  type: EdgeType;
  category: EdgeCategory;
  /** `out` when this entity is the source; `in` when it's the target. */
  direction: "out" | "in";
  /** The label read from this entity's side, e.g. "took part in" or "killed by". */
  label: string;
  other: EntityRef;
  attributes: Record<string, unknown>;
  from: DateRef | null;
  until: DateRef | null;
  titles: RelationshipTitle[];
}

export interface EventDetail {
  when: When;
  start: YearBounds;
  end: YearBounds;
  seq: number | null;
  importance: number;
  arc: { id: string; name: string };
}

export interface EntityDetail extends EntityRef {
  aliases: string[];
  summary: string;
  notes: string | null;
  ogSegmentId: string | null;
  event: EventDetail | null;
  appearances: AppearanceDetail[];
  differences: DifferenceDetail[];
  relationships: RelationshipDetail[];
}

/** The label for an edge seen from one end (relationships.md §5). */
export function relationshipLabel(type: EdgeType, direction: "out" | "in"): string {
  const definition = EDGE_TYPES[type];
  return direction === "out" || definition.inverse === null ? definition.label : definition.inverse;
}

/**
 * Everything about one entity. A retired ID returns `{ redirectTo }` (null if it was removed);
 * an unknown ID returns undefined.
 */
export async function entity(
  db: Db,
  id: string,
): Promise<EntityDetail | { redirectTo: string | null } | undefined> {
  const [row] = await db.execute<
    Omit<EntityDetail, "appearances" | "differences" | "relationships"> & Record<string, unknown>
  >(sql`
    select e.id, e.kind, e.name, e.summary, e.notes, e.og_segment_id as "ogSegmentId",
      coalesce((
        select json_agg(n.name order by n.name) from entity_names n
        where n.entity_id = e.id and not n.is_primary
      ), '[]') as aliases,
      (
        select json_build_object(
          'when', ev.when,
          'start', json_build_object('earliest', ev.start_earliest, 'latest', ev.start_latest),
          'end', json_build_object('earliest', ev.end_earliest, 'latest', ev.end_latest),
          'seq', ev.seq,
          'importance', ev.importance,
          'arc', json_build_object('id', arc.id, 'name', arc.name)
        )
        from events ev join arcs arc on arc.id = ev.arc_id
        where ev.entity_id = e.id
      ) as event
    from entities e
    where e.id = ${id}
  `);

  if (row === undefined) {
    const [redirect] = await db.execute<{ newId: string | null }>(
      sql`select new_id as "newId" from id_redirects where old_id = ${id}`,
    );
    return redirect === undefined ? undefined : { redirectTo: redirect.newId };
  }

  const appearances = await db.execute<AppearanceDetail & Record<string, unknown>>(sql`
    select a.title, a.world, a.status, a.summary, a.role, a.when,
           a.play_position as "playPosition", a.sources, a.certainty, a.notes,
      coalesce((
        select json_agg(json_build_object(
          'locator', d.locator, 'framing', d.framing, 'seq', d.seq, 'isPrimary', d.is_primary,
          'note', d.note, 'playPosition', d.play_position
        ) order by d.position)
        from depictions d
        where d.entity_id = a.entity_id and d.title = a.title and d.world = a.world
      ), '[]') as depictions
    from appearances a
    join titles t on t.code = a.title
    join worlds w on w.id = a.world
    where a.entity_id = ${id}
    order by t.position, w.position
  `);

  const differences = await db.execute<DifferenceDetail & Record<string, unknown>>(sql`
    select d.id, d.key,
      json_build_object('title', d.from_title, 'world', d.from_world) as "from",
      json_build_object('title', d.to_title, 'world', d.to_world) as "to",
      d.category, d.magnitude, d.summary, d.sources, d.certainty, d.notes,
      coalesce((
        select json_agg(json_build_object('id', e.id, 'kind', e.kind, 'name', e.name) order by e.name)
        from difference_related r join entities e on e.id = r.entity_id
        where r.difference_id = d.id
      ), '[]') as related
    from differences d
    join titles ft on ft.code = d.from_title
    join titles tt on tt.code = d.to_title
    where d.entity_id = ${id}
    order by ft.position, tt.position, d.key
  `);

  const relationships = await db.execute<
    Omit<RelationshipDetail, "label"> & Record<string, unknown>
  >(sql`
    select x.id, x.type, x.category, x.direction, x.attributes,
      x.from_ref as "from", x.until_ref as "until",
      json_build_object('id', o.id, 'kind', o.kind, 'name', o.name) as other,
      (
        select json_agg(json_build_object(
          'title', et.title, 'world', et.world, 'sources', et.sources,
          'certainty', et.certainty, 'notes', et.notes
        ) order by t.position)
        from edge_titles et join titles t on t.code = et.title
        where et.edge_id = x.id
      ) as titles
    from (
      select *, 'out' as direction, target_id as other_id from edges where source_id = ${id}
      union all
      select *, 'in', source_id from edges where target_id = ${id}
    ) x
    join entities o on o.id = x.other_id
    order by x.category, x.type, x.direction, o.name
  `);

  return {
    ...row,
    appearances: [...appearances],
    differences: [...differences],
    relationships: relationships.map((r) => ({
      ...r,
      label: relationshipLabel(r.type, r.direction),
    })),
  };
}

// ─── Comparison ───────────────────────────────────────────────────────────────

/** Segment order and coverage, rebuilt from the database for status derivation. */
export async function loadCoverageIndex(db: Db): Promise<CoverageIndex> {
  const segments = await db.execute<OgSegments[number] & Record<string, unknown>>(
    sql`select id, name, disc, summary from og_segments order by position`,
  );
  const ranges = await db.execute<{
    title: Exclude<TitleCode, "og">;
    from: string;
    to: string;
    covered: string[];
  }>(sql`
    select c.title, c.from_segment as "from", c.to_segment as "to",
      coalesce((select json_agg(cs.segment_id) from covered_segments cs where cs.title = c.title), '[]')
        as covered
    from coverage c
  `);

  const order = segments.map((s) => s.id);
  const coverage: Coverage = {};
  for (const range of ranges) {
    const inRange = order.slice(order.indexOf(range.from), order.indexOf(range.to) + 1);
    const covered = new Set(range.covered);
    coverage[range.title] = {
      from: range.from,
      to: range.to,
      except: inRange.filter((segment) => !covered.has(segment)),
    };
  }
  return new CoverageIndex([...segments], coverage);
}

export interface ComparisonColumn {
  title: TitleCode;
  /** Stored or derived status for the main world (appearances.md §3). */
  status: DisplayStatus;
  /** A difference targets this title's appearance. */
  changed: boolean;
  appearance: AppearanceDetail | null;
  /** Appearances in other in-story worlds. */
  otherWorlds: AppearanceDetail[];
}

export interface ComparedRelationship extends RelationshipDetail {
  /**
   * Compared titles that show both ends of the relationship — the only titles that could
   * establish it. A title that shows only one end says nothing about the connection.
   */
  applicable: TitleCode[];
  /** Every applicable title establishes it. */
  shared: boolean;
}

export interface Comparison {
  entity: Omit<EntityDetail, "appearances" | "differences" | "relationships">;
  /** Appears in the Remake series but not in the original. */
  isNew: boolean;
  columns: ComparisonColumn[];
  /** Differences whose two sides are both among the compared titles. */
  differences: DifferenceDetail[];
  /** Relationships established by at least one compared title, with only those titles' evidence. */
  relationships: ComparedRelationship[];
}

/** How the chosen titles present one entity, side by side (appearances.md). */
export async function comparison(
  db: Db,
  id: string,
  titles: readonly TitleCode[] = TITLES_IN_ORDER,
): Promise<Comparison | { redirectTo: string | null } | undefined> {
  const found = await entity(db, id);
  if (found === undefined || "redirectTo" in found) return found;
  const { appearances, differences, relationships, ...info } = found;

  const index = await loadCoverageIndex(db);
  const subject = { appearances, ogSegment: info.ogSegmentId ?? undefined };
  const chosen = new Set(titles);
  const ordered = TITLES_IN_ORDER.filter((title) => chosen.has(title));
  const compared = differences.filter((d) => chosen.has(d.from.title) && chosen.has(d.to.title));
  // Only a title depicting both ends, in the same world, can show a relationship is missing.
  const depicted = await depictedIn(db, [id, ...relationships.map((r) => r.other.id)]);
  const applicableTitles = (other: string, established: ReadonlySet<TitleCode>) =>
    ordered.filter((title) => {
      if (established.has(title)) return true;
      const mine = depicted.get(id) ?? new Set<string>();
      const theirs = depicted.get(other) ?? new Set<string>();
      return [...mine].some((key) => key.startsWith(`${title}/`) && theirs.has(key));
    });

  return {
    entity: info,
    isNew: isNewInRemakeSeries(appearances),
    columns: ordered.map((title) => ({
      title,
      status: displayStatus(subject, title, index),
      changed: isChanged(compared, title),
      appearance: appearances.find((a) => a.title === title && a.world === MAIN_WORLD) ?? null,
      otherWorlds: appearances.filter((a) => a.title === title && a.world !== MAIN_WORLD),
    })),
    differences: compared,
    relationships: relationships.flatMap((relationship) => {
      const evidence = relationship.titles.filter((t) => chosen.has(t.title));
      if (evidence.length === 0) return [];
      const established = new Set(evidence.map((t) => t.title));
      const applicable = applicableTitles(relationship.other.id, established);
      const shared = applicable.every((title) => evidence.some((t) => t.title === title));
      return [{ ...relationship, titles: evidence, applicable, shared }];
    }),
  };
}

/** For each entity, where it's depicted, as `title/world` keys. */
async function depictedIn(db: Db, ids: readonly string[]): Promise<Map<string, Set<string>>> {
  const rows = await db.execute<{ id: string; keys: string[] }>(sql`
    select entity_id as id, array_agg(title::text || '/' || world) as keys
    from appearances
    where status = 'depicted'
      and entity_id in (select jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb))
    group by entity_id
  `);
  return new Map(rows.map((row) => [row.id, new Set(row.keys)]));
}

// ─── Network ──────────────────────────────────────────────────────────────────

/**
 * Everything within `depth` relationships of `id`, following only relationships that at least one
 * of `titles` establishes. A recursive CTE walks the edges in both directions.
 */
export async function neighborhood(
  db: Db,
  {
    id,
    depth,
    titles = TITLES_IN_ORDER,
  }: { id: string; depth: number; titles?: readonly TitleCode[] },
): Promise<Map<string, number>> {
  const rows = await db.execute<{ id: string; depth: number }>(sql`
    with recursive
      links as (
        select distinct e.source_id as a, e.target_id as b
        from edges e
        join edge_titles et on et.edge_id = e.id
        where et.title::text in ${titleList(titles)}
      ),
      adjacency as (
        select a, b from links
        union
        select b, a from links
      ),
      walk (id, depth) as (
        select id, 0 from entities where id = ${id}
        union
        select adjacency.b, walk.depth + 1
        from walk
        join adjacency on adjacency.a = walk.id
        where walk.depth < ${depth}
      )
    select id, min(depth)::int as depth
    from walk
    group by id
  `);
  return new Map(rows.map((row) => [row.id, row.depth]));
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult extends EntityRef {
  /** Why it matched: its own name, its summary, how a title presents it, or a connection. */
  reason: "name" | "summary" | "appearance" | "connection";
  /** The matched name, the title code, or the connected entity's name. */
  detail: string | null;
  score: number;
}

/** Multi-word, typo-tolerant search over names, summaries and related names; names rank first. */
export async function search(
  db: Db,
  { q, limit = 10 }: { q: string; limit?: number },
): Promise<{ terms: string[]; results: SearchResult[] }> {
  const terms = parseQuery(q);
  if (terms.length === 0) return { terms, results: [] };
  const phrase = terms.join(" ");

  const rows = await db.execute<SearchResult & Record<string, unknown>>(sql`
    with
      terms as (
        select term, ord
        from jsonb_array_elements_text(${JSON.stringify(terms)}::jsonb) with ordinality as t(term, ord)
      ),
      links as (
        select source_id as a, target_id as b from edges
        union all
        select target_id, source_id from edges
      ),
      hits as (
        select t.ord, n.entity_id, 'name' as reason, n.name as detail,
               greatest(
                 -- Word similarity scores a typo against each word, so long names aren't penalised.
                 word_similarity(t.term, lower(n.name)) * 0.9,
                 case when lower(n.name) ~ ('\\m' || t.term) then 1
                      when lower(n.name) like '%' || t.term || '%' then 0.8
                      else 0 end
               ) as score
        from terms t
        join entity_names n
          on word_similarity(t.term, lower(n.name)) >= 0.5
          or lower(n.name) like '%' || t.term || '%'
        union all
        select t.ord, e.id, 'summary', null, 0.6
        from terms t
        join entities e on e.search @@ to_tsquery('english', t.term || ':*')
        union all
        select t.ord, a.entity_id, 'appearance', a.title::text, 0.5
        from terms t
        join appearances a on a.search @@ to_tsquery('english', t.term || ':*')
        union all
        select t.ord, l.b, 'connection', n.name, 0.3
        from terms t
        join entity_names n on lower(n.name) ~ ('\\m' || t.term)
        join links l on l.a = n.entity_id
      ),
      per_term as (
        select entity_id, ord, max(score) as score
        from hits
        group by entity_id, ord
      ),
      qualified as (
        select entity_id, sum(score) as total
        from per_term
        group by entity_id
        having count(*) = (select count(*) from terms)
      ),
      best as (
        select distinct on (h.entity_id) h.entity_id, h.reason, h.detail
        from hits h
        join qualified q on q.entity_id = h.entity_id
        order by h.entity_id,
                 case h.reason when 'name' then 0 when 'summary' then 1 when 'appearance' then 2 else 3 end,
                 h.score desc,
                 h.detail
      )
    select e.id, e.kind, e.name, best.reason, best.detail, (q.total + boost.value)::real as score
    from qualified q
    join best on best.entity_id = q.entity_id
    join entities e on e.id = q.entity_id
    -- A name that is exactly the query, or starts with it, beats one that merely contains it.
    cross join lateral (
      select coalesce(max(case
        when lower(n.name) = ${phrase} then 2
        when lower(n.name) like ${phrase} || '%' then 1
        else 0 end), 0) as value
      from entity_names n
      where n.entity_id = e.id
    ) boost
    order by score desc, length(e.name), e.name
    limit ${limit}
  `);
  return { terms, results: [...rows] };
}
