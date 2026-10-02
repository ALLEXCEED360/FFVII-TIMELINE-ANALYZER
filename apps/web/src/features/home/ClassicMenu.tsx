import { type CSSProperties, useEffect, useState } from "react";
import { Link } from "react-router";
import type { TitleCode } from "../../api/client";
import { useEntities, useReference, useSources } from "../../api/queries";
import { TITLE_ART, artSrc, artwork } from "../../art/manifest";
import { useBackdrop } from "../../components/Backdrop";
import { SectionLink } from "../../components/Wipe";
import { coverageText } from "../archive/units";
import { ENTITY_KINDS, KIND_LABELS, archiveTitlePath } from "../../lib/paths";
import { TITLE_COLOR } from "../../lib/titles";
import { SECTIONS, useMenu } from "./menu";

/** Time since the menu opened, counted as the original counts play time. */
function usePlayTime(): string {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const tick = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => {
      window.clearInterval(tick);
    };
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h)}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * The home menu, as the original's pause menu (decision 0017). The four games are the party: a
 * portrait of each, its year as LV, its parts as HP, and how many of them the archive cites as MP.
 * The sections are the commands, chosen with the glove; the help window along the top says what
 * the highlighted command or game is; the side windows keep the play time, the archive's size and
 * where you are. Every window unfolds from its middle, one after another, as the game's do.
 */
export function ClassicMenu() {
  const reference = useReference();
  const entities = useEntities();
  const sources = useSources();
  const { active, choose, onKeyDown, ref, current } = useMenu();
  const [member, setMember] = useState<TitleCode | null>(null);
  const time = usePlayTime();
  // Load every command's artwork up front, so moving the glove changes the scene at once.
  useEffect(() => {
    for (const section of SECTIONS) {
      const art = artwork(section.art);
      if (art) new Image().src = artSrc(art);
    }
  }, []);
  useBackdrop(current?.art, { strength: 0.85, side: "full" });

  const titles = reference.data?.titles ?? [];
  const items = entities.data?.items ?? [];
  const pointed = member ? titles.find((t) => t.code === member) : undefined;
  const help = pointed
    ? `${pointed.name}. ${coverageText(reference.data, pointed.code)}`
    : current?.text;

  return (
    <section aria-labelledby="home-title" className="ff7 classic">
      <h1 id="home-title" className="sr-only">
        One story. Four tellings. Final Fantasy VII Timeline Analyzer.
      </h1>
      <p aria-live="polite" className="ff7-window classic-help ff7-text">
        {help}
      </p>

      {/* The party: the four games. */}
      <div className="ff7-window classic-party">
        <ul aria-label="The four tellings" className="classic-members">
          {titles.map((title, i) => {
            const art = artwork(TITLE_ART[title.code]);
            const units = sources.data?.titles.find((t) => t.code === title.code)?.units ?? [];
            const total = units.length || title.units.length;
            const cited = units.filter((u) => u.citations > 0).length;
            return (
              <li key={title.code} style={{ "--i": i } as CSSProperties} className="classic-member">
                <Link
                  to={archiveTitlePath(title.code)}
                  className="classic-member-link"
                  onPointerEnter={() => {
                    setMember(title.code);
                  }}
                  onPointerLeave={() => {
                    setMember(null);
                  }}
                  onFocus={() => {
                    setMember(title.code);
                  }}
                  onBlur={() => {
                    setMember(null);
                  }}
                >
                  <span className="classic-portrait">
                    {art && (
                      <img
                        src={artSrc(art)}
                        alt=""
                        className="size-full object-cover"
                        style={{ objectPosition: art.focus }}
                      />
                    )}
                  </span>
                  <span className="classic-member-name">
                    <span className="ff7-text classic-name">{title.shortName}</span>
                    <span className="ff7-text classic-stat">
                      <span className="ff7-label">LV</span>
                      <span>{title.released.slice(0, 4)}</span>
                    </span>
                  </span>
                  <span className="classic-member-stats">
                    <span className="ff7-text classic-stat">
                      <span className="ff7-label">HP</span>
                      <span>
                        {total}/{total}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="classic-bar"
                      style={{ "--c": TITLE_COLOR[title.code], "--fill": 1 } as CSSProperties}
                    />
                    <span className="ff7-text classic-stat">
                      <span className="ff7-label">MP</span>
                      <span>
                        {cited}/{total}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="classic-bar classic-bar-mp"
                      style={{ "--fill": total > 0 ? cited / total : 0 } as CSSProperties}
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* The commands, the time and the place. */}
      <div className="classic-side">
        <nav aria-label="Sections" className="ff7-window classic-commands" onKeyDown={onKeyDown}>
          <ul>
            {SECTIONS.map((section, i) => (
              <li key={section.to}>
                <SectionLink
                  ref={ref(i)}
                  to={section.to}
                  word={section.name}
                  aria-current={i === active ? "true" : undefined}
                  onPointerEnter={() => {
                    choose(i);
                  }}
                  onFocus={() => {
                    choose(i);
                  }}
                  className="ff7-text classic-command"
                >
                  <span aria-hidden="true" className="ff7-hand">
                    ☞
                  </span>
                  {section.name}
                </SectionLink>
              </li>
            ))}
          </ul>
        </nav>
        <dl className="ff7-window classic-time ff7-text">
          <div>
            <dt className="ff7-label">Time</dt>
            <dd>{time}</dd>
          </div>
          {ENTITY_KINDS.map((kind) => (
            <div key={kind}>
              <dt className="ff7-label">{KIND_LABELS[kind].many}</dt>
              <dd>{items.length > 0 ? items.filter((e) => e.kind === kind).length : "…"}</dd>
            </div>
          ))}
        </dl>
        <p className="ff7-window classic-location ff7-text">Midgar · Timeline Analyzer</p>
      </div>
    </section>
  );
}
