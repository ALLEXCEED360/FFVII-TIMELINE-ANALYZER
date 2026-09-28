import { describe, expect, it } from "vitest";
import { parseQuery } from "./search-query.ts";

describe("parseQuery", () => {
  it("keeps numbers as terms", () => {
    expect(parseQuery("Sector 7")).toEqual(["sector", "7"]);
    expect(parseQuery("Mako Reactor 1")).toEqual(["mako", "reactor", "1"]);
  });

  it("drops stopwords, punctuation, duplicates and single letters", () => {
    expect(parseQuery("  The Fall of the Plate!  plate x ")).toEqual(["fall", "plate"]);
  });

  it("keeps apostrophes out of terms", () => {
    expect(parseQuery("Aerith's")).toEqual(["aeriths"]);
  });

  it("returns nothing searchable for empty input", () => {
    expect(parseQuery("   ")).toEqual([]);
  });
});
