import type { EdgeCategory, EdgeType, TitleCode } from "@ffvii/shared";

// The relationship graph and its algorithms (blueprint §27–28, docs/model/relationships.md §6).
// Pure and dependency-free at runtime (type imports only), so the API and the browser can share it.
// These are dataset metrics — how the data is connected — not judgements about the story.

export interface GraphNode {
  id: string;
  kind: string;
  name: string;
  /** Titles that show it; when present, a title filter keeps only nodes one of them shows. */
  titles?: TitleCode[] | undefined;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  category: EdgeCategory;
  /** Cost in shortest-path search; lower is a stronger link (relationships.md §4). */
  weight: number;
  /** Titles that establish it. */
  titles: TitleCode[];
}

export interface Graph {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  /** Edges touching each node, in either direction (relationships are walked both ways). */
  adjacency: Map<string, GraphEdge[]>;
}

/** Builds a graph, ignoring edges whose endpoints aren't among the nodes. */
export function createGraph(nodes: Iterable<GraphNode>, edges: Iterable<GraphEdge>): Graph {
  const byId = new Map<string, GraphNode>();
  for (const node of nodes) byId.set(node.id, node);
  const kept: GraphEdge[] = [];
  const adjacency = new Map<string, GraphEdge[]>([...byId.keys()].map((id) => [id, []]));
  for (const edge of edges) {
    if (!byId.has(edge.source) || !byId.has(edge.target)) continue;
    kept.push(edge);
    adjacency.get(edge.source)?.push(edge);
    if (edge.target !== edge.source) adjacency.get(edge.target)?.push(edge);
  }
  return { nodes: byId, edges: kept, adjacency };
}

export interface GraphFilter {
  /**
   * Keep edges established by at least one of these titles (with only those titles' evidence),
   * and nodes shown by at least one of them.
   */
  titles?: readonly TitleCode[] | undefined;
  /** Keep only these edge categories. */
  categories?: readonly EdgeCategory[] | undefined;
  /** Leave these entities out entirely — e.g. to find a path "not via Shinra". */
  avoid?: readonly string[] | undefined;
}

/** A copy of the graph narrowed by titles, categories and entities to avoid. */
export function filterGraph(graph: Graph, { titles, categories, avoid }: GraphFilter): Graph {
  const avoided = new Set(avoid ?? []);
  const shown = (node: GraphNode) =>
    !titles || !node.titles || node.titles.some((title) => titles.includes(title));
  const nodes = [...graph.nodes.values()].filter((node) => !avoided.has(node.id) && shown(node));
  const edges = graph.edges.flatMap((edge) => {
    if (avoided.has(edge.source) || avoided.has(edge.target)) return [];
    if (categories && !categories.includes(edge.category)) return [];
    if (!titles) return [edge];
    const kept = edge.titles.filter((title) => titles.includes(title));
    return kept.length > 0 ? [{ ...edge, titles: kept }] : [];
  });
  return createGraph(nodes, edges);
}

function otherEnd(edge: GraphEdge, node: string): string {
  return edge.source === node ? edge.target : edge.source;
}

/** Every entity within `depth` relationships of `start`, with its distance (breadth-first). */
export function neighborhood(graph: Graph, start: string, depth: number): Map<string, number> {
  if (!graph.nodes.has(start)) return new Map();
  const found = new Map([[start, 0]]);
  let frontier = [start];
  for (let d = 1; d <= depth && frontier.length > 0; d++) {
    const next: string[] = [];
    for (const node of frontier) {
      for (const edge of graph.adjacency.get(node) ?? []) {
        const other = otherEnd(edge, node);
        if (!found.has(other)) {
          found.set(other, d);
          next.push(other);
        }
      }
    }
    frontier = next;
  }
  return found;
}

export interface NetworkSlice {
  center: string;
  /** Entities within the depth, nearest first, then by name. */
  nodes: (GraphNode & { depth: number })[];
  /** Every edge between two of those entities. */
  edges: GraphEdge[];
}

