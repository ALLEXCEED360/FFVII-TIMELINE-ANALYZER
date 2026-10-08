import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import type { DifferenceCategory, DifferenceListItem, TitleCode } from "../api/client";
import { useDifferences, useEntities, useReference } from "../api/queries";
import { SECTION_ART } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";
import { Empty, ErrorMessage, Loading } from "../components/QueryState";
import { Change, GamePicker, ThingPicker } from "../features/compare/pieces";
import { compareTitlesParam, parseCompareTitles } from "../features/compare/titles";
import { KIND_LABELS, comparePath, isEntityKind } from "../lib/paths";
import { CHANGE_WORDS } from "../lib/plain";
import "../features/compare/compare.css";

const KINDS = Object.keys(CHANGE_WORDS) as DifferenceCategory[];

function isKind(value: string | null): value is DifferenceCategory {
  return (KINDS as (string | null)[]).includes(value);
}

/** What changes between two games, or anything side by side. /compare?titles=og,rebirth&category=… */
export function ComparePage() {
  useBackdrop(SECTION_ART.compare, { strength: 0.55, side: "full" });
  const [search, setSearch] = useSearchParams();
  const titles = parseCompareTitles(search.get("titles"));
  const kindParam = search.get("category");
  const kind = isKind(kindParam) ? kindParam : undefined;
  const big = search.get("magnitude") === "major";

  const reference = useReference();
  const entities = useEntities();
  // Every kind of change is fetched, so each filter can say how many it holds.
  const differences = useDifferences({ titles, magnitude: big ? "major" : undefined });

  const set = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(search);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    setSearch(next, { replace: true });
  };
  const titlesQuery = compareTitlesParam(titles);
  const withTitles = (path: string) => (titlesQuery ? `${path}?titles=${titlesQuery}` : path);

  const all = useMemo(() => differences.data?.items ?? [], [differences.data]);
  const counts = useMemo(() => {
    const byKind = new Map<DifferenceCategory, number>();
    for (const item of all) byKind.set(item.category, (byKind.get(item.category) ?? 0) + 1);
    return byKind;
  }, [all]);

  // Changes grouped by the moment, person or place they belong to, in the API's order.
  const groups = useMemo(() => {
    const byEntity = new Map<
      string,
      { entity: DifferenceListItem["entity"]; items: DifferenceListItem[] }
    >();
    for (const item of all) {
      if (kind && item.category !== kind) continue;
      const group = byEntity.get(item.entity.id) ?? { entity: item.entity, items: [] };
      group.items.push(item);
      byEntity.set(item.entity.id, group);
    }
    return [...byEntity.values()];
  }, [all, kind]);

  const titleName = (code: TitleCode) =>
    reference.data?.titles.find((t) => t.code === code)?.shortName ?? code;

  return (
    <div className="cmp">
      <header>
        <h1 className="m-heading m-title">Compare</h1>
        <p className="m-intro">
          The Remake series retells the original, and not always the same way. Pick the games to
          compare to see what changes between them, or open anything side by side.
        </p>
      </header>

      <div className="cmp-body">
        <div className="m-panel cmp-controls">
          <div className="cmp-control">
            <p className="m-label">Which games</p>
            <GamePicker
              titles={titles}
              reference={reference.data}
              onChange={(next: TitleCode[]) => {
                set({ titles: compareTitlesParam(next) });
              }}
            />
          </div>
          <div className="cmp-control">
            <p className="m-label" id="cmp-kinds">
              What changes
            </p>
            <div role="group" aria-labelledby="cmp-kinds" className="m-choices">
              <button
                type="button"
                aria-pressed={kind === undefined}
                onClick={() => {
                  set({ category: null });
                }}
                className="m-choice"
              >
                Everything <span className="cmp-count">{all.length}</span>
              </button>
              {KINDS.filter((k) => counts.has(k) || k === kind).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => {
                    set({ category: kind === k ? null : k });
                  }}
                  className="m-choice"
                >
                  {CHANGE_WORDS[k]} <span className="cmp-count">{counts.get(k) ?? 0}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="cmp-control">
            <p className="m-label" id="cmp-show">
              Show
            </p>
            <div role="group" aria-labelledby="cmp-show" className="m-choices">
              <button
                type="button"
                aria-pressed={big}
                onClick={() => {
                  set({ magnitude: big ? null : "major" });
                }}
                className="m-choice"
              >
                <span aria-hidden="true" className="m-choice-box" />
                Big changes only
              </button>
            </div>
          </div>
        </div>

        <section aria-label="Changes" className="cmp-main">
          <p className="cmp-summary">
            {differences.isSuccess &&
              `${String(groups.reduce((n, g) => n + g.items.length, 0))} changes between ${titles
                .map(titleName)
                .join(", ")
                .replace(/, ([^,]*)$/, " and $1")}`}
          </p>
          {differences.isPending ? (
            <Loading variant="panel" label="Loading the changes…" />
          ) : differences.isError ? (
            <div className="m-panel cmp-group">
              <ErrorMessage error={differences.error} onRetry={() => void differences.refetch()} />
            </div>
          ) : groups.length === 0 ? (
            <div className="m-panel cmp-group">
              <Empty>No changes recorded between these games for these choices.</Empty>
            </div>
          ) : (
            groups.map(({ entity, items }) => (
              <section
                key={entity.id}
                aria-labelledby={`cmp-${entity.id}`}
                className="m-panel cmp-group"
              >
                <header className="cmp-group-head">
                  <div>
                    <p className="m-label">
                      {isEntityKind(entity.kind) ? KIND_LABELS[entity.kind].one : entity.kind}
                    </p>
                    <h2 id={`cmp-${entity.id}`} className="m-heading cmp-group-name">
                      {entity.name}
                    </h2>
                  </div>
                  <Link to={withTitles(comparePath(entity.id))} className="m-row-link cmp-open">
                    See it side by side
                  </Link>
                </header>
                <ul className="cmp-changes">
                  {items.map((item) => (
                    <Change key={item.id} difference={item} reference={reference.data} />
                  ))}
                </ul>
              </section>
            ))
          )}
        </section>

        <ThingPicker
          entities={entities.data?.items ?? []}
          reference={reference.data}
          pathFor={(id) => withTitles(comparePath(id))}
        />
      </div>
    </div>
  );
}
