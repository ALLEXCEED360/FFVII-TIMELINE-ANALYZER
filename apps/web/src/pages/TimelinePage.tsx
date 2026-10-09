import { useEffect, useMemo, useRef } from "react";
import type { TitleCode } from "../api/client";
import { useReference, useTimeline } from "../api/queries";
import { SECTION_ART } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";
import { Empty, ErrorMessage, Loading } from "../components/QueryState";
import { EventWindow } from "../features/timeline/EventWindow";
import { PlayList, StoryChapters } from "../features/timeline/StoryList";
import { TimelineControls } from "../features/timeline/TimelineControls";
import { useTimelineParams } from "../features/timeline/params";
import { playGroups, storyChapters } from "../features/timeline/story";
import { TITLE_ORDER, titleShort } from "../lib/reference";
import { TELLING, TELLINGS, titlesOf } from "../lib/tellings";
import { useMediaQuery } from "../lib/useMediaQuery";
import { useReducedMotion } from "../lib/motion";

/** The story in chapters, top to bottom; or in one game's play order. */
export function TimelinePage() {
  // Across the whole screen: the panels keep the text readable, and the art shows around them.
  useBackdrop(SECTION_ART.timeline, { strength: 0.7, side: "full" });
  const { params, update } = useTimelineParams();
  const reference = useReference();
  // Every game is always fetched: the play view can follow either telling.
  const timeline = useTimeline([...TITLE_ORDER]);
  const wide = useMediaQuery("(min-width: 64rem)");
  const xl = useMediaQuery("(min-width: 80rem)");
  const reduced = useReducedMotion();

  const events = useMemo(
    () => (timeline.data?.items ?? []).filter((event) => !params.keyOnly || event.importance === 3),
    [timeline.data, params.keyOnly],
  );
  const play = params.view === "play";
  const shownTitles = useMemo(() => titlesOf(params.tellings), [params.tellings]);
  const tellings = params.tellings === "both" ? TELLINGS : [params.tellings];
  const chapters = useMemo(
    () =>
      storyChapters(
        // In story order, an event shows when the chosen telling tells it.
        events.filter((e) => e.appearances.some((a) => shownTitles.includes(a.title))),
        reference.data?.eras ?? [],
        reference.data?.arcs ?? [],
      ),
    [events, shownTitles, reference.data],
  );
  const played = useMemo(() => playGroups(events, params.game), [events, params.game]);

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
    <EventWindow key={params.event} id={params.event} reference={reference.data} onClose={close} />
  ) : null;
  const row = { selected: params.event, onSelect: select, detail: wide ? null : detail };

  return (
    <div className="tl">
      <header className="tl-head">
        <h1 className="m-heading m-title">Timeline</h1>
        <p className="m-intro">
          {play
            ? `The events in the order you meet them playing ${params.game === "og" ? "the original" : "the Remake Trilogy, game by game"}. Games often save the past for later, as flashbacks, so this order can jump around in time.`
            : "The story of Final Fantasy VII, from its distant past to its end, in the order it happens. Choose any event to see how the original and the Remake Trilogy tell it."}
        </p>
      </header>

      <TimelineControls params={params} onChange={update} />

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
                  ? `No events here from ${TELLING[params.game].name.toLowerCase()} yet.`
                  : "No events for these choices."}
              </Empty>
            </div>
          ) : play ? (
            <PlayList groups={played} titleName={titleName} {...row} />
          ) : (
            <StoryChapters chapters={chapters} tellings={tellings} {...row} />
          )}
        </section>

        {wide && (
          <div className="tl-side">
            {detail ?? (
              <div className="ff7-window tl-detail tl-detail-empty">
                <span aria-hidden="true" className="tl-empty-glove">
                  ☞
                </span>
                <p className="m-heading">Choose any moment</p>
                <p className="tl-detail-text">
                  Tap a moment on the left. Its story, and how the original and the Remake Trilogy
                  tell it, opens here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
