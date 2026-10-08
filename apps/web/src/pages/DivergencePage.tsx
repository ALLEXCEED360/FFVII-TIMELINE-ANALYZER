import { Link, useSearchParams } from "react-router";
import type { DivergencePoint, TitleCode } from "../api/client";
import { useDivergencePoints, useEntities, useReference } from "../api/queries";
import { SECTION_ART, artFor, sceneFor } from "../art/manifest";
import { Artwork } from "../components/Artwork";
import { useBackdrop } from "../components/Backdrop";
import { Empty, ErrorMessage, Loading } from "../components/QueryState";
import { GamePicker, ThingPicker } from "../features/compare/pieces";
import { compareTitlesParam, parseCompareTitles } from "../features/compare/titles";
import { divergencePath } from "../lib/paths";
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

/** The moments where the games part ways, big turning points first. */
export function DivergencePage() {
  useBackdrop(SECTION_ART.divergence, { strength: 0.6, side: "full" });
  const [search, setSearch] = useSearchParams();
  const titles = parseCompareTitles(search.get("titles"));
  const points = useDivergencePoints(titles);
  const reference = useReference();
  const entities = useEntities();

  const param = compareTitlesParam(titles);
  const keep = param === null ? "" : `?titles=${param}`;
  const setTitles = (next: TitleCode[]) => {
    const value = compareTitlesParam(next);
    setSearch(value === null ? {} : { titles: value }, { replace: true });
  };
  const items = points.data?.items ?? [];
  const turning = items.filter((p) => p.major > 0);

  return (
    <div className="dv">
      <header>
        <h1 className="m-heading m-title">Divergence</h1>
        <p className="m-intro">
          The Remake series doesn&apos;t only retell the original. At some moments its games tell
          things differently, show things the original never did, or hint at another world. Pick a
          moment to follow the story up to it, and see where each game goes from there.
        </p>
      </header>

      <div className="m-panel cmp-controls dv-controls">
        <div className="cmp-control">
          <p className="m-label">Which games</p>
          <GamePicker titles={titles} reference={reference.data} onChange={setTitles} />
        </div>
      </div>

      <div className="dv-landing">
        <div className="dv-main">
          {points.isPending ? (
            <Loading variant="panel" label="Finding where the games part ways…" />
          ) : points.isError ? (
            <div className="m-panel dv-stage">
              <ErrorMessage error={points.error} onRetry={() => void points.refetch()} />
            </div>
          ) : items.length === 0 ? (
            <div className="m-panel dv-stage">
              <Empty>These games don&apos;t part ways anywhere the archive has recorded.</Empty>
            </div>
          ) : (
            <>
              {turning.length > 0 && (
                <section aria-labelledby="dv-turning" className="dv-section">
                  <h2 id="dv-turning" className="m-heading dv-stage-name">
                    The big turning points
                  </h2>
                  <p className="dv-stage-text">
                    Where the games change something that matters. Tap one to follow it.
                  </p>
                  <ul className="dv-cards" aria-busy={points.isPlaceholderData}>
                    {turning.map((point) => {
                      const art = sceneFor(point.id) ?? artFor(point.id).main;
                      return (
                        <li key={point.id}>
                          <Link
                            to={`${divergencePath(point.id)}${keep}`}
                            className="m-panel dv-card"
                          >
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
                    In the order the story happens. Tap any of them to see where the games part ways
                    there.
                  </p>
                </header>
                <ol className="dv-rail dv-rail-shared" aria-busy={points.isPlaceholderData}>
                  {items.map((point) => (
                    <li key={point.id} className="dv-stop">
                      <Link to={`${divergencePath(point.id)}${keep}`} className="dv-moment">
                        <span className="dv-moment-body">
                          <span className="m-heading dv-name">{point.name}</span>
                          <span className="dv-meta">
                            <span className="dv-when">{when(point.start)}</span>
                            <span className="dv-count">{count(point)}</span>
                          </span>
                        </span>
                        <span aria-hidden="true" className="dv-details">
                          Open <span className="dv-details-arrow">›</span>
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
          reference={reference.data}
          kinds={["event"]}
          title="Start from any moment"
          pathFor={(id) => `${divergencePath(id)}${keep}`}
        />
      </div>
    </div>
  );
}
