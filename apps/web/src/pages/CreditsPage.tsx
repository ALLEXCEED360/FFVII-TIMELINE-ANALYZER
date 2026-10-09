import { type ReactNode, useState } from "react";
import { Link } from "react-router";
import { ARTWORK, type ArtEntry, SECTION_ART, artSourceUrl } from "../art/manifest";
import { Artwork } from "../components/Artwork";
import { useBackdrop } from "../components/Backdrop";
import "../features/credits/credits.css";

/** Every typeface the site loads: who made it, its licence, and where it's used. */
const FONTS = [
  {
    name: "Final Fantasy",
    family: "'FF Logo'",
    by: "Juan Pablo Reyes Altamirano, after the series' logo",
    licence: "Free font (1999), non-commercial use",
    use: "The bar along the top, and the series' name on the title screen",
  },
  {
    name: "Optimus Princeps",
    family: "'Optimus Princeps'",
    by: "Manfred Klein",
    licence: "Free font",
    use: "Names, headings and labels, and the title screen's name",
  },
  {
    name: "Reactor7",
    family: "Reactor7",
    by: "Caveras (Cliff Modes), after the original game's text",
    licence: "CC BY-NC-SA 4.0 — caveras.net",
    use: "The home menu, and the window between sections",
  },
  {
    name: "Inter",
    family: "'Inter Variable'",
    by: "Rasmus Andersson",
    licence: "SIL Open Font License 1.1",
    use: "Everything you read",
  },
  {
    name: "JetBrains Mono",
    family: "'JetBrains Mono Variable'",
    by: "JetBrains",
    licence: "SIL Open Font License 1.1",
    use: "Where-in-the-game references, and picture credits",
  },
] as const;

const GROUPS: readonly { id: string; name: string; match: (art: ArtEntry) => boolean }[] = [
  { id: "all", name: "Everything", match: () => true },
  { id: "key", name: "Key art", match: (art) => art.id.startsWith("key/") },
  { id: "characters", name: "Characters", match: (art) => art.id.startsWith("characters/") },
  { id: "places", name: "Places", match: (art) => art.id.startsWith("places/") },
  { id: "groups", name: "Groups", match: (art) => art.id.startsWith("groups/") },
  { id: "moments", name: "Moments", match: (art) => art.id.startsWith("moments/") },
];

/** The named artists first, then the studio. */
const ARTISTS = [...new Set(ARTWORK.map((art) => art.artist))].sort(
  (a, b) => Number(a === "Square Enix") - Number(b === "Square Enix") || a.localeCompare(b),
);

/** One line of the staff roll: what was done, and by whom. */
function Role({ role, children }: { role: string; children: ReactNode }) {
  return (
    <div className="cr-role">
      <dt className="m-label">{role}</dt>
      <dd className="m-heading cr-names">{children}</dd>
    </div>
  );
}

