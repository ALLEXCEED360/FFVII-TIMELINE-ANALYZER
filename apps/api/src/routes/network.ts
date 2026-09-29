import {
  type Graph,
  type GraphEdge,
  type GraphNode,
  connectedComponents,
  degreeCentrality,
  filterGraph,
  networkSlice,
  shortestPath,
} from "@ffvii/graph-core";
import {
  EDGE_CATEGORIES,
  EDGE_TYPES,
  type EdgeCategory,
  type TitleCode,
  TitleCodeSchema,
} from "@ffvii/shared";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  EdgeCategoryEnum,
  EdgeTypeEnum,
  EntityId,
  EntityKindEnum,
  EntityRef,
  ErrorBody,
  Titles,
} from "../schemas.ts";
import { NOT_FOUND } from "./redirects.ts";

// The relationship network (blueprint §27–28), computed in memory with graph-core on a graph
// loaded from Postgres once (docs/decisions/0010-network.md).

const Categories = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  )
  .pipe(z.array(EdgeCategoryEnum).min(1, "list at least one category"))
  .optional()
  .describe(
    "Comma-separated relationship categories (`structural,event,causal`). Defaults to all.",
  );

const Avoid = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  )
  .pipe(z.array(EntityId).max(20))
  .optional()
  .describe("Comma-separated entity IDs to leave out, e.g. to find a path that avoids them.");

const Edge = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: EdgeTypeEnum,
  category: EdgeCategoryEnum,
  label: z.string().describe("Read from source to target, e.g. `took part in`."),
  weight: z.number().describe("Cost in shortest-path search; lower is a stronger link."),
  titles: z.array(TitleCodeSchema).describe("Which requested titles establish it."),
});

const Network = z.object({
  center: z.string(),
  nodes: z.array(EntityRef.extend({ depth: z.number().describe("Steps from the centre.") })),
  edges: z.array(Edge),
});

const Path = z.object({
  found: z.boolean(),
  cost: z.number().nullable().describe("Sum of the weights along the path."),
  nodes: z.array(EntityRef).describe("From start to end."),
  edges: z.array(Edge).describe("`edges[i]` joins `nodes[i]` and `nodes[i + 1]`."),
});

const Metrics = z.object({
  nodeCount: z.number(),
  edgeCount: z.number(),
  components: z
    .array(z.object({ size: z.number(), members: z.array(EntityRef) }))
    .describe("Groups of entities connected to each other, largest first."),
  centrality: z
    .array(
      EntityRef.extend({
        degree: z.number().describe("Distinct entities it's directly related to."),
        centrality: z.number().describe("Degree ÷ (entities − 1), 0–1."),
      }),
    )
    .describe("Degree centrality, highest first — a dataset metric, not a ranking of characters."),
});

function edgeOut(edge: GraphEdge) {
  return { ...edge, label: EDGE_TYPES[edge.type].label };
}

function toRef(node: GraphNode) {
  return { id: node.id, kind: EntityKindEnum.parse(node.kind), name: node.name };
}

function refOf(graph: Graph, id: string) {
  const node = graph.nodes.get(id);
  if (!node) throw new Error(`${id} isn't in the graph`);
  return toRef(node);
}

export const networkRoutes: FastifyPluginCallbackZod<{ graph: () => Promise<Graph> }> = (
  app,
  { graph: loadGraph },
  done,
) => {
  /** The graph as seen through the requested titles and categories. */
  const view = async (titles?: readonly TitleCode[], categories?: readonly EdgeCategory[]) =>
    filterGraph(await loadGraph(), { titles, categories: categories ?? [...EDGE_CATEGORIES] });

  app.get(
    "/network/metrics",
    {
      schema: {
        tags: ["network"],
        summary: "Structure of the whole relationship graph: groups and degree centrality",
        querystring: z.object({ titles: Titles, categories: Categories }),
        response: { 200: Metrics },
      },
    },
    async ({ query: { titles, categories } }) => {
      const graph = await view(titles, categories);
      const centrality = degreeCentrality(graph);
      return {
        nodeCount: graph.nodes.size,
        edgeCount: graph.edges.length,
        components: connectedComponents(graph).map((members) => ({
          size: members.length,
          members: members.map((id) => refOf(graph, id)),
        })),
        centrality: [...centrality]
          .map(([id, c]) => ({ ...refOf(graph, id), ...c }))
          .sort((a, b) => b.degree - a.degree || a.name.localeCompare(b.name)),
      };
    },
  );

  app.get(
    "/network/path",
    {
      schema: {
        tags: ["network"],
        summary: "The strongest chain of relationships between two entities",
        description:
          "Weighted shortest path (docs/model/relationships.md §6): family, killings, causes and experiments are strong links; membership and residence are weak. Use `avoid` to route around large hubs.",
        querystring: z.object({
          from: EntityId,
          to: EntityId,
          titles: Titles,
          categories: Categories,
          avoid: Avoid,
        }),
        response: { 200: Path, 400: ErrorBody, 404: ErrorBody },
      },
    },
    async ({ query: { from, to, titles, categories, avoid } }, reply) => {
      const full = await loadGraph();
      if (!full.nodes.has(from) || !full.nodes.has(to)) return reply.code(404).send(NOT_FOUND);
      if (avoid?.includes(from) || avoid?.includes(to)) {
        return reply
          .code(400)
          .send({ error: "bad_request", message: "The start and end can't be avoided." });
      }
      const graph = filterGraph(await view(titles, categories), { avoid });
      const path = shortestPath(graph, from, to);
      if (!path) return { found: false, cost: null, nodes: [], edges: [] };
      return {
        found: true,
        cost: path.cost,
        nodes: path.nodes.map((id) => refOf(graph, id)),
        edges: path.edges.map(edgeOut),
      };
    },
  );

  app.get(
    "/network/:id",
    {
      schema: {
        tags: ["network"],
        summary: "An entity's neighbourhood in the relationship graph",
        description:
          "Every entity within `depth` relationships of `id`, and the relationships among them, following only relationships that one of `titles` establishes, in the chosen `categories`.",
        params: z.object({ id: EntityId }),
        querystring: z.object({
          depth: z.coerce.number().int().min(1).max(3).default(1),
          titles: Titles,
          categories: Categories,
        }),
        response: { 200: Network, 404: ErrorBody },
      },
    },
    async ({ params: { id }, query: { depth, titles, categories } }, reply) => {
      const full = await loadGraph();
      const center = full.nodes.get(id);
      if (!center) return reply.code(404).send(NOT_FOUND);
      // If the chosen titles don't show the entity at all, it stands alone.
      const slice = networkSlice(await view(titles, categories), id, depth) ?? {
        center: id,
        nodes: [{ ...center, depth: 0 }],
        edges: [],
      };
      return {
        center: slice.center,
        nodes: slice.nodes.map((node) => ({ ...toRef(node), depth: node.depth })),
        edges: slice.edges.map(edgeOut),
      };
    },
  );
  done();
};
