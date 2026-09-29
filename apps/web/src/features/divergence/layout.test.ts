import { describe, expect, it } from "vitest";
import type { DivergenceView } from "../../api/client";
import view from "../../test/divergence-aerith-death.json";
import { layoutDivergence } from "./layout";

const layout = layoutDivergence(view as DivergenceView);

describe("layoutDivergence", () => {
  it("puts the trunk first and forks at the pivot", () => {
    expect(layout.trunk.map((t) => t.eventId)).toEqual([
      "event_nibelheim_incident",
      "event_mako_reactor_1_bombing",
      "event_sector_7_plate_fall",
    ]);
    expect(layout.pivotColumn).toBe(3);
    expect(layout.headers.find((h) => h.pivot)?.eventId).toBe("event_aerith_death");
  });

  it("summarises trunk stops: shared only if every branch shows them alike", () => {
    expect(layout.trunk.every((t) => t.summary === "differs")).toBe(true);
  });

  it("gives each branch a lane, other worlds forking from their title", () => {
    expect(layout.lanes.map((l) => [l.key, l.parent])).toEqual([
      ["og/world_main", null],
      ["remake/world_main", null],
      ["rebirth/world_main", null],
      ["rebirth/world_zack_survives", "rebirth/world_main"],
    ]);
  });

  it("places stops where a branch shows the event, and ends each lane at its last stop", () => {
    const at = (lane: string) =>
      layout.stops.filter((s) => s.lane === lane).map((s) => [s.eventId, s.marking]);
    expect(at("og/world_main")).toEqual([
      ["event_aerith_death", "changed"],
      ["event_cloud_memories_restored", "not_yet_retold"],
    ]);
    expect(at("remake/world_main")).toEqual([["event_cloud_memories_restored", "not_yet_reached"]]);
    expect(layout.laneEnds["rebirth/world_zack_survives"]).toBe(layout.pivotColumn);
  });
});
