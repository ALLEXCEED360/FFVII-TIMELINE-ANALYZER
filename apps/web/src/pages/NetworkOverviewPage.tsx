import { type CSSProperties, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { TitleCode } from "../api/client";
import { useEntities, useNetworkMetrics, useReference } from "../api/queries";
import { SECTION_ART, pictureFor } from "../art/manifest";
import { Artwork } from "../components/Artwork";
import { useBackdrop } from "../components/Backdrop";
import { ErrorMessage, Loading } from "../components/QueryState";
import { Orb } from "../components/Orb";
import { toggle } from "../features/network/params";
import { KIND_WORDS, MATERIA } from "../lib/kinds";
import { ENTITY_KINDS, type EntityKind, networkPath } from "../lib/paths";
import { TITLE_ORDER, titleShort } from "../lib/reference";
import { TITLE_COLOR } from "../lib/titles";
import "../features/network/network.css";

/** Start a web from someone, or find how two things are linked. /network?titles=og,rebirth */
export function NetworkOverviewPage() {
  useBackdrop(SECTION_ART.network, { strength: 0.5, side: "full" });
  const [search, setSearch] = useSearchParams();
  const titlesParam = search.get("titles")?.split(",") ?? [];
  const chosen = TITLE_ORDER.filter((t) => titlesParam.includes(t));
  const titles = chosen.length > 0 ? chosen : [...TITLE_ORDER];
  const metrics = useNetworkMetrics(titles);
  const reference = useReference();
  const entities = useEntities();
  const navigate = useNavigate();
  const [kind, setKind] = useState<EntityKind>("character");
  const [text, setText] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const titlesQuery = titles.length === TITLE_ORDER.length ? "" : `?titles=${titles.join(",")}`;
  const setTitles = (next: TitleCode[]) => {
    setSearch(next.length === TITLE_ORDER.length ? {} : { titles: next.join(",") }, {
      replace: true,
    });
  };
  const items = useMemo(() => entities.data?.items ?? [], [entities.data]);
  const byName = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name)), [items]);

  // Most linked first, so the story's centre comes first.
  const query = text.trim().toLowerCase();
  const cast = useMemo(() => {
    const links = new Map(metrics.data?.centrality.map((c) => [c.id, c.degree]));
    return items
      .filter((e) => (query ? e.name.toLowerCase().includes(query) : e.kind === kind))
      .map((e) => ({ ...e, links: links.get(e.id) ?? 0 }))
      .sort((a, b) => b.links - a.links || a.name.localeCompare(b.name));
  }, [items, metrics.data, query, kind]);

  return (
    <div className="nw">
      <header>
        <p className="m-label nw-kicker">
          <Orb kind="character" />
          The web of links
        </p>
        <h1 className="m-heading m-title nw-title">Who's linked to whom</h1>
        <p className="m-intro">
          Everyone and everything in the story is linked: who took part in what, where it happened,
          who belongs where, and what led to what. Pick someone to see their web.
        </p>
      </header>

      <div className="m-panel nw-controls nw-controls-row">
        <div className="nw-control">
          <p className="m-label" id="nw-games">
            Games
          </p>
          <div role="group" aria-labelledby="nw-games" className="m-choices">
            {TITLE_ORDER.map((code) => (
              <button
                key={code}
                type="button"
                className="m-choice"
                aria-pressed={titles.includes(code)}
                onClick={() => {
                  setTitles(toggle(titles, code, TITLE_ORDER));
                }}
                style={{ "--c": TITLE_COLOR[code] } as CSSProperties}
              >
                <span aria-hidden="true" className="m-choice-box" />
                {titleShort(reference.data, code)}
              </button>
            ))}
          </div>
        </div>
        <p className="nw-text nw-key-inline">
          {ENTITY_KINDS.map((k) => (
            <span key={k}>
              <Orb kind={k} />
              {KIND_WORDS[k].many}
            </span>
          ))}
        </p>
      </div>

      <div className="nw-start">
        <section aria-labelledby="nw-cast" className="m-panel nw-cast-panel">
          <div className="nw-cast-head">
            <h2 id="nw-cast" className="m-heading nw-section-title">
              Start with someone
            </h2>
            <input
              type="search"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
              }}
              aria-label="Find someone or something"
              placeholder="Find someone or something by name…"
              className="nw-search"
            />
          </div>
          {!query && (
            <div role="group" aria-label="Kinds" className="m-choices">
              {ENTITY_KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => {
                    setKind(k);
                  }}
                  className="m-choice"
                >
                  <Orb kind={k} />
                  {KIND_WORDS[k].many}
                </button>
              ))}
            </div>
          )}
          {entities.isPending ? (
            <Loading />
          ) : entities.isError ? (
            <ErrorMessage error={entities.error} onRetry={() => void entities.refetch()} />
          ) : cast.length === 0 ? (
            <p className="nw-text">Nothing by that name.</p>
          ) : (
            <ul aria-label="Whose web to see" className="nw-cast">
              {cast.map((entity) => {
                const picture = pictureFor(entity.id, entity.kind);
                const materia = (MATERIA as Record<string, { color: string } | undefined>)[
                  entity.kind
                ];
                return (
                  <li key={entity.id}>
                    <Link
                      to={`${networkPath(entity.id)}${titlesQuery}`}
                      className="nw-card"
                      style={{ "--materia": materia?.color ?? "#7fd6ff" } as CSSProperties}
                    >
                      <span aria-hidden="true" className="nw-card-art" data-kind={picture?.kind}>
                        {picture ? (
                          <Artwork entry={picture} decorative />
                        ) : (
                          <Orb kind={entity.kind} size="2.4rem" />
                        )}
                      </span>
                      <span className="nw-card-name">{entity.name}</span>
                      <span className="nw-card-links">
                        {entity.links === 1 ? "1 link" : `${String(entity.links)} links`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {metrics.isError && (
            <ErrorMessage error={metrics.error} onRetry={() => void metrics.refetch()} />
          )}
        </section>

        <section aria-labelledby="nw-how" className="m-panel nw-finder">
          <h2 id="nw-how" className="m-heading nw-section-title">
            How are they linked?
          </h2>
          <p className="nw-text">
            Pick any two — say, Cloud and Sephiroth — to see the chain that links them, one step at
            a time.
          </p>
          <form
            className="nw-finder-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (from && to) {
                const query = new URLSearchParams(titlesQuery.slice(1));
                query.set("to", to);
                void navigate(`${networkPath(from)}?${query.toString()}`);
              }
            }}
          >
            <label className="nw-control">
              <span className="m-label">First</span>
              <select
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                }}
                className="nw-select"
              >
                <option value="">Choose…</option>
                {ENTITY_KINDS.map((k) => (
                  <optgroup key={k} label={KIND_WORDS[k].many}>
                    {byName
                      .filter((e) => e.kind === k)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="nw-control">
              <span className="m-label">Second</span>
              <select
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                }}
                className="nw-select"
              >
                <option value="">Choose…</option>
                {ENTITY_KINDS.map((k) => (
                  <optgroup key={k} label={KIND_WORDS[k].many}>
                    {byName
                      .filter((e) => e.kind === k && e.id !== from)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <button type="submit" className="nw-action nw-action-main" disabled={!from || !to}>
              Show how they're linked
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
