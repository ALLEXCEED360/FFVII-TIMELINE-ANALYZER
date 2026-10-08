import type { CatalogueTitle, Reference, TitleCode } from "../../api/client";
import { titleShort } from "../../lib/reference";

// Names and context for the units of the titles — the original's segments, chapters and parts.

export type QuestionKind = "needs_footage" | "not_in_dataset" | "structure";

export const QUESTION_KIND_LABELS: Record<QuestionKind, string> = {
  needs_footage: "To check against video of the game",
  not_in_dataset: "Not in the archive yet",
  structure: "How the games are divided",
};

export const SOURCE_KIND_LABELS: Record<string, string> = {
  play: "Playing the game",
  footage: "Footage",
  transcript: "Transcript",
  walkthrough: "Walkthrough",
  chapter_list: "Chapter list",
  press: "Press release",
};

/** Evidence levels, best first (canon-and-sources.md §4). */
export const EVIDENCE_LEVELS = [
  { kind: "play", label: "Playing the scene", note: "The game itself." },
  {
    kind: "footage",
    label: "Recorded footage",
    note: "Full playthroughs and cutscene compilations.",
  },
  {
    kind: "transcript",
    label: "Script transcripts",
    note: "For what is said; anything visual still needs footage.",
  },
] as const;

export const CERTAINTY_LABELS = {
  stated: "Shown or said outright",
  inferred: "Worked out from what's shown",
  ambiguous: "Left open by the game",
} as const;

/** The colour of each, for its dot and bar. */
export const CERTAINTY_COLORS = {
  stated: "#8ef0c6",
  inferred: "#a9b3c6",
  ambiguous: "#f2c94c",
} as const;

export const CERTAINTY_DESCRIPTIONS = {
  stated: "The game shows it or says it directly.",
  inferred: "Not said outright, but follows from what is; each says how.",
  ambiguous: "The game leaves it open on purpose; each says what is shown, without guessing.",
} as const;

/** Titles not yet in the archive (canon-and-sources.md §2): "future content". */
export const FUTURE_TITLES = [
  {
    name: "Final Fantasy VII Revelation",
    note: "The final part of the Remake Trilogy, due Spring 2027. Added after release.",
  },
  { name: "Crisis Core: Final Fantasy VII", note: "After version 1." },
  { name: "Dirge of Cerberus: Final Fantasy VII", note: "After version 1." },
] as const;

/** "Chapter 8", "Interlude" or the original's segment name. */
export function unitLabel(key: string, name: string): string {
  if (/^\d+$/.test(key)) return `Chapter ${key}`;
  return key.startsWith("og_") ? name : (name.split(":")[0] ?? name);
}

/** How a title is divided, e.g. "39 segments on 3 discs" or "14 chapters and an interlude". */
export function structureOf(title: CatalogueTitle): string {
  if (title.code === "og") {
    const discs = new Set(title.units.map((u) => u.disc)).size;
    return `${String(title.units.length)} parts on ${String(discs)} discs`;
  }
  const chapters = title.units.filter((u) => /^\d+$/.test(u.key)).length;
  const parts = title.units.length - chapters;
  const extra =
    parts === 0
      ? ""
      : parts === 1
        ? " and an unnumbered part"
        : ` and ${String(parts)} unnumbered parts`;
  return `${String(chapters)} chapters${extra}`;
}

/** A unit's number on its chapter-select row: the chapter, or its place on its disc. */
export function unitNumber(title: CatalogueTitle, key: string): string {
  if (/^\d+$/.test(key)) return key;
  if (title.code !== "og") return "✦";
  const unit = title.units.find((u) => u.key === key);
  const disc = title.units.filter((u) => u.disc === unit?.disc);
  return String(disc.findIndex((u) => u.key === key) + 1);
}

/** How much a unit shows, in words. */
export function shownText(subjects: number): string {
  if (subjects === 0) return "Nothing recorded yet";
  return subjects === 1 ? "Shows 1 person or thing" : `Shows ${String(subjects)} people and things`;
}

/** The Remake-series titles that retell an original segment. */
export function retoldBy(reference: Reference | undefined, segment: string): TitleCode[] {
  return (reference?.titles ?? [])
    .filter((t) => t.coverage?.segments.includes(segment))
    .map((t) => t.code);
}

/** Which part of the original a Remake-series title retells, in words. */
export function coverageText(reference: Reference | undefined, code: TitleCode): string {
  if (code === "og") return "The original story, told once across three discs.";
  const coverage = reference?.titles.find((t) => t.code === code)?.coverage;
  if (!coverage) return "A new story; it doesn't retell part of the original.";
  const name = (id: string) => reference.segments.find((s) => s.id === id)?.name ?? id;
  return `Retells the original from ${name(coverage.from)} to ${name(coverage.to)}.`;
}

/** The story arc a unit belongs to, if the arcs say. */
export function arcOf(
  reference: Reference | undefined,
  title: TitleCode,
  key: string,
): { id: string; name: string } | undefined {
  const arcs = reference?.arcs ?? [];
  if (title === "og") {
    const segments = reference?.segments.map((s) => s.id) ?? [];
    const at = segments.indexOf(key);
    return arcs.find(
      (arc) => segments.indexOf(arc.og.from) <= at && at <= segments.indexOf(arc.og.to),
    );
  }
  if (!/^\d+$/.test(key)) return undefined;
  const chapter = Number(key);
  return arcs.find((arc) => {
    const range = (arc.chapters as Partial<Record<TitleCode, [number, number]>>)[title];
    return range !== undefined && range[0] <= chapter && chapter <= range[1];
  });
}

/** "Remake · Chapter 8", "OG · Disc 1". */
export function unitContext(
  reference: Reference | undefined,
  title: TitleCode,
  unit: { key: string; name: string; disc: number | null },
): string {
  const short = titleShort(reference, title);
  if (unit.disc !== null) return `${short} · Disc ${String(unit.disc)}`;
  return /^\d+$/.test(unit.key) ? `${short} · Chapter ${unit.key}` : short;
}
