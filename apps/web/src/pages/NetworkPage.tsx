import { type CSSProperties, Suspense, lazy, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import type { PathResult, TitleCode } from "../api/client";
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
import { NetworkList } from "../features/network/NetworkList";
import {
  type MergedNetwork,
  layoutKey,
  mergeNetworks,
  toElements,
} from "../features/network/elements";
import {
  EDGE_CATEGORY_ORDER,
  networkSearch,
  toggle,
  useNetworkParams,
} from "../features/network/params";
import { CATEGORY_WORDS } from "../features/network/words";
import { KIND_WORDS, MATERIA, isKind } from "../lib/kinds";
import { ENTITY_KINDS, idFromPath, networkPath } from "../lib/paths";
import { TITLE_ORDER, titleShort } from "../lib/reference";
import { TITLE_COLOR } from "../lib/titles";
import { NotFoundPage } from "./NotFoundPage";
import "../features/network/network.css";

const GraphView = lazy(() => import("../features/network/GraphView"));

const DEPTHS = [
  { value: 1, label: "Direct links" },
  { value: 2, label: "Two steps away" },
  { value: 3, label: "Three steps away" },
] as const;

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
 * Someone's — or something's — web of links (decision 0023), for someone new to the story:
 * /network/character/cloud-strife?depth=2&titles=og,rebirth&categories=event&expand=…&to=…&node=…
 * Every thing is a materia orb in its kind's colour; tap one to read its links in plain words,
 * put it in the centre, add its own links, or ask how it's linked to the centre.
 */
export function NetworkPage() {
  const { kind, slug } = useParams();
  const id = idFromPath(kind, slug);
  useBackdrop(sceneFor(id ?? "")?.id ?? SECTION_ART.network, { strength: 0.5, side: "full" });
  const { params, update } = useNetworkParams();
  const filter = { titles: params.titles, categories: params.categories };
  const reference = useReference();
  const entities = useEntities();
  const centerEntity = useEntity(id);
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
          Everything linked to {centerName}: who and what took part, where things happened, who
          belongs where, and what led to what. Tap anything in the web to read its links.
        </p>
      </header>

      <div className="m-panel nw-controls">
        <div className="nw-control">
          <p className="m-label" id="nw-depth">
            How far
          </p>
          <div role="group" aria-labelledby="nw-depth" className="m-choices">
            {DEPTHS.map((d) => (
              <button
                key={d.value}
                type="button"
                aria-pressed={params.depth === d.value}
                onClick={() => {
                  update({ depth: d.value });
                }}
                className="m-choice"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div className="nw-control">
          <p className="m-label" id="nw-games">
            Games
          </p>
          <div role="group" aria-labelledby="nw-games" className="m-choices">
            {TITLE_ORDER.map((code: TitleCode) => (
              <button
                key={code}
                type="button"
                aria-pressed={params.titles.includes(code)}
                onClick={() => {
                  update({ titles: toggle(params.titles, code, TITLE_ORDER) });
                }}
                className="m-choice"
                style={{ "--c": TITLE_COLOR[code] } as CSSProperties}
              >
                <span aria-hidden="true" className="m-choice-box" />
                {titleShort(reference.data, code)}
              </button>
            ))}
          </div>
        </div>
        <div className="nw-control">
          <p className="m-label" id="nw-kinds">
            Kinds of link
          </p>
          <div role="group" aria-labelledby="nw-kinds" className="m-choices">
            {EDGE_CATEGORY_ORDER.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={params.categories.includes(category)}
                onClick={() => {
                  update({ categories: toggle(params.categories, category, EDGE_CATEGORY_ORDER) });
                }}
                className="m-choice"
              >
                <span
                  aria-hidden="true"
                  className="nw-line"
                  style={{ background: CATEGORY_WORDS[category].color }}
                />
                {CATEGORY_WORDS[category].name}
              </button>
            ))}
          </div>
        </div>
        <label className="nw-control nw-find">
          <span className="m-label">How is {centerName} linked to…</span>
          <select
            value={params.to ?? ""}
            onChange={(e) => {
              update({ to: e.target.value || null });
            }}
            className="nw-select"
          >
            <option value="">Choose someone or something…</option>
            {ENTITY_KINDS.map((k) => (
              <optgroup key={k} label={KIND_WORDS[k].many}>
                {(entities.data?.items ?? [])
                  .filter((e) => e.kind === k && e.id !== id)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

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

      <div className="nw-body">
        <section aria-label="The web" className="nw-main">
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
              />
            </Suspense>
          )}
          <ul aria-label="What the colours mean" className="nw-key">
            {ENTITY_KINDS.map((k) => (
              <li key={k}>
                <Orb kind={k} />
                {KIND_WORDS[k].many}
                <span className="nw-key-note"> ({MATERIA[k].name} materia)</span>
              </li>
            ))}
            {EDGE_CATEGORY_ORDER.map((category) => (
              <li key={category}>
                <span
                  aria-hidden="true"
                  className="nw-line"
                  style={{ background: CATEGORY_WORDS[category].color }}
                />
                {CATEGORY_WORDS[category].name}
              </li>
            ))}
            {params.titles.length > 1 && (
              <li>
                <span aria-hidden="true" className="nw-line nw-line-dashed" />
                Dashed: only one of the chosen games shows that link
              </li>
            )}
          </ul>
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
