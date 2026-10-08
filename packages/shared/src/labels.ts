// Locator formatting with no dependencies, so the web app can import it through
// `@ffvii/shared/labels` without pulling Zod into the browser bundle.
import type { Locator } from "./locators.ts";

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
