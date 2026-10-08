import { type CSSProperties, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import type { EntityList, TitleCode } from "../api/client";
import { useEntities, useTimeline } from "../api/queries";
import { SECTION_ART, pictureFor } from "../art/manifest";
import { Artwork } from "../components/Artwork";
import { useBackdrop } from "../components/Backdrop";
import { Orb } from "../components/Orb";
import { TellingChoices } from "../components/TellingChoices";
import { ErrorMessage, Loading } from "../components/QueryState";
import { byStoryOrder, whenOf } from "../features/timeline/story";
import { KIND_WORDS, MATERIA, type Kind } from "../lib/kinds";
import { ENTITY_KINDS, entityPath, isEntityKind } from "../lib/paths";
import { TITLE_ORDER } from "../lib/reference";
import {
  TELLING,
  parseTellingChoice,
  setTellingChoice,
  tellingsIn,
  titlesOf,
} from "../lib/tellings";
import "../features/explore/explore.css";

type Entity = EntityList["items"][number];

/** What each kind is, in a few words, under its heading. */
const KIND_GUIDE: Record<Kind, string> = {
  character: "Everyone you'll meet.",
  event: "The story's big moments, in the order they happen.",
  location: "Where it all happens.",
  organization: "Who belongs to what.",
};

const ALL_TITLES = [...TITLE_ORDER];

/** Which tellings have it, each with its colour. */
function Tellings({ titles }: { titles: readonly TitleCode[] }) {
  return (
    <span className="ex-games">
      <span className="sr-only">In </span>
      {tellingsIn(titles).map((t) => (
        <span key={t} className="ex-game" style={{ "--c": TELLING[t].color } as CSSProperties}>
          {TELLING[t].short}
        </span>
      ))}
    </span>
  );
}

/** Everyone and everything as picture cards by kind. /explore?kind=character&in=trilogy&q=… */
export function ExplorePage() {
  useBackdrop(SECTION_ART.explore, { strength: 0.5, side: "full" });
  const [search, setSearch] = useSearchParams();
  const kindParam = search.get("kind") ?? undefined;
  const kind = isEntityKind(kindParam) ? kindParam : undefined;
  const tellings = parseTellingChoice(search);
  const shownTitles = titlesOf(tellings);
  const text = search.get("q") ?? "";

  const entities = useEntities();
  // Moments are shown in story order, and say when they happen.
  const timeline = useTimeline(ALL_TITLES);

  const set = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(search);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearch(next, { replace: key === "q" });
  };

  const all = useMemo(() => entities.data?.items ?? [], [entities.data]);
  const moments = useMemo(() => {
    const events = [...(timeline.data?.items ?? [])].sort(byStoryOrder);
    return new Map(events.map((e, i) => [e.id, { order: i, when: whenOf(e) }]));
  }, [timeline.data]);

  const groups = useMemo(() => {
    const needle = text.trim().toLowerCase();
    const shown = all.filter(
      (e) =>
        (kind === undefined || e.kind === kind) &&
        (tellings === "both" || e.titles.some((t) => shownTitles.includes(t))) &&
        (needle === "" ||
          e.name.toLowerCase().includes(needle) ||
          e.summary.toLowerCase().includes(needle)),
    );
    const order = (e: Entity) => moments.get(e.id)?.order ?? Number.MAX_SAFE_INTEGER;
    return ENTITY_KINDS.map((k) => ({
      kind: k,
      items: shown
        .filter((e) => e.kind === k)
        .sort((a, b) =>
          k === "event"
            ? order(a) - order(b) || a.name.localeCompare(b.name)
            : a.name.localeCompare(b.name),
        ),
    })).filter((g) => g.items.length > 0);
  }, [all, kind, tellings, shownTitles, text, moments]);
  const count = (k?: Kind) => all.filter((e) => k === undefined || e.kind === k).length;
  const filtered = Boolean(kind ?? text) || tellings !== "both";

  return (
    <div className="ex">
      <header>
        <p className="m-label">Explore</p>
        <h1 className="m-heading m-title">Who's who, and what's what</h1>
        <p className="m-intro">
          Everyone you'll meet, every big moment, and every place and group in the story. Tap any
          card to read about it.
        </p>
      </header>

      <div className="m-panel ex-controls">
        <label className="ex-control ex-find">
          <span className="m-label">Search</span>
          <input
            type="search"
            value={text}
            onChange={(e) => {
              set("q", e.target.value || undefined);
            }}
            placeholder="Say, Tifa or Midgar…"
            className="ex-search"
          />
        </label>
        <div className="ex-control">
          <p className="m-label" id="ex-kinds">
            Show
          </p>
          <div role="group" aria-labelledby="ex-kinds" className="m-choices">
            <button
              type="button"
              className="m-choice"
              aria-pressed={kind === undefined}
              onClick={() => {
                set("kind", undefined);
              }}
            >
              Everything <span className="ex-count">{count()}</span>
            </button>
            {ENTITY_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                className="m-choice"
                aria-pressed={kind === k}
                onClick={() => {
                  set("kind", k);
                }}
              >
                <Orb kind={k} />
                {KIND_WORDS[k].many} <span className="ex-count">{count(k)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="ex-control">
          <p aria-hidden="true" className="m-label">
            Told in
          </p>
          <TellingChoices
            label="Told in"
            value={tellings}
            onChange={(next) => {
              setSearch(setTellingChoice(search, next), { replace: true });
            }}
          />
        </div>
      </div>

      {entities.isPending ? (
        <Loading variant="panel" label="Gathering everyone…" />
      ) : entities.isError ? (
        <div className="m-panel ex-empty">
          <ErrorMessage error={entities.error} onRetry={() => void entities.refetch()} />
        </div>
      ) : groups.length === 0 ? (
        <div className="m-panel ex-empty">
          <p className="ex-text">Nothing matches. Try another word, or show everything.</p>
          <button
            type="button"
            className="m-choice"
            onClick={() => {
              setSearch({});
            }}
          >
            Show everything
          </button>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.kind} aria-labelledby={`ex-${group.kind}`} className="ex-group">
            <header className="ex-group-head">
              <h2 id={`ex-${group.kind}`} className="m-heading ex-group-name">
                <Orb kind={group.kind} size="1.1rem" />
                {KIND_WORDS[group.kind].many}
                <span className="ex-count">{group.items.length}</span>
              </h2>
              {!filtered && <p className="ex-text ex-guide">{KIND_GUIDE[group.kind]}</p>}
            </header>
            <ul
              aria-label={KIND_WORDS[group.kind].many}
              className="ex-cards"
              data-kind={group.kind}
            >
              {group.items.map((entity) => {
                const picture = pictureFor(entity.id, entity.kind);
                const when = group.kind === "event" ? moments.get(entity.id)?.when : undefined;
                return (
                  <li key={entity.id}>
                    <Link
                      to={entityPath(entity.id)}
                      className="ex-card"
                      style={{ "--materia": MATERIA[group.kind].color } as CSSProperties}
                    >
                      <span aria-hidden="true" className="ex-card-art" data-kind={picture?.kind}>
                        {picture ? (
                          <Artwork entry={picture} decorative />
                        ) : (
                          <Orb kind={entity.kind} size="3rem" />
                        )}
                      </span>
                      <span className="ex-card-body">
                        {group.kind === "event" && (
                          <span className="ex-card-when">{when ?? "During the story"}</span>
                        )}
                        <span className="ex-card-name">{entity.name}</span>
                        <span className="ex-card-summary">{entity.summary}</span>
                        <span className="ex-card-foot">
                          <Tellings titles={entity.titles} />
                          <span aria-hidden="true" className="ex-card-more">
                            Read more ›
                          </span>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
