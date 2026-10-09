import { type KeyboardEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { Comparison, Reference } from "../api/client";
import { ApiError } from "../api/client";
import { useComparison, useReference } from "../api/queries";
import { SECTION_ART, artFor, sceneFor } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";
import { Empty, ErrorMessage, Loading } from "../components/QueryState";
import { ChangesByKind, Connections, TellingColumn } from "../features/compare/pieces";
import { KIND_LABELS, comparePath, entityPath, idFromPath, kindOf } from "../lib/paths";
import { TITLE_ORDER } from "../lib/reference";
import { TELLING, TELLINGS, type Telling } from "../lib/tellings";
import { useMediaQuery } from "../lib/useMediaQuery";
import { NotFoundPage } from "./NotFoundPage";
import "../features/compare/compare.css";

/** One thing side by side: the original against the Remake Trilogy. /compare/event/nibelheim-incident */
export function ComparisonPage() {
  const { kind, slug } = useParams();
  const id = idFromPath(kind, slug);
  useBackdrop(sceneFor(id ?? "")?.id ?? SECTION_ART.compare, { strength: 0.55, side: "full" });
  const comparison = useComparison(id, TITLE_ORDER);
  const reference = useReference();
  const navigate = useNavigate();

  // A retired ID is redirected by the API; show the canonical URL for what came back.
  const returnedId = comparison.data?.entity.id;
  useEffect(() => {
    if (returnedId && id && returnedId !== id) {
      void navigate(comparePath(returnedId), { replace: true });
    }
  }, [returnedId, id, navigate]);

  if (id === undefined) return <NotFoundPage />;
  if (comparison.isPending) return <Loading variant="panel" label="Loading the comparison…" />;
  if (comparison.isError) {
    if (comparison.error instanceof ApiError && comparison.error.status === 404) {
      return <NotFoundPage />;
    }
    return (
      <div className="m-panel cmp-group">
        <ErrorMessage error={comparison.error} onRetry={() => void comparison.refetch()} />
      </div>
    );
  }

  return (
    <ComparisonView
      comparison={comparison.data}
      reference={reference.data}
      updating={comparison.isPlaceholderData}
    />
  );
}

function ComparisonView({
  comparison,
  reference,
  updating,
}: {
  comparison: Comparison;
  reference: Reference | undefined;
  updating: boolean;
}) {
  const { entity, columns, differences, relationships } = comparison;
  const kind = kindOf(entity.id) ?? "event";
  const wide = useMediaQuery("(min-width: 768px)");
  const big = differences.filter((d) => d.magnitude === "major").length;

  // A character drawn in both eras: the original's look over its panel, the new look over the
  // trilogy's — how the look changed, beside how the story did.
  const art = artFor(entity.id);
  const figures =
    art.original && art.main?.kind === "cutout"
      ? { original: art.original, main: art.main }
      : undefined;
  const figureFor = (telling: Telling) =>
    figures && (telling === "og" ? figures.original : figures.main);
  const columnsOf = (telling: Telling) =>
    columns.filter((c) => TELLING[telling].titles.includes(c.title));

  return (
    <article className="cmp" aria-busy={updating}>
      {/* Its scene is the page's backdrop (above), so the header is words alone. */}
      <header className="cmp-hero">
        <div>
          <p className="m-label">Compare · {KIND_LABELS[kind].one}</p>
          <h1 className="m-heading m-title">{entity.name}</h1>
          <p className="m-intro">{entity.summary}</p>
          <div className="cmp-hero-links">
            {comparison.isNew && <span className="cmp-tag cmp-big">New in the Remake Trilogy</span>}
            {entity.event && (
              <Link to={`/timeline?event=${entity.id}`} className="m-pill-link">
                See it on the timeline
              </Link>
            )}
            <Link to={entityPath(entity.id)} className="m-pill-link">
              Everything about it
            </Link>
          </div>
        </div>
      </header>

      <section aria-label="Side by side">
        {wide ? (
          <div className="cmp-cols" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            {TELLINGS.map((telling) => (
              <TellingColumn
                key={telling}
                telling={telling}
                columns={columnsOf(telling)}
                reference={reference}
                event={kind === "event"}
                figure={figureFor(telling)}
              />
            ))}
          </div>
        ) : (
          <TellingTabs
            columnsOf={columnsOf}
            reference={reference}
            event={kind === "event"}
            figureFor={figureFor}
          />
        )}
      </section>

      <div className="cmp-after">
        <section aria-labelledby="cmp-changes" className="cmp-after-part">
          <h2 id="cmp-changes" className="m-heading cmp-section">
            What changes{" "}
            <span className="cmp-section-count">
              {differences.length === 0 ? "" : `${String(differences.length)} · ${String(big)} big`}
            </span>
          </h2>
          {differences.length > 0 ? (
            <div className="m-panel cmp-group">
              <ChangesByKind differences={differences} reference={reference} />
            </div>
          ) : (
            <div className="m-panel cmp-group">
              <Empty>No changes recorded between the original and the Remake Trilogy.</Empty>
            </div>
          )}
        </section>

        <section aria-labelledby="cmp-connections" className="cmp-after-part">
          <h2 id="cmp-connections" className="m-heading cmp-section">
            Connections
          </h2>
          {relationships.length > 0 ? (
            <Connections relationships={relationships} />
          ) : (
            <div className="m-panel cmp-group">
              <Empty>No connections recorded.</Empty>
            </div>
          )}
        </section>
      </div>
    </article>
  );
}

/** On narrow screens, one telling at a time. */
function TellingTabs({
  columnsOf,
  reference,
  event,
  figureFor,
}: {
  columnsOf: (telling: Telling) => Comparison["columns"];
  reference: Reference | undefined;
  event: boolean;
  figureFor: (telling: Telling) => ReturnType<typeof artFor>["main"];
}) {
  const [current, setCurrent] = useState<Telling>("og");
  const onKeyDown = (key: KeyboardEvent) => {
    if (key.key === "ArrowRight" || key.key === "ArrowLeft") {
      setCurrent((t) => (t === "og" ? "trilogy" : "og"));
    }
  };

  return (
    <div className="cmp-tabs">
      <div role="tablist" aria-label="Tellings" className="m-choices" onKeyDown={onKeyDown}>
        {TELLINGS.map((telling) => (
          <button
            key={telling}
            type="button"
            role="tab"
            id={`tab-${telling}`}
            aria-selected={telling === current}
            aria-controls="compare-tabpanel"
            tabIndex={telling === current ? 0 : -1}
            className="m-choice"
            onClick={() => {
              setCurrent(telling);
            }}
          >
            {TELLING[telling].short}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="compare-tabpanel" aria-labelledby={`tab-${current}`}>
        <TellingColumn
          telling={current}
          columns={columnsOf(current)}
          reference={reference}
          event={event}
          figure={figureFor(current)}
          labelled={false}
        />
      </div>
    </div>
  );
}
