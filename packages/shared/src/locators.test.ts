import { describe, expect, it } from "vitest";
import { unitOf } from "./locators.ts";

describe("unitOf", () => {
  it("keys units as the reference data does", () => {
    expect(unitOf({ title: "og", disc: 1, segment: "og_kalm" })).toEqual({
      title: "og",
      unit: "og_kalm",
    });
    expect(unitOf({ title: "remake", chapter: 8, scene: "the church" })).toEqual({
      title: "remake",
      unit: "8",
    });
    expect(unitOf({ title: "rebirth", part: "interlude" })).toEqual({
      title: "rebirth",
      unit: "interlude",
    });
  });
});
