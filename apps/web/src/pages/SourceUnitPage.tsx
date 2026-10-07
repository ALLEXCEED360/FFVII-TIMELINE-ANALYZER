import type { CSSProperties } from "react";
import { Link, useParams } from "react-router";
import type { Reference, SourceUnitDetail, TitleCode } from "../api/client";
import { ApiError } from "../api/client";
import { useReference, useResearch, useSourceUnit } from "../api/queries";
import { SECTION_ART, TITLE_ART, pictureFor } from "../art/manifest";
import { Artwork } from "../components/Artwork";
import { useBackdrop } from "../components/Backdrop";
import { Orb } from "../components/Orb";
import { ErrorMessage, Loading } from "../components/QueryState";
import { OpenQuestionList } from "../features/archive/OpenQuestions";
import { arcOf, retoldBy, unitContext, unitLabel } from "../features/archive/units";
import { KIND_WORDS } from "../lib/kinds";
import {
  ENTITY_KINDS,
  archiveTitlePath,
  entityPath,
  sourcePath,
  unitFromPath,
  unitPath,
} from "../lib/paths";
import { CHANGE_WORDS, tellingOf } from "../lib/plain";
import { titleShort, worldName } from "../lib/reference";
import { TITLE_COLOR } from "../lib/titles";
import { NotFoundPage } from "./NotFoundPage";
import "../features/archive/archive.css";

const gameStyle = (code: TitleCode) => ({ "--c": TITLE_COLOR[code] }) as CSSProperties;

/**
 * One chapter of a game — or one part of the original — (decision 0026): /archive/remake/
 * chapter-8, /archive/og/kalm. Who and what it shows, what changes there, the links it shows, and
 * the other worlds glimpsed in it.
 */
export function SourceUnitPage() {
  const params = useParams();
  const unit = unitFromPath(params.title, params.unit);
  useBackdrop(unit ? TITLE_ART[unit.title] : SECTION_ART.archive, {
    strength: 0.4,
    side: "full",
  });
  const query = useSourceUnit(unit?.title, unit?.key);
  const reference = useReference();

  if (unit === undefined) return <NotFoundPage />;
  if (query.isPending) return <Loading variant="panel" label="Opening the chapter…" />;
  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage />;
    return (
      <div className="m-panel ar-panel">
        <ErrorMessage error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );
  }
  return <UnitView detail={query.data} reference={reference.data} />;
}

/** A person's face, or the orb of a thing's kind. */
function Face({ id, kind }: { id: string; kind: string }) {
  const art = kind === "character" ? pictureFor(id, kind) : undefined;
  return art ? (
    <span aria-hidden="true" className="ar-face">
      <Artwork entry={art} decorative />
    </span>
  ) : (
    <Orb kind={kind} size="1.4rem" />
  );
}

function Scenes({ scenes }: { scenes: readonly string[] }) {
  if (scenes.length === 0) return null;
  return <p className="ar-small">In the scene: {scenes.join("; ")}</p>;
}

