import { describe, expect, it } from "vitest";
import { AppearanceSchema } from "./appearances.ts";
import {
  InUniverseDateSchema,
  WhenSchema,
  compareChronologically,
  resolveWhen,
} from "./chronology.ts";
import { DifferenceSchema } from "./differences.ts";
import { EdgeInFileSchema } from "./edges.ts";
import { EventFileSchema } from "./entities.ts";
import { EntityIdSchema, kindOfId } from "./ids.ts";
import { formatLocator, formatYear, formatYearBounds } from "./labels.ts";
import { LocatorSchema, playPosition } from "./locators.ts";

const og = { title: "og", disc: 1, segment: "og_kalm" } as const;
const rebirth1 = { title: "rebirth", chapter: 1 } as const;

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? [] : (result.error?.issues.map((issue) => issue.message) ?? []);
}

describe("IDs", () => {
  it("accepts `<kind>_<slug>` and knows the kind", () => {
    expect(EntityIdSchema.safeParse("character_cloud_strife").success).toBe(true);
    expect(kindOfId("location_sector_7")).toBe("location");
  });

  it("rejects unknown kinds and bad slugs", () => {
    expect(EntityIdSchema.safeParse("titan_attack").success).toBe(false);
    expect(EntityIdSchema.safeParse("character_Cloud").success).toBe(false);
    expect(EntityIdSchema.safeParse("character__cloud").success).toBe(false);
  });
});

describe("locators", () => {
  it("accepts each title's units", () => {
    expect(LocatorSchema.safeParse(og).success).toBe(true);
    expect(LocatorSchema.safeParse({ title: "remake", chapter: 18 }).success).toBe(true);
    expect(LocatorSchema.safeParse({ title: "rebirth", part: "interlude" }).success).toBe(true);
  });

  it("rejects chapters a title doesn't have", () => {
    expect(messages(LocatorSchema.safeParse({ title: "remake", chapter: 19 }))).toContain(
      "remake has 18 chapters",
    );
    expect(LocatorSchema.safeParse({ title: "intermission", chapter: 3 }).success).toBe(false);
  });

  it("rejects unknown parts and chapters for the original", () => {
    expect(LocatorSchema.safeParse({ title: "remake", part: "interlude" }).success).toBe(false);
    expect(LocatorSchema.safeParse({ title: "og", chapter: 1 }).success).toBe(false);
  });

  it("places an unnumbered part before its chapter", () => {
    const at = (locator: unknown) => playPosition(LocatorSchema.parse(locator), () => 0);
    expect(at({ title: "rebirth", part: "interlude" })).toBeLessThan(at(rebirth1));
  });
});

describe("chronology", () => {
  it("resolves years, ranges and spans", () => {
    expect(resolveWhen({ year: -5 })).toEqual({
      start: { earliest: -5, latest: -5 },
      end: { earliest: -5, latest: -5 },
    });
    expect(
      resolveWhen({ start: { year: -30 }, end: { between: [{ year: -6 }, { year: -5 }] } }),
    ).toEqual({ start: { earliest: -30, latest: -30 }, end: { earliest: -6, latest: -5 } });
  });

  it("rejects backwards ranges and spans", () => {
    expect(InUniverseDateSchema.safeParse({ between: [{ year: 0 }, { year: -5 }] }).success).toBe(
      false,
    );
    expect(WhenSchema.safeParse({ start: { year: 0 }, end: { year: -1 } }).success).toBe(false);
  });

  it("sorts by year, then seq, then id", () => {
    const events = [
      { id: "event_c", when: { year: 0 }, seq: 20 },
      { id: "event_b", when: { year: 0 }, seq: 10 },
      { id: "event_a", when: { year: -5 } },
      { id: "event_d", when: { year: 0 } },
    ];
    expect(events.sort(compareChronologically).map((e) => e.id)).toEqual([
      "event_a",
      "event_b",
      "event_c",
      "event_d",
    ]);
  });

  it("formats years relative to the story", () => {
    expect(formatYear({ year: 0 })).toBe("Year 0");
    expect(formatYear({ year: -5 })).toBe("5 years before");
    expect(formatYear({ year: -2000, approx: true })).toBe("~2,000 years before");
    expect(formatYear({ year: 500 })).toBe("500 years after");
  });
});

