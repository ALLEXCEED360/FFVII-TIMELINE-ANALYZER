import {
  type Certainty,
  type DifferenceCategory,
  type FileEntityKind,
  type Locator,
  type Series,
  TITLES_IN_ORDER,
  type TitleCode,
} from "@ffvii/shared";
import { type SQL, sql } from "drizzle-orm";
import type { Db } from "./client.ts";
import type { DifferenceDetail, EntityRef } from "./queries.ts";

// Listings and reference data for browsing: the catalogue, all differences, and the reference
// bundle the web app loads once.

function titleList(titles: readonly TitleCode[]): SQL {
  return sql`(select jsonb_array_elements_text(${JSON.stringify(titles)}::jsonb))`;
}

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface EntityListItem extends EntityRef {
  summary: string;
  /** Titles it appears in (any world, not omitted), in release order. */
  titles: TitleCode[];
}

/** Every entity, by name, optionally only one kind or only those a title shows. */
export async function listEntities(
  db: Db,
  { kind, title }: { kind?: FileEntityKind | undefined; title?: TitleCode | undefined } = {},
): Promise<EntityListItem[]> {
  const rows = await db.execute<EntityListItem & Record<string, unknown>>(sql`
    select e.id, e.kind, e.name, e.summary,
      coalesce((
        select json_agg(distinct_titles.title order by distinct_titles.position)
        from (
          select distinct a.title, t.position
          from appearances a join titles t on t.code = a.title
          where a.entity_id = e.id and a.status <> 'omitted'
        ) distinct_titles
      ), '[]') as titles
    from entities e
    where (${kind ?? null}::entity_kind is null or e.kind = ${kind ?? null}::entity_kind)
      and (${title ?? null}::title_code is null or exists (
        select 1 from appearances a
        where a.entity_id = e.id and a.title = ${title ?? null}::title_code and a.status <> 'omitted'
      ))
    order by e.name, e.id
  `);
  return [...rows];
}

// ─── Differences ──────────────────────────────────────────────────────────────

export interface DifferenceListItem extends DifferenceDetail {
  entity: EntityRef;
}

/** Every documented difference whose two sides are both among `titles`. */
export async function listDifferences(
  db: Db,
  {
    titles = TITLES_IN_ORDER,
    category,
    magnitude,
  }: {
    titles?: readonly TitleCode[];
    category?: DifferenceCategory | undefined;
    magnitude?: "minor" | "major" | undefined;
  } = {},
): Promise<DifferenceListItem[]> {
  const rows = await db.execute<DifferenceListItem & Record<string, unknown>>(sql`
    select d.id, d.key,
      json_build_object('id', e.id, 'kind', e.kind, 'name', e.name) as entity,
      json_build_object('title', d.from_title, 'world', d.from_world) as "from",
      json_build_object('title', d.to_title, 'world', d.to_world) as "to",
      d.category, d.magnitude, d.summary, d.sources, d.certainty, d.notes,
      coalesce((
        select json_agg(json_build_object('id', r.id, 'kind', r.kind, 'name', r.name) order by r.name)
        from difference_related dr join entities r on r.id = dr.entity_id
        where dr.difference_id = d.id
      ), '[]') as related
    from differences d
    join entities e on e.id = d.entity_id
    left join events ev on ev.entity_id = e.id
    where d.from_title::text in ${titleList(titles)}
      and d.to_title::text in ${titleList(titles)}
      and (${category ?? null}::difference_category is null
           or d.category = ${category ?? null}::difference_category)
      and (${magnitude ?? null}::magnitude is null or d.magnitude = ${magnitude ?? null}::magnitude)
    -- Events in story order first, then everything else by name.
    order by ev.start_earliest nulls last, ev.seq nulls last, e.name, d.key
  `);
  return [...rows];
}

// ─── Reference data ───────────────────────────────────────────────────────────

export interface ReferenceTitle {
  code: TitleCode;
  name: string;
  shortName: string;
  released: string;
  series: Series;
  /** Chapters and unnumbered parts, in play order; empty for the disc-based original. */
  units: { key: string; name: string; position: number }[];
  /** Original segments this title retells; null if it retells none. */
  coverage: { from: string; to: string; segments: string[]; notes: string | null } | null;
}

export interface Reference {
  titles: ReferenceTitle[];
  segments: { id: string; name: string; disc: number; summary: string }[];
  arcs: {
    id: string;
    name: string;
    summary: string;
    og: { from: string; to: string };
    chapters: Partial<Record<TitleCode, [number, number]>>;
  }[];
  eras: { id: string; name: string; start: number; end: number; weight: number }[];
  worlds: {
    id: string;
    name: string;
    summary: string;
    firstShown: Locator | null;
    branchesFrom: string | null;
    sources: Locator[] | null;
    certainty: Certainty | null;
    notes: string | null;
  }[];
}

/** Titles, segments, arcs, eras and worlds — everything the app needs to label and lay out data. */
export async function reference(db: Db): Promise<Reference> {
  const titles = await db.execute<ReferenceTitle & Record<string, unknown>>(sql`
    select t.code, t.name, t.short_name as "shortName", t.released, t.series,
      coalesce((
        select json_agg(json_build_object('key', u.key, 'name', u.name, 'position', u.position)
                        order by u.position)
        from title_units u where u.title = t.code
      ), '[]') as units,
      (
        select json_build_object(
          'from', c.from_segment, 'to', c.to_segment, 'notes', c.notes,
          'segments', (
            select json_agg(cs.segment_id order by s.position)
            from covered_segments cs join og_segments s on s.id = cs.segment_id
            where cs.title = c.title
          )
        )
        from coverage c where c.title = t.code
      ) as coverage
    from titles t
    order by t.position
  `);
  const segments = await db.execute<Reference["segments"][number] & Record<string, unknown>>(
    sql`select id, name, disc, summary from og_segments order by position`,
  );
  const arcs = await db.execute<Reference["arcs"][number] & Record<string, unknown>>(sql`
    select id, name, summary, json_build_object('from', og_from, 'to', og_to) as og, chapters
    from arcs order by position
  `);
  const eras = await db.execute<Reference["eras"][number] & Record<string, unknown>>(sql`
    select id, name, start_year as start, end_year as "end", weight from eras order by position
  `);
  const worlds = await db.execute<Reference["worlds"][number] & Record<string, unknown>>(sql`
    select id, name, summary, first_shown as "firstShown", branches_from as "branchesFrom",
           sources, certainty, notes
    from worlds order by position
  `);
  return {
    titles: [...titles],
    segments: [...segments],
    arcs: [...arcs],
    eras: [...eras],
    worlds: [...worlds],
  };
}
