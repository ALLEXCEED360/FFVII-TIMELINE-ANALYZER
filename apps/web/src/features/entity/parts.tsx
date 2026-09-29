import {
  DIFFERENCE_CATEGORY_LABELS,
  FRAMING_LABELS,
  STATUS_DESCRIPTIONS,
  STATUS_LABELS,
} from "@ffvii/shared/labels";
import { Link } from "react-router";
import type { Appearance, Difference, Reference, TitleCode } from "../../api/client";
import { Citation, Citations } from "../../components/Citation";
import { describeLocator, titleShort, worldName } from "../../lib/reference";
import { entityPath } from "../../lib/paths";
import { TITLE_COLOR } from "../../lib/titles";

// Pieces shared by the timeline inspector and the entity pages.

/** How one title presents the entity: status, summary, and where it's shown (with citations). */
export function AppearanceCard({
  appearance,
  reference,
  headingLevel = 4,
  compact = false,
}: {
  appearance: Appearance;
  reference: Reference | undefined;
  headingLevel?: 3 | 4;
  /** Inside a column that already names the title and its status: leave both out. */
  compact?: boolean;
}) {
  const Heading = headingLevel === 3 ? "h3" : "h4";
  // Citations not already given as a depiction's place.
  const shown = new Set(appearance.depictions.map((d) => describeLocator(reference, d.locator)));
  const alsoCited = appearance.sources.filter((s) => !shown.has(describeLocator(reference, s)));
  return (
    <article
      className="rounded border border-night-700 border-l-2 bg-night-950/40 p-3"
      style={{ borderLeftColor: TITLE_COLOR[appearance.title] }}
    >
      <header className="mb-1.5 flex flex-wrap items-center gap-1.5">
        {!compact && (
          <>
            <Heading className="font-display text-sm font-semibold text-steel-100">
              {titleShort(reference, appearance.title)}
            </Heading>
            <span className="chip" title={STATUS_DESCRIPTIONS[appearance.status]}>
              {STATUS_LABELS[appearance.status]}
            </span>
          </>
        )}
        {appearance.world !== "world_main" && (
          <span className="chip border-title-rebirth/60">
            {worldName(reference, appearance.world)}
          </span>
        )}
        {appearance.certainty !== "stated" && (
          <span className="chip">
            {appearance.certainty === "ambiguous" ? "Left open" : "Inferred"}
          </span>
        )}
      </header>
      {appearance.role && <p className="mb-1 text-xs text-mako-300">{appearance.role}</p>}
      <p className="text-sm text-steel-300">{appearance.summary}</p>
      {appearance.depictions.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1" aria-label="Where it's shown">
          {appearance.depictions.map((d, i) => (
            <li key={i} className="flex flex-wrap gap-x-2 text-xs">
              <Citation locator={d.locator} reference={reference} />
              <span className="text-steel-300">{FRAMING_LABELS[d.framing]}</span>
              {d.note && <span className="text-steel-400">— {d.note}</span>}
            </li>
          ))}
        </ul>
      )}
      {alsoCited.length > 0 && (
        <p className="mt-1 text-xs text-steel-400">
          {appearance.depictions.length > 0 ? "Also cited: " : "Cited: "}
          <Citations sources={alsoCited} reference={reference} />
        </p>
      )}
      {appearance.notes && <p className="mt-2 text-xs text-steel-400 italic">{appearance.notes}</p>}
    </article>
  );
}

/** Documented differences, each with the two titles it compares. */
export function DifferenceList({
  differences,
  reference,
}: {
  differences: readonly Difference[];
  reference: Reference | undefined;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {differences.map((d) => (
        <li key={d.id} className="rounded border border-night-700 p-2.5 text-sm">
          <p className="mb-1 flex flex-wrap gap-1.5">
            <span className="chip">
              {titleShort(reference, d.from.title)} → {titleShort(reference, d.to.title)}
            </span>
            <span className="chip">{DIFFERENCE_CATEGORY_LABELS[d.category]}</span>
            {d.magnitude === "major" && (
              <span className="chip border-mako-500 text-mako-300">Major</span>
            )}
            {d.certainty === "ambiguous" && <span className="chip">Left open</span>}
          </p>
          <p className="text-steel-200">{d.summary}</p>
          {d.related.length > 0 && (
            <p className="mt-1 text-xs text-steel-400">
              Involves:{" "}
              {d.related.map((r, i) => (
                <span key={r.id}>
                  {i > 0 && ", "}
                  <Link to={entityPath(r.id)} className="text-steel-200 hover:text-mako-300">
                    {r.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
          {d.notes && <p className="mt-1 text-xs text-steel-400 italic">{d.notes}</p>}
          <p className="mt-1 text-xs text-steel-400">
            Sources: <Citations sources={d.sources} reference={reference} />
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Small diamonds, one per title, e.g. for which titles establish a relationship. */
export function TitleDots({
  titles,
  reference,
  describe,
}: {
  titles: readonly TitleCode[];
  reference: Reference | undefined;
  /** Extra text for a title's tooltip, e.g. its citations. */
  describe?: (title: TitleCode) => string;
}) {
  return (
    <span className="flex gap-1">
      {titles.map((title) => {
        const name = titleShort(reference, title);
        const detail = describe?.(title);
        return (
          <span
            key={title}
            role="img"
            aria-label={name}
            title={detail ? `${name}: ${detail}` : name}
            className="size-2 rotate-45"
            style={{ background: TITLE_COLOR[title] }}
          />
        );
      })}
    </span>
  );
}
