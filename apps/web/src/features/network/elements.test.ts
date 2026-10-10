import { describe, expect, it } from "vitest";
import type { Network } from "../../api/client";
import { mergeNetworks, neighboursOf, onlyKinds, ringLayout, toElements } from "./elements";
import { networkSearch, parseNetworkParams, toggle } from "./params";

const edge = (
  id: string,
  source: string,
  target: string,
  titles: Network["edges"][number]["titles"] = ["og", "rebirth"],
) => ({
  id,
  source,
  target,
  type: "participated_in" as const,
  category: "event" as const,
  label: "took part in",
  weight: 2,
  titles,
});

const main: Network = {
  center: "character_a",
  nodes: [
    { id: "character_a", kind: "character", name: "A", depth: 0 },
    { id: "event_b", kind: "event", name: "B", depth: 1 },
    { id: "location_c", kind: "location", name: "C", depth: 1 },
  ],
  edges: [edge("ab", "character_a", "event_b"), edge("ac", "character_a", "location_c", ["og"])],
};

const expansion: Network = {
  center: "event_b",
  nodes: [
    { id: "event_b", kind: "event", name: "B", depth: 0 },
    { id: "character_d", kind: "character", name: "D", depth: 1 },
  ],
  edges: [edge("bd", "character_d", "event_b")],
};

describe("mergeNetworks", () => {
  it("adds expanded neighbourhoods, marking entities reached only through them", () => {
    const merged = mergeNetworks(main, [expansion]);
    expect([...merged.nodes.values()].map((n) => [n.id, n.depth])).toEqual([
      ["character_a", 0],
      ["event_b", 1],
      ["location_c", 1],
      ["character_d", null],
    ]);
    expect([...merged.edges.keys()]).toEqual(["ab", "ac", "bd"]);
    expect([...neighboursOf(merged, "event_b")].sort()).toEqual(["character_a", "character_d"]);
  });
});

describe("toElements", () => {
  const merged = mergeNetworks(main, [expansion]);
  // What a thing is and how it's lit; where it sits (its ring and name side) is ringLayout's.
  const LAYOUT = /^(name-\w+|far|spoke|rim)$/;
  const classesOf = (elements: ReturnType<typeof toElements>, id: string) =>
    String(elements.find((e) => e.data.id === id)?.classes ?? "")
      .split(" ")
      .filter((c) => !LAYOUT.test(c))
      .join(" ");

  it("styles by kind and marks the centre and expansions", () => {
    const elements = toElements(merged, {
      center: "character_a",
      selected: null,
      titles: ["og", "rebirth"],
    });
    expect(classesOf(elements, "character_a")).toBe("character center");
    expect(classesOf(elements, "character_d")).toBe("character expanded");
  });

  it("highlights the selected entity's immediate network and fades the rest", () => {
    const elements = toElements(merged, {
      center: "character_a",
      selected: "event_b",
      titles: ["og"],
    });
    expect(classesOf(elements, "event_b")).toBe("event selected");
    expect(classesOf(elements, "character_d")).toBe("character expanded near");
    expect(classesOf(elements, "location_c")).toBe("location faded");
    expect(classesOf(elements, "ab")).toBe("event near");
    expect(classesOf(elements, "ac")).toBe("event faded");
  });

  it("marks edges only one of several viewed titles establishes", () => {
    const elements = toElements(merged, {
      center: "character_a",
      selected: null,
      titles: ["og", "rebirth"],
    });
    expect(classesOf(elements, "ac")).toBe("event single-title");
    expect(classesOf(elements, "ab")).toBe("event");
  });

  it("puts a path above the selection", () => {
    const elements = toElements(merged, {
      center: "character_a",
      selected: "location_c",
      titles: ["og"],
      pathNodes: ["character_a", "event_b"],
      pathEdges: ["ab"],
    });
    expect(classesOf(elements, "event_b")).toBe("event on-path");
    expect(classesOf(elements, "location_c")).toBe("location selected faded");
    expect(classesOf(elements, "ab")).toBe("event on-path");
  });
});

describe("network params", () => {
  it("defaults to depth 1, both tellings and every kind of link", () => {
    const params = parseNetworkParams(new URLSearchParams());
    expect(params).toMatchObject({ depth: 1, tellings: "both", expand: [], to: null, node: null });
    expect(networkSearch(params).toString()).toBe("");
  });

  it("round-trips, dropping invalid values", () => {
    const params = parseNetworkParams(
      new URLSearchParams(
        "depth=9&in=trilogy&categories=causal&expand=event_b,Bad!,event_b&to=character_x",
      ),
    );
    expect(params).toMatchObject({
      depth: 1,
      tellings: "trilogy",
      categories: ["causal"],
      expand: ["event_b"],
      to: "character_x",
    });
    expect(networkSearch(params).toString()).toBe(
      "in=trilogy&categories=causal&expand=event_b&to=character_x",
    );
  });

  it("toggles without emptying a list", () => {
    expect(toggle(["og"], "og", ["og", "remake"])).toEqual(["og"]);
    expect(toggle(["og"], "remake", ["og", "remake"])).toEqual(["og", "remake"]);
  });
});

describe("onlyKinds", () => {
  it("keeps the chosen kinds and what must stay, with only the links between them", () => {
    const network = mergeNetworks(main, []);
    const shown = onlyKinds(network, ["event"], new Set(["character_a"]));
    expect([...shown.nodes.keys()]).toEqual(["character_a", "event_b"]);
    expect([...shown.edges.keys()]).toEqual(["ab"]);
  });
});

describe("ringLayout", () => {
  const network = mergeNetworks(main, [expansion]);
  const placed = ringLayout(network, "character_a");

  it("puts the centre in the middle and each step on a wider ring", () => {
    expect(placed.get("character_a")).toEqual({ ring: 0, x: 0, y: 0, side: "centre" });
    const ring1 = [...placed.values()].filter((p) => p.ring === 1);
    const ring2 = [...placed.values()].filter((p) => p.ring === 2);
    expect(ring1.length).toBeGreaterThan(0);
    expect(ring2.length).toBeGreaterThan(0);
    const reach = (p: { x: number; y: number }) => Math.hypot(p.x / 1.2, p.y);
    expect(Math.min(...ring2.map(reach))).toBeGreaterThan(Math.max(...ring1.map(reach)));
  });

  it("places everything once, never two in the same spot, names facing out", () => {
    expect(placed.size).toBe(network.nodes.size);
    const spots = new Set([...placed.values()].map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`));
    expect(spots.size).toBe(placed.size);
    for (const p of placed.values()) {
      if (p.side === "right") expect(p.x).toBeGreaterThan(0);
      if (p.side === "left") expect(p.x).toBeLessThan(0);
    }
  });

  it("gives the elements their places, and marks the far rings and the spokes", () => {
    const elements = toElements(network, { center: "character_a", selected: null, titles: ["og"] });
    const node = elements.find((e) => e.data.id === "event_b");
    expect(node?.position).toEqual({ x: placed.get("event_b")?.x, y: placed.get("event_b")?.y });
    const far = [...placed].filter(([, p]) => p.ring >= 2).map(([id]) => id);
    for (const id of far) {
      expect(elements.find((e) => e.data.id === id)?.classes).toContain("far");
    }
    expect(elements.find((e) => e.data.id === "ab")?.classes).toContain("spoke");
  });
});
