import type { CSSProperties, ReactNode } from "react";
import type { TimelineEvent, TitleCode } from "../../api/client";
import { TITLE_COLOR } from "../../lib/titles";
import { type Chapter, MARK_WORDS, appearanceIn, markOf, tellingOf, whenOf } from "./story";

interface RowProps {
  selected: string | null;
  onSelect: (id: string) => void;
  /** What opens under the chosen event on a narrow screen. */
  detail: ReactNode;
}

/** The story in chapters, each a window of events in the order they happen. */
export function StoryChapters({
  chapters,
  titles,
  titleName,
  ...row
}: RowProps & {
  chapters: readonly Chapter[];
  titles: readonly TitleCode[];
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
                <Marks event={event} titles={titles} titleName={titleName} />
              </EventRow>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/** One game's events, numbered in the order you meet them playing it. */
export function PlayList({
  events,
  game,
  titleName,
  ...row
}: RowProps & {
  events: readonly TimelineEvent[];
  game: TitleCode;
  titleName: (code: TitleCode) => string;
}) {
  return (
    <section
      aria-labelledby="play-order-name"
      className="m-panel tl-chapter"
      style={{ "--c": TITLE_COLOR[game] } as CSSProperties}
    >
      <header className="tl-chapter-head">
        <p className="m-label tl-part">In the order you play it</p>
        <h2 id="play-order-name" className="m-heading tl-chapter-name">
          {titleName(game)}
        </h2>
      </header>
      <ol className="tl-events">
        {events.map((event, i) => {
          const a = appearanceIn(event, game);
          return (
            <EventRow key={event.id} event={event} number={i + 1} {...row}>
              {a && <p className="tl-how">{tellingOf(a)}</p>}
            </EventRow>
          );
        })}
      </ol>
    </section>
  );
}

function EventRow({
  event,
  number,
  selected,
  onSelect,
  detail,
  children,
}: RowProps & { event: TimelineEvent; number?: number; children: ReactNode }) {
  const on = event.id === selected;
  const when = whenOf(event);
  return (
    <li id={`event-${event.id}`} className="tl-event" data-selected={on || undefined}>
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
      {on && detail}
    </li>
  );
}

/** Whether each game shows the event, only mentions it, or leaves it out. */
function Marks({
  event,
  titles,
  titleName,
}: {
  event: TimelineEvent;
  titles: readonly TitleCode[];
  titleName: (code: TitleCode) => string;
}) {
  return (
    <ul aria-label="Which games tell it" className="tl-marks">
      {titles.map((title) => {
        const mark = markOf(event, title);
        return (
          <li
            key={title}
            className="tl-mark"
            data-mark={mark}
            style={{ "--c": TITLE_COLOR[title] } as CSSProperties}
            title={`${titleName(title)}: ${MARK_WORDS[mark]}`}
          >
            <MarkIcon mark={mark} />
            {titleName(title)}
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
