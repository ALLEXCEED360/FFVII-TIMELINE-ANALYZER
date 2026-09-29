import { describe, expect, it } from "vitest";
import {
  type GraphEdge,
  connectedComponents,
  createGraph,
  degreeCentrality,
  filterGraph,
  neighborhood,
  networkSlice,
  shortestPath,
} from "./graph.ts";

// A small graph:
//
//   a ──(w1, og)── b ──(w3, og+remake)── c ──(w1, remake)── d
//    \                                                     /
//     └──────────────(w2, rebirth, causal)────────────────┘        e (alone)

const node = (id: string) => ({ id, kind: "character", name: id.toUpperCase() });
const edge = (
  id: string,
  source: string,
  target: string,
  weight: number,
  titles: GraphEdge["titles"],
  category: GraphEdge["category"] = "structural",
): GraphEdge => ({ id, source, target, type: "parent_of", category, weight, titles });

const graph = createGraph(["a", "b", "c", "d", "e"].map(node), [
  edge("ab", "a", "b", 1, ["og"]),
  edge("bc", "b", "c", 3, ["og", "remake"]),
  edge("cd", "c", "d", 1, ["remake"]),
  edge("ad", "a", "d", 2, ["rebirth"], "causal"),
  edge("ax", "a", "missing", 1, ["og"]),
]);

describe("createGraph", () => {
  it("drops edges to missing entities", () => {
    expect(graph.edges.map((e) => e.id)).toEqual(["ab", "bc", "cd", "ad"]);
  });
});

describe("neighborhood", () => {
  it("walks relationships in both directions, up to a depth", () => {
    expect(Object.fromEntries(neighborhood(graph, "c", 1))).toEqual({ c: 0, b: 1, d: 1 });
    expect(Object.fromEntries(neighborhood(graph, "c", 2))).toEqual({ c: 0, b: 1, d: 1, a: 2 });
  });

  it("is empty for an unknown entity", () => {
    expect(neighborhood(graph, "zz", 2).size).toBe(0);
  });
});

describe("networkSlice", () => {
  it("returns the neighbourhood, nearest first, with the edges among it", () => {
    const slice = networkSlice(graph, "c", 1);
    expect(slice?.nodes.map((n) => [n.id, n.depth])).toEqual([
      ["c", 0],
      ["b", 1],
      ["d", 1],
    ]);
    expect(slice?.edges.map((e) => e.id)).toEqual(["bc", "cd"]);
    expect(networkSlice(graph, "zz", 1)).toBeNull();
  });
});

describe("shortestPath", () => {
  it("prefers the lowest total weight over the fewest steps", () => {
    // a→d directly costs 2; a→b→c→d costs 5.
    expect(shortestPath(graph, "a", "d")).toMatchObject({ cost: 2, nodes: ["a", "d"] });
    expect(shortestPath(graph, "b", "d")).toMatchObject({ cost: 3, nodes: ["b", "a", "d"] });
  });

  it("returns the edges taken, in order", () => {
    expect(shortestPath(graph, "b", "d")?.edges.map((e) => e.id)).toEqual(["ab", "ad"]);
  });

  it("returns null when there's no path, and a single node for the same entity", () => {
    expect(shortestPath(graph, "a", "e")).toBeNull();
    expect(shortestPath(graph, "a", "a")).toEqual({ cost: 0, nodes: ["a"], edges: [] });
  });

  it("breaks ties deterministically", () => {
    const tie = createGraph(["s", "x", "y", "t"].map(node), [
      edge("sy", "s", "y", 1, ["og"]),
      edge("yt", "y", "t", 1, ["og"]),
      edge("sx", "s", "x", 1, ["og"]),
      edge("xt", "x", "t", 1, ["og"]),
    ]);
    expect(shortestPath(tie, "s", "t")?.nodes).toEqual(["s", "x", "t"]);
  });
});

describe("filterGraph", () => {
  it("keeps edges a chosen title establishes, with only those titles", () => {
    const remake = filterGraph(graph, { titles: ["remake"] });
    expect(remake.edges.map((e) => [e.id, e.titles])).toEqual([
      ["bc", ["remake"]],
      ["cd", ["remake"]],
    ]);
    expect(shortestPath(remake, "a", "d")).toBeNull();
  });

  it("keeps only entities a chosen title shows, when titles are known", () => {
    const withTitles = createGraph(
      [
        { ...node("a"), titles: ["og" as const] },
        { ...node("b"), titles: ["og" as const, "remake" as const] },
        node("c"),
      ],
      [edge("ab", "a", "b", 1, ["og"])],
    );
    const remake = filterGraph(withTitles, { titles: ["remake"] });
    expect([...remake.nodes.keys()]).toEqual(["b", "c"]);
    expect(remake.edges).toEqual([]);
  });

  it("filters by category and avoids entities", () => {
    expect(filterGraph(graph, { categories: ["causal"] }).edges.map((e) => e.id)).toEqual(["ad"]);
    const noA = filterGraph(graph, { avoid: ["a"] });
    expect(noA.nodes.has("a")).toBe(false);
    expect(shortestPath(noA, "b", "d")).toMatchObject({ nodes: ["b", "c", "d"], cost: 4 });
  });
});

describe("connectedComponents", () => {
  it("groups connected entities, largest first", () => {
    expect(connectedComponents(graph)).toEqual([["a", "b", "c", "d"], ["e"]]);
    expect(connectedComponents(filterGraph(graph, { titles: ["og"] }))).toEqual([
      ["a", "b", "c"],
      ["d"],
      ["e"],
    ]);
  });
});

describe("degreeCentrality", () => {
  it("counts distinct neighbours, normalised by n − 1", () => {
    const centrality = degreeCentrality(graph);
    expect(centrality.get("a")).toEqual({ degree: 2, centrality: 0.5 });
    expect(centrality.get("e")).toEqual({ degree: 0, centrality: 0 });
  });

  it("counts two edges to the same entity once", () => {
    const multi = createGraph(["a", "b"].map(node), [
      edge("1", "a", "b", 1, ["og"]),
      edge("2", "b", "a", 2, ["og"]),
    ]);
    expect(degreeCentrality(multi).get("a")?.degree).toBe(1);
  });
});
