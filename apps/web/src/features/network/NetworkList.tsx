import { Link } from "react-router";
import type { Reference } from "../../api/client";
import { networkPath } from "../../lib/paths";
import { TitleDots } from "../entity/parts";
import type { MergedNetwork } from "./elements";
import { Orb } from "../../components/Orb";
import { KIND_WORDS, isKind } from "../../lib/kinds";
import { linkHeading } from "./words";

/**
 * The web as text (blueprint §33: the graph is never the only way to the information): each
 * thing in it with its links read from its own end, nearest the centre first.
 */
export function NetworkList({
  network,
  reference,
  selected,
  onSelect,
  search,
}: {
  network: MergedNetwork;
  reference: Reference | undefined;
  selected: string | null;
  onSelect: (id: string) => void;
  /** Query string to keep when linking to another thing's web. */
  search: string;
}) {
  const nodes = [...network.nodes.values()].sort(
    (a, b) => (a.depth ?? 99) - (b.depth ?? 99) || a.name.localeCompare(b.name),
  );
  const edgesOf = (id: string) =>
    [...network.edges.values()].filter((e) => e.source === id || e.target === id);

  return (
    <ol className="nw-rows" aria-label="Everything in the web and its links">
      {nodes.map((node) => (
        <li key={node.id} className={`nw-row ${node.id === selected ? "m-chosen" : ""}`}>
          <div className="nw-row-head">
            <button
              type="button"
              aria-pressed={node.id === selected}
              onClick={() => {
                onSelect(node.id);
              }}
              className="nw-row-name"
            >
              <Orb kind={node.kind} />
              {node.name}
            </button>
            <span className="nw-row-kind">
              {isKind(node.kind) ? KIND_WORDS[node.kind].one : node.kind}
              {node.depth === 0
                ? " · the centre"
                : node.depth === null
                  ? ""
                  : node.depth === 1
                    ? " · linked directly"
                    : ` · ${String(node.depth)} steps away`}
            </span>
            <Link to={`${networkPath(node.id)}${search}`} className="m-pill-link nw-row-centre">
              Put in the centre
            </Link>
          </div>
          <ul className="nw-row-links">
            {edgesOf(node.id).map((edge) => {
              const outgoing = edge.source === node.id;
              const other = network.nodes.get(outgoing ? edge.target : edge.source);
              return (
                <li key={edge.id}>
                  <span className="nw-row-phrase">
                    {linkHeading(edge.type, edge.label, outgoing)}
                  </span>
                  <span>{other?.name}</span>
                  <span className="nw-row-games">
                    <TitleDots titles={edge.titles} reference={reference} />
                  </span>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
