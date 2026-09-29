import {
  DIFFERENCE_CATEGORY_LABELS,
  STATUS_DESCRIPTIONS,
  STATUS_LABELS,
} from "@ffvii/shared/labels";
import { useId } from "react";
import { Link } from "react-router";
import type {
  ComparedRelationship,
  ComparisonColumn,
  Difference,
  DisplayStatus,
  Reference,
  TitleCode,
} from "../../api/client";
import { entityPath } from "../../lib/paths";
import { TITLE_ORDER, describeLocator, titleShort } from "../../lib/reference";
import { TITLE_COLOR } from "../../lib/titles";
import { AppearanceCard } from "../entity/parts";
import { PRESETS, sameTitles, toggleTitle } from "./titles";

// Pieces of the comparison view (blueprint §24, §48).

/** Presets for the pairs the blueprint names, plus a toggle per title. */
export function TitleSelect({
  titles,
  reference,
  onChange,
}: {
  titles: readonly TitleCode[];
  reference: Reference | undefined;
  onChange: (titles: TitleCode[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label="Presets" className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="btn"
            aria-pressed={sameTitles(titles, preset.titles)}
            onClick={() => {
              onChange([...preset.titles]);
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div role="group" aria-label="Titles to compare" className="flex flex-wrap gap-1.5">
        {TITLE_ORDER.map((code) => {
          const on = titles.includes(code);
          return (
            <button
              key={code}
              type="button"
              className="btn"
              aria-pressed={on}
              disabled={on && titles.length <= 2}
              onClick={() => {
                onChange(toggleTitle(titles, code));
              }}
            >
              <span
                aria-hidden="true"
                className="size-2 rotate-45 border"
                style={{
                  borderColor: TITLE_COLOR[code],
                  background: on ? TITLE_COLOR[code] : "transparent",
                }}
              />
              {titleShort(reference, code)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<DisplayStatus, string> = {
  depicted: "border-mako-500 text-mako-200",
  referenced: "border-steel-400 text-steel-200",
  omitted: "border-ember-500 text-ember-400",
  not_yet_reached: "border-dashed border-title-og text-title-og",
  undocumented: "border-dashed border-night-500 text-steel-400",
  absent: "border-night-600 text-steel-400",
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
  return (
    <span className={`chip ${STATUS_STYLE[status]}`} title={STATUS_DESCRIPTIONS[status]}>
      {STATUS_LABELS[status]}
    </span>
  );
}

/** One title's column: its status, its appearance, and any other worlds it shows. */
export function ColumnView({
  column,
  reference,
}: {
  column: ComparisonColumn;
  reference: Reference | undefined;
}) {
  const { appearance, status } = column;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge status={status} />
        {column.changed && <span className="chip border-mako-500 text-mako-300">Changed</span>}
      </div>
      {appearance ? (
        <AppearanceCard appearance={appearance} reference={reference} compact />
      ) : (
        <p className="rounded border border-dashed border-night-600 p-3 text-sm text-steel-400">
          {STATUS_DESCRIPTIONS[status]}
        </p>
      )}
      {column.otherWorlds.map((other) => (
        <AppearanceCard key={other.world} appearance={other} reference={reference} compact />
      ))}
    </div>
  );
}

/** Documented differences grouped by category, each with its evidence on both sides. */
export function DifferencesByCategory({
  differences,
  reference,
}: {
  differences: readonly Difference[];
  reference: Reference | undefined;
}) {
  const categories = [...new Set(differences.map((d) => d.category))];
  const id = useId();
  return (
    <div className="flex flex-col gap-4">
      {categories.map((category) => (
        <section key={category} aria-labelledby={`${id}-${category}`}>
          <h3
            id={`${id}-${category}`}
            className="mb-2 font-display text-sm font-semibold tracking-wider text-steel-100 uppercase"
          >
            {DIFFERENCE_CATEGORY_LABELS[category]}
          </h3>
          <ul className="flex flex-col gap-2">
            {differences
              .filter((d) => d.category === category)
              .map((d) => (
                <li key={d.id} className="panel p-3 text-sm">
                  <p className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    <TitleChip code={d.from.title} reference={reference} />
                    <span aria-hidden="true" className="text-steel-400">
                      →
                    </span>
                    <span className="sr-only">compared with</span>
                    <TitleChip code={d.to.title} reference={reference} />
                    {d.magnitude === "major" && (
                      <span className="chip border-mako-500 text-mako-300">Major</span>
                    )}
                    {d.certainty === "ambiguous" && <span className="chip">Left open</span>}
                  </p>
                  <p className="text-steel-200">{d.summary}</p>
                  {d.notes && <p className="mt-1 text-xs text-steel-400 italic">{d.notes}</p>}
                  <p className="mt-1.5 font-mono text-[11px] text-steel-400">
                    Sources: {d.sources.map((s) => describeLocator(reference, s)).join("; ")}
                  </p>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function TitleChip({ code, reference }: { code: TitleCode; reference: Reference | undefined }) {
  return (
    <span className="chip text-steel-100" style={{ borderColor: TITLE_COLOR[code] }}>
      {titleShort(reference, code)}
    </span>
  );
}

/**
 * Relationships × titles: which titles establish each connection. Shared connections come first.
 * A dash marks a title that depicts both ends but doesn't establish the connection (a real
 * difference); a dot marks a title that doesn't depict both, and so says nothing about it.
 */
export function RelationshipMatrix({
  relationships,
  columns,
  reference,
}: {
  relationships: readonly ComparedRelationship[];
  columns: readonly ComparisonColumn[];
  reference: Reference | undefined;
}) {
  const ordered = [...relationships].sort((a, b) => Number(b.shared) - Number(a.shared));

  return (
    <div className="panel overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Which titles establish each connection</caption>
        <thead>
          <tr className="border-b border-night-700">
            <th scope="col" className="label p-3 text-left font-normal">
              Connection
            </th>
            {columns.map((c) => (
              <th
                key={c.title}
                scope="col"
                className="label p-3 text-center font-normal"
                style={{ color: TITLE_COLOR[c.title] }}
              >
                {titleShort(reference, c.title)}
              </th>
            ))}
            <th scope="col" className="label p-3 text-left font-normal">
              <span className="sr-only">Shared</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((r) => (
            <tr key={`${r.id}-${r.direction}`} className="border-b border-night-800 last:border-0">
              <th scope="row" className="p-3 text-left font-normal">
                <span className="mr-2 text-xs text-steel-400">{r.label}</span>
                <Link to={entityPath(r.other.id)} className="text-steel-100 hover:text-mako-300">
                  {r.other.name}
                </Link>
              </th>
              {columns.map((c) => {
                const evidence = r.titles.find((t) => t.title === c.title);
                return (
                  <td key={c.title} className="p-3 text-center">
                    {evidence ? (
                      <span
                        title={`${evidence.sources.map((s) => describeLocator(reference, s)).join("; ")}${evidence.notes ? ` — ${evidence.notes}` : ""}`}
                        className={
                          evidence.certainty === "stated" ? "text-mako-300" : "text-title-og"
                        }
                      >
                        {evidence.certainty === "stated" ? "✓" : "?"}
                        <span className="sr-only">
                          {evidence.certainty === "stated"
                            ? "Established"
                            : `Established, ${evidence.certainty}`}
                        </span>
                      </span>
                    ) : r.applicable.includes(c.title) ? (
                      <span className="text-steel-400">
                        —<span className="sr-only">Not established</span>
                      </span>
                    ) : (
                      <span className="text-night-500">
                        ·
                        <span className="sr-only">
                          Not applicable: this title doesn't depict both
                        </span>
                      </span>
                    )}
                  </td>
                );
              })}
              <td className="p-3">
                {r.shared ? (
                  <span className="chip">Shared</span>
                ) : (
                  <span className="chip border-mako-500 text-mako-300">Version-specific</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
