import { Link } from "react-router";
import type { CatalogueTitle, Reference } from "../api/client";
import { useEntities, useReference, useResearch, useSources } from "../api/queries";
import { ErrorMessage, Loading } from "../components/QueryState";
import {
  CERTAINTY_LABELS,
  FUTURE_TITLES,
  coverageText,
  structureOf,
} from "../features/archive/units";
import { archiveTitlePath, KIND_LABELS, ENTITY_KINDS, unitPath } from "../lib/paths";
import { titleShort } from "../lib/reference";
import { TITLE_COLOR } from "../lib/titles";
import { SECTION_ART, TITLE_ART } from "../art/manifest";
import { Artwork } from "../components/Artwork";
import { useBackdrop } from "../components/Backdrop";

/**
 * The ARCHIVE section (blueprint §16, §20): the structured catalogue — each title as a source,
 * part by part — the research log behind the facts, and what is still to come.
 */
export function ArchivePage() {
  useBackdrop(SECTION_ART.archive, { strength: 0.45, side: "left" });
  const sources = useSources();
  const reference = useReference();
  const research = useResearch();
  const entities = useEntities();
  const items = entities.data?.items ?? [];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="eyebrow">Structured catalogue and sources</p>
        <h1 className="page-title">Archive</h1>
        <p className="max-w-3xl text-sm text-steel-300">
          Every fact here cites the part of a game it comes from: a disc and story segment of the
          original, or a chapter of the Remake series. Browse each title part by part to see what
          cites it, or read the research log for how the facts were checked.
        </p>
      </header>

      <section aria-labelledby="archive-titles" className="flex flex-col gap-3">
        <h2 id="archive-titles" className="section-title">
          The titles as sources
        </h2>
        {sources.isPending ? (
          <Loading variant="panel" label="Loading the catalogue…" />
        ) : sources.isError ? (
          <div className="panel p-4">
            <ErrorMessage error={sources.error} onRetry={() => void sources.refetch()} />
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {sources.data.titles.map((title) => (
              <li key={title.code}>
                <TitleCard title={title} reference={reference.data} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="archive-research" className="panel flex flex-col gap-3 p-4">
          <h2 id="archive-research" className="section-title">
            Research log
          </h2>
          <p className="text-sm text-steel-300">
            The sources used to find and check each fact, the questions still open, and the facts
            that are inferred or left open rather than stated outright.
          </p>
          {research.data && (
            <dl className="grid grid-cols-3 gap-3">
              {[
                ["Sources", research.data.sources.length],
                ["Open questions", research.data.questions.length],
                ["Inferred or open", research.data.interpretations.length],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="label">{label}</dt>
                  <dd className="font-display text-2xl font-semibold text-steel-100">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          <Link to="/archive/research" className="btn self-start">
            Open the research log
          </Link>
        </section>

        <section aria-labelledby="archive-dataset" className="panel flex flex-col gap-3 p-4">
          <h2 id="archive-dataset" className="section-title">
            The dataset
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ENTITY_KINDS.map((kind) => (
              <div key={kind}>
                <dt className="label">
                  <Link to={`/explore?kind=${kind}`} className="hover:text-mako-300">
                    {KIND_LABELS[kind].many}
                  </Link>
                </dt>
                <dd className="font-display text-2xl font-semibold text-steel-100">
                  {items.filter((e) => e.kind === kind).length}
                </dd>
              </div>
            ))}
          </dl>
          {research.data && <CertaintyBar certainty={research.data.certainty} />}
        </section>
      </div>

      <section aria-labelledby="archive-future" className="flex flex-col gap-3">
        <h2 id="archive-future" className="section-title">
          Still to come
        </h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {FUTURE_TITLES.map((title) => (
            <li key={title.name} className="panel border-dashed p-4 opacity-80">
              <p className="font-semibold text-steel-200">{title.name}</p>
              <p className="text-sm text-steel-400">{title.note}</p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-steel-400">
          Parts of the original the Remake series hasn't reached yet are shown as “not yet reached”
          throughout, never as missing.
        </p>
      </section>
    </div>
  );
}

function TitleCard({
  title,
  reference,
}: {
  title: CatalogueTitle;
  reference: Reference | undefined;
}) {
  const info = reference?.titles.find((t) => t.code === title.code);
  const cited = title.units.filter((u) => u.citations > 0).length;
  const max = Math.max(1, ...title.units.map((u) => u.citations));
  return (
    <article
      className="panel flex h-full flex-col gap-2 overflow-hidden border-t-2 p-4"
      style={{ borderTopColor: TITLE_COLOR[title.code] }}
    >
      <div aria-hidden="true" className="relative -mx-4 -mt-4 mb-1 h-28 overflow-hidden sm:h-32">
        <Artwork
          id={TITLE_ART[title.code]}
          decorative
          className="size-full object-cover saturate-[0.85]"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-night-900 via-night-900/20 to-transparent" />
      </div>
      <h3 className="font-display text-lg font-semibold text-steel-100">
        <Link to={archiveTitlePath(title.code)} className="hover:text-mako-300">
          {info?.name ?? titleShort(reference, title.code)}
        </Link>
      </h3>
      <p className="label">
        {info?.released.slice(0, 4)} · {structureOf(title)}
      </p>
      <p className="text-sm text-steel-300">{coverageText(reference, title.code)}</p>
      {/* One cell per unit, in play order, brighter where more is cited. */}
      <div aria-hidden="true" className="mt-1 flex h-3 gap-px">
        {title.units.map((unit) => (
          <Link
            key={unit.key}
            to={unitPath(title.code, unit.key)}
            tabIndex={-1}
            title={`${unit.name}: ${String(unit.citations)} citations`}
            className="flex-1 rounded-[1px] bg-night-700"
            style={
              unit.citations > 0
                ? {
                    background: TITLE_COLOR[title.code],
                    opacity: 0.35 + (0.65 * unit.citations) / max,
                  }
                : undefined
            }
          />
        ))}
      </div>
      <p className="text-xs text-steel-400">
        {cited} of {title.units.length} cited so far
      </p>
    </article>
  );
}

/** Facts by certainty, as a bar with a legend. */
export function CertaintyBar({
  certainty,
}: {
  certainty: { stated: number; inferred: number; ambiguous: number };
}) {
  const total = Math.max(1, certainty.stated + certainty.inferred + certainty.ambiguous);
  const parts = [
    { key: "stated", value: certainty.stated, className: "bg-mako-500" },
    { key: "inferred", value: certainty.inferred, className: "bg-steel-400" },
    { key: "ambiguous", value: certainty.ambiguous, className: "bg-ember-400" },
  ] as const;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm text-steel-300">Facts by certainty</p>
      <div aria-hidden="true" className="flex h-2 overflow-hidden rounded bg-night-800">
        {parts.map((p) => (
          <span
            key={p.key}
            className={p.className}
            style={{ width: `${String((p.value / total) * 100)}%` }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-steel-300">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`size-2 rounded-full ${p.className}`} />
            {CERTAINTY_LABELS[p.key]}: <span className="font-mono">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
