import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { TitleCode } from "../api/client";
import { useEntities, useNetworkMetrics, useReference } from "../api/queries";
import { ErrorMessage, Loading } from "../components/QueryState";
import { toggle } from "../features/network/params";
import { KIND_LABELS, isEntityKind, networkPath } from "../lib/paths";
import { TITLE_ORDER, titleShort } from "../lib/reference";
import { TITLE_COLOR } from "../lib/titles";
import { SECTION_ART } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";

/**
 * The NETWORK section (blueprint §20, §28): how the dataset is connected — the most directly
 * connected entities, any disconnected groups — and entry points into the graph and path finder.
 */
export function NetworkOverviewPage() {
  useBackdrop(SECTION_ART.network, { strength: 0.45 });
  const [search, setSearch] = useSearchParams();
  const titlesParam = search.get("titles")?.split(",") ?? [];
  const chosen = TITLE_ORDER.filter((t) => titlesParam.includes(t));
  const titles = chosen.length > 0 ? chosen : [...TITLE_ORDER];
  const metrics = useNetworkMetrics(titles);
  const reference = useReference();
  const entities = useEntities();
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const titlesQuery = titles.length === TITLE_ORDER.length ? "" : `?titles=${titles.join(",")}`;
  const setTitles = (next: TitleCode[]) => {
    setSearch(next.length === TITLE_ORDER.length ? {} : { titles: next.join(",") }, {
      replace: true,
    });
  };
  const items = entities.data?.items ?? [];
  const top = metrics.data?.centrality.slice(0, 10) ?? [];
  const maxDegree = Math.max(1, ...top.map((c) => c.degree));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="eyebrow">Relationship graph</p>
        <h1 className="page-title">Network</h1>
        <p className="max-w-3xl text-sm text-steel-300">
          How the dataset's characters, events, places and organizations connect. These are measures
          of the data — how much is recorded and linked — not rankings of the story.
        </p>
      </header>

      <div role="group" aria-label="Titles" className="flex flex-wrap gap-1.5">
        {TITLE_ORDER.map((code) => (
          <button
            key={code}
            type="button"
            className="btn"
            aria-pressed={titles.includes(code)}
            onClick={() => {
              setTitles(toggle(titles, code, TITLE_ORDER));
            }}
          >
            <span
              aria-hidden="true"
              className="size-2 rotate-45"
              style={{ background: TITLE_COLOR[code] }}
            />
            {titleShort(reference.data, code)}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="network-start" className="panel flex flex-col gap-4 p-4">
          <h2 id="network-start" className="section-title">
            Explore the graph
          </h2>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-steel-300">Start from</span>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) void navigate(`${networkPath(e.target.value)}${titlesQuery}`);
              }}
              className="rounded border border-night-600 bg-night-900 px-2 py-1.5 text-sm text-steel-100"
            >
              <option value="">Choose an entity…</option>
              {items.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>

          <form
            className="flex flex-col gap-2 border-t border-night-700 pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (from && to) {
                const query = new URLSearchParams(titlesQuery.slice(1));
                query.set("to", to);
                void navigate(`${networkPath(from)}?${query.toString()}`);
              }
            }}
          >
            <span className="text-sm text-steel-300">
              Find the strongest path between two entities
            </span>
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                aria-label="From"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                }}
                className="rounded border border-night-600 bg-night-900 px-2 py-1.5 text-sm text-steel-100"
              >
                <option value="">From…</option>
                {items.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="To"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                }}
                className="rounded border border-night-600 bg-night-900 px-2 py-1.5 text-sm text-steel-100"
              >
                <option value="">To…</option>
                {items
                  .filter((e) => e.id !== from)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </select>
            </div>
            <button type="submit" className="btn self-start" disabled={!from || !to}>
              Find path
            </button>
          </form>
        </section>

        <section aria-labelledby="network-shape" className="panel flex flex-col gap-3 p-4">
          <h2 id="network-shape" className="section-title">
            Shape of the data
          </h2>
          {metrics.isPending ? (
            <Loading />
          ) : metrics.isError ? (
            <ErrorMessage error={metrics.error} onRetry={() => void metrics.refetch()} />
          ) : (
            <>
              <dl className="grid grid-cols-3 gap-3">
                {[
                  ["Entities", metrics.data.nodeCount],
                  ["Relationships", metrics.data.edgeCount],
                  ["Groups", metrics.data.components.length],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="label">{label}</dt>
                    <dd className="font-display text-2xl font-semibold text-steel-100">{value}</dd>
                  </div>
                ))}
              </dl>
              {metrics.data.components.length > 1 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-steel-300">
                    Not everything connects with these titles. Separate groups:
                  </p>
                  <ol className="flex flex-col gap-1.5 text-sm">
                    {metrics.data.components.map((group, i) => (
                      <li key={group.members[0]?.id ?? i} className="text-steel-300">
                        <span className="label mr-2">{group.size}</span>
                        {group.members.map((m, j) => (
                          <span key={m.id}>
                            {j > 0 && ", "}
                            <Link
                              to={`${networkPath(m.id)}${titlesQuery}`}
                              className="text-steel-100 hover:text-mako-300"
                            >
                              {m.name}
                            </Link>
                          </span>
                        ))}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <section aria-labelledby="network-central" className="flex flex-col gap-3">
        <h2 id="network-central" className="section-title">
          Most directly connected
        </h2>
        {metrics.data && (
          <ol className="panel divide-y divide-night-800">
            {top.map((entry) => (
              <li
                key={entry.id}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_3rem] items-center gap-3 p-3 text-sm"
              >
                <Link
                  to={`${networkPath(entry.id)}${titlesQuery}`}
                  className="truncate text-steel-100 hover:text-mako-300"
                >
                  {entry.name}
                  <span className="label ml-2">
                    {isEntityKind(entry.kind) ? KIND_LABELS[entry.kind].one : entry.kind}
                  </span>
                </Link>
                <span aria-hidden="true" className="h-1.5 rounded bg-night-800">
                  <span
                    className="block h-full rounded bg-mako-500"
                    style={{ width: `${String((entry.degree / maxDegree) * 100)}%` }}
                  />
                </span>
                <span className="text-right font-mono text-xs text-steel-300">
                  {entry.degree}
                  <span className="sr-only"> direct connections</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
