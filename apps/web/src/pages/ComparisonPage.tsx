import { type KeyboardEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import type { Comparison, Reference, TitleCode } from "../api/client";
import { ApiError } from "../api/client";
import { useComparison, useReference } from "../api/queries";
import { Empty, ErrorMessage, Loading } from "../components/QueryState";
import {
  ColumnView,
  DifferencesByCategory,
  RelationshipMatrix,
  TitleSelect,
} from "../features/compare/parts";
import { compareTitlesParam, parseCompareTitles } from "../features/compare/titles";
import { comparePath, entityPath, idFromPath, KIND_LABELS, kindOf } from "../lib/paths";
import { titleShort } from "../lib/reference";
import { TITLE_COLOR } from "../lib/titles";
import { useMediaQuery } from "../lib/useMediaQuery";
import { NotFoundPage } from "./NotFoundPage";
import { SECTION_ART, artFor, sceneFor } from "../art/manifest";
import { Artwork } from "../components/Artwork";
import { useBackdrop } from "../components/Backdrop";

/**
 * How the chosen titles present one entity, side by side (blueprint §24, §48):
 * /compare/event/nibelheim-incident?titles=og,rebirth
 */
export function ComparisonPage() {
  const { kind, slug } = useParams();
  const id = idFromPath(kind, slug);
  useBackdrop(sceneFor(id ?? "")?.id ?? SECTION_ART.compare, { strength: 0.45 });
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
      <div className="panel p-4">
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
  const major = differences.filter((d) => d.magnitude === "major").length;
  const specific = relationships.filter((r) => !r.shared).length;

  // A character drawn in both eras: the original's artwork over its column, the new look over
  // the others — how the look changed, beside how the story did.
  const art = artFor(entity.id);
  const figures =
    art.original && art.main?.kind === "cutout"
      ? { original: art.original, main: art.main }
      : undefined;

  return (
    <article className="flex flex-col gap-8" aria-busy={updating}>
      <header className="flex flex-col gap-3">
        <nav aria-label="Breadcrumb" className="label">
          <Link to="/compare" className="hover:text-mako-300">
            Compare
          </Link>{" "}
          / {KIND_LABELS[kind].many}
        </nav>
        <h1 className="page-title">{entity.name}</h1>
        <p className="max-w-3xl text-steel-300">{entity.summary}</p>
        <div className="flex flex-wrap items-center gap-2">
          {comparison.isNew && (
            <span className="chip border-mako-500 text-mako-300">New in the Remake series</span>
          )}
          <Link to={entityPath(entity.id)} className="btn">
            Entity page
          </Link>
          {entity.event && (
            <Link to={`/timeline?event=${entity.id}`} className="btn">
              Show on timeline
            </Link>
          )}
        </div>
        <TitleSelect titles={titles} reference={reference} onChange={onTitles} />
      </header>

      <section aria-label="Side by side" className="flex flex-col gap-3">
        {wide ? (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${String(columns.length)}, minmax(0, 1fr))` }}
          >
            {columns.map((column) => (
              <section
                key={column.title}
                aria-labelledby={`col-${column.title}`}
                className="flex flex-col gap-3"
              >
                <h2
                  id={`col-${column.title}`}
                  className="border-b-2 pb-2 font-display text-lg font-semibold tracking-wider text-steel-100 uppercase"
                  style={{ borderColor: TITLE_COLOR[column.title] }}
                >
                  {titleShort(reference, column.title)}
                </h2>
                {figures && (
                  <div className="halftone flex h-56 items-end justify-center overflow-hidden border-b border-steel-100/10 bg-gradient-to-b from-transparent to-night-900/60">
                    <Artwork
                      entry={column.title === "og" ? figures.original : figures.main}
                      className="max-h-full w-auto object-contain drop-shadow-[0_14px_18px_rgb(0_0_0/0.8)]"
                    />
                  </div>
                )}
                <ColumnView column={column} reference={reference} />
              </section>
            ))}
          </div>
        ) : (
          <ColumnTabs comparison={comparison} reference={reference} />
        )}
      </section>

      <section aria-labelledby="compare-differences" className="flex flex-col gap-3">
        <h2 id="compare-differences" className="section-title">
          Documented differences
          <span className="ml-2 text-steel-300">
            {differences.length} · {major} major
          </span>
        </h2>
        {differences.length > 0 ? (
          <DifferencesByCategory differences={differences} reference={reference} />
        ) : (
          <div className="panel">
            <Empty>No documented differences between these titles.</Empty>
          </div>
        )}
      </section>

      <section aria-labelledby="compare-connections" className="flex flex-col gap-3">
        <h2 id="compare-connections" className="section-title">
          Connections
          <span className="ml-2 text-steel-300">
            {relationships.length - specific} shared · {specific} version-specific
          </span>
        </h2>
        {relationships.length > 0 ? (
          <RelationshipMatrix
            relationships={relationships}
            columns={columns}
            reference={reference}
          />
        ) : (
          <div className="panel">
            <Empty>No connections documented for these titles.</Empty>
          </div>
        )}
      </section>
    </article>
  );
}

/** On narrow screens, one title at a time (blueprint §24). */
function ColumnTabs({
  comparison,
  reference,
}: {
  comparison: Comparison;
  reference: Reference | undefined;
}) {
  const [selected, setSelected] = useState(0);
  const columns = comparison.columns;
  const current = columns[Math.min(selected, columns.length - 1)];

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") setSelected((i) => (i + 1) % columns.length);
    if (event.key === "ArrowLeft") setSelected((i) => (i - 1 + columns.length) % columns.length);
  };

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="Titles" className="flex gap-1" onKeyDown={onKeyDown}>
        {columns.map((column, i) => (
          <button
            key={column.title}
            type="button"
            role="tab"
            id={`tab-${column.title}`}
            aria-selected={column === current}
            aria-controls="compare-tabpanel"
            tabIndex={column === current ? 0 : -1}
            className="btn flex-1 justify-center"
            style={column === current ? { borderColor: TITLE_COLOR[column.title] } : undefined}
            onClick={() => {
              setSelected(i);
            }}
          >
            {titleShort(reference, column.title)}
          </button>
        ))}
      </div>
      {current && (
        <div role="tabpanel" id="compare-tabpanel" aria-labelledby={`tab-${current.title}`}>
          <ColumnView column={current} reference={reference} />
        </div>
      )}
    </div>
  );
}
