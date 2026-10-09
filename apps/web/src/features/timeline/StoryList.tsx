import type { CSSProperties, ReactNode } from "react";
import type { TimelineEvent, TitleCode } from "../../api/client";
import { TELLING, type Telling } from "../../lib/tellings";
import { TITLE_COLOR } from "../../lib/titles";
import { type Chapter, appearanceIn, tellingMark, tellingOf, whenOf } from "./story";

interface RowProps {
  selected: string | null;
  onSelect: (id: string) => void;
  /** What opens under the chosen event on a narrow screen. */
  detail: ReactNode;
}

/** The story in chapters, each a window of events in the order they happen. */
export function StoryChapters({
  chapters,
  tellings,
  ...row
}: RowProps & {
  chapters: readonly Chapter[];
  tellings: readonly Telling[];
}) {
  return (
    <div className="tl-chapters">
      {chapters.map((chapter) => (
        <section
          key={chapter.id}
          id={`chapter-${chapter.id}`}
          aria-labelledby={`chapter-${chapter.id}-name`}
          className="m-panel tl-chapter"
        >
          <header className="tl-chapter-head">
            <p className="m-label tl-part">{chapter.part}</p>
            <h2 id={`chapter-${chapter.id}-name`} className="m-heading tl-chapter-name">
              {chapter.name}
            </h2>
          </header>
          <ol className="tl-events">
            {chapter.events.map((event) => (
              <EventRow key={event.id} event={event} {...row}>
                <Marks event={event} tellings={tellings} />
              </EventRow>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/** A telling's events in the order you play them: a panel per game, numbered on throughout. */
export function PlayList({
  groups,
  titleName,
  ...row
}: RowProps & {
  groups: readonly { title: TitleCode; events: readonly TimelineEvent[] }[];
  titleName: (code: TitleCode) => string;
}) {
  // Numbered on through the telling; a moment met again in a later game is anchored once.
  const seen = new Set<string>();
  const numbered = groups.map(({ title, events }) => ({
    title,
    rows: [] as { event: TimelineEvent; number: number; anchor: boolean }[],
    events,
  }));
  let count = 0;
  for (const group of numbered) {
    for (const event of group.events) {
      count += 1;
      group.rows.push({ event, number: count, anchor: !seen.has(event.id) });
      seen.add(event.id);
    }
  }
  return (
    <div className="tl-chapters">
      {numbered.map(({ title, rows }) => (
        <section
          key={title}
          aria-labelledby={`play-${title}`}
          className="m-panel tl-chapter"
          style={{ "--c": TITLE_COLOR[title] } as CSSProperties}
        >
          <header className="tl-chapter-head">
            <p className="m-label tl-part">In the order you play it</p>
            <h2 id={`play-${title}`} className="m-heading tl-chapter-name">
              {titleName(title)}
            </h2>
          </header>
          <ol className="tl-events">
            {rows.map(({ event, number, anchor }) => {
              const a = appearanceIn(event, title);
              return (
                <EventRow key={event.id} event={event} number={number} anchor={anchor} {...row}>
                  {a && <p className="tl-how">{tellingOf(a)}</p>}
                </EventRow>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

function EventRow({
  event,
  number,
  anchor = true,
  selected,
  onSelect,
  detail,
  children,
}: RowProps & { event: TimelineEvent; number?: number; anchor?: boolean; children: ReactNode }) {
  const on = event.id === selected;
  const when = whenOf(event);
  return (
    <li
      id={anchor ? `event-${event.id}` : undefined}
      className="tl-event"
      data-selected={on || undefined}
    >
      {/* The game's white glove: it points at the moment under the pointer, and stays on the
          chosen one. */}
      <span aria-hidden="true" className="ff7-hand tl-glove">
        ☞
      </span>
      <button
        type="button"
        aria-pressed={on}
        onClick={() => {
          onSelect(event.id);
        }}
        className="m-heading tl-event-button"
      >
        {number !== undefined && <span className="tl-number">{number}.</span>}
        {event.name}
        {event.importance === 3 && (
          <span className="tl-star" title="Key moment">
            {" "}
            ★<span className="sr-only">Key moment</span>
          </span>
        )}
      </button>
      {when && <p className="m-label tl-when">{when}</p>}
      <p className="tl-summary">{event.summary}</p>
      {children}
      {on && anchor && detail}
    </li>
  );
}

/** The tellings that have the event, each a filled diamond in its colour. */
function Marks({ event, tellings }: { event: TimelineEvent; tellings: readonly Telling[] }) {
  const having = tellings.filter((telling) => tellingMark(event, telling).mark !== "none");
  if (having.length === 0) return null;
  return (
    <ul aria-label="Told in" className="tl-marks">
      {having.map((telling) => (
        <li
          key={telling}
          className="tl-mark"
          style={{ "--c": TELLING[telling].color } as CSSProperties}
        >
          <MarkIcon />
          {TELLING[telling].short}
        </li>
      ))}
    </ul>
  );
}

export function MarkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="tl-mark-icon">
      <path d="M6 1 11 6 6 11 1 6Z" />
    </svg>
  );
}
