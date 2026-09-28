import {
  DIFFERENCE_CATEGORY_LABELS,
  FRAMING_LABELS,
  STATUS_DESCRIPTIONS,
  STATUS_LABELS,
  formatYearBounds,
} from "@ffvii/shared/labels";
import type { Appearance, EntityDetail, Reference } from "../../api/client";
import { useEntity } from "../../api/queries";
import { ErrorMessage, Loading } from "../../components/QueryState";
import { describeLocator, titleShort, worldName } from "../../lib/reference";
import { TITLE_COLOR } from "../../lib/titles";

/**
 * The inspector (blueprint §25): the selected event in full, without leaving the timeline —
 * when it happens, how each title shows it, what changes, and who and where is involved.
 */
export function EventInspector({
  id,
  reference,
  onClose,
}: {
  id: string;
  reference: Reference | undefined;
  onClose: () => void;
}) {
  const query = useEntity(id);

  return (
    <aside aria-label="Inspector" className="panel flex flex-col gap-5 p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="label">Inspector</span>
        <button
          type="button"
          className="btn px-2 py-0.5"
          onClick={onClose}
          aria-label="Close inspector"
        >
          ✕
        </button>
      </div>
      {query.isPending ? (
        <Loading label="Loading event…" />
      ) : query.isError ? (
        <ErrorMessage error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <EventDetails entity={query.data} reference={reference} />
      )}
    </aside>
  );
}

function EventDetails({
  entity,
  reference,
}: {
  entity: EntityDetail;
  reference: Reference | undefined;
}) {
  const people = entity.relationships.filter(
    (r) => r.type === "participated_in" && r.direction === "in",
  );
  const places = entity.relationships.filter(
    (r) => r.type === "occurred_at" && r.direction === "out",
  );

  return (
    <>
      <header className="flex flex-col gap-1.5">
        <h2 className="font-display text-xl leading-tight font-semibold text-steel-100">
          {entity.name}
        </h2>
        {entity.event && (
          <p className="label text-mako-300">
            {formatYearBounds(entity.event.start)} · {entity.event.arc.name}
            {entity.event.importance === 3 ? " · Pivotal" : ""}
          </p>
        )}
        <p className="text-sm text-steel-300">{entity.summary}</p>
      </header>

      <section aria-labelledby="inspector-titles" className="flex flex-col gap-3">
        <h3 id="inspector-titles" className="label">
          In each title
        </h3>
        {entity.appearances.map((appearance) => (
          <AppearanceCard
            key={`${appearance.title}-${appearance.world}`}
            appearance={appearance}
            reference={reference}
          />
        ))}
      </section>

      {entity.differences.length > 0 && (
        <section aria-labelledby="inspector-differences" className="flex flex-col gap-2">
          <h3 id="inspector-differences" className="label">
            Differences
          </h3>
          <ul className="flex flex-col gap-2">
            {entity.differences.map((d) => (
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
              </li>
            ))}
          </ul>
        </section>
      )}

      {(people.length > 0 || places.length > 0) && (
        <section aria-labelledby="inspector-links" className="flex flex-col gap-2">
          <h3 id="inspector-links" className="label">
            Who and where
          </h3>
          <ul className="flex flex-col gap-1.5 text-sm">
            {[...places, ...people].map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-steel-100">{r.other.name}</span>
                {typeof r.attributes.role === "string" && (
                  <span className="text-xs text-steel-400">{r.attributes.role}</span>
                )}
                <span className="ml-auto flex gap-1">
                  {r.titles.map((t) => (
                    <span
                      key={t.title}
                      role="img"
                      title={titleShort(reference, t.title)}
                      aria-label={titleShort(reference, t.title)}
                      className="size-2 rotate-45"
                      style={{ background: TITLE_COLOR[t.title] }}
                    />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function AppearanceCard({
  appearance,
  reference,
}: {
  appearance: Appearance;
  reference: Reference | undefined;
}) {
  return (
    <article
      className="rounded border border-night-700 border-l-2 p-3"
      style={{ borderLeftColor: TITLE_COLOR[appearance.title] }}
    >
      <header className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <h4 className="font-display text-sm font-semibold text-steel-100">
          {titleShort(reference, appearance.title)}
        </h4>
        <span className="chip" title={STATUS_DESCRIPTIONS[appearance.status]}>
          {STATUS_LABELS[appearance.status]}
        </span>
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
      <p className="text-sm text-steel-300">{appearance.summary}</p>
      {appearance.depictions.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {appearance.depictions.map((d, i) => (
            <li key={i} className="flex flex-wrap gap-x-2 text-xs">
              <span className="font-mono text-steel-400">
                {describeLocator(reference, d.locator)}
              </span>
              <span className="text-steel-300">{FRAMING_LABELS[d.framing]}</span>
              {d.note && <span className="text-steel-400">— {d.note}</span>}
            </li>
          ))}
        </ul>
      )}
      {appearance.notes && <p className="mt-2 text-xs text-steel-400 italic">{appearance.notes}</p>}
    </article>
  );
}
