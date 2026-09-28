import { describe, expect, it } from "vitest";
import { stringify } from "yaml";
import { type SourceFile, loadDataset } from "./load.ts";
import { validateDataset } from "./validate.ts";

// A tiny, valid dataset built in memory; each test breaks one rule.

const ogA = { title: "og", disc: 1, segment: "og_a" };
const remake1 = { title: "remake", chapter: 1 };
const rebirth1 = { title: "rebirth", chapter: 1 };

function appearance(at: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return {
    title: at.title,
    status: "depicted",
    summary: "…",
    depictions: [{ at, framing: "direct" }],
    sources: [at],
    certainty: "stated",
    ...extra,
  };
}

type Files = Record<string, unknown>;

function baseFiles(): Files {
  return {
    "reference/og-segments.yaml": [
      { id: "og_a", name: "A", disc: 1, summary: "…" },
      { id: "og_b", name: "B", disc: 1, summary: "…" },
      { id: "og_c", name: "C", disc: 2, summary: "…" },
    ],
    "reference/coverage.yaml": {
      remake: { from: "og_a", to: "og_a" },
      rebirth: { from: "og_b", to: "og_b" },
    },
    "reference/arcs.yaml": [
      { id: "arc_one", name: "One", summary: "…", og: { from: "og_a", to: "og_b" } },
      { id: "arc_two", name: "Two", summary: "…", og: { from: "og_c", to: "og_c" } },
    ],
    "reference/eras.yaml": [
      { id: "era_before", name: "Before", start: -10, end: -1, weight: 1 },
      { id: "era_story", name: "Story", start: 0, end: 0, weight: 4 },
    ],
    "reference/worlds.yaml": [{ id: "world_main", name: "Main", summary: "…" }],
    "events/event_one.yaml": {
      id: "event_one",
      name: "One",
      summary: "…",
      when: { year: 0 },
      seq: 10,
      importance: 3,
      arc: "arc_one",
      appearances: [appearance(ogA), appearance(remake1)],
    },
    "characters/character_one.yaml": {
      id: "character_one",
      name: "One",
      summary: "…",
      appearances: [appearance(ogA), appearance(remake1)],
      relationships: [
        {
          type: "participated_in",
          target: "event_one",
          titles: { og: { sources: [ogA], certainty: "stated" } },
        },
      ],
    },
    "locations/location_one.yaml": {
      id: "location_one",
      name: "One",
      summary: "…",
      appearances: [appearance(ogA)],
    },
  };
}

function run(files: Files) {
  const sources: SourceFile[] = Object.entries(files).map(([path, value]) => ({
    path,
    content: stringify(value),
  }));
  const { dataset, issues } = loadDataset(sources);
  return [...issues, ...validateDataset(dataset)];
}

function errors(files: Files): string[] {
  return run(files)
    .filter((issue) => issue.level === "error")
    .map((issue) => issue.message);
}

function warnings(files: Files): string[] {
  return run(files)
    .filter((issue) => issue.level === "warning")
    .map((issue) => issue.message);
}

/** Deep-clones the base files and lets a test edit one of them. */
function edit(path: string, change: (file: Record<string, any>) => void): Files {
  const files = structuredClone(baseFiles());
  change(files[path] as Record<string, any>);
  return files;
}

