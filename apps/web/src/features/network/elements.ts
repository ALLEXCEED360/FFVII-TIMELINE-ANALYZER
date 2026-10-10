import type { ElementDefinition } from "cytoscape";
import type { Network, NetworkEdge, NetworkNode, TitleCode } from "../../api/client";
import { artFor, pictureFor, thumbSrc } from "../../art/manifest";
import { tellingsIn } from "../../lib/tellings";

/**
 * The picture a thing's orb wears: a person's portrait (the modern look where there is one), and
 * for a moment, place or group its own picture, so no two look alike.
 */
export function pictureOf(id: string, kind: string): string | undefined {
  if (kind !== "character") {
    const picture = pictureFor(id, kind);
    return picture ? thumbSrc(picture) : undefined;
  }
  const art = artFor(id);
  const entry = art.main?.kind === "cutout" ? art.main : art.original;
  return entry ? thumbSrc(entry) : undefined;
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

/** Only the kinds of thing chosen, and the links between them; `keep` stays whatever its kind. */
export function onlyKinds(
  network: MergedNetwork,
  kinds: readonly string[],
  keep: ReadonlySet<string>,
): MergedNetwork {
  const nodes = new Map(
    [...network.nodes].filter(([id, node]) => kinds.includes(node.kind) || keep.has(id)),
  );
  const edges = new Map(
    [...network.edges].filter(([, edge]) => nodes.has(edge.source) && nodes.has(edge.target)),
  );
  return { nodes, edges };
}

/** Where a thing sits: its ring (0 is the centre), its place, and which side its name goes on. */
export interface Placed {
  ring: number;
  x: number;
  y: number;
  side: "centre" | "left" | "right" | "top" | "bottom";
}

/** People first, then groups and places, then moments: each ring's sectors, clockwise from the top. */
const KIND_ORDER = ["character", "organization", "location", "event"];
/** The room one name needs on the first ring, and one dot on the rings beyond. */
const NAME_ROOM = 98;
const DOT_ROOM = 44;

/**
 * The web as rings round the centre, like a clock face: what's directly linked on the first ring,
 * grouped by kind; each further step on a wider ring, every thing placed beside what links it in.
 * Names go outside their ring, so they never cover one another.
 */
export function ringLayout(network: MergedNetwork, center: string): Map<string, Placed> {
  const next = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    const set = next.get(a) ?? new Set<string>();
    set.add(b);
    next.set(a, set);
  };
  for (const edge of network.edges.values()) {
    link(edge.source, edge.target);
    link(edge.target, edge.source);
  }

  // How many steps each thing is from the centre.
  const ringOf = new Map<string, number>([[center, 0]]);
  const queue = [center];
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    for (const other of next.get(id) ?? []) {
      if (!ringOf.has(other) && network.nodes.has(other)) {
        ringOf.set(other, (ringOf.get(id) ?? 0) + 1);
        queue.push(other);
      }
    }
  }
  const furthest = Math.max(0, ...ringOf.values());
  for (const id of network.nodes.keys()) if (!ringOf.has(id)) ringOf.set(id, furthest + 1);

  const rings: string[][] = [];
  for (const [id, ring] of ringOf) (rings[ring] ??= []).push(id);

  const placed = new Map<string, Placed>();
  const angleOf = new Map<string, number>();
  const name = (id: string) => network.nodes.get(id)?.name ?? id;
  const kindRank = (id: string) => KIND_ORDER.indexOf(network.nodes.get(id)?.kind ?? "");
  const top = -Math.PI / 2;
  let radius = 0;

  rings.forEach((ids, ring) => {
    if (ring === 0) {
      placed.set(center, { ring: 0, x: 0, y: 0, side: "centre" });
      return;
    }
    let angles: [string, number][];
    if (ring === 1) {
      // Sectors by kind, a gap between each, in name order within.
      const sorted = [...ids].sort(
        (a, b) => kindRank(a) - kindRank(b) || name(a).localeCompare(name(b)),
      );
      const slots: (string | null)[] = [];
      sorted.forEach((id, i) => {
        if (i > 0 && kindRank(id) !== kindRank(sorted[i - 1] ?? "")) slots.push(null);
        slots.push(id);
      });
      // And between the last sector and the first.
      if (new Set(sorted.map(kindRank)).size > 1) slots.push(null);
      angles = slots.flatMap((id, i) =>
        id ? [[id, top + (2 * Math.PI * i) / slots.length] as [string, number]] : [],
      );
      radius = Math.max(170, (slots.length * NAME_ROOM) / (2 * Math.PI));
    } else {
      // Beside what links them in: the average direction of their neighbours one ring in.
      const wanted = ids.map((id) => {
        let sin = 0;
        let cos = 0;
        for (const other of next.get(id) ?? []) {
          const a = angleOf.get(other);
          if (a !== undefined && ringOf.get(other) === ring - 1) {
            sin += Math.sin(a);
            cos += Math.cos(a);
          }
        }
        const a = sin === 0 && cos === 0 ? top : Math.atan2(sin, cos);
        return [id, (((a - top) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)] as const;
      });
      wanted.sort((a, b) => a[1] - b[1] || name(a[0]).localeCompare(name(b[0])));
      const step = (2 * Math.PI) / wanted.length;
      // Spread evenly, turned so each stays as near as it can to where it wanted to be.
      const turn =
        wanted.reduce((sum, [, a], i) => sum + (a - i * step), 0) / Math.max(1, wanted.length);
      angles = wanted.map(([id], i) => [id, top + turn + i * step]);
      // Room outside the first ring for its names; the rings beyond are dots.
      radius = Math.max(
        radius + (ring === 2 ? 175 : 100),
        (wanted.length * DOT_ROOM) / (2 * Math.PI),
      );
    }
    for (const [id, a] of angles) {
      angleOf.set(id, a);
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const side = cos > 0.3 ? "right" : cos < -0.3 ? "left" : sin < 0 ? "top" : "bottom";
      // A little wider than tall: names sit left and right, where there's room for them.
      placed.set(id, { ring, x: radius * 1.2 * cos, y: radius * sin, side });
    }
  });
  return placed;
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
  /** The titles being viewed; with both tellings, edges only one of them establishes are marked. */
  titles: readonly TitleCode[];
}

