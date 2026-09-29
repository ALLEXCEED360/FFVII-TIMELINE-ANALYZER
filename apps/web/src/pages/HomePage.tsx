import { Link } from "react-router";
import { useEntities, useReference } from "../api/queries";
import { archiveTitlePath } from "../lib/paths";
import { TITLE_COLOR } from "../lib/titles";

/** The entry point (blueprint §20): what this is, what it covers, and where to start. */
export function HomePage() {
  const reference = useReference();
  const entities = useEntities();
  const items = entities.data?.items ?? [];
  const count = (kind: string) => items.filter((e) => e.kind === kind).length;

  return (
    <div className="flex flex-col gap-12 py-6 sm:py-12">
      <section className="flex max-w-4xl flex-col gap-5">
        <p className="label text-mako-300">Narrative analysis archive</p>
        <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-wide text-steel-100 sm:text-6xl">
          One story.
          <br />
          <span className="text-mako-300 glow-text">Four tellings.</span>
        </h1>
        <p className="max-w-2xl text-base text-steel-300 sm:text-lg">
          Explore how <em>Final Fantasy VII</em>, <em>Remake</em>, <em>INTERmission</em> and{" "}
          <em>Rebirth</em> present the same events, characters and places — where they agree, where
          they change, and where they diverge.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link to="/timeline" className="btn border-mako-500 px-5 py-2.5 text-mako-200">
            Open the timeline →
          </Link>
          <Link to="/timeline?view=play" className="btn px-5 py-2.5">
            Compare play order
          </Link>
        </div>
      </section>

      <section aria-labelledby="home-titles" className="flex flex-col gap-4">
        <h2 id="home-titles" className="label">
          Titles in the archive
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(reference.data?.titles ?? []).map((title) => (
            <li
              key={title.code}
              className="panel border-t-2 p-4"
              style={{ borderTopColor: TITLE_COLOR[title.code] }}
            >
              <p className="font-display text-lg font-semibold text-steel-100">
                <Link to={archiveTitlePath(title.code)} className="hover:text-mako-300">
                  {title.shortName}
                </Link>
              </p>
              <p className="text-sm text-steel-300">{title.name}</p>
              <p className="label mt-3">
                {title.released.slice(0, 4)} ·{" "}
                {title.units.length > 0
                  ? `${String(title.units.filter((u) => /^\d+$/.test(u.key)).length)} chapters`
                  : "3 discs"}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {items.length > 0 && (
        <section aria-labelledby="home-dataset" className="flex flex-col gap-4">
          <h2 id="home-dataset" className="label">
            Dataset
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Events", count("event")],
              ["Characters", count("character")],
              ["Locations", count("location")],
              ["Organizations", count("organization")],
            ].map(([label, value]) => (
              <div key={label} className="panel p-4">
                <dt className="label">{label}</dt>
                <dd className="font-display text-3xl font-semibold text-steel-100">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-steel-400">
            A growing, sourced dataset: every fact cites the chapter or disc it comes from.
          </p>
        </section>
      )}
    </div>
  );
}