/** The part of the graph around `center`: its neighbourhood and the edges among it. */
export function networkSlice(graph: Graph, center: string, depth: number): NetworkSlice | null {
  const depths = neighborhood(graph, center, depth);
  if (depths.size === 0) return null;
  const nodes = [...depths].flatMap(([id, d]) => {
    const node = graph.nodes.get(id);
    return node ? [{ ...node, depth: d }] : [];
  });
  nodes.sort((a, b) => a.depth - b.depth || a.name.localeCompare(b.name));
  const edges = graph.edges
    .filter((edge) => depths.has(edge.source) && depths.has(edge.target))
    .sort((a, b) => a.id.localeCompare(b.id));
  return { center, nodes, edges };
}

export interface PathResult {
  /** Sum of edge weights along the path. */
  cost: number;
  /** Entity IDs from start to end. */
  nodes: string[];
  /** The edge taken at each step (`edges[i]` joins `nodes[i]` and `nodes[i + 1]`). */
  edges: GraphEdge[];
}

/**
 * The strongest chain of relationships between two entities: the path with the lowest total
 * weight (Dijkstra). Ties go to fewer steps, then to alphabetical IDs, so answers are stable.
 * Null if they aren't connected.
 */
export function shortestPath(graph: Graph, from: string, to: string): PathResult | null {
  if (!graph.nodes.has(from) || !graph.nodes.has(to)) return null;
  if (from === to) return { cost: 0, nodes: [from], edges: [] };

  interface Entry {
    node: string;
    cost: number;
    hops: number;
  }
  const best = new Map<string, Entry>([[from, { node: from, cost: 0, hops: 0 }]]);
  const via = new Map<string, { previous: string; edge: GraphEdge }>();
  const done = new Set<string>();
  const queue: Entry[] = [{ node: from, cost: 0, hops: 0 }];
  const before = (a: Entry, b: Entry) =>
    a.cost - b.cost || a.hops - b.hops || a.node.localeCompare(b.node);

  while (queue.length > 0) {
    queue.sort(before);
    const current = queue.shift();
    if (!current || done.has(current.node)) continue;
    done.add(current.node);
    if (current.node === to) break;

    const edges = [...(graph.adjacency.get(current.node) ?? [])].sort(
      (a, b) => a.weight - b.weight || a.id.localeCompare(b.id),
    );
    for (const edge of edges) {
      const next = otherEnd(edge, current.node);
      if (done.has(next)) continue;
      const candidate = { node: next, cost: current.cost + edge.weight, hops: current.hops + 1 };
      const known = best.get(next);
      if (!known || before(candidate, known) < 0) {
        best.set(next, candidate);
        via.set(next, { previous: current.node, edge });
        queue.push(candidate);
      }
    }
  }

  const end = best.get(to);
  if (!end || !done.has(to)) return null;
  const nodes = [to];
  const edges: GraphEdge[] = [];
  for (let node = to; node !== from;) {
    const step = via.get(node);
    if (!step) return null;
    edges.unshift(step.edge);
    nodes.unshift(step.previous);
    node = step.previous;
  }
  return { cost: end.cost, nodes, edges };
}

/** Groups of entities connected to each other, largest first (IDs sorted within each group). */
export function connectedComponents(graph: Graph): string[][] {
  const seen = new Set<string>();
  const groups: string[][] = [];
  for (const id of [...graph.nodes.keys()].sort()) {
    if (seen.has(id)) continue;
    const group = [...neighborhood(graph, id, Number.POSITIVE_INFINITY).keys()].sort();
    for (const member of group) seen.add(member);
    groups.push(group);
  }
  return groups.sort((a, b) => b.length - a.length || (a[0] ?? "").localeCompare(b[0] ?? ""));
}

export interface Centrality {
  /** Distinct entities it's directly related to. */
  degree: number;
  /** Degree divided by the most it could be (n − 1); 0–1. */
  centrality: number;
}

/** Degree centrality: how directly connected each entity is, within this graph. */
export function degreeCentrality(graph: Graph): Map<string, Centrality> {
  const n = graph.nodes.size;
  return new Map(
    [...graph.nodes.keys()].map((id) => {
      const neighbours = new Set(
        (graph.adjacency.get(id) ?? []).map((edge) => otherEnd(edge, id)).filter((o) => o !== id),
      );
      return [id, { degree: neighbours.size, centrality: n > 1 ? neighbours.size / (n - 1) : 0 }];
    }),
  );
}
