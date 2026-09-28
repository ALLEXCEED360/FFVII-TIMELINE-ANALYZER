import { describe, expect, it } from "vitest";
import type { Era, TimelineEvent } from "../../api/client";
import { layoutTimeline } from "./layout";

const eras: Era[] = [
  { id: "era_past", name: "Past", start: -100, end: -1, weight: 1 },
  { id: "era_story", name: "Story", start: 0, end: 0, weight: 3 },
  { id: "era_after", name: "After", start: 1, end: 100, weight: 1 },
];

function appearance(
  title: "og" | "remake" | "rebirth",
  extra: Partial<TimelineEvent["appearances"][number]> = {},
): TimelineEvent["appearances"][number] {
  return {
    title,
    world: "world_main",
    status: "depicted",
    playPosition: 1,
    framing: "direct",
    start: null,
    end: null,
    ...extra,
  };
}

function event(
  id: string,
  year: number,
  seq: number | null,
  appearances: TimelineEvent["appearances"],
): TimelineEvent {
  return {
    id,
    name: id,
    summary: "…",
    importance: 2,
    arcId: "arc_x",
    seq,
    start: { earliest: year, latest: year },
    end: { earliest: year, latest: year },
    appearances,
  };
}

const events = [
  event("event_past", -5, null, [appearance("og", { playPosition: 9 }), appearance("rebirth")]),
  event("event_a", 0, 10, [appearance("og", { playPosition: 1 }), appearance("remake")]),
  event("event_b", 0, 20, [appearance("og", { playPosition: 5 })]),
];

describe("in-universe layout", () => {
  const layout = layoutTimeline(events, eras, ["og", "remake", "rebirth"], "world");

  it("shows only eras that contain events, sized by weight", () => {
    expect(layout.eras.map((e) => e.id)).toEqual(["era_past", "era_story"]);
    expect(layout.eras[0]).toMatchObject({ x0: 0, x1: 0.25 });
    expect(layout.eras[1]).toMatchObject({ x0: 0.25, x1: 1 });
  });

  it("spaces events evenly inside an era, in story order", () => {
    const x = Object.fromEntries(layout.columns.map((c) => [c.eventId, c.x]));
    expect(x.event_past).toBeCloseTo(0.125);
    expect(x.event_a).toBeCloseTo(0.25 + 0.75 * 0.25);
    expect(x.event_b).toBeCloseTo(0.25 + 0.75 * 0.75);
  });

  it("puts a marker in each lane that shows the event, and links them", () => {
    expect(layout.markers.filter((m) => m.eventId === "event_past").map((m) => m.title)).toEqual([
      "og",
      "rebirth",
    ]);
    expect(layout.connectors.filter((c) => c.eventId === "event_past")).toHaveLength(1);
  });

  it("moves a title's marker when it places the event at another time", () => {
    const moved = layoutTimeline(
      [
        event("event_x", 0, 10, [
          appearance("og"),
          appearance("remake", { start: { earliest: -5, latest: -5 } }),
        ]),
      ],
      eras,
      ["og", "remake"],
      "world",
    );
    const remake = moved.markers.find((m) => m.title === "remake");
    const og = moved.markers.find((m) => m.title === "og");
    expect(remake?.overridden).toBe(true);
    expect(remake?.x).toBeLessThan(og?.x ?? 0);
  });

  it("prefers the main world and lists the others", () => {
    const worlds = layoutTimeline(
      [
        event("event_w", 0, 10, [
          appearance("rebirth", { world: "world_other", status: "referenced" }),
        ]),
      ],
      eras,
      ["rebirth"],
      "world",
    );
    expect(worlds.markers[0]).toMatchObject({ status: "referenced", worlds: ["world_other"] });
  });
});

describe("play-order layout", () => {
  it("orders each lane by play position", () => {
    const layout = layoutTimeline(events, eras, ["og"], "play");
    const og = layout.markers.sort((a, b) => a.x - b.x).map((m) => [m.eventId, m.playRank]);
    expect(og).toEqual([
      ["event_a", 1],
      ["event_b", 2],
      ["event_past", 3],
    ]);
    expect(layout.eras).toEqual([]);
  });

  it("leaves out omitted appearances, which have no play position", () => {
    const layout = layoutTimeline(
      [event("event_o", 0, 10, [appearance("remake", { status: "omitted", playPosition: null })])],
      eras,
      ["remake"],
      "play",
    );
    expect(layout.markers).toEqual([]);
  });
});
