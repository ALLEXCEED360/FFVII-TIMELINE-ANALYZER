import { FRAMING_LABELS, STATUS_LABELS, formatYearBounds } from "@ffvii/shared/labels";
import type { TimelineEvent, TitleCode } from "../../api/client";
import { TITLE_COLOR } from "../../lib/titles";
import type { TimelineView } from "./layout";
import { MAIN_WORLD } from "./layout";

/**
 * The timeline as a list: every event with how each title shows it. The accessible alternative to
 * the chart, and the layout used on narrow screens.
 */
export function TimelineList({
  events,
  lanes,
  view,
  selected,
  onSelect,
  titleName,
  arcName,
}: {
  events: readonly TimelineEvent[];
  lanes: readonly TitleCode[];
  view: TimelineView;
  selected: string | null;
  onSelect: (eventId: string) => void;
  titleName: (code: TitleCode) => string;
  arcName: (id: string) => string;
}) {
  if (view === "play") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {lanes.map((title) => {
          const shown = events
            .flatMap((event) => {
              const a = event.appearances.find((x) => x.title === title && x.playPosition !== null);
              return a ? [{ event, position: a.playPosition ?? 0 }] : [];
            })
            .sort((a, b) => a.position - b.position);
          return (
            <section key={title} className="panel p-4" aria-labelledby={`play-${title}`}>
              <h3
                id={`play-${title}`}
                className="mb-3 flex items-center gap-2 font-display text-sm font-semibold tracking-wider uppercase"
              >
                <span
                  aria-hidden="true"
                  className="size-2 rotate-45"
                  style={{ background: TITLE_COLOR[title] }}
                />
                {titleName(title)}
                <span className="label ml-auto">play order</span>
              </h3>
              {shown.length === 0 ? (
                <p className="text-sm text-steel-400">No events from the current filters.</p>
              ) : (
                <ol className="flex flex-col gap-1">
                  {shown.map(({ event }, i) => (
                    <li key={event.id}>
                      <EventButton
                        event={event}
                        selected={event.id === selected}
                        onSelect={onSelect}
                        prefix={`${String(i + 1)}.`}
                      />
                    </li>
                  ))}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <ol className="panel divide-y divide-night-800">
      {events.map((event) => (
        <li key={event.id} className="grid gap-x-4 gap-y-1 p-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <span className="label pt-0.5">{formatYearBounds(event.start)}</span>
          <div className="flex min-w-0 flex-col gap-2">
            <div>
              <EventButton event={event} selected={event.id === selected} onSelect={onSelect} />
              <span className="block text-xs text-steel-400">{arcName(event.arcId)}</span>
            </div>
            <ul className="flex flex-wrap gap-1.5" aria-label="How each title shows it">
              {lanes.map((title) => {
                const all = event.appearances.filter((a) => a.title === title);
                const a = all.find((x) => x.world === MAIN_WORLD) ?? all[0];
                const text = a
                  ? `${STATUS_LABELS[a.status]}${a.framing && a.framing !== "direct" ? ` · ${FRAMING_LABELS[a.framing]}` : ""}${a.world === MAIN_WORLD ? "" : " · other world"}`
                  : "—";
                return (
                  <li
                    key={title}
                    className="chip"
                    style={{ borderColor: a ? TITLE_COLOR[title] : undefined }}
                  >
                    <span className="text-steel-100">{titleName(title)}</span>
                    <span>{text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}

function EventButton({
  event,
  selected,
  onSelect,
  prefix,
}: {
  event: TimelineEvent;
  selected: boolean;
  onSelect: (id: string) => void;
  prefix?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => {
        onSelect(event.id);
      }}
      className={`text-left text-sm transition hover:text-mako-300 ${
        selected ? "font-semibold text-mako-200" : "text-steel-100"
      }`}
    >
      {prefix && <span className="mr-2 font-mono text-xs text-steel-400">{prefix}</span>}
      {event.name}
    </button>
  );
}
