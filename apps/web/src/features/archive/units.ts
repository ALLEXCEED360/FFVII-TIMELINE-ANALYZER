import type { CatalogueTitle, Reference, TitleCode } from "../../api/client";
import { titleShort } from "../../lib/reference";

// Names and context for the units of the titles — the original's segments, chapters and parts.

export type QuestionKind = "needs_footage" | "not_in_dataset" | "structure";

export const QUESTION_KIND_LABELS: Record<QuestionKind, string> = {
  needs_footage: "Needs checking against footage",
  not_in_dataset: "Not yet in the dataset",
  structure: "Structure",
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
  stated: "Stated",
  inferred: "Inferred",
  ambiguous: "Left open",
} as const;

export const CERTAINTY_DESCRIPTIONS = {
  stated: "The title shows or says it directly.",
  inferred: "Derived from stated facts; the note shows the reasoning.",
  ambiguous: "The title deliberately leaves it open; the note says what is shown.",
} as const;

/** Titles not yet in the archive (canon-and-sources.md §2): "future content". */
export const FUTURE_TITLES = [
  {
    name: "Final Fantasy VII Revelation",
    note: "The final part of the Remake series, due Spring 2027. Added after release.",
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
    return `${String(title.units.length)} story segments on ${String(discs)} discs`;
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
