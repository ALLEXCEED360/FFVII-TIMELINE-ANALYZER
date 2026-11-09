import type { CSSProperties } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import type { CatalogueTitle, CatalogueUnit, Reference, TitleCode } from "../api/client";
import { useReference, useSources } from "../api/queries";
import { SECTION_ART, TITLE_ART } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";
import { ErrorMessage, Loading } from "../components/QueryState";
import {
  arcOf,
  coverageText,
  retoldBy,
  shownText,
  structureOf,
  unitLabel,
  unitNumber,
} from "../features/archive/units";
import { unitPath } from "../lib/paths";
import { isTitleCode, titleShort } from "../lib/reference";
import { TITLE_COLOR } from "../lib/titles";
import { useMediaQuery } from "../lib/useMediaQuery";
import { NotFoundPage } from "./NotFoundPage";
import "../features/archive/archive.css";

/** One game, chapter by chapter, like its chapter select. */
export function ArchiveTitlePage() {
  const { title } = useParams();
  useBackdrop(isTitleCode(title ?? "") ? TITLE_ART[title as TitleCode] : SECTION_ART.archive, {
    strength: 0.5,
    side: "full",
  });
  const sources = useSources();
  const reference = useReference();
  // Short of a wide screen, the original's three discs are read one at a time. The disc lives in
  // the address, so coming back from a part returns to it.
  const narrow = useMediaQuery("(max-width: 63.99rem)", false);
  const [search, setSearch] = useSearchParams();
  const discParam = Number(search.get("disc"));
  const disc = discParam === 2 || discParam === 3 ? discParam : 1;

  if (title === undefined || !isTitleCode(title)) return <NotFoundPage />;
  const catalogue = sources.data?.titles.find((t) => t.code === title);
  const info = reference.data?.titles.find((t) => t.code === title);

  // The original is grouped by disc; the others are one list.
  const groups = catalogue
    ? title === "og"
      ? [1, 2, 3].map((disc) => ({
          label: `Disc ${String(disc)}`,
          units: catalogue.units.filter((u) => u.disc === disc),
        }))
      : [{ label: null, units: catalogue.units }]
    : [];

  return (
    <article className="ar" style={{ "--c": TITLE_COLOR[title] } as CSSProperties}>
      <header>
        <nav aria-label="Breadcrumb">
          <ol className="ar-crumbs">
            <li>
              <Link to="/archive">Archive</Link>
            </li>
          </ol>
        </nav>
        <p className="ar-game-label">
          {titleShort(reference.data, title)}
          {info && ` · ${info.released.slice(0, 4)}`}
          {catalogue && ` · ${structureOf(catalogue)}`}
        </p>
        <h1 className="m-heading m-title">{info?.name ?? titleShort(reference.data, title)}</h1>
        <p className="m-intro">
          {coverageText(reference.data, title)} Pick a {title === "og" ? "part" : "chapter"} to see
          who and what it shows.
        </p>
      </header>

      {sources.isPending ? (
        <Loading variant="panel" label="Opening the chapters…" />
      ) : sources.isError ? (
        <div className="m-panel ar-panel">
          <ErrorMessage error={sources.error} onRetry={() => void sources.refetch()} />
        </div>
      ) : (
        catalogue && (
          <>
            {narrow && title === "og" && (
              <div role="group" aria-label="Which disc" className="ar-discs">
                {groups.map((group, i) => (
                  <button
                    key={group.label}
                    type="button"
                    aria-pressed={disc === i + 1}
                    onClick={() => {
                      const next = new URLSearchParams(search);
                      if (i === 0) next.delete("disc");
                      else next.set("disc", String(i + 1));
                      setSearch(next, { replace: true });
                    }}
                    className="ar-disc"
                  >
                    <span className="ar-disc-name">{group.label}</span>
                    <span className="ar-disc-count">{group.units.length} parts</span>
                  </button>
                ))}
              </div>
            )}
            {groups
              .filter((_, i) => !(narrow && title === "og") || i + 1 === disc)
              .map((group) => (
                <section
                  key={group.label ?? "units"}
                  aria-labelledby={`ar-${(group.label ?? "chapters").replace(" ", "-")}`}
                  className="ar-section"
                >
                  <h2
                    id={`ar-${(group.label ?? "chapters").replace(" ", "-")}`}
                    className="m-heading ar-heading"
                  >
                    {group.label ?? "Chapters"}
                  </h2>
                  <ChapterList title={catalogue} units={group.units} reference={reference.data} />
                </section>
              ))}
          </>
        )
      )}
    </article>
  );
}

function ChapterList({
  title,
  units,
  reference,
}: {
  title: CatalogueTitle;
  units: readonly CatalogueUnit[];
  reference: Reference | undefined;
}) {
  return (
    <ol className="ar-chapters">
      {units.map((unit) => {
        const arc = arcOf(reference, title.code, unit.key);
        const retold = title.code === "og" ? retoldBy(reference, unit.key) : [];
        const label = unitLabel(unit.key, unit.name);
        return (
          <li key={unit.key} className="ar-chapter" data-empty={unit.subjects === 0 || undefined}>
            <span aria-hidden="true" className="ar-chapter-number">
              {unitNumber(title, unit.key)}
            </span>
            <span className="ar-chapter-text">
              <Link to={unitPath(title.code, unit.key)} className="ar-chapter-name">
                {unit.name.startsWith(label) ? unit.name : `${label} · ${unit.name}`}
              </Link>
              {(arc !== undefined || retold.length > 0) && (
                <span className="ar-chapter-meta">
                  {arc && <span>{arc.name}</span>}
                  {retold.length > 0 && (
                    <span>
                      Retold in{" "}
                      {retold.map((code, i) => (
                        <span key={code}>
                          {i > 0 && ", "}
                          <span
                            className="ar-game-inline"
                            style={{ "--c": TITLE_COLOR[code] } as CSSProperties}
                          >
                            {titleShort(reference, code)}
                          </span>
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              )}
            </span>
            <span className="ar-chapter-count">{shownText(unit.subjects)}</span>
          </li>
        );
      })}
    </ol>
  );
}
