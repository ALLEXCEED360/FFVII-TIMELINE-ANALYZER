import type { ReactNode } from "react";
import type { Appearance, EntityDetail, Reference, TitleCode } from "../../api/client";
import { Link } from "react-router";
import { useEntity } from "../../api/queries";
import { pictureFor } from "../../art/manifest";
import { Artwork } from "../../components/Artwork";
import { ErrorMessage, Loading } from "../../components/QueryState";
import { comparePath, divergencePath, entityPath } from "../../lib/paths";
import { describeLocator, notYetReached, titleShort } from "../../lib/reference";
import { TELLING, TELLINGS } from "../../lib/tellings";
import { MAIN_WORLD, tellingOf } from "./story";
import "./timeline.css";

/** The chosen event: what happens, how each telling tells it, what changes, who and where. */
export function EventWindow({
  id,
  reference,
  onClose,
  action,
}: {
  id: string;
  reference: Reference | undefined;
  onClose: () => void;
  /** Takes the place of "See where the stories split", e.g. on the divergence page itself. */
  action?: ReactNode;
}) {
  const query = useEntity(id);
  return (
    <aside aria-label="Event details" className="ff7-window tl-detail tl-window">
      <button type="button" onClick={onClose} className="tl-close">
        Close
      </button>
      {query.isPending ? (
        <Loading label="Loading the event…" />
      ) : query.isError ? (
        <ErrorMessage error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <EventDetails entity={query.data} reference={reference} action={action} />
      )}
    </aside>
  );
}

/** The appearance that speaks for a game, as the timeline's marks choose it. */
function mainAppearance(entity: EntityDetail, title: TitleCode): Appearance | undefined {
  const all = entity.appearances.filter((a) => a.title === title);
  return all.find((a) => a.world === MAIN_WORLD) ?? all[0];
}

function EventDetails({
  entity,
  reference,
  action,
}: {
  entity: EntityDetail;
  reference: Reference | undefined;
  action?: ReactNode;
}) {
  const art = pictureFor(entity.id, "event");
  const people = entity.relationships.filter(
    (r) => r.type === "participated_in" && r.direction === "in",
  );
  const places = entity.relationships.filter(
    (r) => r.type === "occurred_at" && r.direction === "out",
  );
  const year = entity.event?.start.earliest ?? 0;

  return (
    <div className="tl-detail-body">
      {art && (
        // Full width, at the picture's own proportions; only a very tall one is cropped, around
        // its focus, so it is seen whole rather than as a strip.
        <div aria-hidden="true" className="tl-detail-art" data-kind={art.kind}>
          <Artwork entry={art} decorative eager />
        </div>
      )}

      <header className="tl-detail-head">
        <h2 className="m-heading tl-detail-name">{entity.name}</h2>
        <p className="m-label tl-detail-meta">
          {year < 0
            ? `${Math.abs(year).toLocaleString("en-US")} years before the story`
            : year > 0
              ? `${year.toLocaleString("en-US")} years after the story`
              : entity.event?.arc.name}
          {entity.event?.importance === 3 && <span className="tl-star"> ★ Key moment</span>}
        </p>
        <p className="tl-detail-text">{entity.summary}</p>
      </header>

      <section aria-labelledby="tl-games" className="tl-detail-section">
        <h3 id="tl-games" className="m-label">
          How each telling tells it
        </h3>
        <ul className="tl-tellings">
          {TELLINGS.map((telling) => {
            const told = TELLING[telling].titles
              .map((title) => ({ title, a: mainAppearance(entity, title) }))
              .filter((t) => t.a !== undefined);
            const reached = TELLING[telling].titles.some(
              (title) => !notYetReached(reference, title, entity.ogSegmentId),
            );
            return (
              <li
                key={telling}
                className="tl-telling"
                style={{ borderLeftColor: told.length > 0 ? TELLING[telling].color : undefined }}
              >
                <p className="tl-telling-head">
                  <span className="m-heading">{TELLING[telling].short}</span>
                  {told.length === 0 && (
                    <span className="tl-telling-none">
                      {reached ? "Not in this telling" : "Not reached yet"}
                    </span>
                  )}
                </p>
                {told.map(({ title, a }) => (
                  <Telling
                    key={title}
                    title={title}
                    appearance={a}
                    reference={reference}
                    named={telling === "trilogy"}
                  />
                ))}
              </li>
            );
          })}
        </ul>
      </section>

      {entity.differences.length > 0 && (
        <section aria-labelledby="tl-changes" className="tl-detail-section">
          <h3 id="tl-changes" className="m-label">
            What changes in the Remake Trilogy
          </h3>
          <ul className="tl-changes">
            {entity.differences.map((difference) => (
              <li key={difference.id} className="tl-detail-text">
                {difference.magnitude === "major" && (
                  <span className="tl-big-change">Big change · </span>
                )}
                {difference.summary}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(people.length > 0 || places.length > 0) && (
        <section aria-labelledby="tl-who" className="tl-detail-section">
          <h3 id="tl-who" className="m-label">
            Who and where
          </h3>
          <ul className="tl-who">
            {[...people, ...places].map((r) => (
              <li key={r.id}>
                <Link to={entityPath(r.other.id)} className="m-pill-link">
                  {r.other.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="Learn more" className="tl-more">
        <Link to={comparePath(entity.id)} className="m-row-link">
          Compare side by side
        </Link>
        {action ?? (
          <Link to={divergencePath(entity.id)} className="m-row-link">
            See where the stories split
          </Link>
        )}
        <Link to={entityPath(entity.id)} className="m-row-link">
          Everything about this event
        </Link>
      </nav>
    </div>
  );
}

/** One game's telling of the event: how, its account, and where to see it. */
function Telling({
  title,
  appearance: a,
  reference,
  named,
}: {
  title: TitleCode;
  appearance: Appearance | undefined;
  reference: Reference | undefined;
  /** Name the game (within the Remake Trilogy). */
  named: boolean;
}) {
  if (!a) return null;
  const depiction = a.depictions.find((d) => d.isPrimary) ?? a.depictions[0];
  const where = depiction?.locator ?? a.sources[0];
  return (
    <div className="tl-telling-game">
      <p className="tl-telling-how">
        {named && <span className="tl-telling-title">{titleShort(reference, title)} · </span>}
        {tellingOf({
          status: a.status,
          framing: depiction?.framing ?? (a.status === "referenced" ? "mention" : null),
          world: a.world,
        })}
      </p>
      <p className="tl-detail-text">{a.summary}</p>
      {a.certainty === "ambiguous" && <p className="tl-telling-note">The game leaves this open.</p>}
      {where && <p className="tl-telling-note">Where: {describeLocator(reference, where)}</p>}
    </div>
  );
}
