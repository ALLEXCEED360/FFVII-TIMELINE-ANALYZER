import { StationGlyph } from "./DivergenceMap";
import { MARKING_DESCRIPTIONS, MARKING_LABELS, type Marking } from "./layout";

const ORDER: readonly Marking[] = [
  "shared",
  "changed",
  "only_here",
  "not_yet_retold",
  "omitted",
  "not_yet_reached",
  "undocumented",
];

/** What each station shape means (docs/features/divergence.md §4). */
export function MarkingLegend() {
  return (
    <section aria-labelledby="divergence-legend" className="panel flex flex-col gap-2 p-4">
      <h2 id="divergence-legend" className="label">
        Stations
      </h2>
      <dl className="grid gap-x-5 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
        {ORDER.map((marking) => (
          <div key={marking} className="flex gap-2">
            <dt className="flex shrink-0 items-start gap-2 text-steel-100">
              <svg width="26" height="22" aria-hidden="true" className="shrink-0">
                <StationGlyph marking={marking} cx={11} cy={11} color="var(--color-steel-300)" />
              </svg>
              <span className="sr-only">{MARKING_LABELS[marking]}</span>
            </dt>
            <dd className="text-steel-300">
              <span className="font-semibold text-steel-100" aria-hidden="true">
                {MARKING_LABELS[marking]}.
              </span>{" "}
              {MARKING_DESCRIPTIONS[marking]}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
