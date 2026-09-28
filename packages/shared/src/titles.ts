import { z } from "zod";

// The released games (docs/model/titles-and-worlds.md §2). Codes are fixed; adding a title means
// adding it here and to the doc.

export const TITLE_CODES = ["og", "remake", "intermission", "rebirth"] as const;
export const TitleCodeSchema = z.enum(TITLE_CODES);
export type TitleCode = z.infer<typeof TitleCodeSchema>;

export type Series = "original" | "remake";

/** An unnumbered part of a chaptered title, placed before a given chapter. */
export interface TitlePart {
  key: string;
  name: string;
  /** The chapter this part is played before. */
  before: number;
}

export interface TitleDefinition {
  name: string;
  /** For compact UI labels. */
  shortName: string;
  /** First release, ISO date. */
  released: string;
  series: Series;
  /** Position in release order, from 1. */
  order: number;
  /** How the title is divided — the units its citations use (canon-and-sources.md §5). */
  units:
    | { kind: "discs"; discs: number }
    | { kind: "chapters"; chapters: readonly string[]; parts: readonly TitlePart[] };
}

export const TITLES = {
  og: {
    name: "Final Fantasy VII",
    shortName: "OG",
    released: "1997-01-31",
    series: "original",
    order: 1,
    units: { kind: "discs", discs: 3 },
  },
  remake: {
    name: "Final Fantasy VII Remake",
    shortName: "Remake",
    released: "2020-04-10",
    series: "remake",
    order: 2,
    units: {
      kind: "chapters",
      chapters: [
        "The Destruction of Mako Reactor 1",
        "Fateful Encounters",
        "Home Sweet Slum",
        "Mad Dash",
        "Dogged Pursuit",
        "Light the Way",
        "A Trap is Sprung",
        "Budding Bodyguard",
        "The Town That Never Sleeps",
        "Rough Waters",
        "Haunted",
        "Fight for Survival",
        "A Broken World",
        "In Search of Hope",
        "The Day Midgar Stood Still",
        "The Belly of the Beast",
        "Deliverance from Chaos",
        "Destiny's Crossroads",
      ],
      parts: [],
    },
  },
  intermission: {
    name: "Final Fantasy VII Remake Intergrade — Episode INTERmission",
    shortName: "INTERmission",
    released: "2021-06-10",
    series: "remake",
    order: 3,
    units: { kind: "chapters", chapters: ["Wutai's Finest", "Covert Ops"], parts: [] },
  },
  rebirth: {
    name: "Final Fantasy VII Rebirth",
    shortName: "Rebirth",
    released: "2024-02-29",
    series: "remake",
    order: 4,
    units: {
      kind: "chapters",
      chapters: [
        "Fall of a Hero",
        "A New Journey Begins",
        "Deeper into Darkness",
        "Dawn of a New Era",
        "Blood in the Water",
        "Fool's Paradise",
        "Those Left Behind",
        "All That Glitters",
        "The Planet Stirs",
        "Watcher of the Vale",
        "The Long Shadow of Shinra",
        "A Golden Key",
        "Where Angels Fear to Tread",
        "End of the World",
      ],
      parts: [{ key: "interlude", name: "Interlude: A World Apart", before: 1 }],
    },
  },
} as const satisfies Record<TitleCode, TitleDefinition>;

export function isRemakeSeries(title: TitleCode): boolean {
  return TITLES[title].series === "remake";
}

/** Chapter count for chaptered titles; undefined for the disc-based original. */
export function chapterCount(title: TitleCode): number | undefined {
  const units: TitleDefinition["units"] = TITLES[title].units;
  return units.kind === "chapters" ? units.chapters.length : undefined;
}

export function partsOf(title: TitleCode): readonly TitlePart[] {
  const units: TitleDefinition["units"] = TITLES[title].units;
  return units.kind === "chapters" ? units.parts : [];
}

/** Title codes in release order. */
export const TITLES_IN_ORDER: readonly TitleCode[] = [...TITLE_CODES].sort(
  (a, b) => TITLES[a].order - TITLES[b].order,
);
