import { formatYearBounds } from "@ffvii/shared/labels";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { EntityDetail, Reference } from "../../api/client";
import { useEntity } from "../../api/queries";
import { ErrorMessage, Loading } from "../../components/QueryState";
import { comparePath, divergencePath, entityPath } from "../../lib/paths";
import { describeLocator } from "../../lib/reference";
import { AppearanceCard, DifferenceList, TitleDots } from "../entity/parts";
import { artFor, sceneFor } from "../../art/manifest";
import { Artwork } from "../../components/Artwork";

/**
 * The inspector (blueprint §25): the selected event in full, without leaving the timeline —
 * when it happens, how each title shows it, what changes, and who and where is involved.
 */
export function EventInspector({
  id,
  reference,
  onClose,
  action,
}: {
  id: string;
  reference: Reference | undefined;
  onClose: () => void;
  /** Replaces the Divergence link, e.g. with "Re-root here" on the divergence view. */
  action?: ReactNode;
}) {
  const query = useEntity(id);

  return (
    <aside aria-label="Inspector" className="panel flex flex-col gap-5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="label">Inspector</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <Link to={comparePath(id)} className="btn px-2 py-0.5">
            Compare
          </Link>
          {action ?? (
            <Link to={divergencePath(id)} className="btn px-2 py-0.5">
              Divergence
            </Link>
          )}
          <Link to={entityPath(id)} className="btn px-2 py-0.5">
            Open page
          </Link>
          <button
            type="button"
            className="btn px-2 py-0.5"
            onClick={onClose}
            aria-label="Close inspector"
          >
            ✕
          </button>
        </div>
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

  const art = sceneFor(entity.id) ?? artFor(entity.id).main;

  return (
    <>
      {art && (
        <div
          aria-hidden="true"
          className="halftone relative -mx-4 -mb-2 h-32 overflow-hidden bg-night-950"
        >
          <Artwork
            entry={art}
            decorative
            className={`size-full ${art.kind === "cutout" ? "object-contain object-top" : "object-cover"}`}
          />
          <span className="absolute inset-0 bg-gradient-to-t from-night-900 to-transparent" />
        </div>
      )}
      <header className="flex flex-col gap-1.5">
        <h2 className="font-display text-2xl leading-tight font-bold tracking-wide text-steel-100 uppercase italic">
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
          <DifferenceList differences={entity.differences} reference={reference} />
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
                <Link to={entityPath(r.other.id)} className="text-steel-100 hover:text-mako-300">
                  {r.other.name}
                </Link>
                {typeof r.attributes.role === "string" && (
                  <span className="text-xs text-steel-400">{r.attributes.role}</span>
                )}
                <span className="ml-auto">
                  <TitleDots
                    titles={r.titles.map((t) => t.title)}
                    reference={reference}
                    describe={(title) =>
                      r.titles
                        .find((t) => t.title === title)
                        ?.sources.map((s) => describeLocator(reference, s))
                        .join("; ") ?? ""
                    }
                  />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
