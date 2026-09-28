// Display labels and formatting, with no dependencies (no Zod), so the web app can import them
// through `@ffvii/shared/labels` without pulling schemas into the browser bundle.
// Only type imports below — they vanish at build time.
import type { DifferenceCategory } from "./differences.ts";
import type { Framing, StoredStatus } from "./appearances.ts";
import type { InUniverseDate } from "./chronology.ts";
import type { Locator } from "./locators.ts";
import type { DisplayStatus } from "./status.ts";

// ─── Years ────────────────────────────────────────────────────────────────────

/** "Year 0", "5 years before", "500 years after" (docs/model/chronology.md §1). */
export function formatYearNumber(year: number, approx = false): string {
  if (year === 0) return "Year 0";
  const n = `${approx ? "~" : ""}${Math.abs(year).toLocaleString("en-US")}`;
  const unit = Math.abs(year) === 1 ? "year" : "years";
  return year < 0 ? `${n} ${unit} before` : `${n} ${unit} after`;
}

/** Formats a date as written in the data: a year, an approximate year, or a range. */
export function formatYear(date: InUniverseDate): string {
  if ("between" in date) {
    return `${formatYearNumber(date.between[0].year)} – ${formatYearNumber(date.between[1].year)}`;
  }
  return formatYearNumber(date.year, date.approx === true);
}

/** Formats resolved bounds, e.g. `{ earliest: -5, latest: -5 }` → "5 years before". */
export function formatYearBounds(bounds: { earliest: number; latest: number }): string {
  return bounds.earliest === bounds.latest
    ? formatYearNumber(bounds.earliest)
    : `${formatYearNumber(bounds.earliest)} – ${formatYearNumber(bounds.latest)}`;
}

// ─── Statuses, framings, categories ───────────────────────────────────────────

export const STATUS_LABELS: Record<DisplayStatus, string> = {
  depicted: "Depicted",
  referenced: "Referenced",
  omitted: "Omitted",
  not_yet_reached: "Not yet reached",
  undocumented: "Not yet documented",
  absent: "Not in this title",
};

export const STATUS_DESCRIPTIONS: Record<DisplayStatus, string> = {
  depicted: "Shown on screen, as it happens or as a full flashback.",
  referenced: "Only mentioned, or glimpsed without being portrayed.",
  omitted: "This part of the story is covered, and this is left out.",
  not_yet_reached: "The Remake series hasn't reached this part of the story yet.",
  undocumented: "Covered by this title, but not yet entered in the dataset.",
  absent: "This title doesn't cover it.",
};

export const FRAMING_LABELS: Record<Framing, string> = {
  direct: "Shown directly",
  flashback: "Flashback",
  false_account: "False account",
  disputed_account: "Disputed account",
  vision: "Vision",
  mention: "Mentioned",
  glimpse: "Glimpse",
};

export const FRAMING_DESCRIPTIONS: Record<Framing, string> = {
  direct: "Shown as it happens, in the present of the story.",
  flashback: "A memory or retelling the title presents as accurate.",
  false_account: "A memory or retelling the title later reveals to be false.",
  disputed_account: "A memory or retelling the title calls into doubt without resolving.",
  vision: "A vision or hallucination, not presented as literally real.",
  mention: "Told in dialogue or text only.",
  glimpse: "A brief flash of imagery.",
};

export const DIFFERENCE_CATEGORY_LABELS: Record<DifferenceCategory, string> = {
  presentation: "Presentation",
  participants: "Participants",
  setting: "Setting",
  chronology: "Chronology",
  outcome: "Outcome",
  role: "Role",
  relationship: "Relationship",
  context: "Context",
  gameplay: "Gameplay",
};

/** Whether a stored status counts as the title showing the entity at all. */
export function isShown(status: StoredStatus): boolean {
  return status !== "omitted";
}

// ─── Locators ─────────────────────────────────────────────────────────────────

export interface LocatorNames {
  /** Short title name, e.g. "Rebirth". */
  title: (code: Locator["title"]) => string;
  /** Segment display name, e.g. "Kalm". */
  segment?: (id: string) => string | undefined;
  /** A chaptered title's unit name, e.g. "Fall of a Hero" or "Interlude: A World Apart". */
  unit?: (code: Locator["title"], key: string) => string | undefined;
}

/** "OG · Disc 1 · Kalm", "Rebirth · Ch. 14", "Rebirth · Interlude: A World Apart". */
export function formatLocator(locator: Locator, names: LocatorNames): string {
  const title = names.title(locator.title);
  if ("segment" in locator) {
    const segment = names.segment?.(locator.segment) ?? locator.segment;
    return `${title} · Disc ${String(locator.disc)} · ${segment}`;
  }
  if ("chapter" in locator) return `${title} · Ch. ${String(locator.chapter)}`;
  return `${title} · ${names.unit?.(locator.title, locator.part) ?? locator.part}`;
}
