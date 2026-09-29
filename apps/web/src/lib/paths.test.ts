import { describe, expect, it } from "vitest";
import { entityPath, idFromPath, sourcePath, unitFromPath, unitPath } from "./paths";

describe("entity paths", () => {
  it("turns IDs into readable paths and back", () => {
    expect(entityPath("character_cloud_strife")).toBe("/character/cloud-strife");
    expect(entityPath("event_mako_reactor_1_bombing")).toBe("/event/mako-reactor-1-bombing");
    expect(idFromPath("character", "cloud-strife")).toBe("character_cloud_strife");
    expect(idFromPath("location", "sector-7")).toBe("location_sector_7");
  });

  it("rejects paths that can't name an entity", () => {
    expect(idFromPath("titan", "attack")).toBeUndefined();
    expect(idFromPath("character", "Cloud_Strife")).toBeUndefined();
    expect(idFromPath("character", undefined)).toBeUndefined();
  });
});

describe("archive paths", () => {
  it("names units readably and reads them back", () => {
    const cases = [
      ["og", "og_forgotten_capital", "/archive/og/forgotten-capital"],
      ["og", "og_reactor_1", "/archive/og/reactor-1"],
      ["remake", "8", "/archive/remake/chapter-8"],
      ["rebirth", "interlude", "/archive/rebirth/interlude"],
    ] as const;
    for (const [title, key, path] of cases) {
      expect(unitPath(title, key)).toBe(path);
      const [, , pathTitle, slug] = path.split("/");
      expect(unitFromPath(pathTitle, slug)).toEqual({ title, key });
    }
  });

  it("links a citation to its unit", () => {
    expect(sourcePath({ title: "og", disc: 1, segment: "og_kalm" })).toBe("/archive/og/kalm");
    expect(sourcePath({ title: "rebirth", chapter: 14, scene: "the altar" })).toBe(
      "/archive/rebirth/chapter-14",
    );
    expect(sourcePath({ title: "rebirth", part: "interlude" })).toBe("/archive/rebirth/interlude");
  });

  it("rejects paths that can't name a unit", () => {
    expect(unitFromPath("crisis-core", "chapter-1")).toBeUndefined();
    expect(unitFromPath("remake", "Chapter_8")).toBeUndefined();
    expect(unitFromPath("remake", undefined)).toBeUndefined();
  });
});
