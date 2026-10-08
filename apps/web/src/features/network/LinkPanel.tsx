import type { ReactNode } from "react";
import { Link } from "react-router";
import type { PathResult } from "../../api/client";
import { useEntity } from "../../api/queries";
import { pictureFor } from "../../art/manifest";
import { Artwork } from "../../components/Artwork";
import { Orb } from "../../components/Orb";
import { KIND_WORDS, isKind } from "../../lib/kinds";
import { comparePath, entityPath } from "../../lib/paths";
import type { MergedNetwork } from "./elements";
import { linkHeading, linkSentence } from "./words";

/** The chosen thing (or the centre): what it is, its links as phrases, and what to do next. */
export function LinkPanel({
  id,
  center,
  network,
  expanded,
  onSelect,
  onCentre,
  onExpand,
  onPath,
}: {
  id: string;
  center: string;
  network: MergedNetwork;
  expanded: boolean;
  onSelect: (id: string) => void;
  onCentre: (id: string) => void;
  onExpand: (id: string) => void;
  onPath: (id: string) => void;
}) {
  const node = network.nodes.get(id);
  const entity = useEntity(id);
  const centerName = network.nodes.get(center)?.name ?? "the centre";
  if (!node) return null;
  const kind = isKind(node.kind) ? node.kind : "character";
  const art = pictureFor(id, kind);

  // Its links in this web, grouped under how they read from this end.
  const groups = new Map<string, { other: string; name: string; kind: string }[]>();
  for (const edge of network.edges.values()) {
    if (edge.source !== id && edge.target !== id) continue;
    const outgoing = edge.source === id;
    const other = network.nodes.get(outgoing ? edge.target : edge.source);
    if (!other) continue;
    const heading = linkHeading(edge.type, edge.label, outgoing);
    const list = groups.get(heading) ?? [];
    if (!list.some((l) => l.other === other.id)) {
      list.push({ other: other.id, name: other.name, kind: other.kind });
    }
    groups.set(heading, list);
  }

  return (
    <aside aria-label="Chosen in the web" className="m-panel nw-panel">
      {art && (
        <div aria-hidden="true" className="nw-panel-art" data-kind={art.kind}>
          <Artwork entry={art} decorative eager />
        </div>
      )}
      <p className="m-label nw-panel-kind">
        <Orb kind={kind} />
        {KIND_WORDS[kind].one}
        {id === center && " · the centre of this web"}
      </p>
      <h2 className="m-heading nw-panel-name">{node.name}</h2>
      {entity.data?.summary && <p className="nw-text">{entity.data.summary}</p>}

      {id !== center && (
        <div className="nw-actions">
          <button
            type="button"
            className="nw-action"
            onClick={() => {
              onCentre(id);
            }}
          >
            Put {node.name} in the centre
          </button>
          <button
            type="button"
            className="nw-action"
            aria-pressed={expanded}
            onClick={() => {
              onExpand(id);
            }}
          >
            {expanded ? "Hide their own links" : "Show their own links too"}
          </button>
          <button
            type="button"
            className="nw-action"
            onClick={() => {
              onPath(id);
            }}
          >
            How is this linked to {centerName}?
          </button>
        </div>
      )}

      <section aria-labelledby="nw-links" className="nw-panel-section">
        <h3 id="nw-links" className="m-label">
          Links in this web
        </h3>
        {groups.size === 0 ? (
          <p className="nw-text">
            No links shown here. Try “Two steps away”, or more kinds of link.
          </p>
        ) : (
          <dl className="nw-groups">
            {[...groups].map(([heading, items]) => (
              <div key={heading} className="nw-group">
                <dt className="nw-group-name">{heading}</dt>
                <dd className="nw-chips">
                  {items.map((item) => (
                    <button
                      key={item.other}
                      type="button"
                      className="nw-chip"
                      onClick={() => {
                        onSelect(item.other);
                      }}
                    >
                      <Orb kind={item.kind} size="0.7rem" />
                      {item.name}
                    </button>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <nav aria-label="Learn more" className="nw-more">
        <Link to={entityPath(id)} className="m-row-link">
          Everything about {node.name}
        </Link>
        <Link to={comparePath(id)} className="m-row-link">
          Compare side by side
        </Link>
      </nav>
    </aside>
  );
}

/** How two things are linked, step by step, each step a sentence the right way round. */
export function PathChain({
  path,
  pending,
  fromName,
  toName,
  onSelect,
  onClear,
}: {
  path: PathResult | undefined;
  pending: boolean;
  fromName: string;
  toName: string;
  onSelect: (id: string) => void;
  onClear: () => void;
}): ReactNode {
  const name = (id: string) => path?.nodes.find((n) => n.id === id)?.name ?? id;
  return (
    <section aria-labelledby="nw-path" className="m-panel nw-path">
      <header className="nw-path-head">
        <div>
          <p className="m-label">The link</p>
          <h2 id="nw-path" className="m-heading nw-path-name">
            How {fromName} is linked to {toName}
          </h2>
        </div>
        <button type="button" className="nw-action" onClick={onClear}>
          Clear
        </button>
      </header>
      {pending ? (
        <p className="nw-text">Finding the link…</p>
      ) : !path?.found ? (
        <p className="nw-text">
          No link between them with these choices. Try showing both tellings, or more kinds of link.
        </p>
      ) : (
        <>
          <p className="nw-text">
            {path.edges.length === 1
              ? "They're linked directly:"
              : `${String(path.edges.length)} steps, through ${String(path.nodes.length - 2)} in between:`}
          </p>
          <ol className="nw-steps">
            {path.edges.map((edge) => (
              <li key={edge.id} className="nw-step">
                {linkSentence(name(edge.source), edge.label, name(edge.target))}
              </li>
            ))}
          </ol>
          <p className="nw-chain" aria-label="Along the way">
            {path.nodes.map((node, i) => (
              <span key={node.id} className="nw-chain-item">
                {i > 0 && (
                  <span aria-hidden="true" className="nw-chain-arrow">
                    →
                  </span>
                )}
                <button
                  type="button"
                  className="nw-chip"
                  onClick={() => {
                    onSelect(node.id);
                  }}
                >
                  <Orb kind={node.kind} size="0.7rem" />
                  {node.name}
                </button>
              </span>
            ))}
          </p>
        </>
      )}
    </section>
  );
}
