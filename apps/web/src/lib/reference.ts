import { type LocatorNames, formatLocator } from "@ffvii/shared/labels";
import type { Locator, Reference, TitleCode } from "../api/client";

// Helpers that turn codes into names using the reference bundle from `/reference`.

export const TITLE_ORDER: readonly TitleCode[] = ["og", "remake", "intermission", "rebirth"];

/** Short labels used before the reference data has loaded (and as fallbacks). */
const FALLBACK_SHORT: Record<TitleCode, string> = {
  og: "OG",
  remake: "Remake",
  intermission: "INTERmission",
  rebirth: "Rebirth",
};

export function isTitleCode(value: string): value is TitleCode {
  return (TITLE_ORDER as readonly string[]).includes(value);
}

export function titleShort(reference: Reference | undefined, code: TitleCode): string {
  return reference?.titles.find((t) => t.code === code)?.shortName ?? FALLBACK_SHORT[code];
}

export function locatorNames(reference: Reference | undefined): LocatorNames {
  return {
    title: (code) => titleShort(reference, code),
    segment: (id) => reference?.segments.find((s) => s.id === id)?.name,
    unit: (code, key) =>
      reference?.titles.find((t) => t.code === code)?.units.find((u) => u.key === key)?.name,
  };
}

export function describeLocator(reference: Reference | undefined, locator: Locator): string {
  return formatLocator(locator, locatorNames(reference));
}

export function worldName(reference: Reference | undefined, id: string): string {
  return reference?.worlds.find((w) => w.id === id)?.name ?? id;
}
