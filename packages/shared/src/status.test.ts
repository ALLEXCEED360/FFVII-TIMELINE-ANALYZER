import { describe, expect, it } from "vitest";
import { type Appearance, AppearanceSchema } from "./appearances.ts";
import { CoverageIndex, displayStatus, isNewInRemakeSeries, ogSegmentOf } from "./status.ts";

const segments = ["og_a", "og_b", "og_c", "og_d", "og_e"].map((id) => ({
  id,
  name: id,
  disc: 1,
  summary: "…",
}));
const index = new CoverageIndex(segments, {
  remake: { from: "og_a", to: "og_b" },
  rebirth: { from: "og_c", to: "og_d", except: ["og_d"] },
});

function ogAt(segment: string): Appearance {
  const at = { title: "og", disc: 1, segment } as const;
  return AppearanceSchema.parse({
    title: "og",
    status: "depicted",
    summary: "…",
    depictions: [{ at, framing: "direct" }],
    sources: [at],
    certainty: "stated",
  });
}

function remakeSeries(title: "remake" | "rebirth", status = "depicted"): Appearance {
  const at = { title, chapter: 1 } as const;
  return AppearanceSchema.parse({
    title,
    status,
    summary: "…",
    depictions: status === "omitted" ? [] : [{ at, framing: "direct" }],
    sources: [at],
    certainty: "stated",
  });
}

function subject(appearances: Appearance[]) {
  return { appearances, ogSegment: ogSegmentOf(appearances) };
}

describe("displayStatus", () => {
  it("returns the stored status when there is one", () => {
    expect(displayStatus(subject([ogAt("og_a"), remakeSeries("remake")]), "remake", index)).toBe(
      "depicted",
    );
    expect(
      displayStatus(subject([ogAt("og_a"), remakeSeries("remake", "omitted")]), "remake", index),
    ).toBe("omitted");
  });

  it("flags covered-but-missing data as undocumented", () => {
    expect(displayStatus(subject([ogAt("og_b")]), "remake", index)).toBe("undocumented");
  });

  it("says not yet reached beyond every title's coverage", () => {
    expect(displayStatus(subject([ogAt("og_e")]), "remake", index)).toBe("not_yet_reached");
    expect(displayStatus(subject([ogAt("og_e")]), "rebirth", index)).toBe("not_yet_reached");
  });

  it("is absent when another title covers it, or it's excluded", () => {
    expect(displayStatus(subject([ogAt("og_c")]), "remake", index)).toBe("absent");
    expect(displayStatus(subject([ogAt("og_d")]), "rebirth", index)).toBe("absent");
  });

  it("is absent for titles without coverage and for the original", () => {
    expect(displayStatus(subject([ogAt("og_a")]), "intermission", index)).toBe("absent");
    expect(displayStatus(subject([ogAt("og_e")]), "intermission", index)).toBe("absent");
    expect(displayStatus(subject([remakeSeries("remake")]), "og", index)).toBe("absent");
  });
});

describe("isNewInRemakeSeries", () => {
  it("is true only without an original appearance", () => {
    expect(isNewInRemakeSeries([remakeSeries("remake")])).toBe(true);
    expect(isNewInRemakeSeries([ogAt("og_a"), remakeSeries("remake")])).toBe(false);
  });
});
