import { type CSSProperties, useEffect, useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import type { Appearance, EntityDetail, Reference, Relationship, TitleCode } from "../api/client";
import { ApiError } from "../api/client";
import { useEntity, useReference, useTimeline } from "../api/queries";
import { SECTION_ART, artFor, pictureFor, sceneFor } from "../art/manifest";
import { Artwork } from "../components/Artwork";
import { useBackdrop } from "../components/Backdrop";
import { Citations } from "../components/Citation";
import { Orb } from "../components/Orb";
import { ErrorMessage, Loading } from "../components/QueryState";
import { ChangesByKind, Game, Telling } from "../features/compare/pieces";
import { Picture, Portrait } from "../features/entity/Portrait";
import { linkHeading } from "../features/network/words";
import { byStoryOrder, whenOf } from "../features/timeline/story";
import { KIND_WORDS, MATERIA } from "../lib/kinds";
import {
  ENTITY_KINDS,
  comparePath,
  divergencePath,
  entityPath,
  idFromPath,
  kindOf,
  networkPath,
} from "../lib/paths";
import { TITLE_ORDER, titleShort, worldName } from "../lib/reference";
import { TITLE_COLOR } from "../lib/titles";
import { NotFoundPage } from "./NotFoundPage";
import "../features/compare/compare.css";
import "../features/entity/entity.css";

const MAIN_WORLD = "world_main";

/** A character, moment, place or group in full: /character/cloud-strife, /event/…, … */
export function EntityPage() {
  const { kind, slug } = useParams();
  const id = idFromPath(kind, slug);
  const entity = useEntity(id);
  const reference = useReference();
  const navigate = useNavigate();

  // A retired ID is redirected by the API; show the canonical URL for what came back.
  const canonical = entity.data ? entityPath(entity.data.id) : undefined;
  useEffect(() => {
    if (canonical && id && entity.data?.id !== id) void navigate(canonical, { replace: true });
  }, [canonical, entity.data?.id, id, navigate]);

  if (id === undefined) return <NotFoundPage />;
  if (entity.isPending) return <Loading variant="panel" label="Loading…" />;
  if (entity.isError) {
    if (entity.error instanceof ApiError && entity.error.status === 404) return <NotFoundPage />;
    return (
      <div className="m-panel ent-section">
        <ErrorMessage error={entity.error} onRetry={() => void entity.refetch()} />
      </div>
    );
  }
  if (kindOf(entity.data.id) !== kind) return <Navigate to={entityPath(entity.data.id)} replace />;

  return <EntityView entity={entity.data} reference={reference.data} />;
}

/** What a game does with it, in a word or two. */
function presence(appearance: Appearance | undefined, event: boolean): string {
  if (!appearance) return "Not in this game";
  if (appearance.status === "omitted") return "Left out";
  if (appearance.status === "referenced") return "Only mentioned";
  return event ? "Shown" : "Appears";
}

function EntityView({
  entity,
  reference,
}: {
  entity: EntityDetail;
  reference: Reference | undefined;
}) {
  const kind = kindOf(entity.id) ?? "event";
  const event = entity.event !== null;
  const { main, original } = artFor(entity.id);
  const figure = main?.kind === "cutout" ? main : undefined;
  const picture = figure ? undefined : pictureFor(entity.id, kind);
  // The scene behind; fainter where the same picture is shown at the top, and the section's own
  // where there's none.
  useBackdrop(sceneFor(entity.id)?.id ?? SECTION_ART.explore, {
    strength: picture ? 0.28 : 0.4,
    side: "full",
  });

  // Each game's own telling (the main world's), and any other world's beside it.
  const byGame = TITLE_ORDER.map((title) => {
    const all = entity.appearances.filter((a) => a.title === title);
    return {
      title,
      main: all.find((a) => a.world === MAIN_WORLD) ?? all[0],
      others: all.filter((a) => a.world !== MAIN_WORLD),
    };
  });
  const told = byGame.filter((g) => g.main && g.main.status !== "omitted").length;
  const when = entity.event ? (whenOf(entity.event) ?? "During the story") : null;

  return (
    <article className="ent" style={{ "--materia": MATERIA[kind].color } as CSSProperties}>
      <header className={`ent-hero ${figure || picture ? "ent-hero-art" : ""}`}>
        <div className="ent-hero-text">
          <p className="m-label ent-kicker">
            <Orb kind={kind} />
            {KIND_WORDS[kind].one}
            {entity.event?.importance === 3 && <span className="ent-key">★ Key moment</span>}
          </p>
          <h1 className="m-heading m-title ent-name">{entity.name}</h1>
          {entity.aliases.length > 0 && (
            <p className="ent-aliases">Also called {entity.aliases.join(", ")}</p>
          )}
          {entity.event && (
            <p className="ent-when">
              {when} · {entity.event.arc.name}
            </p>
          )}
          <p className="m-intro ent-summary">{entity.summary}</p>

          <ul aria-label="In the games" className="ent-games">
            {byGame.map(({ title, main: appearance }) => {
              const absent = !appearance || appearance.status === "omitted";
              return (
                <li
                  key={title}
                  className="ent-game"
                  data-absent={absent || undefined}
                  style={{ "--c": TITLE_COLOR[title] } as CSSProperties}
                >
                  <span className="ent-game-name">{titleShort(reference, title)}</span>
                  <span className="ent-game-status">{presence(appearance, event)}</span>
                </li>
              );
            })}
          </ul>

          <nav aria-label="Where next" className="ent-next">
            {told >= 2 && (
              <Link to={comparePath(entity.id)} className="ent-next-link">
                Compare the games side by side
              </Link>
            )}
            {entity.relationships.length > 0 && (
              <Link to={networkPath(entity.id)} className="ent-next-link">
                See the web of links
              </Link>
            )}
            {event && (
              <Link to={divergencePath(entity.id)} className="ent-next-link">
                See where the stories split
              </Link>
            )}
            {event && (
              <Link to={`/timeline?event=${entity.id}`} className="ent-next-link">
                Show on the timeline
              </Link>
            )}
          </nav>
        </div>
        {figure && <Portrait main={figure} original={original} />}
        {picture && <Picture entry={picture} />}
      </header>

      {event && <BeforeAndAfter id={entity.id} />}

      <section aria-labelledby="ent-games" className="ent-section">
        <h2 id="ent-games" className="m-heading ent-heading">
          {event ? "How each game tells it" : "In each game"}
        </h2>
        <div className="ent-tellings">
          {byGame.map(({ title, main: appearance, others }) => (
            <section
              key={title}
              aria-labelledby={`ent-game-${title}`}
              className="m-panel ent-telling"
              data-absent={!appearance || undefined}
              style={{ "--c": TITLE_COLOR[title] } as CSSProperties}
            >
              <header className="ent-telling-head">
                <h3 id={`ent-game-${title}`} className="m-heading ent-telling-name">
                  {titleShort(reference, title)}
                </h3>
                <span className="ent-telling-status">{presence(appearance, event)}</span>
              </header>
              {appearance ? (
                <Telling appearance={appearance} reference={reference} event={event} />
              ) : (
                <p className="ent-text ent-dim">
                  {event
                    ? "This game doesn't tell this part of the story."
                    : `${entity.name} isn't in this game.`}
                </p>
              )}
              {others.map((other) => (
                <div key={other.world} className="ent-other-world">
                  <p className="m-label">In another world: {worldName(reference, other.world)}</p>
                  <Telling appearance={other} reference={reference} event={event} />
                </div>
              ))}
            </section>
          ))}
        </div>
      </section>

      <section aria-labelledby="ent-changes" className="ent-section">
        <h2 id="ent-changes" className="m-heading ent-heading">
          What changes between the games
        </h2>
        {entity.differences.length > 0 ? (
          <div className="m-panel ent-panel">
            <ChangesByKind differences={entity.differences} reference={reference} />
          </div>
        ) : (
          <p className="m-panel ent-panel ent-text">
            No changes between the games are recorded for {entity.name} yet.
          </p>
        )}
      </section>

      <LinkedTo entity={entity} reference={reference} />

      {entity.openQuestions.length > 0 && (
        <section aria-labelledby="ent-questions" className="ent-section">
          <h2 id="ent-questions" className="m-heading ent-heading">
            Still being checked
          </h2>
          <div className="m-panel ent-panel">
            <p className="ent-text ent-dim">
              Parts of this page wait on a closer look at the games. See the{" "}
              <Link to="/archive/research" className="ent-inline-link">
                research log
              </Link>
              .
            </p>
            <ul className="ent-questions">
              {entity.openQuestions.map((q) => (
                <li key={q.id} className="ent-question">
                  <h3 className="ent-question-name">{q.summary}</h3>
                  <p className="ent-text">{q.details}</p>
                  {q.sources.length > 0 && (
                    <p className="cmp-sources">
                      Where to look: <Citations sources={q.sources} reference={reference} />
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}

/** For moments: what happens just before and just after, in the world of the story. */
function BeforeAndAfter({ id }: { id: string }) {
  const timeline = useTimeline(TITLE_ORDER);
  const items = useMemo(
    () => [...(timeline.data?.items ?? [])].sort(byStoryOrder),
    [timeline.data],
  );
  const index = items.findIndex((e) => e.id === id);
  if (index < 0) return null;
  const neighbours = [
    { label: "Just before", event: items[index - 1] },
    { label: "Just after", event: items[index + 1] },
  ];
  if (neighbours.every((n) => n.event === undefined)) return null;
  return (
    <nav aria-label="Before and after" className="ent-around">
      {neighbours.map(({ label, event }) =>
        event ? (
          <Link
            key={label}
            to={entityPath(event.id)}
            className="m-panel ent-around-link"
            data-side={label === "Just before" ? "before" : "after"}
          >
            <span className="m-label">{label}</span>
            <span className="ent-around-name">{event.name}</span>
            <span className="ent-around-when">{whenOf(event) ?? "During the story"}</span>
          </Link>
        ) : (
          <span key={label} aria-hidden="true" />
        ),
      )}
    </nav>
  );
}

/** A link's other end: a person's face, or the orb of its kind. */
function Face({ id, kind }: { id: string; kind: string }) {
  const art = kind === "character" ? pictureFor(id, kind) : undefined;
  return art ? (
    <span aria-hidden="true" className="ent-face">
      <Artwork entry={art} decorative />
    </span>
  ) : (
    <Orb kind={kind} size="1.05rem" />
  );
}

/** Its links, grouped by the other end's kind and read from this end ("Took part in"). */
function LinkedTo({
  entity,
  reference,
}: {
  entity: EntityDetail;
  reference: Reference | undefined;
}) {
  const timeline = useTimeline(TITLE_ORDER);
  const order = useMemo(
    () => new Map([...(timeline.data?.items ?? [])].sort(byStoryOrder).map((e, i) => [e.id, i])),
    [timeline.data],
  );
  const games = new Set(
    entity.appearances.filter((a) => a.status !== "omitted").map((a) => a.title),
  );

  const groups = ENTITY_KINDS.map((kind) => {
    const links = entity.relationships
      .filter((r) => r.other.kind === kind)
      .sort((a, b) =>
        kind === "event"
          ? (order.get(a.other.id) ?? 0) - (order.get(b.other.id) ?? 0)
          : a.other.name.localeCompare(b.other.name),
      );
    const phrases = new Map<string, Relationship[]>();
    for (const r of links) {
      const phrase = linkHeading(r.type, r.label, r.direction === "out");
      phrases.set(phrase, [...(phrases.get(phrase) ?? []), r]);
    }
    return { kind, phrases };
  }).filter((g) => g.phrases.size > 0);

  return (
    <section aria-labelledby="ent-links" className="ent-section">
      <h2 id="ent-links" className="m-heading ent-heading">
        Connections
      </h2>
      {groups.length === 0 ? (
        <p className="m-panel ent-panel ent-text">No links are recorded for {entity.name} yet.</p>
      ) : (
        <div className="ent-links">
          {groups.map(({ kind, phrases }) => (
            <section
              key={kind}
              aria-labelledby={`ent-links-${kind}`}
              className="m-panel ent-links-group"
            >
              <h3 id={`ent-links-${kind}`} className="m-label ent-links-kind">
                <Orb kind={kind} />
                {KIND_WORDS[kind].many}
              </h3>
              <dl className="ent-phrases">
                {[...phrases].map(([phrase, links]) => (
                  <div key={phrase} className="ent-phrase">
                    <dt className="ent-phrase-name">{phrase}</dt>
                    <dd className="ent-chips">
                      {links.map((r) => (
                        <LinkChip
                          key={`${r.id}-${r.direction}`}
                          relationship={r}
                          games={games}
                          reference={reference}
                        />
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function LinkChip({
  relationship: r,
  games,
  reference,
}: {
  relationship: Relationship;
  /** The games that show this page's subject. */
  games: ReadonlySet<TitleCode>;
  reference: Reference | undefined;
}) {
  const role = typeof r.attributes.role === "string" ? r.attributes.role : null;
  const open = r.titles.some((t) => t.certainty !== "stated");
  const only = r.titles.length === 1 && games.size > 1 ? r.titles[0]?.title : undefined;
  return (
    <span className="ent-chip-wrap">
      <Link to={entityPath(r.other.id)} className="ent-chip">
        <Face id={r.other.id} kind={r.other.kind} />
        {r.other.name}
      </Link>
      {role && <span className="ent-chip-note">{role}</span>}
      {only && (
        <span className="ent-chip-note">
          only in <Game code={only} reference={reference} />
        </span>
      )}
      {open && <span className="cmp-tag">Left open</span>}
    </span>
  );
}
