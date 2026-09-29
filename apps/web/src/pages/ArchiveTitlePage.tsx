import { Link, useParams } from "react-router";
import type { CatalogueUnit, Reference, TitleCode } from "../api/client";
import { useReference, useSources } from "../api/queries";
import { ErrorMessage, Loading } from "../components/QueryState";
import { arcOf, coverageText, retoldBy, structureOf, unitLabel } from "../features/archive/units";
import { unitPath } from "../lib/paths";
import { isTitleCode, titleShort } from "../lib/reference";
import { TITLE_COLOR } from "../lib/titles";
import { NotFoundPage } from "./NotFoundPage";

/** One title as a source (blueprint §16): every segment or chapter, with what cites it. */
export function ArchiveTitlePage() {
  const { title } = useParams();
  const sources = useSources();
  const reference = useReference();

  if (title === undefined || !isTitleCode(title)) return <NotFoundPage />;
  const catalogue = sources.data?.titles.find((t) => t.code === title);
  const info = reference.data?.titles.find((t) => t.code === title);

  // The original is grouped by disc; chaptered titles are one list.
  const groups = catalogue
    ? title === "og"
      ? [1, 2, 3].map((disc) => ({
          label: `Disc ${String(disc)}`,
          units: catalogue.units.filter((u) => u.disc === disc),
        }))
      : [{ label: null, units: catalogue.units }]
    : [];

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <nav aria-label="Breadcrumb" className="label">
          <Link to="/archive" className="hover:text-mako-300">
            Archive
          </Link>
        </nav>
        <h1
          className="border-l-4 pl-3 font-display text-3xl font-semibold tracking-wide text-steel-100"
          style={{ borderColor: TITLE_COLOR[title] }}
        >
          {info?.name ?? titleShort(reference.data, title)}
        </h1>
        {catalogue && (
          <p className="label">
            {info?.released} · {structureOf(catalogue)}
          </p>
        )}
        <p className="max-w-3xl text-sm text-steel-300">{coverageText(reference.data, title)}</p>
      </header>

      {sources.isPending ? (
        <Loading variant="panel" label="Loading the catalogue…" />
      ) : sources.isError ? (
        <div className="panel p-4">
          <ErrorMessage error={sources.error} onRetry={() => void sources.refetch()} />
        </div>
      ) : (
        groups.map((group) => (
          <section
            key={group.label ?? "units"}
            aria-label={group.label ?? "Chapters"}
            className="flex flex-col gap-2"
          >
            {group.label && <h2 className="label">{group.label}</h2>}
            <UnitList
              title={title}
              units={group.units}
              reference={reference.data}
              max={Math.max(1, ...(catalogue?.units ?? []).map((u) => u.citations))}
            />
          </section>
        ))
      )}
    </article>
  );
}

function UnitList({
  title,
  units,
  reference,
  max,
}: {
  title: TitleCode;
  units: readonly CatalogueUnit[];
  reference: Reference | undefined;
  max: number;
}) {
  return (
    <ol className="panel divide-y divide-night-800">
      {units.map((unit) => {
        const arc = arcOf(reference, title, unit.key);
        const retold = title === "og" ? retoldBy(reference, unit.key) : [];
        const label = unitLabel(unit.key, unit.name);
        return (
          <li
            key={unit.key}
            className="grid gap-x-4 gap-y-1 p-3 text-sm sm:grid-cols-[minmax(0,1fr)_12rem]"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <Link
                to={unitPath(title, unit.key)}
                className={`font-semibold hover:text-mako-300 ${unit.citations > 0 ? "text-steel-100" : "text-steel-400"}`}
              >
                {unit.name.startsWith(label) ? unit.name : `${label} · ${unit.name}`}
              </Link>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-steel-400">
                {arc && <span>{arc.name}</span>}
                {retold.length > 0 && (
                  <span>
                    Retold in{" "}
                    {retold.map((code, i) => (
                      <span key={code}>
                        {i > 0 && ", "}
                        <span style={{ color: TITLE_COLOR[code] }}>
                          {titleShort(reference, code)}
                        </span>
                      </span>
                    ))}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-steel-400">
              <span aria-hidden="true" className="h-1.5 flex-1 rounded bg-night-800">
                <span
                  className="block h-full rounded"
                  style={{
                    width: `${String((unit.citations / max) * 100)}%`,
                    background: TITLE_COLOR[title],
                  }}
                />
              </span>
              <span className="w-24 text-right">
                {unit.citations > 0
                  ? `${String(unit.citations)} citation${unit.citations === 1 ? "" : "s"}`
                  : "Nothing yet"}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