/** Credits as a staff roll, then every picture, typeface and licence. */
export function CreditsPage() {
  useBackdrop(SECTION_ART.credits, { strength: 0.5, side: "full" });
  const [group, setGroup] = useState("all");
  const shown = ARTWORK.filter(GROUPS.find((g) => g.id === group)?.match ?? (() => true));

  return (
    <div className="cr">
      <header>
        <p className="m-label">Thanks to</p>
        <h1 className="m-heading m-title">Credits</h1>
        <p className="m-intro">
          <em>Final Fantasy VII</em> and all its names, characters and artwork belong to Square
          Enix. This is a non-commercial fan project, not made, approved or endorsed by Square Enix.
        </p>
      </header>

      <section aria-labelledby="cr-roll" className="m-panel cr-roll">
        <h2 id="cr-roll" className="sr-only">
          Who made what
        </h2>
        <dl className="cr-roles">
          <Role role="Final Fantasy VII · Remake · INTERmission · Rebirth">Square Enix</Role>
          <Role role="Artwork">
            {ARTISTS.map((artist) => (
              <span key={artist} className="cr-name">
                {artist}
              </span>
            ))}
          </Role>
          <Role role="Site icon">
            <span className="cr-name">The Meteor emblem, by Yoshitaka Amano</span>
          </Role>
          <Role role="Pointer">
            <span className="cr-name">
              Cloud&apos;s Buster Sword, from{" "}
              <a
                href="https://www.cursors-4u.com/cursor/final-fantasy-7-cloud-s-buster-sword"
                target="_blank"
                rel="noreferrer"
                className="cr-link"
              >
                Cursors-4U
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </span>
          </Role>
          <Role role="Lettering">
            {FONTS.map((font) => (
              <span key={font.name} className="cr-name">
                {font.by.split(",")[0]}
              </span>
            ))}
          </Role>
          <Role role="Every fact checked against">
            <span className="cr-name">
              The games themselves —{" "}
              <Link to="/archive/research" className="cr-link">
                see how
              </Link>
            </span>
          </Role>
        </dl>
      </section>

      <section aria-labelledby="cr-art" className="cr-section">
        <h2 id="cr-art" className="m-heading cr-heading">
          The pictures <span className="cr-count">{ARTWORK.length}</span>
        </h2>
        <div className="m-panel cr-panel">
          <p className="cr-text">
            Every picture is official Square Enix artwork — key art, character renders and
            illustrations, and concept art — found through the{" "}
            <a
              href="https://finalfantasy.fandom.com"
              target="_blank"
              rel="noreferrer"
              className="cr-link"
            >
              Final Fantasy Wiki
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            . None of it is made by AI, and the pictures only decorate: no fact here rests on one.
            For the moments, places and groups no artwork shows, the picture is a still from the
            game, a Square Enix promo shot, or a fan&apos;s render of the game&apos;s model, each
            named below.
          </p>
          <ul className="cr-notes">
            <li>Resized to load quickly.</li>
            <li>Plain studio backgrounds around some figures removed.</li>
            <li>Pencil concept sketches shown as light lines on the dark page.</li>
            <li>Printed titles and publisher logos cropped off.</li>
            <li>A few cropped to the part that shows the moment.</li>
          </ul>
          <p className="cr-small">
            None of it is covered by this project&apos;s licences, and any picture will be taken
            down at the rights holder&apos;s request.
          </p>
        </div>
        <div role="group" aria-label="Show" className="m-choices">
          {GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={group === g.id}
              onClick={() => {
                setGroup(g.id);
              }}
              className="m-choice"
            >
              {g.name} <span className="cr-count">{ARTWORK.filter(g.match).length}</span>
            </button>
          ))}
        </div>
        <ul aria-label="Pictures" className="cr-art">
          {shown.map((art) => (
            <li key={art.id} className="m-panel cr-piece">
              <span className="cr-piece-art" data-kind={art.kind}>
                <Artwork entry={art} decorative />
              </span>
              <span className="cr-piece-body">
                <span className="cr-piece-title">{art.title}</span>
                <span className="cr-small">{art.artist} · © Square Enix</span>
                {art.wiki === undefined ? (
                  <span className="cr-small">{art.source}</span>
                ) : (
                  <a
                    href={artSourceUrl(art)}
                    target="_blank"
                    rel="noreferrer"
                    className="cr-link cr-source"
                  >
                    See the original
                    <span className="sr-only">
                      {" "}
                      of {art.title} on the Final Fantasy Wiki (opens in a new tab)
                    </span>
                  </a>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="cr-fonts" className="cr-section">
        <h2 id="cr-fonts" className="m-heading cr-heading">
          The lettering <span className="cr-count">{FONTS.length}</span>
        </h2>
        <ul className="cr-fonts">
          {FONTS.map((font) => (
            <li key={font.name} className="m-panel cr-font">
              <span
                aria-hidden="true"
                className="cr-font-sample"
                style={{ fontFamily: font.family }}
              >
                {font.name === "Final Fantasy" ? "FINAL FANTASY" : "Final Fantasy VII"}
              </span>
              <span className="cr-font-name">{font.name}</span>
              <span className="cr-small">by {font.by}</span>
              <span className="cr-text">{font.use}</span>
              <span className="cr-small">{font.licence}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="cr-project" className="cr-section">
        <h2 id="cr-project" className="m-heading cr-heading">
          This project
        </h2>
        <ul className="cr-licences">
          <li className="m-panel cr-panel">
            <p className="cr-font-name">The code</p>
            <p className="cr-text">MIT licence: use it for anything, with the notice kept.</p>
          </li>
          <li className="m-panel cr-panel">
            <p className="cr-font-name">The facts and the writing</p>
            <p className="cr-text">
              Creative Commons Attribution-NonCommercial 4.0: reuse them with credit, but not to
              make money.
            </p>
          </li>
          <li className="m-panel cr-panel">
            <p className="cr-font-name">The research</p>
            <p className="cr-text">
              What each fact was checked against is listed in the{" "}
              <Link to="/archive/research" className="cr-link">
                research log
              </Link>
              .
            </p>
          </li>
        </ul>
      </section>
    </div>
  );
}