function UnitView({
  detail,
  reference,
}: {
  detail: SourceUnitDetail;
  reference: Reference | undefined;
}) {
  const { title, unit, appearances, differences, relationships, worlds } = detail;
  const research = useResearch();
  const arc = arcOf(reference, title, unit.key);
  const retold = title === "og" ? retoldBy(reference, unit.key) : [];
  const label = unitLabel(unit.key, unit.name);
  const questions = (research.data?.questions ?? []).filter((q) =>
    q.sources.some((s) => sourcePath(s) === unitPath(title, unit.key)),
  );
  const empty =
    appearances.length + differences.length + relationships.length + worlds.length === 0;

  return (
    <article className="ar" style={gameStyle(title)}>
      <header>
        <nav aria-label="Breadcrumb">
          <ol className="ar-crumbs">
            <li>
              <Link to="/archive">Archive</Link>
            </li>
            <li>
              <Link to={archiveTitlePath(title)}>{titleShort(reference, title)}</Link>
            </li>
          </ol>
        </nav>
        <p className="ar-game-label">
          {unitContext(reference, title, unit)}
          {label !== unit.name && label !== `Chapter ${unit.key}` ? ` · ${label}` : ""}
        </p>
        <h1 className="m-heading m-title">{unit.name}</h1>
        {unit.summary && <p className="m-intro">{unit.summary}</p>}
        {(arc !== undefined || retold.length > 0) && (
          <p className="m-intro ar-dim">
            {arc && <span>Part of the story: {arc.name}. </span>}
            {retold.length > 0 && (
              <span>
                Retold in{" "}
                {retold.map((code: TitleCode, i) => (
                  <span key={code}>
                    {i > 0 && ", "}
                    <span className="ar-game-inline" style={gameStyle(code)}>
                      {titleShort(reference, code)}
                    </span>
                  </span>
                ))}
              </span>
            )}
          </p>
        )}
        {(detail.previous ?? detail.next) && (
          <nav aria-label="Other chapters" className="ar-steps">
            {detail.previous && (
              <Link
                to={unitPath(title, detail.previous.key)}
                className="m-panel ar-step"
                data-side="previous"
              >
                <span className="m-label">← Before this</span>
                <span className="ar-step-name">{detail.previous.name}</span>
              </Link>
            )}
            {detail.next && (
              <Link
                to={unitPath(title, detail.next.key)}
                className="m-panel ar-step"
                data-side="next"
              >
                <span className="m-label">After this →</span>
                <span className="ar-step-name">{detail.next.name}</span>
              </Link>
            )}
          </nav>
        )}
      </header>

      {empty && (
        <p className="m-panel ar-panel ar-text">
          Nothing from this part of the game is recorded in the archive yet.
        </p>
      )}

      {appearances.length > 0 && (
        <section aria-labelledby="ar-shown" className="ar-section">
          <h2 id="ar-shown" className="m-heading ar-heading">
            Who and what it shows <span className="ar-count">{appearances.length}</span>
          </h2>
          <div className="ar-kinds">
            {ENTITY_KINDS.map((kind) => {
              const items = appearances.filter((a) => a.entity.kind === kind);
              if (items.length === 0) return null;
              return (
                <section key={kind} aria-labelledby={`ar-kind-${kind}`} className="m-panel ar-kind">
                  <h3 id={`ar-kind-${kind}`} className="m-label ar-kind-name">
                    <Orb kind={kind} />
                    {KIND_WORDS[kind].many}
                  </h3>
                  <ul className="ar-things">
                    {items.map((a) => {
                      const depiction = a.depictions[0];
                      const how =
                        kind === "event"
                          ? tellingOf({
                              status: a.status,
                              framing: depiction?.framing ?? null,
                              world: a.world,
                            })
                          : a.status === "depicted"
                            ? a.world === "world_main"
                              ? "Appears"
                              : `Appears, in another world: ${worldName(reference, a.world)}`
                            : "Only mentioned";
                      return (
                        <li key={`${a.entity.id}-${a.world}`} className="ar-thing">
                          <span className="ar-thing-icon">
                            <Face id={a.entity.id} kind={a.entity.kind} />
                          </span>
                          <p className="ar-thing-head">
                            <Link to={entityPath(a.entity.id)} className="ar-thing-name">
                              {a.entity.name}
                            </Link>
                            <span className="ar-how">{how}</span>
                            {a.certainty === "ambiguous" && (
                              <span className="ar-tag">The game leaves this open</span>
                            )}
                          </p>
                          {a.role && <p className="ar-role">{a.role}</p>}
                          <p className="ar-text">{a.summary}</p>
                          <Scenes scenes={a.scenes} />
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </section>
      )}

      {differences.length > 0 && (
        <section aria-labelledby="ar-changes" className="ar-section">
          <h2 id="ar-changes" className="m-heading ar-heading">
            What changes here <span className="ar-count">{differences.length}</span>
          </h2>
          <ul className="ar-list">
            {differences.map((d) => (
              <li key={d.id} className="m-panel ar-item">
                <p className="ar-item-head">
                  <Link to={entityPath(d.entity.id)} className="ar-link">
                    {d.entity.name}
                  </Link>
                  <span className="ar-small">
                    <span className="ar-game-inline" style={gameStyle(d.from.title)}>
                      {titleShort(reference, d.from.title)}
                    </span>{" "}
                    →{" "}
                    <span className="ar-game-inline" style={gameStyle(d.to.title)}>
                      {titleShort(reference, d.to.title)}
                    </span>
                  </span>
                  <span className="ar-tag">{CHANGE_WORDS[d.category]}</span>
                  {d.magnitude === "major" && <span className="ar-tag ar-tag-big">Big change</span>}
                  {d.certainty === "ambiguous" && (
                    <span className="ar-tag">The game leaves this open</span>
                  )}
                </p>
                <p className="ar-text">{d.summary}</p>
                <Scenes scenes={d.scenes} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {relationships.length > 0 && (
        <section aria-labelledby="ar-links" className="ar-section">
          <h2 id="ar-links" className="m-heading ar-heading">
            Links it shows <span className="ar-count">{relationships.length}</span>
          </h2>
          <ul className="m-panel ar-panel ar-list">
            {relationships.map((r) => (
              <li key={r.id} className="ar-sentence">
                <Link to={entityPath(r.source.id)}>{r.source.name}</Link> {r.label}{" "}
                <Link to={entityPath(r.target.id)}>{r.target.name}</Link>.
                {r.world !== "world_main" && (
                  <span className="ar-small">
                    {" "}
                    In another world: {worldName(reference, r.world)}.
                  </span>
                )}
                {r.certainty === "ambiguous" && (
                  <span className="ar-small"> The game leaves this open.</span>
                )}
                {r.scenes.length > 0 && (
                  <span className="ar-small"> In the scene: {r.scenes.join("; ")}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {worlds.length > 0 && (
        <section aria-labelledby="ar-worlds" className="ar-section">
          <h2 id="ar-worlds" className="m-heading ar-heading">
            Other worlds glimpsed here
          </h2>
          <ul className="ar-list">
            {worlds.map((w) => (
              <li key={w.id} className="m-panel ar-item">
                <p className="ar-link">{w.name}</p>
                <p className="ar-text">{reference?.worlds.find((x) => x.id === w.id)?.summary}</p>
                <Scenes scenes={w.scenes} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {questions.length > 0 && (
        <section aria-labelledby="ar-questions" className="ar-section">
          <h2 id="ar-questions" className="m-heading ar-heading">
            Still being checked here
          </h2>
          <OpenQuestionList questions={questions} reference={reference} />
        </section>
      )}
    </article>
  );
}
