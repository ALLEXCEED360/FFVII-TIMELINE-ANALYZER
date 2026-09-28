import { describe, expect, it } from "vitest";
import type { Arc } from "../../api/client";
import { type SearchHit, buildGroups } from "./palette";

const titleName = (code: string) => ({ og: "OG", rebirth: "Rebirth" })[code] ?? code;

const hits: SearchHit[] = [
  {
    id: "location_nibelheim",
    kind: "location",
    name: "Nibelheim",
    reason: "name",
    detail: "Nibelheim",
    score: 3,
  },
  {
    id: "event_nibelheim_incident",
    kind: "event",
    name: "Nibelheim Incident",
    reason: "name",
    detail: "Nibelheim Incident",
    score: 2,
  },
  {
    id: "character_tifa_lockhart",
    kind: "character",
    name: "Tifa Lockhart",
    reason: "connection",
    detail: "Nibelheim",
    score: 0.3,
  },
  {
    id: "event_aerith_death",
    kind: "event",
    name: "Death of Aerith",
    reason: "appearance",
    detail: "rebirth",
    score: 0.5,
  },
];

const arcs: Arc[] = [
  {
    id: "arc_midgar",
    name: "Midgar",
    summary: "AVALANCHE's campaign.",
    og: { from: "og_a", to: "og_b" },
    chapters: {},
  },
  {
    id: "arc_the_lifestream",
    name: "The Lifestream",
    summary: "The truth about Cloud's past in Nibelheim.",
    og: { from: "og_c", to: "og_d" },
    chapters: {},
  },
];

describe("buildGroups", () => {
  const groups = buildGroups(hits, arcs, ["nibelheim"], titleName);

  it("groups by kind, best group first, arcs last", () => {
    expect(groups.map((g) => g.label)).toEqual(["Locations", "Events", "Characters", "Arcs"]);
  });

  it("keeps the API's ranking inside a group and links to entity pages", () => {
    expect(groups[1]?.items.map((i) => i.href)).toEqual([
      "/event/nibelheim-incident",
      "/event/aerith-death",
    ]);
  });

  it("explains non-obvious matches", () => {
    expect(groups[0]?.items[0]?.hint).toBeNull();
    expect(groups[1]?.items[1]?.hint).toBe("In Rebirth's version");
    expect(groups[2]?.items[0]?.hint).toBe("Connected to Nibelheim");
  });

  it("matches arcs by name or summary and links to the filtered timeline", () => {
    expect(groups[3]?.items).toEqual([
      {
        key: "arc_the_lifestream",
        href: "/timeline?arc=arc_the_lifestream",
        label: "The Lifestream",
        hint: "Arc — opens the timeline",
      },
    ]);
  });

  it("shows aliases as hints", () => {
    const [group] = buildGroups(
      [
        {
          id: "character_aerith_gainsborough",
          kind: "character",
          name: "Aerith Gainsborough",
          reason: "name",
          detail: "Aeris",
          score: 3,
        },
      ],
      [],
      ["aeris"],
      titleName,
    );
    expect(group?.items[0]?.hint).toBe("Also known as Aeris");
  });
});
