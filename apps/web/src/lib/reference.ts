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

/** Whether the Remake series hasn't reached this part of the original yet (the API's rule). */
export function notYetReached(
  reference: Reference | undefined,
  code: TitleCode,
  ogSegmentId: string | null | undefined,
): boolean {
  if (!reference || !ogSegmentId) return false;
  const title = reference.titles.find((t) => t.code === code);
  if (title?.series !== "remake" || !title.coverage) return false;
  const order = reference.segments.map((s) => s.id);
  const furthest = Math.max(
    ...reference.titles
      .filter((t) => t.series === "remake" && t.coverage)
      .map((t) => order.indexOf(t.coverage?.to ?? "")),
  );
  return order.indexOf(ogSegmentId) > furthest;
}
