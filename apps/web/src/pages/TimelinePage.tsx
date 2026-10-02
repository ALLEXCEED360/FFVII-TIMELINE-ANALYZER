import { useMemo } from "react";
import type { TitleCode } from "../api/client";
import { useReference, useTimeline } from "../api/queries";
import { Empty, ErrorMessage, Loading } from "../components/QueryState";
import { EventInspector } from "../features/inspector/EventInspector";
import { TimelineChart } from "../features/timeline/TimelineChart";
import { TimelineFilters, TimelineLegend } from "../features/timeline/TimelineFilters";
import { TimelineList } from "../features/timeline/TimelineList";
import { layoutTimeline } from "../features/timeline/layout";
import { useTimelineParams } from "../features/timeline/params";
import { titleShort } from "../lib/reference";
import { SECTION_ART } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";

/** The primary view (blueprint §21–22): the chronology, one lane per title, with an inspector. */
export function TimelinePage() {
  useBackdrop(SECTION_ART.timeline, { strength: 0.42 });
  const { params, update, toggleTitle } = useTimelineParams();
  const reference = useReference();
  const timeline = useTimeline(params.titles);

  const events = useMemo(
    () =>
      (timeline.data?.items ?? []).filter(
        (event) =>
          (params.arc === null || event.arcId === params.arc) &&
          (!params.majorOnly || event.importance === 3),
      ),
    [timeline.data, params.arc, params.majorOnly],
  );
  const layout = useMemo(
    () => layoutTimeline(events, reference.data?.eras ?? [], params.titles, params.view),
    [events, reference.data, params.titles, params.view],
  );

  const titleName = (code: TitleCode) => titleShort(reference.data, code);
  const eventName = (id: string) => events.find((e) => e.id === id)?.name ?? id;
  const arcName = (id: string) => reference.data?.arcs.find((a) => a.id === id)?.name ?? id;
  const select = (id: string) => {
    update({ event: params.event === id ? null : id });
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="eyebrow">Chronology</p>
        <h1 className="page-title">Timeline</h1>
        <p className="max-w-3xl text-sm text-steel-300">
          {params.view === "world"
            ? "Events in the order they happen in the world of the story, one lane per title. Year 0 is the year the story begins."
            : "Events in the order each title shows them to the player. Crossing threads show where titles reorder the story."}
        </p>
      </header>

      {/* The inspector column only opens once an event is selected; until then the chart has the room. */}
      <div
        className={`grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] ${
          params.event ? "xl:grid-cols-[15rem_minmax(0,1fr)_24rem]" : ""
        }`}
      >
        <div className="panel h-fit p-4">
          <TimelineFilters
            params={params}
            arcs={reference.data?.arcs ?? []}
            titleName={titleName}
            onToggleTitle={toggleTitle}
            onChange={update}
          />
        </div>

        <section aria-label="Timeline" className="flex min-w-0 flex-col gap-3">
          {timeline.isPending || reference.isPending ? (
            <Loading variant="panel" label="Loading the timeline…" />
          ) : timeline.isError || reference.isError ? (
            <div className="panel p-4">
              <ErrorMessage
                error={timeline.error ?? reference.error}
                onRetry={() => {
                  void timeline.refetch();
                  void reference.refetch();
                }}
              />
            </div>
          ) : events.length === 0 ? (
            <div className="panel">
              <Empty>No events match these filters.</Empty>
            </div>
          ) : params.layout === "chart" ? (
            <>
              {/* The chart needs width; narrow screens get the list instead. */}
              <div className="hidden sm:block">
                <TimelineChart
                  layout={layout}
                  selected={params.event}
                  onSelect={select}
                  titleName={titleName}
                  eventName={eventName}
                />
              </div>
              <div className="sm:hidden">
                <TimelineList
                  events={events}
                  lanes={params.titles}
                  view={params.view}
                  selected={params.event}
                  onSelect={select}
                  titleName={titleName}
                  arcName={arcName}
                />
              </div>
              <div className="hidden flex-wrap items-start justify-between gap-3 sm:flex">
                <TimelineLegend />
                {!params.event && (
                  <p className="text-xs text-steel-400">
                    Select an event to see how each title shows it.
                  </p>
                )}
              </div>
            </>
          ) : (
            <TimelineList
              events={events}
              lanes={params.titles}
              view={params.view}
              selected={params.event}
              onSelect={select}
              titleName={titleName}
              arcName={arcName}
            />
          )}
        </section>

        {params.event ? (
          <div className="lg:col-span-2 xl:col-span-1">
            <EventInspector
              id={params.event}
              reference={reference.data}
              onClose={() => {
                update({ event: null });
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
