import type { CSSProperties } from "react";
import { Link } from "react-router";
import type { CatalogueTitle, Reference } from "../api/client";
import { useReference, useResearch, useSources } from "../api/queries";
import { SECTION_ART, TITLE_ART } from "../art/manifest";
import { Artwork } from "../components/Artwork";
import { useBackdrop } from "../components/Backdrop";
import { ErrorMessage, Loading } from "../components/QueryState";
import {
  CERTAINTY_COLORS,
  CERTAINTY_DESCRIPTIONS,
  CERTAINTY_LABELS,
  FUTURE_TITLES,
  coverageText,
  structureOf,
} from "../features/archive/units";
import { archiveTitlePath } from "../lib/paths";
import { titleShort } from "../lib/reference";
import { TITLE_COLOR } from "../lib/titles";
import "../features/archive/archive.css";

/**
 * The archive (decision 0026), for someone new to the story: each game to go through chapter by
 * chapter, how the facts were checked, and the games still to come.
 */
export function ArchivePage() {
  useBackdrop(SECTION_ART.archive, { strength: 0.5, side: "full" });
  const sources = useSources();
  const reference = useReference();
  const research = useResearch();

  return (
    <div className="ar">
      <header>
        <p className="m-label">Archive</p>
        <h1 className="m-heading m-title">The games, chapter by chapter</h1>
        <p className="m-intro">
          Everything in this guide comes from the games themselves. Pick a game to go through it
          chapter by chapter, and see who and what each chapter shows.
        </p>
      </header>

      <section aria-labelledby="ar-games" className="ar-section">
        <h2 id="ar-games" className="m-heading ar-heading">
          Pick a game
        </h2>
        {sources.isPending ? (
          <Loading variant="panel" label="Opening the archive…" />
        ) : sources.isError ? (
          <div className="m-panel ar-panel">
            <ErrorMessage error={sources.error} onRetry={() => void sources.refetch()} />
          </div>
        ) : (
          <ul className="ar-games">
            {sources.data.titles.map((title) => (
              <li key={title.code}>
                <GameCard title={title} reference={reference.data} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="ar-pair">
        <section aria-labelledby="ar-checked" className="m-panel ar-panel ar-section">
          <h2 id="ar-checked" className="m-heading ar-heading">
            How the facts were checked
          </h2>
          <p className="ar-text">
            Each fact here was checked against the game itself — by playing it, from video of it, or
            from its script — and says where in the game to see it. Some things the games don&apos;t
            say outright; those are marked, and never settled with a guess.
          </p>
          {research.data && (
            <ul className="ar-sure-key">
              {(["stated", "inferred", "ambiguous"] as const).map((c) => (
                <li key={c}>
                  <span
                    aria-hidden="true"
                    className="ar-dot"
                    style={{ background: CERTAINTY_COLORS[c] }}
                  />
                  <span>
                    <strong>{CERTAINTY_LABELS[c]}.</strong>{" "}
                    <span className="ar-dim">{CERTAINTY_DESCRIPTIONS[c]}</span>
                  </span>
                  <span className="ar-small">{research.data.certainty[c]}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/archive/research" className="ar-button">
            See how each fact was checked
          </Link>
        </section>

        <section aria-labelledby="ar-future" className="m-panel ar-panel ar-section">
          <h2 id="ar-future" className="m-heading ar-heading">
            Still to come
          </h2>
          <ul className="ar-future">
            {FUTURE_TITLES.map((title) => (
              <li key={title.name}>
                <p className="ar-future-name">{title.name}</p>
                <p className="ar-small">{title.note}</p>
              </li>
            ))}
          </ul>
          <p className="ar-small">
            Parts of the story the Remake series hasn&apos;t reached yet are marked “not reached
            yet”, never as missing.
          </p>
        </section>
      </div>
    </div>
  );
}

function GameCard({ title, reference }: { title: CatalogueTitle; reference?: Reference }) {
  const info = reference?.titles.find((t) => t.code === title.code);
  const recorded = title.units.filter((u) => u.subjects > 0).length;
  return (
    <article
      className="m-panel ar-game"
      style={{ "--c": TITLE_COLOR[title.code] } as CSSProperties}
    >
      <div aria-hidden="true" className="ar-game-art">
        <Artwork id={TITLE_ART[title.code]} decorative />
      </div>
      <div className="ar-game-body">
        <p className="ar-game-label">
          {titleShort(reference, title.code)} · {info?.released.slice(0, 4)}
        </p>
        <h3 className="m-heading ar-game-name">
          <Link to={archiveTitlePath(title.code)}>
            {info?.name ?? titleShort(reference, title.code)}
          </Link>
        </h3>
        <p className="ar-small">{structureOf(title)}</p>
        <p className="ar-text">{coverageText(reference, title.code)}</p>
        {/* One mark per part, lit where something is recorded from it. */}
        <span aria-hidden="true" className="ar-progress">
          {title.units.map((unit) => (
            <span key={unit.key} data-on={unit.subjects > 0 || undefined} />
          ))}
        </span>
        <p className="ar-small">
          {recorded} of {title.units.length} recorded so far
        </p>
        <span aria-hidden="true" className="ar-more">
          Go through it ›
        </span>
      </div>
    </article>
  );
}
