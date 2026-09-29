import { describe, expect, it } from "vitest";
import { type DivergenceEvent, computeDivergence, divergencePoints } from "./divergence.ts";
import { CoverageIndex } from "./status.ts";

// Segments a–e; Remake retells a–b, Rebirth retells c–d.
const index = new CoverageIndex(
  ["og_a", "og_b", "og_c", "og_d", "og_e"].map((id) => ({ id, name: id, disc: 1, summary: "…" })),
  { remake: { from: "og_a", to: "og_b" }, rebirth: { from: "og_c", to: "og_d" } },
);

const appear = (title: "og" | "remake" | "rebirth", status = "depicted", world = "world_main") =>
  ({ title, world, status }) as DivergenceEvent["appearances"][number];

function event(
  id: string,
  start: number,
  seq: number,
  ogSegment: string | undefined,
  appearances: DivergenceEvent["appearances"],
  differences: DivergenceEvent["differences"] = [],
): DivergenceEvent {
  return { id, name: id, start, seq, importance: 2, ogSegment, appearances, differences };
}

const diff = (id: string, to: "remake" | "rebirth", magnitude: "minor" | "major" = "major") => ({
  id,
  from: { title: "og" as const, world: "world_main" },
  to: { title: to, world: "world_main" },
  category: "presentation" as const,
  magnitude,
});

const events = [
  event("e_past", -5, 10, "og_c", [appear("og"), appear("rebirth")], [diff("past:x", "rebirth")]),
  event("e_a", 0, 10, "og_a", [appear("og"), appear("remake")]),
  event("e_b", 0, 20, "og_b", [appear("og"), appear("remake")], [diff("b:x", "remake", "minor")]),
  event("e_cut", 0, 25, "og_b", [appear("og"), appear("remake", "omitted")]),
  event("e_new", 0, 27, undefined, [appear("remake")]),
  event("e_c", 0, 30, "og_c", [appear("og")]),
  event("e_late", 0, 40, "og_e", [appear("og")]),
  event("e_world", 0, 50, undefined, [appear("rebirth", "referenced", "world_zack")]),
];

describe("computeDivergence", () => {
  const view = computeDivergence(events, "e_a", ["og", "remake"], index);

  it("puts earlier events on the trunk and the rest on the branches, in story order", () => {
    expect(view?.trunk.map((r) => r.eventId)).toEqual(["e_past"]);
    expect(view?.events.map((r) => r.eventId)).toEqual([
      "e_a",
      "e_b",
      "e_cut",
      "e_new",
      "e_c",
      "e_late",
    ]);
  });

  it("marks shared, changed and omitted events", () => {
    const at = (id: string, branch: string) =>
      view?.events.find((r) => r.eventId === id)?.stations[branch]?.marking;
    expect(at("e_a", "og/world_main")).toBe("shared");
    expect(at("e_b", "og/world_main")).toBe("changed");
    expect(at("e_b", "remake/world_main")).toBe("changed");
    expect(at("e_cut", "remake/world_main")).toBe("omitted");
    expect(at("e_cut", "og/world_main")).toBe("only_here");
    expect(at("e_new", "remake/world_main")).toBe("only_here");
  });

  it("tells 'the others haven't got there yet' apart from 'the others left it out'", () => {
    const at = (id: string, branch: string) =>
      view?.events.find((r) => r.eventId === id)?.stations[branch]?.marking;
    // e_late is beyond every Remake-series title's coverage.
    expect(at("e_late", "og/world_main")).toBe("not_yet_retold");
    expect(at("e_late", "remake/world_main")).toBe("not_yet_reached");
    // e_c is Rebirth's territory, which isn't in this view: Remake simply doesn't cover it.
    expect(at("e_c", "remake/world_main")).toBeUndefined();
  });

  it("carries the differences behind a 'changed' marking", () => {
    const b = view?.events.find((r) => r.eventId === "e_b")?.stations["og/world_main"];
    expect(b?.differences).toEqual([{ id: "b:x", category: "presentation", magnitude: "minor" }]);
  });

  it("adds other worlds as branches of their title when asked", () => {
    const withWorlds = computeDivergence(events, "e_a", ["og", "rebirth"], index, { worlds: true });
    expect(withWorlds?.branches).toEqual([
      { title: "og", world: "world_main" },
      { title: "rebirth", world: "world_main" },
      { title: "rebirth", world: "world_zack" },
    ]);
    const world = withWorlds?.events.find((r) => r.eventId === "e_world")?.stations[
      "rebirth/world_zack"
    ];
    expect(world?.marking).toBe("only_here");
  });

  it("returns null for an unknown pivot", () => {
    expect(computeDivergence(events, "e_zz", ["og", "remake"], index)).toBeNull();
  });
});

describe("divergencePoints", () => {
  it("lists events with differences between the chosen titles, in story order", () => {
    expect(divergencePoints(events, ["og", "remake", "rebirth"])).toEqual([
      { eventId: "e_past", differences: 1, major: 1 },
      { eventId: "e_b", differences: 1, major: 0 },
    ]);
    expect(divergencePoints(events, ["og", "remake"])).toEqual([
      { eventId: "e_b", differences: 1, major: 0 },
    ]);
  });
});
