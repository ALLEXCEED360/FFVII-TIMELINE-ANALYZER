import { formatYearNumber } from "@ffvii/shared/labels";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { TitleCode } from "../api/client";
import { useDivergencePoints, useEntities, useReference } from "../api/queries";
import { Empty, ErrorMessage, Loading } from "../components/QueryState";
import { TitleSelect } from "../features/compare/parts";
import { compareTitlesParam, parseCompareTitles } from "../features/compare/titles";
import { divergencePath, kindOf } from "../lib/paths";

/**
 * The DIVERGENCE section (blueprint §29): the events where the chosen titles part ways, each a
 * way into the divergence map, plus any event as a starting point.
 */
export function DivergencePage() {
  const [search, setSearch] = useSearchParams();
  const titles = parseCompareTitles(search.get("titles"));
  const points = useDivergencePoints(titles);
  const reference = useReference();
  const entities = useEntities();
  const navigate = useNavigate();

  const param = compareTitlesParam(titles);
  const keep = param === null ? "" : `?titles=${param}`;
  const setTitles = (next: TitleCode[]) => {
    const value = compareTitlesParam(next);
    setSearch(value === null ? {} : { titles: value }, { replace: true });
  };
  const events = (entities.data?.items ?? []).filter((e) => kindOf(e.id) === "event");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="label text-mako-300">Where the stories part ways</p>
        <h1 className="font-display text-3xl font-semibold tracking-wide text-steel-100">
          Divergence
        </h1>
        <p className="max-w-3xl text-sm text-steel-300">
          Pick an event to see the history the titles share up to it, and how each tells it and what
          follows. The points below are where the chosen titles have documented differences.
        </p>
      </header>

      <TitleSelect titles={titles} reference={reference.data} onChange={setTitles} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby="divergence-points" className="flex flex-col gap-3">
          <h2 id="divergence-points" className="label">
            Divergence points
          </h2>
          {points.isPending ? (
            <Loading variant="panel" label="Finding divergence points…" />
          ) : points.isError ? (
            <div className="panel p-4">
              <ErrorMessage error={points.error} onRetry={() => void points.refetch()} />
            </div>
          ) : points.data.items.length === 0 ? (
            <div className="panel">
              <Empty>No documented differences between these titles.</Empty>
            </div>
          ) : (
            <ol
              aria-labelledby="divergence-points"
              className="panel divide-y divide-night-800"
              aria-busy={points.isPlaceholderData}
            >
              {points.data.items.map((point) => (
                <li key={point.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-3">
                  <Link
                    to={`${divergencePath(point.id)}${keep}`}
                    className="font-semibold text-steel-100 hover:text-mako-300"
                  >
                    {point.name}
                  </Link>
                  <span className="label">{formatYearNumber(point.start)}</span>
                  <span className="ml-auto flex gap-1.5">
                    <span className="chip">
                      {point.differences} difference{point.differences === 1 ? "" : "s"}
                    </span>
                    {point.major > 0 && (
                      <span className="chip border-mako-500 text-mako-300">
                        {point.major} major
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="divergence-any" className="panel flex h-fit flex-col gap-3 p-4">
          <h2 id="divergence-any" className="label">
            Start from any event
          </h2>
          <select
            aria-label="Event"
            value=""
            onChange={(e) => {
              if (e.target.value) void navigate(`${divergencePath(e.target.value)}${keep}`);
            }}
            className="rounded border border-night-600 bg-night-900 px-2 py-1.5 text-sm text-steel-100"
          >
            <option value="">Choose an event…</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </section>
      </div>
    </div>
  );
}
