import { useEffect, useMemo, useRef } from "react";
import type { TitleCode } from "../api/client";
import { useReference, useTimeline } from "../api/queries";
import { SECTION_ART } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";
import { Empty, ErrorMessage, Loading } from "../components/QueryState";
import { EventWindow } from "../features/timeline/EventWindow";
import { MarkIcon, PlayList, StoryChapters } from "../features/timeline/StoryList";
import { TimelineControls } from "../features/timeline/TimelineControls";
import { useTimelineParams } from "../features/timeline/params";
import { MARK_WORDS, playOrder, storyChapters } from "../features/timeline/story";
import { TITLE_ORDER, titleShort } from "../lib/reference";
import { useMediaQuery } from "../lib/useMediaQuery";
import { useReducedMotion } from "../lib/motion";
import "../features/timeline/timeline.css";

/**
 * The timeline (decision 0019): the story of FFVII told top to bottom in chapters, in the
 * original game's windows, for someone meeting it for the first time. Each event says when it
 * happens, what happens, and which games show it; choosing one opens how each game tells it.
 * It can also follow the order one game shows things in.
 */
export function TimelinePage() {
  // Across the whole screen: the panels keep the text readable, and the art shows around them.
  useBackdrop(SECTION_ART.timeline, { strength: 0.7, side: "full" });
  const { params, update, toggleTitle } = useTimelineParams();
  const reference = useReference();
  // Every game is always fetched: the play view can follow any of them.
  const timeline = useTimeline([...TITLE_ORDER]);
  const wide = useMediaQuery("(min-width: 64rem)");
  const xl = useMediaQuery("(min-width: 80rem)");
  const reduced = useReducedMotion();

  const events = useMemo(
    () => (timeline.data?.items ?? []).filter((event) => !params.keyOnly || event.importance === 3),
    [timeline.data, params.keyOnly],
  );
  const play = params.view === "play";
  const chapters = useMemo(
    () =>
      storyChapters(
        // In story order, an event shows when one of the chosen games tells it.
        events.filter((e) => e.appearances.some((a) => params.titles.includes(a.title))),
        reference.data?.eras ?? [],
        reference.data?.arcs ?? [],
      ),
    [events, params.titles, reference.data],
  );
  const played = useMemo(() => playOrder(events, params.game), [events, params.game]);

  // The list of chapters, to jump between them, where there's room beside the story.
  const contents = !play && xl && chapters.length > 1;
  // Arriving with an event chosen (a link from elsewhere), go straight to it.
  const arrived = useRef(false);
  const ready = !timeline.isPending && !reference.isPending;
  useEffect(() => {
    if (arrived.current || !ready) return;
    arrived.current = true;
    // Centred beside its window on a wide screen; at the top on a narrow one, where its window
    // opens beneath it.
    if (params.event) {
      document
        .getElementById(`event-${params.event}`)
        ?.scrollIntoView({ block: wide ? "center" : "start" });
    }
  }, [ready, params.event, wide]);

  const titleName = (code: TitleCode) => titleShort(reference.data, code);
  const select = (id: string) => {
    update({ event: params.event === id ? null : id });
  };
  const close = () => {
    update({ event: null });
  };
  const detail = params.event ? (
    <EventWindow id={params.event} reference={reference.data} onClose={close} />
  ) : null;
  const row = { selected: params.event, onSelect: select, detail: wide ? null : detail };

  return (
    <div className="tl">
      <header className="tl-head">
        <h1 className="m-heading m-title">Timeline</h1>
        <p className="m-intro">
          {play
            ? `The events in the order you meet them playing ${titleName(params.game)}. Games often save the past for later, as flashbacks, so this order can jump around in time.`
            : "The story of Final Fantasy VII, from its distant past to its end, in the order it happens. Choose any event to see how each game tells it."}
        </p>
      </header>

      <TimelineControls
        params={params}
        titleName={titleName}
        onToggleTitle={toggleTitle}
        onChange={update}
      />

      {!play && (
        <ul aria-label="What the marks mean" className="tl-key">
          {(["shown", "mentioned", "none"] as const).map((mark) => (
            <li key={mark} className="tl-mark" data-mark={mark}>
              <MarkIcon mark={mark} />
              {MARK_WORDS[mark]}
            </li>
          ))}
        </ul>
      )}

      <div className="tl-body" data-chapters={contents || undefined}>
        {contents && (
          <nav aria-label="Chapters" className="m-panel tl-contents">
            <p className="m-label">Chapters</p>
            <ul>
              {chapters.map((chapter) => (
                <li key={chapter.id}>
                  <button
                    type="button"
                    className="tl-contents-item"
                    onClick={() => {
                      document
                        .getElementById(`chapter-${chapter.id}`)
                        ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
                    }}
                  >
                    {chapter.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <section aria-label="Timeline" className="tl-main">
          {timeline.isPending || reference.isPending ? (
            <Loading variant="panel" label="Loading the timeline…" />
          ) : timeline.isError || reference.isError ? (
            <div className="m-panel tl-chapter">
              <ErrorMessage
                error={timeline.error ?? reference.error}
                onRetry={() => {
                  void timeline.refetch();
                  void reference.refetch();
                }}
              />
            </div>
          ) : (play ? played.length : chapters.length) === 0 ? (
            <div className="m-panel tl-chapter">
              <Empty>
                {play
                  ? `No events here from ${titleName(params.game)} yet.`
                  : "No events for these choices."}
              </Empty>
            </div>
          ) : play ? (
            <PlayList events={played} game={params.game} titleName={titleName} {...row} />
          ) : (
            <StoryChapters
              chapters={chapters}
              titles={params.titles}
              titleName={titleName}
              {...row}
            />
          )}
        </section>

        {wide && (
          <div className="tl-side">
            {detail ?? (
              <div className="m-panel tl-detail tl-detail-empty">
                <p className="m-heading">Choose an event</p>
                <p className="tl-detail-text">
                  Its story, and how each of the four games tells it, will open here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
