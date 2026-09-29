import { DIFFERENCE_CATEGORY_LABELS } from "@ffvii/shared/labels";
import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { DifferenceCategory, DifferenceListItem, TitleCode } from "../api/client";
import { useDifferences, useEntities, useReference } from "../api/queries";
import { Empty, ErrorMessage, Loading } from "../components/QueryState";
import { DifferencesByCategory, TitleSelect } from "../features/compare/parts";
import { compareTitlesParam, parseCompareTitles } from "../features/compare/titles";
import { KIND_LABELS, comparePath, isEntityKind } from "../lib/paths";

const CATEGORIES = Object.keys(DIFFERENCE_CATEGORY_LABELS) as DifferenceCategory[];

function isCategory(value: string | null): value is DifferenceCategory {
  return (CATEGORIES as (string | null)[]).includes(value);
}

/**
 * The COMPARE section (blueprint §20): every documented difference between the chosen titles,
 * and a way into any entity's side-by-side comparison. /compare?titles=og,rebirth&category=…
 */
export function ComparePage() {
  const [search, setSearch] = useSearchParams();
  const titles = parseCompareTitles(search.get("titles"));
  const categoryParam = search.get("category");
  const category = isCategory(categoryParam) ? categoryParam : undefined;
  const magnitude = search.get("magnitude") === "major" ? "major" : undefined;

  const reference = useReference();
  const entities = useEntities();
  const differences = useDifferences({ titles, category, magnitude });
  const navigate = useNavigate();

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

  // Entities worth comparing: shown by at least two titles.
  const comparable = useMemo(
    () => (entities.data?.items ?? []).filter((e) => e.titles.length >= 2),
    [entities.data],
  );

  // Group differences by entity, keeping the API's order (events in story order first).
  const byEntity = useMemo(() => {
    const groups = new Map<
      string,
      { entity: DifferenceListItem["entity"]; items: DifferenceListItem[] }
    >();
    for (const item of differences.data?.items ?? []) {
      const group = groups.get(item.entity.id) ?? { entity: item.entity, items: [] };
      group.items.push(item);
      groups.set(item.entity.id, group);
    }
    return [...groups.values()];
  }, [differences.data]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="label text-mako-300">Version analysis</p>
        <h1 className="font-display text-3xl font-semibold tracking-wide text-steel-100">
          Compare
        </h1>
        <p className="max-w-3xl text-sm text-steel-300">
          Every documented difference between the titles you choose, described neutrally and cited
          on both sides. Open any entity to see its titles side by side.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="panel flex h-fit flex-col gap-5 p-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="compare-entity" className="label">
              Compare an entity
            </label>
            <select
              id="compare-entity"
              value=""
              onChange={(e) => {
                if (e.target.value) void navigate(withTitles(comparePath(e.target.value)));
              }}
              className="rounded border border-night-600 bg-night-900 px-2 py-1.5 text-sm text-steel-100"
            >
              <option value="">Choose…</option>
              {(["event", "character", "location", "organization"] as const).map((kind) => {
                const options = comparable.filter((e) => e.kind === kind);
                return options.length > 0 ? (
                  <optgroup key={kind} label={KIND_LABELS[kind].many}>
                    {options.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null;
              })}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="label">Titles</span>
            <TitleSelect
              titles={titles}
              reference={reference.data}
              onChange={(next: TitleCode[]) => {
                set({ titles: compareTitlesParam(next) });
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="compare-category" className="label">
              Category
            </label>
            <select
              id="compare-category"
              value={category ?? ""}
              onChange={(e) => {
                set({ category: e.target.value || null });
              }}
              className="rounded border border-night-600 bg-night-900 px-2 py-1.5 text-sm text-steel-100"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {DIFFERENCE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-steel-300">
            <input
              type="checkbox"
              checked={magnitude === "major"}
              onChange={(e) => {
                set({ magnitude: e.target.checked ? "major" : null });
              }}
              className="size-4 accent-mako-400"
            />
            Major differences only
          </label>
        </div>

        <section aria-label="Differences" className="flex min-w-0 flex-col gap-6">
          {differences.isPending ? (
            <Loading variant="panel" label="Loading differences…" />
          ) : differences.isError ? (
            <div className="panel p-4">
              <ErrorMessage error={differences.error} onRetry={() => void differences.refetch()} />
            </div>
          ) : byEntity.length === 0 ? (
            <div className="panel">
              <Empty>No documented differences match these filters.</Empty>
            </div>
          ) : (
            byEntity.map(({ entity, items }) => (
              <section
                key={entity.id}
                aria-labelledby={`entity-${entity.id}`}
                className="flex flex-col gap-3"
              >
                <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-night-700 pb-2">
                  <h2
                    id={`entity-${entity.id}`}
                    className="font-display text-xl font-semibold text-steel-100"
                  >
                    {entity.name}
                    <span className="label ml-3">
                      {isEntityKind(entity.kind) ? KIND_LABELS[entity.kind].one : entity.kind}
                    </span>
                  </h2>
                  <Link to={withTitles(comparePath(entity.id))} className="btn">
                    Side by side →
                  </Link>
                </header>
                <DifferencesByCategory differences={items} reference={reference.data} />
              </section>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
