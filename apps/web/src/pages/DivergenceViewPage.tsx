import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ApiError } from "../api/client";
import { useDivergence, useEntity, useReference } from "../api/queries";
import { SECTION_ART, sceneFor } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";
import { ErrorMessage, Loading } from "../components/QueryState";
import { SplitView } from "../features/divergence/SplitView";
import { byTelling } from "../features/divergence/tellings";
import { divergenceSearch, useDivergenceParams } from "../features/divergence/params";
import { EventWindow } from "../features/timeline/EventWindow";
import { comparePath, divergencePath, idFromPath, kindOf } from "../lib/paths";
import { TITLE_ORDER, worldName } from "../lib/reference";
import { useMediaQuery } from "../lib/useMediaQuery";
import { NotFoundPage } from "./NotFoundPage";
import "../features/compare/compare.css";
import "../features/divergence/divergence.css";

/** Where the original and the Remake Trilogy part ways around one moment. /divergence/event/…?worlds=1 */
export function DivergenceViewPage() {
  const { kind, slug } = useParams();
  const id = idFromPath(kind, slug);
  useBackdrop(sceneFor(id ?? "")?.id ?? SECTION_ART.divergence, { strength: 0.6, side: "full" });
  const { params, update } = useDivergenceParams();
  const divergence = useDivergence(id, TITLE_ORDER, params.worlds);
  const pivot = useEntity(id);
  const reference = useReference();
  const navigate = useNavigate();
  const wide = useMediaQuery("(min-width: 64rem)");
  const view = divergence.data;

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
  const hasOtherWorlds = (reference.data?.worlds.length ?? 0) > 1;

  const detail = selected ? (
    <EventWindow
      key={selected}
      id={selected}
      reference={reference.data}
      onClose={() => {
        update({ node: null });
      }}
      action={
        selected === view?.pivot.id ? (
          false
        ) : (
          <button
            type="button"
            className="m-row-link"
            onClick={() => {
              reroot(selected);
            }}
          >
            Make this the turning point
          </button>
        )
      }
    />
  ) : null;

  return (
    <div className="dv">
      <header>
        <p className="m-label">Divergence · A turning point</p>
        <h1 className="m-heading m-title dv-title">
          {view?.pivot.name ?? pivot.data?.name ?? "…"}
        </h1>
        {pivot.data && <p className="m-intro">{pivot.data.summary}</p>}
        <p className="m-intro dv-guide">
          Read it in three steps: the story so far, the turning point, then where the original and
          the Remake Trilogy each go next. Tap any moment to see its details.
        </p>
        <div className="cmp-hero-links">
          <Link to={comparePath(id)} className="m-pill-link">
            Compare side by side
          </Link>
          <Link to={`/timeline?event=${id}`} className="m-pill-link">
            See it on the timeline
          </Link>
        </div>
      </header>

      {hasOtherWorlds && (
        <div className="m-panel cmp-controls dv-controls">
          <div className="cmp-control">
            <p className="m-label" id="dv-worlds">
              Other worlds
            </p>
            <div role="group" aria-labelledby="dv-worlds" className="m-choices">
              <button
                type="button"
                aria-pressed={params.worlds}
                onClick={() => {
                  update({ worlds: !params.worlds });
                }}
                className="m-choice"
              >
                <span aria-hidden="true" className="m-choice-box" />
                Include other worlds
              </button>
            </div>
            <p className="dv-help">
              The Remake Trilogy also shows another world, where Zack survived. Turn this on to
              follow it as a line of its own.
            </p>
          </div>
        </div>
      )}

      <div className="dv-body">
        <div className="dv-main">
          {!wide && detail}
          {divergence.isPending ? (
            <Loading variant="panel" label="Finding where the tellings part ways…" />
          ) : divergence.isError ? (
            <div className="m-panel dv-stage">
              <ErrorMessage error={divergence.error} onRetry={() => void divergence.refetch()} />
            </div>
          ) : (
            <div aria-busy={divergence.isPlaceholderData}>
              <SplitView
                view={byTelling(divergence.data, (world) => worldName(reference.data, world))}
                reference={reference.data}
                selected={selected}
                onSelect={select}
              />
            </div>
          )}
        </div>
        {wide && (
          <div className="dv-side">
            {detail ?? (
              <div className="ff7-window dv-side-empty">
                <span aria-hidden="true" className="dv-empty-glove">
                  ☞
                </span>
                <p className="m-heading">Choose any moment</p>
                <p className="dv-stage-text">
                  Tap a moment on the left. How each telling tells it opens here, with a way to make
                  it the turning point.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
