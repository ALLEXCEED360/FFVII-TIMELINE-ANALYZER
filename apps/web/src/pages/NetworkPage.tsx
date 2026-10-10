import { Suspense, lazy, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import type { PathResult } from "../api/client";
import { ApiError } from "../api/client";
import {
  useEntities,
  useEntity,
  useNetwork,
  useNetworkExpansions,
  usePath,
  useReference,
} from "../api/queries";
import { SECTION_ART, sceneFor } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";
import { ErrorMessage, Loading } from "../components/QueryState";
import { Orb } from "../components/Orb";
import { LinkPanel, PathChain } from "../features/network/LinkPanel";
import { NetworkFilters } from "../features/network/NetworkFilters";
import { NetworkList } from "../features/network/NetworkList";
import {
  type MergedNetwork,
  layoutKey,
  mergeNetworks,
  onlyKinds,
  toElements,
} from "../features/network/elements";
import { networkSearch, useNetworkParams } from "../features/network/params";
import { KIND_WORDS, isKind } from "../lib/kinds";
import { idFromPath, networkPath } from "../lib/paths";
import { titlesOf } from "../lib/tellings";
import { useMediaQuery } from "../lib/useMediaQuery";
import { NotFoundPage } from "./NotFoundPage";
import "../features/network/network.css";

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

/** One thing's web of links. /network/character/cloud-strife?depth=2&titles=…&expand=…&to=…&node=… */
export function NetworkPage() {
  const { kind, slug } = useParams();
  const id = idFromPath(kind, slug);
  useBackdrop(sceneFor(id ?? "")?.id ?? SECTION_ART.network, { strength: 0.5, side: "full" });
  const { params, update } = useNetworkParams();
  const titles = useMemo(() => titlesOf(params.tellings), [params.tellings]);
  const filter = { titles, categories: params.categories };
  const reference = useReference();
  const entities = useEntities();
  const centerEntity = useEntity(id);
  const main = useNetwork(id, params.depth, filter);
  const expansions = useNetworkExpansions(params.expand, filter);
  const path = usePath(id, params.to, filter);
  const navigate = useNavigate();

  const wide = useMediaQuery("(min-width: 64rem)");

  // The kinds of thing chosen; the centre and a path being followed always show.
  const network = useMemo(() => {
    if (!main.data || !id) return null;
    const all = withPath(mergeNetworks(main.data, expansions), path.data);
    const keep = new Set([id, ...(path.data?.nodes.map((n) => n.id) ?? [])]);
    return onlyKinds(all, params.kinds, keep);
  }, [main.data, expansions, path.data, params.kinds, id]);

  const selected = params.node && network?.nodes.has(params.node) ? params.node : null;
  const elements = useMemo(
    () =>
      network && id
        ? toElements(network, {
            center: id,
            selected,
            titles,
            pathNodes: path.data?.nodes.map((n) => n.id),
            pathEdges: path.data?.edges.map((e) => e.id),
          })
        : [],
    [network, id, selected, titles, path.data],
  );

  // Putting something else in the centre keeps the choices but starts a fresh web.
  const filtersOnly = networkSearch({ ...params, expand: [], to: null, node: null }).toString();
  const keep = filtersOnly ? `?${filtersOnly}` : "";
  const recentre = (target: string) => {
    void navigate(`${networkPath(target)}${keep}`);
  };

  if (id === undefined) return <NotFoundPage />;
  if (main.isError && main.error instanceof ApiError && main.error.status === 404) {
    return <NotFoundPage />;
  }

  const centerNode = network?.nodes.get(id);
  const centerName = centerNode?.name ?? centerEntity.data?.name ?? "…";
  const centerKind = isKind(kind ?? "") ? (kind as keyof typeof KIND_WORDS) : "character";
  const toName = params.to
    ? (network?.nodes.get(params.to)?.name ??
      entities.data?.items.find((e) => e.id === params.to)?.name ??
      "…")
    : "";

  return (
    <div className="nw">
      <header>
        <p className="m-label nw-kicker">
          <Orb kind={centerKind} />
          The web of links · {KIND_WORDS[centerKind].one}
        </p>
        <h1 className="m-heading m-title nw-title">{centerName}</h1>
        {centerEntity.data && <p className="m-intro">{centerEntity.data.summary}</p>}
        <p className="m-intro nw-guide">
          Everything linked to {centerName}. Tap anything in the web to read its links, and use the
          window beside it to choose what the web shows.
        </p>
      </header>

      <div className="nw-body">
        <NetworkFilters
          params={params}
          update={update}
          centreId={id}
          centreName={centerName}
          entities={entities.data?.items ?? []}
          folded={!wide}
        />

        <section aria-label="The web" className="nw-main">
          {params.to && (
            <PathChain
              path={path.data}
              pending={path.isPending}
              fromName={centerName}
              toName={toName}
              onSelect={(node) => {
                update({ node });
              }}
              onClear={() => {
                update({ to: null });
              }}
            />
          )}
          {network && (
            <p className="nw-count">
              Showing {network.nodes.size} {network.nodes.size === 1 ? "thing" : "things"} and{" "}
              {network.edges.size} {network.edges.size === 1 ? "link" : "links"}
              {network.nodes.size === 1 && " — try looking further, or showing more"}
              {params.depth > 1 &&
                network.nodes.size > 1 &&
                ". The small dots further out are further away: point at one to see its name"}
            </p>
          )}
          {main.isPending ? (
            <Loading variant="panel" label="Drawing the web…" />
          ) : main.isError ? (
            <div className="m-panel nw-panel">
              <ErrorMessage error={main.error} onRetry={() => void main.refetch()} />
            </div>
          ) : (
            <Suspense fallback={<Loading variant="panel" label="Drawing the web…" />}>
              <GraphView
                elements={elements}
                layoutKey={network ? layoutKey(network) : ""}
                onSelect={(node) => {
                  update({ node });
                }}
                onFocus={recentre}
                dashed={params.tellings === "both"}
              />
            </Suspense>
          )}
        </section>

        {network && (
          <LinkPanel
            key={selected ?? id}
            id={selected ?? id}
            center={id}
            network={network}
            expanded={params.expand.includes(selected ?? "")}
            onSelect={(node) => {
              update({ node });
            }}
            onCentre={recentre}
            onExpand={(node) => {
              update({
                expand: params.expand.includes(node)
                  ? params.expand.filter((e) => e !== node)
                  : [...params.expand, node],
              });
            }}
            onPath={(node) => {
              update({ to: node });
            }}
          />
        )}
      </div>

      {network && (
        <details className="m-panel nw-list">
          <summary className="nw-list-summary">
            <span className="m-heading">Every link as a list</span>
            <span className="nw-text"> — the same web, written out</span>
          </summary>
          <NetworkList
            network={network}
            reference={reference.data}
            selected={selected}
            onSelect={(node) => {
              update({ node });
            }}
            search={keep}
          />
        </details>
      )}
    </div>
  );
}
