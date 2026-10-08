import type { ReactNode } from "react";
import type { Appearance, EntityDetail, Reference, TitleCode } from "../../api/client";
import { Link } from "react-router";
import { useEntity } from "../../api/queries";
import { artFor, sceneFor } from "../../art/manifest";
import { Artwork } from "../../components/Artwork";
import { ErrorMessage, Loading } from "../../components/QueryState";
import { comparePath, divergencePath, entityPath } from "../../lib/paths";
import { TITLE_ORDER, describeLocator, notYetReached, titleShort } from "../../lib/reference";
import { TITLE_COLOR } from "../../lib/titles";
import { MAIN_WORLD, tellingOf } from "./story";
import "./timeline.css";

/** The chosen event: what happens, how each game tells it, what changes, who and where. */
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
    <aside aria-label="Event details" className="m-panel tl-detail">
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
  const art = sceneFor(entity.id) ?? artFor(entity.id).main;
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
          How each game tells it
        </h3>
        <ul className="tl-tellings">
          {TITLE_ORDER.map((title) => {
            const a = mainAppearance(entity, title);
            const depiction = a?.depictions.find((d) => d.isPrimary) ?? a?.depictions[0];
            const where = depiction?.locator ?? a?.sources[0];
            return (
              <li
                key={title}
                className="tl-telling"
                style={{ borderLeftColor: a ? TITLE_COLOR[title] : undefined }}
              >
                <p className="tl-telling-head">
                  <span className="m-heading">{titleShort(reference, title)}</span>
                  <span className={a ? "tl-telling-how" : "tl-telling-none"}>
                    {a
                      ? tellingOf({
                          status: a.status,
                          framing:
                            depiction?.framing ?? (a.status === "referenced" ? "mention" : null),
                          world: a.world,
                        })
                      : notYetReached(reference, title, entity.ogSegmentId)
                        ? "Not reached yet"
                        : "Not in this game"}
                  </span>
                </p>
                {a && <p className="tl-detail-text">{a.summary}</p>}
                {a?.certainty === "ambiguous" && (
                  <p className="tl-telling-note">The game leaves this open.</p>
                )}
                {where && (
                  <p className="tl-telling-note">Where: {describeLocator(reference, where)}</p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {entity.differences.length > 0 && (
        <section aria-labelledby="tl-changes" className="tl-detail-section">
          <h3 id="tl-changes" className="m-label">
            What changes between games
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
          Compare the games side by side
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
