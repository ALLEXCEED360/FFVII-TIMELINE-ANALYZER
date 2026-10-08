import type { ElementDefinition } from "cytoscape";
import type { Network, NetworkEdge, NetworkNode, TitleCode } from "../../api/client";
import { artFor, artSrc } from "../../art/manifest";

/** A person's portrait for their orb: the modern look where there is one, else the original's. */
export function portraitOf(id: string, kind: string): string | undefined {
  if (kind !== "character") return undefined;
  const art = artFor(id);
  const entry = art.main?.kind === "cutout" ? art.main : art.original;
  return entry ? artSrc(entry) : undefined;
}

// What the graph shows, as Cytoscape elements. Pure (a type-only Cytoscape import), so it's tested
// without a browser.

export interface ViewNode extends Omit<NetworkNode, "depth"> {
  /** Steps from the centre, or null for entities added by expanding another node. */
  depth: number | null;
}

export interface MergedNetwork {
  nodes: Map<string, ViewNode>;
  edges: Map<string, NetworkEdge>;
}

/** The centre's neighbourhood plus any expanded ones (those have no depth). */
export function mergeNetworks(main: Network, expansions: readonly Network[]): MergedNetwork {
  const nodes = new Map<string, ViewNode>(main.nodes.map((n) => [n.id, n]));
  const edges = new Map<string, NetworkEdge>(main.edges.map((e) => [e.id, e]));
  for (const extra of expansions) {
    for (const node of extra.nodes) {
      if (!nodes.has(node.id)) nodes.set(node.id, { ...node, depth: null });
    }
    for (const edge of extra.edges) edges.set(edge.id, edge);
  }
  return { nodes, edges };
}

/** Entities directly related to `id` within the view. */
export function neighboursOf(network: MergedNetwork, id: string): Set<string> {
  const found = new Set<string>();
  for (const edge of network.edges.values()) {
    if (edge.source === id) found.add(edge.target);
    if (edge.target === id) found.add(edge.source);
  }
  return found;
}

export interface Highlight {
  center: string;
  selected: string | null;
  /** Edge IDs on the highlighted path, if any. */
  pathEdges?: readonly string[];
  /** Entity IDs on the highlighted path, if any. */
  pathNodes?: readonly string[];
  /** The titles being viewed; when several are, edges only one of them establishes are marked. */
  titles: readonly TitleCode[];
}

/** Cytoscape elements, classed by kind, centre, selection, path and single-game edges. */
export function toElements(network: MergedNetwork, highlight: Highlight): ElementDefinition[] {
  const { center, selected, titles } = highlight;
  const pathEdges = new Set(highlight.pathEdges ?? []);
  const pathNodes = new Set(highlight.pathNodes ?? []);
  const hasPath = pathEdges.size > 0;
  const near = selected ? neighboursOf(network, selected) : null;

  const nodeClasses = (node: ViewNode) => {
    const classes: string[] = [node.kind];
    if (portraitOf(node.id, node.kind)) classes.push("portrait");
    if (node.id === center) classes.push("center");
    if (node.depth === null) classes.push("expanded");
    if (node.id === selected) classes.push("selected");
    if (hasPath) classes.push(pathNodes.has(node.id) ? "on-path" : "faded");
    else if (near && node.id !== selected) classes.push(near.has(node.id) ? "near" : "faded");
    return classes.join(" ");
  };

  const edgeClasses = (edge: NetworkEdge) => {
    const classes: string[] = [edge.category];
    if (titles.length > 1 && edge.titles.length === 1) classes.push("single-title");
    if (hasPath) classes.push(pathEdges.has(edge.id) ? "on-path" : "faded");
    else if (selected) {
      classes.push(edge.source === selected || edge.target === selected ? "near" : "faded");
    }
    return classes.join(" ");
  };

  return [
    ...[...network.nodes.values()].map((node) => ({
      group: "nodes" as const,
      data: {
        id: node.id,
        label: node.name,
        kind: node.kind,
        ...(portraitOf(node.id, node.kind) ? { image: portraitOf(node.id, node.kind) } : {}),
      },
      classes: nodeClasses(node),
    })),
    ...[...network.edges.values()].map((edge) => ({
      group: "edges" as const,
      data: { id: edge.id, source: edge.source, target: edge.target, label: edge.label },
      classes: edgeClasses(edge),
    })),
  ];
}

/** A key that changes only when the set of nodes changes — when the layout needs to rerun. */
export function layoutKey(network: MergedNetwork): string {
  return [...network.nodes.keys()].sort().join("|");
}
