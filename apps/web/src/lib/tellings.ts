import type { TitleCode } from "../api/client";
import { TITLE_COLOR } from "./titles";

// The story is told twice: the original, and the Remake Trilogy (Remake, INTERmission, Rebirth —
// one retelling in parts). Every choice of games on the site is between these two.

export type Telling = "og" | "trilogy";
export type TellingChoice = "both" | Telling;

export const TELLINGS: readonly Telling[] = ["og", "trilogy"];

export const TELLING: Record<
  Telling,
  { name: string; short: string; titles: readonly TitleCode[]; color: string }
> = {
  og: { name: "The original", short: "Original", titles: ["og"], color: TITLE_COLOR.og },
  trilogy: {
    name: "The Remake Trilogy",
    short: "Remake Trilogy",
    titles: ["remake", "intermission", "rebirth"],
    color: TITLE_COLOR.remake,
  },
};

export const CHOICE_NAME: Record<TellingChoice, string> = {
  both: "Both",
  og: TELLING.og.name,
  trilogy: TELLING.trilogy.name,
};

export function tellingFor(title: TitleCode): Telling {
  return title === "og" ? "og" : "trilogy";
}

/** The games behind a choice, in release order. */
export function titlesOf(choice: TellingChoice): TitleCode[] {
  return choice === "both"
    ? [...TELLING.og.titles, ...TELLING.trilogy.titles]
    : [...TELLING[choice].titles];
}

/** Which tellings a set of games includes. */
export function tellingsIn(titles: readonly TitleCode[]): Telling[] {
  return TELLINGS.filter((t) => TELLING[t].titles.some((code) => titles.includes(code)));
}

/**
 * The choice in a URL: `?in=original` or `?in=trilogy`, absent for both. Older links named the
 * games (`?titles=og,rebirth`); they still work.
 */
export function parseTellingChoice(search: URLSearchParams): TellingChoice {
  const value = search.get("in");
  if (value === "original") return "og";
  if (value === "trilogy") return "trilogy";
  const titles = search.get("titles")?.split(",") as TitleCode[] | undefined;
  if (!titles) return "both";
  const tellings = tellingsIn(titles);
  return tellings.length === 1 && tellings[0] ? tellings[0] : "both";
}

/** Writes the choice into a query, removing any older `titles`. */
export function setTellingChoice(search: URLSearchParams, choice: TellingChoice): URLSearchParams {
  const next = new URLSearchParams(search);
  next.delete("titles");
  if (choice === "both") next.delete("in");
  else next.set("in", choice === "og" ? "original" : "trilogy");
  return next;
}