describe("appearances", () => {
  const base = {
    title: "rebirth",
    status: "depicted",
    summary: "…",
    depictions: [{ at: rebirth1, framing: "direct" }],
    sources: [rebirth1],
    certainty: "stated",
  };

  it("defaults to the main world", () => {
    expect(AppearanceSchema.parse(base).world).toBe("world_main");
  });

  it("requires depictions unless omitted, and none when omitted", () => {
    expect(AppearanceSchema.safeParse({ ...base, depictions: [] }).success).toBe(false);
    expect(AppearanceSchema.safeParse({ ...base, status: "omitted" }).success).toBe(false);
    expect(AppearanceSchema.safeParse({ ...base, status: "omitted", depictions: [] }).success).toBe(
      true,
    );
  });

  it("keeps citations and depictions in the appearance's title", () => {
    expect(AppearanceSchema.safeParse({ ...base, sources: [og] }).success).toBe(false);
    expect(
      AppearanceSchema.safeParse({ ...base, depictions: [{ at: og, framing: "direct" }] }).success,
    ).toBe(false);
  });

  it("requires notes for inferred and ambiguous facts", () => {
    expect(AppearanceSchema.safeParse({ ...base, certainty: "ambiguous" }).success).toBe(false);
    expect(
      AppearanceSchema.safeParse({ ...base, certainty: "ambiguous", notes: "left open" }).success,
    ).toBe(true);
  });
});

describe("differences", () => {
  const base = {
    key: "framing",
    from: { title: "og" },
    to: { title: "rebirth" },
    category: "presentation",
    magnitude: "major",
    summary: "In X …; in Y …",
    sources: [og, rebirth1],
    certainty: "stated",
  };

  it("accepts a cited, two-sided difference", () => {
    expect(DifferenceSchema.safeParse(base).success).toBe(true);
  });

  it("requires citations on both sides, and only from those titles", () => {
    expect(DifferenceSchema.safeParse({ ...base, sources: [og] }).success).toBe(false);
    expect(
      DifferenceSchema.safeParse({
        ...base,
        sources: [og, rebirth1, { title: "remake", chapter: 1 }],
      }).success,
    ).toBe(false);
  });

  it("rejects comparing a title with itself in the same world", () => {
    expect(DifferenceSchema.safeParse({ ...base, to: { title: "og" } }).success).toBe(false);
  });
});

describe("relationships", () => {
  const scope = { sources: [og], certainty: "stated" };

  it("accepts a title-scoped edge", () => {
    const edge = { type: "hometown", target: "location_nibelheim", titles: { og: scope } };
    expect(EdgeInFileSchema.safeParse(edge).success).toBe(true);
  });

  it("requires at least one title, with citations from that title", () => {
    expect(
      EdgeInFileSchema.safeParse({ type: "hometown", target: "location_nibelheim", titles: {} })
        .success,
    ).toBe(false);
    expect(
      EdgeInFileSchema.safeParse({
        type: "hometown",
        target: "location_nibelheim",
        titles: { rebirth: scope },
      }).success,
    ).toBe(false);
  });

  it("only lets time-bounded types carry from/until", () => {
    const edge = { target: "location_nibelheim", titles: { og: scope }, from: { year: -5 } };
    expect(EdgeInFileSchema.safeParse({ ...edge, type: "hometown" }).success).toBe(false);
    expect(EdgeInFileSchema.safeParse({ ...edge, type: "lives_in" }).success).toBe(true);
  });
});

describe("entity files", () => {
  const event = {
    id: "event_test",
    name: "Test",
    summary: "…",
    when: { year: 0 },
    importance: 2,
    arc: "arc_midgar",
    appearances: [
      {
        title: "og",
        status: "depicted",
        summary: "…",
        depictions: [{ at: og, framing: "direct" }],
        sources: [og],
        certainty: "stated",
      },
    ],
  };

  it("accepts a minimal event", () => {
    expect(EventFileSchema.safeParse(event).success).toBe(true);
  });

  it("rejects duplicate appearances and roles on non-characters", () => {
    const appearance = event.appearances[0];
    expect(
      EventFileSchema.safeParse({ ...event, appearances: [appearance, appearance] }).success,
    ).toBe(false);
    expect(
      EventFileSchema.safeParse({ ...event, appearances: [{ ...appearance, role: "x" }] }).success,
    ).toBe(false);
  });

  it("rejects an ID of the wrong kind", () => {
    expect(EventFileSchema.safeParse({ ...event, id: "character_test" }).success).toBe(false);
  });
});

describe("labels", () => {
  const names = {
    title: (code: string) => ({ og: "OG", rebirth: "Rebirth" })[code] ?? code,
    segment: (id: string) => (id === "og_kalm" ? "Kalm" : undefined),
    unit: (_code: string, key: string) =>
      key === "interlude" ? "Interlude: A World Apart" : undefined,
  };

  it("formats locators with display names", () => {
    expect(formatLocator(og, names)).toBe("OG · Disc 1 · Kalm");
    expect(formatLocator(rebirth1, names)).toBe("Rebirth · Ch. 1");
    expect(formatLocator({ title: "rebirth", part: "interlude" }, names)).toBe(
      "Rebirth · Interlude: A World Apart",
    );
  });

  it("formats resolved year bounds", () => {
    expect(formatYearBounds({ earliest: -5, latest: -5 })).toBe("5 years before");
    expect(formatYearBounds({ earliest: -30, latest: -25 })).toBe(
      "30 years before – 25 years before",
    );
  });
});
