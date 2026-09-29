import { describe, expect, it } from "vitest";
import type { Network } from "../../api/client";
import { mergeNetworks, neighboursOf, toElements } from "./elements";
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
  const classesOf = (elements: ReturnType<typeof toElements>, id: string) =>
    elements.find((e) => e.data.id === id)?.classes;

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
  it("defaults to depth 1, every title and category", () => {
    const params = parseNetworkParams(new URLSearchParams());
    expect(params).toMatchObject({ depth: 1, expand: [], to: null, node: null });
    expect(params.titles).toHaveLength(4);
    expect(networkSearch(params).toString()).toBe("");
  });

  it("round-trips, dropping invalid values", () => {
    const params = parseNetworkParams(
      new URLSearchParams(
        "depth=9&titles=rebirth,og&categories=causal&expand=event_b,Bad!,event_b&to=character_x",
      ),
    );
    expect(params).toMatchObject({
      depth: 1,
      titles: ["og", "rebirth"],
      categories: ["causal"],
      expand: ["event_b"],
      to: "character_x",
    });
  });

  it("toggles without emptying a list", () => {
    expect(toggle(["og"], "og", ["og", "remake"])).toEqual(["og"]);
    expect(toggle(["og"], "remake", ["og", "remake"])).toEqual(["og", "remake"]);
  });
});