describe("validateDataset", () => {
  it("accepts the base dataset", () => {
    expect(run(baseFiles())).toEqual([]);
  });

  it("requires every reference file", () => {
    const files = baseFiles();
    delete files["reference/worlds.yaml"];
    expect(errors(files)).toContain("required reference file is missing");
  });

  it("checks file names against IDs", () => {
    const files = baseFiles();
    files["events/event_two.yaml"] = files["events/event_one.yaml"];
    expect(errors(files).join()).toMatch(/file name must match the ID/);
  });

  it("checks original segments exist and sit on the cited disc", () => {
    const wrongDisc = edit("locations/location_one.yaml", (f) => {
      f.appearances = [appearance({ ...ogA, disc: 2 })];
    });
    expect(errors(wrongDisc)).toContain("`og_a` is on disc 1, not disc 2");

    const unknown = edit("locations/location_one.yaml", (f) => {
      f.appearances = [appearance({ ...ogA, segment: "og_zzz" })];
    });
    expect(errors(unknown)).toContain("unknown segment `og_zzz`");
  });

  it("only allows `omitted` inside the title's coverage", () => {
    const outside = edit("events/event_one.yaml", (f) => {
      f.appearances.push({ ...appearance(rebirth1, { status: "omitted" }), depictions: [] });
    });
    expect(errors(outside).join()).toMatch(/rebirth doesn't cover `og_a`/);
  });

  it("requires a chronology difference for a `when` override", () => {
    const files = edit("events/event_one.yaml", (f) => {
      f.appearances[1].when = { year: -1 };
    });
    expect(errors(files).join()).toMatch(/needs a `chronology` difference/);

    const explained = edit("events/event_one.yaml", (f) => {
      f.appearances[1].when = { year: -1 };
      f.differences = [
        {
          key: "when",
          from: { title: "og" },
          to: { title: "remake" },
          category: "chronology",
          magnitude: "minor",
          summary: "…",
          sources: [ogA, remake1],
          certainty: "stated",
        },
      ];
    });
    expect(errors(explained)).toEqual([]);
  });

  it("requires both sides of a difference to have appearances", () => {
    const files = edit("locations/location_one.yaml", (f) => {
      f.differences = [
        {
          key: "x",
          from: { title: "og" },
          to: { title: "remake" },
          category: "setting",
          magnitude: "minor",
          summary: "…",
          sources: [ogA, remake1],
          certainty: "stated",
        },
      ];
    });
    expect(errors(files)).toContain("no remake appearance in `world_main` to compare");
  });

  it("restricts other worlds to known worlds in the Remake series", () => {
    const unknown = edit("characters/character_one.yaml", (f) => {
      f.appearances.push(appearance(remake1, { world: "world_other" }));
    });
    expect(errors(unknown)).toContain("unknown world `world_other`");

    const withWorld = edit("reference/worlds.yaml", (f) => {
      (f as unknown as unknown[]).push({
        id: "world_other",
        name: "Other",
        summary: "…",
        firstShown: remake1,
        sources: [remake1],
        certainty: "stated",
      });
    });
    (withWorld["characters/character_one.yaml"] as Record<string, any>).appearances.push(
      appearance(ogA, { world: "world_other" }),
    );
    expect(errors(withWorld)).toContain("only the Remake series has other worlds");
  });

  it("checks relationship targets, kinds and title scopes", () => {
    const unknown = edit("characters/character_one.yaml", (f) => {
      f.relationships[0].target = "event_missing";
    });
    expect(errors(unknown)).toContain("unknown entity `event_missing`");

    const wrongKind = edit("characters/character_one.yaml", (f) => {
      f.relationships[0].target = "location_one";
    });
    expect(errors(wrongKind).join()).toMatch(/`participated_in` connects/);

    const notInTitle = edit("characters/character_one.yaml", (f) => {
      f.relationships[0].target = "event_one";
      f.relationships[0].titles = { rebirth: { sources: [rebirth1], certainty: "stated" } };
    });
    expect(errors(notInTitle).join()).toMatch(/has no rebirth appearance/);
  });

  it("rejects duplicate and mirrored relationships", () => {
    const duplicate = edit("characters/character_one.yaml", (f) => {
      f.relationships.push(structuredClone(f.relationships[0]));
    });
    expect(errors(duplicate).join()).toMatch(/duplicate relationship/);
  });

  it("rejects cycles in acyclic types", () => {
    const files = baseFiles();
    const location = (id: string, target: string) => ({
      id,
      name: id,
      summary: "…",
      appearances: [appearance(ogA)],
      relationships: [
        { type: "part_of", target, titles: { og: { sources: [ogA], certainty: "stated" } } },
      ],
    });
    files["locations/location_one.yaml"] = location("location_one", "location_two");
    files["locations/location_two.yaml"] = location("location_two", "location_one");
    expect(errors(files).join()).toMatch(/`part_of` cycle/);
  });

  it("checks arcs cover every segment without gaps", () => {
    const files = edit("reference/arcs.yaml", (f) => {
      (f as unknown as unknown[]).pop();
    });
    expect(errors(files)).toContain("arcs must cover every segment, through the last one");
  });

  it("checks eras are contiguous and cover every date", () => {
    const gap = edit("reference/eras.yaml", (f) => {
      (f as unknown as { end: number }[])[0]!.end = -2;
    });
    expect(errors(gap).join()).toMatch(/no gap or overlap/);

    const outside = edit("events/event_one.yaml", (f) => {
      f.when = { year: -50 };
    });
    expect(errors(outside)).toContain("year -50 isn't inside any era");
  });

  it("warns about undocumented events and missing `seq`", () => {
    const files = baseFiles();
    files["events/event_two.yaml"] = {
      id: "event_two",
      name: "Two",
      summary: "…",
      when: { year: 0 },
      importance: 2,
      arc: "arc_one",
      appearances: [appearance(ogA)],
    };
    const found = warnings(files);
    expect(found.join()).toMatch(/Remake covers this part of the story/);
    expect(found.join()).toMatch(/add a `seq`/);
  });

  it("points retired IDs at their replacement", () => {
    const files = baseFiles();
    files["id-redirects.yaml"] = { event_old: "event_one" };
    (files["characters/character_one.yaml"] as Record<string, any>).relationships[0].target =
      "event_old";
    expect(errors(files)).toContain("`event_old` was retired — use `event_one`");
  });
});
