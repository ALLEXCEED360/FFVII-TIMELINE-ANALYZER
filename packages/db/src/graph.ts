import { type Graph, type GraphEdge, type GraphNode, createGraph } from "@ffvii/graph-core";
import { sql } from "drizzle-orm";
import type { Db } from "./client.ts";

/**
 * The whole relationship graph, for the in-memory algorithms in graph-core (shortest path,
 * components, centrality). Each node carries the titles that show it; each edge, the titles
 * that establish it.
 */
export async function loadGraph(db: Db): Promise<Graph> {
  const nodes = await db.execute<GraphNode & Record<string, unknown>>(sql`
    select e.id, e.kind, e.name,
      coalesce((
        select json_agg(distinct a.title) from appearances a
        where a.entity_id = e.id and a.status <> 'omitted'
      ), '[]') as titles
    from entities e
    order by e.id
  `);
  const edges = await db.execute<GraphEdge & Record<string, unknown>>(sql`
    select e.id, e.source_id as source, e.target_id as target, e.type, e.category, e.weight,
      json_agg(et.title order by t.position) as titles
    from edges e
    join edge_titles et on et.edge_id = e.id
    join titles t on t.code = et.title
    group by e.id
    order by e.id
  `);
  return createGraph(nodes, edges);
}
