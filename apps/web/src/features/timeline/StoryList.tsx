import type { CSSProperties, ReactNode } from "react";
import type { TimelineEvent, TitleCode } from "../../api/client";
import { TELLING, type Telling } from "../../lib/tellings";
import { TITLE_COLOR } from "../../lib/titles";
import { type Chapter, MARK_WORDS, appearanceIn, tellingMark, tellingOf, whenOf } from "./story";

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
  titleName,
  ...row
}: RowProps & {
  chapters: readonly Chapter[];
  tellings: readonly Telling[];
  titleName: (code: TitleCode) => string;
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
                <Marks event={event} tellings={tellings} titleName={titleName} />
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

/** Whether each telling shows the event, only mentions it, or leaves it out — and in which game. */
function Marks({
  event,
  tellings,
  titleName,
}: {
  event: TimelineEvent;
  tellings: readonly Telling[];
  titleName: (code: TitleCode) => string;
}) {
  return (
    <ul aria-label="Which tellings have it" className="tl-marks">
      {tellings.map((telling) => {
        const { mark, titles } = tellingMark(event, telling);
        const games =
          telling === "trilogy" && titles.length > 0 ? titles.map(titleName).join(", ") : "";
        return (
          <li
            key={telling}
            className="tl-mark"
            data-mark={mark}
            style={{ "--c": TELLING[telling].color } as CSSProperties}
            title={`${TELLING[telling].short}: ${MARK_WORDS[mark]}${games ? ` (${games})` : ""}`}
          >
            <MarkIcon mark={mark} />
            {TELLING[telling].short}
            {games && <span className="tl-mark-games">{games}</span>}
            <span className="sr-only">: {MARK_WORDS[mark]}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function MarkIcon({ mark }: { mark: keyof typeof MARK_WORDS }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="tl-mark-icon">
      {mark === "none" ? (
        <path d="M2.5 6h7" strokeWidth="1.6" />
      ) : (
        <path d="M6 1 11 6 6 11 1 6Z" strokeWidth="1.6" data-fill={mark === "shown" || undefined} />
      )}
    </svg>
  );
}