/** Cytoscape elements, classed by kind, centre, selection, path and single-game edges. */
export function toElements(network: MergedNetwork, highlight: Highlight): ElementDefinition[] {
  const { center, selected, titles } = highlight;
  const pathEdges = new Set(highlight.pathEdges ?? []);
  const pathNodes = new Set(highlight.pathNodes ?? []);
  const hasPath = pathEdges.size > 0;
  const near = selected ? neighboursOf(network, selected) : null;
  const placed = ringLayout(network, center);

  const nodeClasses = (node: ViewNode) => {
    const where = placed.get(node.id);
    const classes: string[] = [node.kind, `name-${where?.side ?? "bottom"}`];
    if ((where?.ring ?? 0) >= 2) classes.push("far");
    if (pictureOf(node.id, node.kind)) classes.push("pictured");
    if (node.id === center) classes.push("center");
    if (node.depth === null) classes.push("expanded");
    if (node.id === selected) classes.push("selected");
    if (hasPath) classes.push(pathNodes.has(node.id) ? "on-path" : "faded");
    else if (near && node.id !== selected) classes.push(near.has(node.id) ? "near" : "faded");
    return classes.join(" ");
  };

  const edgeClasses = (edge: NetworkEdge) => {
    const classes: string[] = [edge.category];
    // Links to the centre are the web's spokes; the rest stay faint until pointed at.
    classes.push(edge.source === center || edge.target === center ? "spoke" : "rim");
    if (tellingsIn(titles).length > 1 && tellingsIn(edge.titles).length === 1) {
      classes.push("single-title");
    }
    if (hasPath) classes.push(pathEdges.has(edge.id) ? "on-path" : "faded");
    else if (selected) {
      classes.push(edge.source === selected || edge.target === selected ? "near" : "faded");
    }
    return classes.join(" ");
  };

  return [
    ...[...network.nodes.values()].map((node) => ({
      group: "nodes" as const,
      position: { x: placed.get(node.id)?.x ?? 0, y: placed.get(node.id)?.y ?? 0 },
      data: {
        id: node.id,
        label: node.name,
        kind: node.kind,
        ...(pictureOf(node.id, node.kind) ? { image: pictureOf(node.id, node.kind) } : {}),
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
