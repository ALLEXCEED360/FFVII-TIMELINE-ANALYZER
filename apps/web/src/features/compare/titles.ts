import type { TitleCode } from "../../api/client";
import { TITLE_ORDER } from "../../lib/reference";

// Which titles a comparison shows, as `?titles=og,rebirth`.

export const DEFAULT_COMPARE: readonly TitleCode[] = ["og", "remake", "rebirth"];

/** The usual pairs and sets, offered as one-click presets. */
export const PRESETS: readonly { label: string; titles: readonly TitleCode[] }[] = [
  { label: "OG vs Remake", titles: ["og", "remake"] },
  { label: "Remake vs Rebirth", titles: ["remake", "rebirth"] },
  { label: "OG vs Rebirth", titles: ["og", "rebirth"] },
  { label: "All three", titles: ["og", "remake", "rebirth"] },
];

/** Titles from a query value, in release order; falls back to the default if fewer than two. */
export function parseCompareTitles(value: string | null): TitleCode[] {
  if (value === null) return [...DEFAULT_COMPARE];
  const wanted = value.split(",");
  const titles = TITLE_ORDER.filter((code) => wanted.includes(code));
  return titles.length >= 2 ? titles : [...DEFAULT_COMPARE];
}

/** The query value, or null when it's the default (to keep URLs short). */
export function compareTitlesParam(titles: readonly TitleCode[]): string | null {
  const ordered = TITLE_ORDER.filter((code) => titles.includes(code));
  return ordered.join(",") === DEFAULT_COMPARE.join(",") ? null : ordered.join(",");
}

/** Adds or removes a title, never going below two. */
export function toggleTitle(titles: readonly TitleCode[], code: TitleCode): TitleCode[] {
  const next = titles.includes(code) ? titles.filter((t) => t !== code) : [...titles, code];
  return next.length >= 2 ? TITLE_ORDER.filter((t) => next.includes(t)) : [...titles];
}

export function sameTitles(a: readonly TitleCode[], b: readonly TitleCode[]): boolean {
  return a.length === b.length && a.every((t) => b.includes(t));
}
