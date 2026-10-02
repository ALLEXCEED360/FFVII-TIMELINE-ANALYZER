import {
  DIFFERENCE_CATEGORY_LABELS,
  FRAMING_LABELS,
  STATUS_DESCRIPTIONS,
  STATUS_LABELS,
} from "@ffvii/shared/labels";
import { Link, useParams } from "react-router";
import type { Reference, SourceUnitDetail, TitleCode } from "../api/client";
import { ApiError } from "../api/client";
import { useReference, useResearch, useSourceUnit } from "../api/queries";
import { Empty, ErrorMessage, Loading } from "../components/QueryState";
import { OpenQuestionList } from "../features/archive/OpenQuestions";
import { arcOf, retoldBy, unitContext, unitLabel } from "../features/archive/units";
import {
  ENTITY_KINDS,
  KIND_LABELS,
  archiveTitlePath,
  entityPath,
  sourcePath,
  unitFromPath,
  unitPath,
} from "../lib/paths";
import { titleShort, worldName } from "../lib/reference";
import { TITLE_COLOR } from "../lib/titles";
import { NotFoundPage } from "./NotFoundPage";
import { SECTION_ART, TITLE_ART } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";

/**
 * One unit of a title as a source (blueprint §16): /archive/remake/chapter-8, /archive/og/kalm.
 * Everything the dataset cites it for — who and what it shows, differences, relationships, worlds.
 */
