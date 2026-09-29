import { Suspense, lazy, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { NetworkEdge, PathResult, Reference, TitleCode } from "../api/client";
import { ApiError } from "../api/client";
import {
  useEntities,
  useNetwork,
  useNetworkExpansions,
  usePath,
  useReference,
} from "../api/queries";
import { ErrorMessage, Loading } from "../components/QueryState";
import { TitleDots } from "../features/entity/parts";
import {
  type MergedNetwork,
  layoutKey,
  mergeNetworks,
  toElements,
} from "../features/network/elements";
import { NetworkList } from "../features/network/NetworkList";
import {
  EDGE_CATEGORY_LABELS,
  EDGE_CATEGORY_ORDER,
  networkSearch,
  toggle,
  useNetworkParams,
} from "../features/network/params";
import { CATEGORY_COLOR, KIND_STYLE } from "../features/network/style";
import {
  KIND_LABELS,
  comparePath,
  entityPath,
  idFromPath,
  isEntityKind,
  networkPath,
} from "../lib/paths";
import { TITLE_ORDER, titleShort } from "../lib/reference";
import { TITLE_COLOR } from "../lib/titles";
import { NotFoundPage } from "./NotFoundPage";

const GraphView = lazy(() => import("../features/network/GraphView"));

/** Adds a path's entities and relationships to the view, so the whole path is always visible. */
function withPath(network: MergedNetwork, path: PathResult | undefined): MergedNetwork {
  if (!path?.found) return network;
  const nodes = new Map(network.nodes);
  const edges = new Map(network.edges);
  for (const node of path.nodes)
    if (!nodes.has(node.id)) nodes.set(node.id, { ...node, depth: null });
  for (const edge of path.edges) edges.set(edge.id, edge);
  return { nodes, edges };
}

/**
 * An entity's relationship network (blueprint §27): /network/character/cloud-strife?depth=2…
 * Click to select (its immediate network lights up), double-click to recentre, expand nodes to
 * grow the view, and find the strongest path to any entity.
 */
export function NetworkPage() {
  const { kind, slug } = useParams();
  const id = idFromPath(kind, slug);
  const { params, update } = useNetworkParams();
  const filter = { titles: params.titles, categories: params.categories };
  const reference = useReference();
  const entities = useEntities();
  const main = useNetwork(id, params.depth, filter);
  const expansions = useNetworkExpansions(params.expand, filter);
  const path = usePath(id, params.to, filter);
  const navigate = useNavigate();

  const network = useMemo(
    () => (main.data ? withPath(mergeNetworks(main.data, expansions), path.data) : null),
    [main.data, expansions, path.data],
  );

  const selected = params.node && network?.nodes.has(params.node) ? params.node : null;
  const elements = useMemo(
    () =>
      network && id
        ? toElements(network, {
            center: id,
            selected,
            titles: params.titles,
            pathNodes: path.data?.nodes.map((n) => n.id),
            pathEdges: path.data?.edges.map((e) => e.id),
          })
        : [],
    [network, id, selected, params.titles, path.data],
  );

  // Recentring keeps the filters but starts a fresh view.
  const filtersOnly = networkSearch({ ...params, expand: [], to: null, node: null }).toString();
  const keep = filtersOnly ? `?${filtersOnly}` : "";
  const recentre = (target: string) => {
    void navigate(`${networkPath(target)}${keep}`);
  };

  if (id === undefined) return <NotFoundPage />;
  if (main.isError && main.error instanceof ApiError && main.error.status === 404) {
    return <NotFoundPage />;
  }

  const centerName = network?.nodes.get(id)?.name ?? "…";
  const selectedNode = selected ? network?.nodes.get(selected) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <nav aria-label="Breadcrumb" className="label">
          <Link to="/network" className="hover:text-mako-300">
            Network
          </Link>
        </nav>
        <h1 className="font-display text-3xl font-semibold tracking-wide text-steel-100">
          {centerName}
        </h1>
        <p className="max-w-3xl text-sm text-steel-300">
          Everything within {params.depth} relationship{params.depth > 1 ? "s" : ""} of {centerName}
          . Click an entity to light up its immediate network, double-click to centre on it, or
          expand it to add its own connections.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_20rem]">
        <aside aria-label="Network settings" className="panel flex h-fit flex-col gap-5 p-4">
          <fieldset>
            <legend className="label mb-2">Depth</legend>
            <div className="grid grid-cols-3 gap-1.5">
              {([1, 2, 3] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  className="btn justify-center"
                  aria-pressed={params.depth === d}
                  onClick={() => {
                    update({ depth: d });
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label mb-2">Titles</legend>
            <div className="flex flex-col gap-1.5">
              {TITLE_ORDER.map((code: TitleCode) => (
                <button
                  key={code}
                  type="button"
                  className="btn justify-start"
                  aria-pressed={params.titles.includes(code)}
                  onClick={() => {
                    update({ titles: toggle(params.titles, code, TITLE_ORDER) });
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
          </fieldset>
          <fieldset>
            <legend className="label mb-2">Relationships</legend>
            <div className="flex flex-col gap-1.5">
              {EDGE_CATEGORY_ORDER.map((category) => (
                <button
                  key={category}
                  type="button"
                  className="btn justify-start"
                  aria-pressed={params.categories.includes(category)}
                  onClick={() => {
                    update({
                      categories: toggle(params.categories, category, EDGE_CATEGORY_ORDER),
                    });
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="h-0.5 w-3"
                    style={{ background: CATEGORY_COLOR[category] }}
                  />
                  {EDGE_CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-2">
            <label htmlFor="path-to" className="label">
              Strongest path to…
            </label>
            <select
              id="path-to"
              value={params.to ?? ""}
              onChange={(e) => {
                update({ to: e.target.value || null });
              }}
              className="rounded border border-night-600 bg-night-900 px-2 py-1.5 text-sm text-steel-100"
            >
              <option value="">No path</option>
              {(entities.data?.items ?? [])
                .filter((e) => e.id !== id)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
            </select>
          </div>
          <Legend />
        </aside>

        <section aria-label="Graph" className="flex min-w-0 flex-col gap-3">
          {main.isPending ? (
            <Loading variant="panel" label="Loading the network…" />
          ) : main.isError ? (
            <div className="panel p-4">
              <ErrorMessage error={main.error} onRetry={() => void main.refetch()} />
            </div>
          ) : (
            <Suspense fallback={<Loading variant="panel" label="Loading the graph…" />}>
              <GraphView
                elements={elements}
                layoutKey={network ? layoutKey(network) : ""}
                onSelect={(node) => {
                  update({ node });
                }}
                onFocus={recentre}
              />
            </Suspense>
          )}
          {params.to && (
            <PathPanel
              path={path.data}
              pending={path.isPending}
              error={path.error}
              reference={reference.data}
              onClear={() => {
                update({ to: null });
              }}
            />
          )}
        </section>

        <aside
          aria-label="Selection"
          className="panel flex h-fit flex-col gap-3 p-4 lg:col-span-2 xl:col-span-1"
        >
          <span className="label">Selected</span>
          {selectedNode ? (
            <>
              <p className="font-display text-lg font-semibold text-steel-100">
                {selectedNode.name}
              </p>
              <p className="label">
                {isEntityKind(selectedNode.kind)
                  ? KIND_LABELS[selectedNode.kind].one
                  : selectedNode.kind}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Link to={entityPath(selectedNode.id)} className="btn">
                  Open page
                </Link>
                <Link to={comparePath(selectedNode.id)} className="btn">
                  Compare
                </Link>
                {selectedNode.id !== id && (
                  <>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        recentre(selectedNode.id);
                      }}
                    >
                      Centre here
                    </button>
                    <button
                      type="button"
                      className="btn"
                      aria-pressed={params.expand.includes(selectedNode.id)}
                      onClick={() => {
                        update({
                          expand: params.expand.includes(selectedNode.id)
                            ? params.expand.filter((e) => e !== selectedNode.id)
                            : [...params.expand, selectedNode.id],
                        });
                      }}
                    >
                      {params.expand.includes(selectedNode.id) ? "Collapse" : "Expand"}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        update({ to: selectedNode.id });
                      }}
                    >
                      Path from {centerName}
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-steel-400">Select an entity in the graph or the list.</p>
          )}
        </aside>
      </div>

      {network && (
        <section aria-labelledby="network-list" className="flex flex-col gap-3">
          <h2 id="network-list" className="label">
            As a list
          </h2>
          <NetworkList
            network={network}
            reference={reference.data}
            selected={selected}
            onSelect={(node) => {
              update({ node });
            }}
            search={keep}
          />
        </section>
      )}
    </div>
  );
}

function PathPanel({
  path,
  pending,
  error,
  reference,
  onClear,
}: {
  path: PathResult | undefined;
  pending: boolean;
  error: unknown;
  reference: Reference | undefined;
  onClear: () => void;
}) {
  return (
    <section aria-label="Path" className="panel flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="label">Strongest path</h2>
        <button type="button" className="btn px-2 py-0.5" onClick={onClear}>
          Clear
        </button>
      </div>
      {error ? (
        <ErrorMessage error={error} />
      ) : pending || !path ? (
        <Loading label="Finding a path…" />
      ) : !path.found ? (
        <p className="text-sm text-steel-400">
          No connection with the current titles and relationships.
        </p>
      ) : (
        <ol className="flex flex-col gap-1.5 text-sm">
          {path.nodes.map((node, i) => {
            const edge: NetworkEdge | undefined = path.edges[i];
            const next = path.nodes[i + 1];
            return (
              <li key={node.id} className="flex flex-col">
                <Link to={entityPath(node.id)} className="text-steel-100 hover:text-mako-300">
                  {node.name}
                </Link>
                {edge && next && (
                  <span className="flex items-center gap-2 pl-3 text-xs text-steel-400">
                    ↓ {edge.source === node.id ? edge.label : `${edge.label} (from ${next.name})`}
                    <TitleDots titles={edge.titles} reference={reference} />
                  </span>
                )}
              </li>
            );
          })}
          <li className="label mt-1">
            {path.edges.length} step{path.edges.length === 1 ? "" : "s"} · strength cost {path.cost}
          </li>
        </ol>
      )}
    </section>
  );
}

function Legend() {
  return (
    <div className="flex flex-col gap-2 text-xs text-steel-400" aria-label="Legend">
      <span className="label">Legend</span>
      <ul className="grid grid-cols-2 gap-1.5">
        {Object.entries(KIND_STYLE).map(([kind, { color }]) => (
          <li key={kind} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`size-2.5 ${kind === "event" ? "rotate-45" : kind === "character" ? "rounded-full" : "rounded-sm"}`}
              style={{ background: color }}
            />
            {isEntityKind(kind) ? KIND_LABELS[kind].many : kind}
          </li>
        ))}
      </ul>
      <p>
        Dashed line: only one of the chosen titles establishes it. Dashed outline: added by
        expanding.
      </p>
    </div>
  );
}
