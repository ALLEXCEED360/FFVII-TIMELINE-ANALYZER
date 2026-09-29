import { DIFFERENCE_CATEGORY_LABELS } from "@ffvii/shared/labels";
import type { DivergenceView, Reference } from "../../api/client";
import { titleShort, worldName } from "../../lib/reference";
import { TITLE_COLOR } from "../../lib/titles";
import { MARKING_LABELS } from "./layout";

/**
 * The divergence as text (docs/features/divergence.md §5): the trunk, then each branch's events
 * with their markings. The accessible form of the map, with the same information.
 */
export function DivergenceList({
  view,
  reference,
  selected,
  onSelect,
}: {
  view: DivergenceView;
  reference: Reference | undefined;
  selected: string | null;
  onSelect: (eventId: string) => void;
}) {
  const branchName = (b: DivergenceView["branches"][number]) =>
    b.world === "world_main"
      ? titleShort(reference, b.title)
      : `${titleShort(reference, b.title)} · ${worldName(reference, b.world)}`;

  const eventButton = (id: string, name: string) => (
    <button
      type="button"
      aria-pressed={id === selected}
      onClick={() => {
        onSelect(id);
      }}
      className={`text-left hover:text-mako-300 ${id === selected ? "font-semibold text-mako-200" : "text-steel-100"}`}
    >
      {name}
    </button>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section aria-labelledby="div-trunk" className="panel p-4">
        <h3 id="div-trunk" className="label mb-2">
          Before the pivot — shared history
        </h3>
        {view.trunk.length === 0 ? (
          <p className="text-sm text-steel-400">Nothing earlier in the dataset.</p>
        ) : (
          <ol className="flex flex-col gap-1.5 text-sm">
            {view.trunk.map((row) => (
              <li key={row.event.id} className="flex flex-wrap items-baseline gap-x-2">
                {eventButton(row.event.id, row.event.name)}
                <span className="text-xs text-steel-400">
                  {row.stations.every((s) => s === null || s.marking === "shared")
                    ? "told alike"
                    : "told differently"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {view.branches.map((branch, b) => {
        const rows = view.events.filter((row) => row.stations[b] !== null);
        return (
          <section
            key={branch.key}
            aria-labelledby={`div-${branch.key}`}
            className="panel border-t-2 p-4"
            style={{ borderTopColor: TITLE_COLOR[branch.title] }}
          >
            <h3 id={`div-${branch.key}`} className="label mb-2">
              {branchName(branch)} — from the pivot
            </h3>
            {rows.length === 0 ? (
              <p className="text-sm text-steel-400">Doesn't show the pivot or anything after it.</p>
            ) : (
              <ol className="flex flex-col gap-2 text-sm">
                {rows.map((row) => {
                  const station = row.stations[b];
                  if (!station) return null;
                  return (
                    <li key={row.event.id} className="flex flex-col">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        {eventButton(row.event.id, row.event.name)}
                        <span className="chip">{MARKING_LABELS[station.marking]}</span>
                      </span>
                      {station.differences.length > 0 && (
                        <span className="text-xs text-steel-400">
                          {station.differences
                            .map(
                              (d) =>
                                `${DIFFERENCE_CATEGORY_LABELS[d.category]}${d.magnitude === "major" ? " (major)" : ""}`,
                            )
                            .join(", ")}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}
