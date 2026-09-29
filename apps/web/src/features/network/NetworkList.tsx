import { Link } from "react-router";
import type { Reference } from "../../api/client";
import { KIND_LABELS, isEntityKind, networkPath } from "../../lib/paths";
import { TitleDots } from "../entity/parts";
import type { MergedNetwork } from "./elements";

/**
 * The graph as text (blueprint §33: the graph is never the only way to the information): each
 * entity with its relationships in the view, nearest first.
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
  /** Query string to keep when linking to another entity's network. */
  search: string;
}) {
  const nodes = [...network.nodes.values()].sort(
    (a, b) => (a.depth ?? 99) - (b.depth ?? 99) || a.name.localeCompare(b.name),
  );
  const edgesOf = (id: string) =>
    [...network.edges.values()].filter((e) => e.source === id || e.target === id);

  return (
    <ol className="panel divide-y divide-night-800" aria-label="Entities and their connections">
      {nodes.map((node) => (
        <li key={node.id} className={`p-3 ${node.id === selected ? "bg-mako-900/30" : ""}`}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <button
              type="button"
              aria-pressed={node.id === selected}
              onClick={() => {
                onSelect(node.id);
              }}
              className="text-left font-medium text-steel-100 hover:text-mako-300"
            >
              {node.name}
            </button>
            <span className="label">
              {isEntityKind(node.kind) ? KIND_LABELS[node.kind].one : node.kind}
              {" · "}
              {node.depth === null
                ? "expanded"
                : node.depth === 0
                  ? "centre"
                  : `${String(node.depth)} step${node.depth > 1 ? "s" : ""}`}
            </span>
            <Link
              to={`${networkPath(node.id)}${search}`}
              className="ml-auto text-xs text-steel-400 hover:text-mako-300"
            >
              Centre here
            </Link>
          </div>
          <ul className="mt-1.5 flex flex-col gap-1 text-sm">
            {edgesOf(node.id).map((edge) => {
              const outgoing = edge.source === node.id;
              const other = network.nodes.get(outgoing ? edge.target : edge.source);
              return (
                <li key={edge.id} className="flex flex-wrap items-baseline gap-x-2 text-steel-300">
                  <span className="text-xs text-steel-400">
                    {outgoing ? edge.label : `${edge.label} ←`}
                  </span>
                  <span>{other?.name}</span>
                  <span className="ml-auto">
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
