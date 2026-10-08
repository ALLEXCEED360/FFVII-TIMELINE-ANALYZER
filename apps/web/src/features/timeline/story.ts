import type { Arc, Era, TimelineAppearance, TimelineEvent, TitleCode } from "../../api/client";
import { TELLING, type Telling } from "../../lib/tellings";

// The timeline in chapters, and how each telling treats each event, in plain words. Pure.

export const MAIN_WORLD = "world_main";

/** How a game treats an event, at a glance. */
export type Mark = "shown" | "mentioned" | "none";

export const MARK_WORDS: Record<Mark, string> = {
  shown: "Shows it",
  mentioned: "Only mentions it",
  none: "Not in it",
};

/** The appearance that speaks for a game: the main world's, else the first other world's. */
export function appearanceIn(
  event: TimelineEvent,
  title: TitleCode,
): TimelineAppearance | undefined {
  const all = event.appearances.filter((a) => a.title === title);
  return all.find((a) => a.world === MAIN_WORLD) ?? all[0];
}

export function markOf(event: TimelineEvent, title: TitleCode): Mark {
  const a = appearanceIn(event, title);
  if (!a || a.status === "omitted") return "none";
  return a.status === "depicted" ? "shown" : "mentioned";
}

const MARK_RANK: Record<Mark, number> = { shown: 2, mentioned: 1, none: 0 };

/** How a telling treats an event: its strongest mark, and which of its games give it. */
export function tellingMark(
  event: TimelineEvent,
  telling: Telling,
): { mark: Mark; titles: TitleCode[] } {
  const marks = TELLING[telling].titles.map((title) => ({ title, mark: markOf(event, title) }));
  const best = marks.reduce<Mark>(
    (m, x) => (MARK_RANK[x.mark] > MARK_RANK[m] ? x.mark : m),
    "none",
  );
  return {
    mark: best,
    titles: best === "none" ? [] : marks.filter((x) => x.mark === best).map((x) => x.title),
  };
}

export { tellingOf } from "../../lib/plain";

/** When an event happens, for someone who doesn't know the story: "15 years before the story". */
export function whenOf(event: Pick<TimelineEvent, "start">): string | null {
  const year = event.start.earliest;
  if (year === 0) return null;
  const n = Math.abs(year).toLocaleString("en-US");
  const unit = Math.abs(year) === 1 ? "year" : "years";
  const about = Math.abs(year) >= 100 ? "About " : "";
  return year < 0
    ? `${about}${n} ${unit} before the story`
    : `${about}${n} ${unit} after the story`;
}

export interface Chapter {
  id: string;
  /** Where the chapter sits: before, during or after the main story. */
  part: "Before the story" | "The story" | "After the story";
  name: string;
  events: TimelineEvent[];
}

export const byStoryOrder = (a: TimelineEvent, b: TimelineEvent) =>
  a.start.earliest - b.start.earliest ||
  (a.seq ?? Number.MAX_SAFE_INTEGER) - (b.seq ?? Number.MAX_SAFE_INTEGER) ||
  a.id.localeCompare(b.id);

/** Chapters: eras before the story, its arcs, then eras after; empty ones left out. */
export function storyChapters(
  events: readonly TimelineEvent[],
  eras: readonly Era[],
  arcs: readonly Arc[],
): Chapter[] {
  const sorted = [...events].sort(byStoryOrder);
  const eraOf = (year: number) => eras.find((era) => era.start <= year && year <= era.end);
  const chapters: Chapter[] = [];
  const add = (id: string, part: Chapter["part"], name: string, event: TimelineEvent) => {
    const last = chapters.at(-1);
    if (last?.id === id) last.events.push(event);
    else chapters.push({ id, part, name, events: [event] });
  };
  for (const event of sorted.filter((e) => e.start.earliest < 0)) {
    const era = eraOf(event.start.earliest);
    add(era?.id ?? "before", "Before the story", era?.name ?? "Before the story", event);
  }
  const present = sorted.filter((e) => e.start.earliest === 0);
  for (const arc of arcs) {
    for (const event of present.filter((e) => e.arcId === arc.id)) {
      add(arc.id, "The story", arc.name, event);
    }
  }
  for (const event of present.filter((e) => !arcs.some((arc) => arc.id === e.arcId))) {
    add("story", "The story", "The story", event);
  }
  for (const event of sorted.filter((e) => e.start.earliest > 0)) {
    const era = eraOf(event.start.earliest);
    add(era?.id ?? "after", "After the story", era?.name ?? "After the story", event);
  }
  return chapters;
}

/** The events one game shows, in the order you meet them playing it. */
export function playOrder(events: readonly TimelineEvent[], title: TitleCode): TimelineEvent[] {
  return events
    .flatMap((event) => {
      const a = appearanceIn(event, title);
      return a && a.playPosition !== null ? [{ event, position: a.playPosition }] : [];
    })
    .sort((a, b) => a.position - b.position || byStoryOrder(a.event, b.event))
    .map(({ event }) => event);
}

/** A telling's events in the order you play them: one group per game, in release order. */
export function playGroups(
  events: readonly TimelineEvent[],
  telling: Telling,
): { title: TitleCode; events: TimelineEvent[] }[] {
  return TELLING[telling].titles
    .map((title) => ({ title, events: playOrder(events, title) }))
    .filter((group) => group.events.length > 0);
}
