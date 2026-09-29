import { describe, expect, it } from "vitest";
import { compareTitlesParam, parseCompareTitles, toggleTitle } from "./titles";

describe("comparison titles", () => {
  it("defaults to OG, Remake and Rebirth", () => {
    expect(parseCompareTitles(null)).toEqual(["og", "remake", "rebirth"]);
    expect(compareTitlesParam(["og", "remake", "rebirth"])).toBeNull();
  });

  it("keeps release order and needs at least two titles", () => {
    expect(parseCompareTitles("rebirth,og")).toEqual(["og", "rebirth"]);
    expect(parseCompareTitles("og")).toEqual(["og", "remake", "rebirth"]);
    expect(parseCompareTitles("og,zz")).toEqual(["og", "remake", "rebirth"]);
  });

  it("toggles titles without dropping below two", () => {
    expect(toggleTitle(["og", "rebirth"], "intermission")).toEqual([
      "og",
      "intermission",
      "rebirth",
    ]);
    expect(toggleTitle(["og", "remake", "rebirth"], "remake")).toEqual(["og", "rebirth"]);
    expect(toggleTitle(["og", "rebirth"], "og")).toEqual(["og", "rebirth"]);
  });
});
