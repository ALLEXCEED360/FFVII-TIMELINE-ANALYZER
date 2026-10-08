import { type CSSProperties, type KeyboardEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import type { Comparison, Reference, TitleCode } from "../api/client";
import { ApiError } from "../api/client";
import { useComparison, useReference } from "../api/queries";
import { SECTION_ART, artFor, sceneFor } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";
import { Empty, ErrorMessage, Loading } from "../components/QueryState";
import { ChangesByKind, Connections, GameColumn, GamePicker } from "../features/compare/pieces";
import { compareTitlesParam, parseCompareTitles } from "../features/compare/titles";
import { KIND_LABELS, comparePath, entityPath, idFromPath, kindOf } from "../lib/paths";
import { titleShort } from "../lib/reference";
import { TITLE_COLOR } from "../lib/titles";
import { useMediaQuery } from "../lib/useMediaQuery";
import { NotFoundPage } from "./NotFoundPage";
import "../features/compare/compare.css";

/** One thing side by side across games. /compare/event/nibelheim-incident?titles=og,rebirth */
export function ComparisonPage() {
  const { kind, slug } = useParams();
  const id = idFromPath(kind, slug);
  useBackdrop(sceneFor(id ?? "")?.id ?? SECTION_ART.compare, { strength: 0.55, side: "full" });
  const [search, setSearch] = useSearchParams();
  const titles = parseCompareTitles(search.get("titles"));
  const comparison = useComparison(id, titles);
  const reference = useReference();
  const navigate = useNavigate();

  const setTitles = (next: TitleCode[]) => {
    const param = compareTitlesParam(next);
    setSearch(param === null ? {} : { titles: param }, { replace: true });
  };

  // A retired ID is redirected by the API; show the canonical URL for what came back.
  const returnedId = comparison.data?.entity.id;
  useEffect(() => {
    if (returnedId && id && returnedId !== id) {
      void navigate(`${comparePath(returnedId)}${window.location.search}`, { replace: true });
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
      titles={titles}
      reference={reference.data}
      onTitles={setTitles}
      updating={comparison.isPlaceholderData}
    />
  );
}

function ComparisonView({
  comparison,
  titles,
  reference,
  onTitles,
  updating,
}: {
  comparison: Comparison;
  titles: TitleCode[];
  reference: Reference | undefined;
  onTitles: (titles: TitleCode[]) => void;
  updating: boolean;
}) {
  const { entity, columns, differences, relationships } = comparison;
  const kind = kindOf(entity.id) ?? "event";
  const wide = useMediaQuery("(min-width: 768px)");
  const big = differences.filter((d) => d.magnitude === "major").length;

  // A character drawn in both eras: the original's look over its panel, the new look over the
  // others — how the look changed, beside how the story did.
  const art = artFor(entity.id);
  const figures =
    art.original && art.main?.kind === "cutout"
      ? { original: art.original, main: art.main }
      : undefined;
  const figureFor = (title: TitleCode) =>
    figures && (title === "og" ? figures.original : figures.main);

  return (
    <article className="cmp" aria-busy={updating}>
      {/* Its scene is the page's backdrop (above), so the header is words alone. */}
      <header className="cmp-hero">
        <div>
          <p className="m-label">Compare · {KIND_LABELS[kind].one}</p>
          <h1 className="m-heading m-title">{entity.name}</h1>
          <p className="m-intro">{entity.summary}</p>
          <div className="cmp-hero-links">
            {comparison.isNew && <span className="cmp-tag cmp-big">New in the Remake series</span>}
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

      <div className="m-panel cmp-controls cmp-controls-row">
        <p className="m-label">Which games</p>
        <GamePicker titles={titles} reference={reference} onChange={onTitles} />
      </div>

      <section aria-label="Side by side">
        {wide ? (
          <div
            className="cmp-cols"
            style={{ gridTemplateColumns: `repeat(${String(columns.length)}, minmax(0, 1fr))` }}
          >
            {columns.map((column) => (
              <GameColumn
                key={column.title}
                column={column}
                reference={reference}
                event={kind === "event"}
                figure={figureFor(column.title)}
              />
            ))}
          </div>
        ) : (
          <GameTabs
            comparison={comparison}
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
              <Empty>No changes recorded between these games.</Empty>
            </div>
          )}
        </section>

        <section aria-labelledby="cmp-connections" className="cmp-after-part">
          <h2 id="cmp-connections" className="m-heading cmp-section">
            Connections
          </h2>
          {relationships.length > 0 ? (
            <Connections relationships={relationships} columns={columns} reference={reference} />
          ) : (
            <div className="m-panel cmp-group">
              <Empty>No connections recorded for these games.</Empty>
            </div>
          )}
        </section>
      </div>
    </article>
  );
}

/** On narrow screens, one game at a time. */
function GameTabs({
  comparison,
  reference,
  event,
  figureFor,
}: {
  comparison: Comparison;
  reference: Reference | undefined;
  event: boolean;
  figureFor: (title: TitleCode) => ReturnType<typeof artFor>["main"];
}) {
  const [selected, setSelected] = useState(0);
  const columns = comparison.columns;
  const current = columns[Math.min(selected, columns.length - 1)];

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") setSelected((i) => (i + 1) % columns.length);
    if (event.key === "ArrowLeft") setSelected((i) => (i - 1 + columns.length) % columns.length);
  };

  return (
    <div className="cmp-tabs">
      <div role="tablist" aria-label="Games" className="m-choices" onKeyDown={onKeyDown}>
        {columns.map((column, i) => (
          <button
            key={column.title}
            type="button"
            role="tab"
            id={`tab-${column.title}`}
            aria-selected={column === current}
            aria-controls="compare-tabpanel"
            tabIndex={column === current ? 0 : -1}
            className="m-choice"
            style={{ "--c": TITLE_COLOR[column.title] } as CSSProperties}
            onClick={() => {
              setSelected(i);
            }}
          >
            <span aria-hidden="true" className="m-choice-box" />
            {titleShort(reference, column.title)}
          </button>
        ))}
      </div>
      {current && (
        <div role="tabpanel" id="compare-tabpanel" aria-labelledby={`tab-${current.title}`}>
          <GameColumn
            column={current}
            reference={reference}
            event={event}
            figure={figureFor(current.title)}
            labelled={false}
          />
        </div>
      )}
    </div>
  );
}
