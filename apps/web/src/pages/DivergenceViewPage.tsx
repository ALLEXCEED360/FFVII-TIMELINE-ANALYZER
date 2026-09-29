import { formatYearNumber } from "@ffvii/shared/labels";
import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ApiError } from "../api/client";
import { useDivergence, useReference } from "../api/queries";
import { ErrorMessage, Loading } from "../components/QueryState";
import { TitleSelect } from "../features/compare/parts";
import { DivergenceList } from "../features/divergence/DivergenceList";
import { DivergenceMap } from "../features/divergence/DivergenceMap";
import { MarkingLegend } from "../features/divergence/Legend";
import { layoutDivergence } from "../features/divergence/layout";
import { divergenceSearch, useDivergenceParams } from "../features/divergence/params";
import { EventInspector } from "../features/inspector/EventInspector";
import { comparePath, divergencePath, idFromPath, kindOf } from "../lib/paths";
import { NotFoundPage } from "./NotFoundPage";

/**
 * Where the titles part ways around one event (blueprint §29):
 * /divergence/event/aerith-death?titles=og,rebirth&worlds=1
 * The shared history before it is one line; at the event it forks into a line per title.
 */
export function DivergenceViewPage() {
  const { kind, slug } = useParams();
  const id = idFromPath(kind, slug);
  const { params, update } = useDivergenceParams();
  const divergence = useDivergence(id, params.titles, params.worlds);
  const reference = useReference();
  const navigate = useNavigate();
  const view = divergence.data;
  const layout = useMemo(() => (view ? layoutDivergence(view) : null), [view]);

  // A retired ID is redirected by the API; show the canonical URL for what came back.
  const returnedId = view?.pivot.id;
  useEffect(() => {
    if (returnedId && id && returnedId !== id && !divergence.isPlaceholderData) {
      void navigate(`${divergencePath(returnedId)}${window.location.search}`, { replace: true });
    }
  }, [returnedId, id, navigate, divergence.isPlaceholderData]);

  if (id === undefined || kindOf(id) !== "event") return <NotFoundPage />;
  if (
    divergence.isError &&
    divergence.error instanceof ApiError &&
    divergence.error.status === 404
  ) {
    return <NotFoundPage />;
  }

  const onMap = (eventId: string) =>
    view !== undefined && [...view.trunk, ...view.events].some((r) => r.event.id === eventId);
  const selected = params.node && onMap(params.node) ? params.node : null;
  const select = (eventId: string) => {
    update({ node: eventId === selected ? null : eventId });
  };
  const reroot = (eventId: string) => {
    const query = divergenceSearch({ ...params, node: null }).toString();
    void navigate(`${divergencePath(eventId)}${query ? `?${query}` : ""}`);
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <nav aria-label="Breadcrumb" className="label">
          <Link to="/divergence" className="hover:text-mako-300">
            Divergence
          </Link>
        </nav>
        <h1 className="font-display text-3xl font-semibold tracking-wide text-steel-100">
          {view?.pivot.name ?? "…"}
        </h1>
        {view && (
          <p className="label text-mako-300">
            {formatYearNumber(view.pivot.start)}
            {view.pivot.importance === 3 ? " · Pivotal" : ""}
          </p>
        )}
        <p className="max-w-3xl text-sm text-steel-300">
          The line on the left is the history before this event; at the event it forks into a line
          per title. Each station shows how that title tells the event. Select a station for
          details, or re-root the map on it.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={comparePath(id)} className="btn">
            Compare titles
          </Link>
          <button
            type="button"
            className="btn"
            aria-pressed={params.worlds}
            onClick={() => {
              update({ worlds: !params.worlds });
            }}
          >
            Show other worlds
          </button>
        </div>
        <TitleSelect
          titles={params.titles}
          reference={reference.data}
          onChange={(titles) => {
            update({ titles });
          }}
        />
      </header>

      {divergence.isPending ? (
        <Loading variant="panel" label="Loading the divergence…" />
      ) : divergence.isError ? (
        <div className="panel p-4">
          <ErrorMessage error={divergence.error} onRetry={() => void divergence.refetch()} />
        </div>
      ) : (
        layout &&
        view && (
          <div
            className={`grid gap-5 ${selected ? "xl:grid-cols-[minmax(0,1fr)_22rem]" : ""}`}
            aria-busy={divergence.isPlaceholderData}
          >
            <div className="flex min-w-0 flex-col gap-5">
              <section aria-label="Map">
                <DivergenceMap
                  layout={layout}
                  reference={reference.data}
                  selected={selected}
                  onSelect={select}
                />
              </section>
              <MarkingLegend />
              <section aria-labelledby="divergence-list" className="flex flex-col gap-3">
                <h2 id="divergence-list" className="label">
                  As a list
                </h2>
                <DivergenceList
                  view={view}
                  reference={reference.data}
                  selected={selected}
                  onSelect={select}
                />
              </section>
            </div>
            {selected && (
              <EventInspector
                key={selected}
                id={selected}
                reference={reference.data}
                onClose={() => {
                  update({ node: null });
                }}
                // The map is already rooted on the pivot: no action for it.
                action={
                  selected === view.pivot.id ? (
                    false
                  ) : (
                    <button
                      type="button"
                      className="btn px-2 py-0.5"
                      onClick={() => {
                        reroot(selected);
                      }}
                    >
                      Re-root here
                    </button>
                  )
                }
              />
            )}
          </div>
        )
      )}
    </div>
  );
}