export function SourceUnitPage() {
  const params = useParams();
  const unit = unitFromPath(params.title, params.unit);
  useBackdrop(unit ? TITLE_ART[unit.title] : SECTION_ART.archive, { strength: 0.35 });
  const query = useSourceUnit(unit?.title, unit?.key);
  const reference = useReference();

  if (unit === undefined) return <NotFoundPage />;
  if (query.isPending) return <Loading variant="panel" label="Loading…" />;
  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage />;
    return (
      <div className="panel p-4">
        <ErrorMessage error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );
  }
  return <UnitView detail={query.data} reference={reference.data} />;
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
    <article className="flex flex-col gap-7">
      <header className="flex flex-col gap-2">
        <nav aria-label="Breadcrumb" className="label">
          <Link to="/archive" className="hover:text-mako-300">
            Archive
          </Link>{" "}
          /{" "}
          <Link to={archiveTitlePath(title)} className="hover:text-mako-300">
            {titleShort(reference, title)}
          </Link>
        </nav>
        <p className="label" style={{ color: TITLE_COLOR[title] }}>
          {unitContext(reference, title, unit)}
          {label !== unit.name && label !== `Chapter ${unit.key}` ? ` · ${label}` : ""}
        </p>
        <h1 className="page-title">{unit.name}</h1>
        {unit.summary && <p className="max-w-3xl text-steel-300">{unit.summary}</p>}
        {(arc !== undefined || retold.length > 0) && (
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-steel-400">
            {arc && <span>Arc: {arc.name}</span>}
            {retold.length > 0 && (
              <span>
                Retold in{" "}
                {retold.map((code: TitleCode, i) => (
                  <span key={code}>
                    {i > 0 && ", "}
                    <span style={{ color: TITLE_COLOR[code] }}>{titleShort(reference, code)}</span>
                  </span>
                ))}
              </span>
            )}
          </p>
        )}
        <nav aria-label="Neighbouring units" className="flex flex-wrap gap-2 pt-1">
          {detail.previous && (
            <Link to={unitPath(title, detail.previous.key)} className="btn">
              ← {detail.previous.name}
            </Link>
          )}
          {detail.next && (
            <Link to={unitPath(title, detail.next.key)} className="btn">
              {detail.next.name} →
            </Link>
          )}
        </nav>
      </header>

      {empty && (
        <div className="panel">
          <Empty>Nothing in the dataset cites this part of the game yet.</Empty>
        </div>
      )}

      {appearances.length > 0 && (
        <section aria-labelledby="unit-shown" className="flex flex-col gap-3">
          <h2 id="unit-shown" className="section-title">
            Shown here <span className="text-steel-300">{appearances.length}</span>
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {ENTITY_KINDS.map((kind) => {
              const items = appearances.filter((a) => a.entity.kind === kind);
              if (items.length === 0) return null;
              return (
                <section
                  key={kind}
                  aria-labelledby={`unit-${kind}`}
                  className="flex flex-col gap-2"
                >
                  <h3 id={`unit-${kind}`} className="text-sm font-semibold text-steel-200">
                    {KIND_LABELS[kind].many}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {items.map((a) => (
                      <li
                        key={`${a.entity.id}-${a.world}`}
                        className="panel border-l-2 p-3 text-sm"
                        style={{ borderLeftColor: TITLE_COLOR[title] }}
                      >
                        <p className="flex flex-wrap items-center gap-1.5">
                          <Link
                            to={entityPath(a.entity.id)}
                            className="font-semibold text-steel-100 hover:text-mako-300"
                          >
                            {a.entity.name}
                          </Link>
                          <span className="chip" title={STATUS_DESCRIPTIONS[a.status]}>
                            {STATUS_LABELS[a.status]}
                          </span>
                          {a.world !== "world_main" && (
                            <span className="chip">{worldName(reference, a.world)}</span>
                          )}
                          {a.certainty !== "stated" && (
                            <span className="chip">
                              {a.certainty === "ambiguous" ? "Left open" : "Inferred"}
                            </span>
                          )}
                          {a.depictions.map((d, i) => (
                            <span key={i} className="chip border-mako-700 text-mako-300">
                              {FRAMING_LABELS[d.framing]}
                            </span>
                          ))}
                        </p>
                        {a.role && <p className="mt-1 text-xs text-mako-300">{a.role}</p>}
                        <p className="mt-1 text-steel-300">{a.summary}</p>
                        <Scenes scenes={a.scenes} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </section>
      )}

      {differences.length > 0 && (
        <section aria-labelledby="unit-differences" className="flex flex-col gap-3">
          <h2 id="unit-differences" className="section-title">
            Differences cited here <span className="text-steel-300">{differences.length}</span>
          </h2>
          <ul className="flex flex-col gap-2">
            {differences.map((d) => (
              <li key={d.id} className="panel p-3 text-sm">
                <p className="mb-1 flex flex-wrap items-center gap-1.5">
                  <Link
                    to={entityPath(d.entity.id)}
                    className="font-semibold text-steel-100 hover:text-mako-300"
                  >
                    {d.entity.name}
                  </Link>
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
                <Scenes scenes={d.scenes} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {relationships.length > 0 && (
        <section aria-labelledby="unit-relationships" className="flex flex-col gap-3">
          <h2 id="unit-relationships" className="section-title">
            Relationships shown here <span className="text-steel-300">{relationships.length}</span>
          </h2>
          <ul className="panel divide-y divide-night-800">
            {relationships.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 p-3 text-sm">
                <Link to={entityPath(r.source.id)} className="text-steel-100 hover:text-mako-300">
                  {r.source.name}
                </Link>
                <span className="text-steel-400">{r.label}</span>
                <Link to={entityPath(r.target.id)} className="text-steel-100 hover:text-mako-300">
                  {r.target.name}
                </Link>
                {r.world !== "world_main" && (
                  <span className="chip">{worldName(reference, r.world)}</span>
                )}
                {r.certainty !== "stated" && (
                  <span className="chip">
                    {r.certainty === "ambiguous" ? "Left open" : "Inferred"}
                  </span>
                )}
                {r.scenes.length > 0 && (
                  <span className="w-full text-xs text-steel-400">
                    Scene: {r.scenes.join("; ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {worlds.length > 0 && (
        <section aria-labelledby="unit-worlds" className="flex flex-col gap-3">
          <h2 id="unit-worlds" className="section-title">
            Worlds shown here
          </h2>
          <ul className="flex flex-col gap-2">
            {worlds.map((w) => (
              <li key={w.id} className="panel p-3 text-sm">
                <p className="font-semibold text-steel-100">{w.name}</p>
                <p className="text-steel-300">
                  {reference?.worlds.find((x) => x.id === w.id)?.summary}
                </p>
                <Scenes scenes={w.scenes} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {questions.length > 0 && (
        <section aria-labelledby="unit-questions" className="flex flex-col gap-3">
          <h2 id="unit-questions" className="section-title">
            Open questions here
          </h2>
          <OpenQuestionList questions={questions} reference={reference} />
        </section>
      )}
    </article>
  );
}

function Scenes({ scenes }: { scenes: readonly string[] }) {
  if (scenes.length === 0) return null;
  return <p className="mt-1 text-xs text-steel-400">Scene: {scenes.join("; ")}</p>;
}
