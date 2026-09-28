import type { Era, TimelineAppearance, TimelineEvent, TitleCode } from "../../api/client";

// Where everything goes on the timeline chart, as fractions of its width (0–1). Pure, so it's
// tested without a browser. See docs/model/chronology.md §6–8.
//
// In-universe view: eras get widths by weight (only eras that contain an event are shown).
// Inside an era, events are spaced evenly in story order — FFVII gives almost no dates, and nearly
// everything happens in year 0, so an even ordinal spacing is both honest and readable.
// Play-order view: each lane lists its events in the order the player sees them.

export type TimelineView = "world" | "play";

export const MAIN_WORLD = "world_main";

export interface EraBand {
  id: string;
  name: string;
  x0: number;
  x1: number;
}

export interface Marker {
  eventId: string;
  title: TitleCode;
  x: number;
  status: TimelineAppearance["status"];
  framing: TimelineAppearance["framing"];
  /** Worlds this title shows the event in; the marker uses the main world when present. */
  worlds: string[];
  /** This title places the event at a different time than the event's own (chronology.md §5). */
  overridden: boolean;
  /** 1-based position in the title's play order (play view only). */
  playRank: number | null;
}

export interface Column {
  eventId: string;
  name: string;
  importance: number;
  x: number;
}

export interface Connector {
  eventId: string;
  from: { title: TitleCode; x: number };
  to: { title: TitleCode; x: number };
}

export interface TimelineLayout {
  lanes: TitleCode[];
  eras: EraBand[];
  columns: Column[];
  markers: Marker[];
  connectors: Connector[];
}

interface Key {
  start: number;
  seq: number;
  id: string;
}

function keyOf(event: TimelineEvent, start = event.start.earliest): Key {
  return { start, seq: event.seq ?? Number.MAX_SAFE_INTEGER, id: event.id };
}

function compareKeys(a: Key, b: Key): number {
  return a.start - b.start || a.seq - b.seq || a.id.localeCompare(b.id);
}

const keyString = (k: Key) => `${String(k.start)}|${String(k.seq)}|${k.id}`;

/** The appearance a lane shows: main world first, otherwise the first other world. */
function laneAppearance(event: TimelineEvent, title: TitleCode) {
  const all = event.appearances.filter((a) => a.title === title);
  if (all.length === 0) return undefined;
  const chosen = all.find((a) => a.world === MAIN_WORLD) ?? all[0];
  return chosen && { chosen, worlds: all.map((a) => a.world) };
}

export function layoutTimeline(
  events: readonly TimelineEvent[],
  eras: readonly Era[],
  lanes: readonly TitleCode[],
  view: TimelineView,
): TimelineLayout {
  return view === "world" ? worldLayout(events, eras, lanes) : playLayout(events, lanes);
}

function worldLayout(
  events: readonly TimelineEvent[],
  eras: readonly Era[],
  lanes: readonly TitleCode[],
): TimelineLayout {
  // Every position that needs a place on the axis: each event's own time, plus any title's override.
  const keys = new Map<string, Key>();
  const add = (key: Key) => keys.set(keyString(key), key);
  for (const event of events) {
    add(keyOf(event));
    for (const appearance of event.appearances) {
      if (appearance.start) add(keyOf(event, appearance.start.earliest));
    }
  }

  const eraOf = (year: number) => eras.find((era) => era.start <= year && year <= era.end);
  const used = eras.filter((era) => [...keys.values()].some((k) => eraOf(k.start) === era));
  const total = used.reduce((sum, era) => sum + era.weight, 0) || 1;

  const bands: EraBand[] = [];
  const position = new Map<string, number>();
  let cursor = 0;
  for (const era of used) {
    const width = era.weight / total;
    bands.push({ id: era.id, name: era.name, x0: cursor, x1: cursor + width });
    const inEra = [...keys.values()].filter((k) => eraOf(k.start) === era).sort(compareKeys);
    inEra.forEach((key, i) => {
      position.set(keyString(key), cursor + ((i + 0.5) / inEra.length) * width);
    });
    cursor += width;
  }
  const xOf = (key: Key) => position.get(keyString(key)) ?? 0;

  const markers: Marker[] = [];
  for (const event of events) {
    for (const title of lanes) {
      const found = laneAppearance(event, title);
      if (!found) continue;
      const { chosen, worlds } = found;
      const start = chosen.start?.earliest;
      markers.push({
        eventId: event.id,
        title,
        x: xOf(keyOf(event, start ?? event.start.earliest)),
        status: chosen.status,
        framing: chosen.framing,
        worlds,
        overridden: start !== undefined && start !== event.start.earliest,
        playRank: null,
      });
    }
  }

  const columns = [...events]
    .sort((a, b) => compareKeys(keyOf(a), keyOf(b)))
    .map((event) => ({
      eventId: event.id,
      name: event.name,
      importance: event.importance,
      x: xOf(keyOf(event)),
    }));

  return { lanes: [...lanes], eras: bands, columns, markers, connectors: connect(markers, lanes) };
}

function playLayout(events: readonly TimelineEvent[], lanes: readonly TitleCode[]): TimelineLayout {
  const perLane = lanes.map((title) =>
    events
      .flatMap((event) => {
        const found = laneAppearance(event, title);
        const playPosition = found?.chosen.playPosition ?? null;
        if (!found || playPosition === null) return [];
        return [{ event, ...found, playPosition }];
      })
      .sort((a, b) => a.playPosition - b.playPosition || a.event.id.localeCompare(b.event.id)),
  );
  const longest = Math.max(1, ...perLane.map((lane) => lane.length));

  const markers: Marker[] = perLane.flatMap((lane, laneIndex) =>
    lane.map(({ event, chosen, worlds }, rank) => ({
      eventId: event.id,
      title: lanes[laneIndex] ?? "og",
      x: (rank + 0.5) / longest,
      status: chosen.status,
      framing: chosen.framing,
      worlds,
      overridden: false,
      playRank: rank + 1,
    })),
  );

  return { lanes: [...lanes], eras: [], columns: [], markers, connectors: connect(markers, lanes) };
}

/** Links each event's markers in adjacent lanes, so shared events read as one thread. */
function connect(markers: readonly Marker[], lanes: readonly TitleCode[]): Connector[] {
  const byEvent = new Map<string, Marker[]>();
  for (const marker of markers) {
    byEvent.set(marker.eventId, [...(byEvent.get(marker.eventId) ?? []), marker]);
  }
  const connectors: Connector[] = [];
  for (const [eventId, list] of byEvent) {
    const ordered = [...list].sort((a, b) => lanes.indexOf(a.title) - lanes.indexOf(b.title));
    for (let i = 1; i < ordered.length; i++) {
      const from = ordered[i - 1];
      const to = ordered[i];
      if (from && to) {
        connectors.push({
          eventId,
          from: { title: from.title, x: from.x },
          to: { title: to.title, x: to.x },
        });
      }
    }
  }
  return connectors;
}
