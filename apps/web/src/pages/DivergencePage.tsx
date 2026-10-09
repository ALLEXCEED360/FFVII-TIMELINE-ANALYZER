import { Link } from "react-router";
import type { DivergencePoint } from "../api/client";
import { useDivergencePoints, useEntities } from "../api/queries";
import { SECTION_ART, artFor, sceneFor } from "../art/manifest";
import { Artwork } from "../components/Artwork";
import { useBackdrop } from "../components/Backdrop";
import { Empty, ErrorMessage, Loading } from "../components/QueryState";
import { ThingPicker } from "../features/compare/pieces";
import { divergencePath } from "../lib/paths";
import { TITLE_ORDER } from "../lib/reference";
import "../features/compare/compare.css";
import "../features/divergence/divergence.css";

function when(start: number): string {
  if (start === 0) return "During the story";
  const n = Math.abs(start).toLocaleString("en-US");
  const about = Math.abs(start) >= 100 ? "About " : "";
  return `${about}${n} years ${start < 0 ? "before" : "after"} the story`;
}

function count(point: DivergencePoint): string {
  const all = `${String(point.differences)} change${point.differences === 1 ? "" : "s"}`;
  return point.major > 0 ? `${all}, ${String(point.major)} big` : all;
}

/** The moments where the original and the Remake Trilogy part ways, big turning points first. */
export function DivergencePage() {
  useBackdrop(SECTION_ART.divergence, { strength: 0.6, side: "full" });
  const points = useDivergencePoints(TITLE_ORDER);
  const entities = useEntities();

  const items = points.data?.items ?? [];
  const turning = items.filter((p) => p.major > 0);

  return (
    <div className="dv">
      <header>
        <h1 className="m-heading m-title">Divergence</h1>
        <p className="m-intro">
          The Remake Trilogy doesn&apos;t only retell the original. At some moments it tells things
          differently, shows things the original never did, or hints at another world. Pick a moment
          to follow the story up to it, and see where each telling goes from there.
        </p>
      </header>

      <div className="dv-landing">
        <div className="dv-main">
          {points.isPending ? (
            <Loading variant="panel" label="Finding where the tellings part ways…" />
          ) : points.isError ? (
            <div className="m-panel dv-stage">
              <ErrorMessage error={points.error} onRetry={() => void points.refetch()} />
            </div>
          ) : items.length === 0 ? (
            <div className="m-panel dv-stage">
              <Empty>They don&apos;t part ways anywhere the archive has recorded.</Empty>
            </div>
          ) : (
            <>
              {turning.length > 0 && (
                <section aria-labelledby="dv-turning" className="dv-section">
                  <h2 id="dv-turning" className="m-heading dv-stage-name">
                    The big turning points
                  </h2>
                  <p className="dv-stage-text">
                    Where the Remake Trilogy changes something that matters. Tap one to follow it.
                  </p>
                  <ul className="dv-cards" aria-busy={points.isPlaceholderData}>
                    {turning.map((point) => {
                      const art = sceneFor(point.id) ?? artFor(point.id).main;
                      return (
                        <li key={point.id}>
                          <Link to={divergencePath(point.id)} className="m-panel dv-card">
                            {art && (
                              <span aria-hidden="true" className="dv-card-art" data-kind={art.kind}>
                                <Artwork entry={art} decorative />
                              </span>
                            )}
                            <span className="dv-card-text">
                              <span className="m-heading dv-card-name">{point.name}</span>
                              <span className="dv-when">{when(point.start)}</span>
                              <span className="dv-card-count">{count(point)}</span>
                              <span aria-hidden="true" className="dv-details">
                                See where they part ways <span className="dv-details-arrow">›</span>
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              <section aria-labelledby="dv-all" className="m-panel dv-stage">
                <header className="dv-stage-head">
                  <h2 id="dv-all" className="m-heading dv-stage-name">
                    Every moment where they differ
                  </h2>
                  <p className="dv-stage-text">
                    In the order the story happens. Tap any of them to see where the tellings part
                    ways there.
                  </p>
                </header>
                <ol className="dv-rail dv-rail-shared" aria-busy={points.isPlaceholderData}>
                  {items.map((point) => (
                    <li key={point.id} className="dv-stop">
                      <span aria-hidden="true" className="ff7-hand dv-glove">
                        ☞
                      </span>
                      <Link to={divergencePath(point.id)} className="dv-moment">
                        <span className="dv-moment-body">
                          <span className="m-heading dv-name">{point.name}</span>
                          <span className="dv-meta">
                            <span className="dv-when">{when(point.start)}</span>
                            <span className="dv-count">{count(point)}</span>
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}
        </div>

        <ThingPicker
          entities={entities.data?.items ?? []}
          kinds={["event"]}
          title="Start from any moment"
          pathFor={divergencePath}
        />
      </div>
    </div>
  );
}
