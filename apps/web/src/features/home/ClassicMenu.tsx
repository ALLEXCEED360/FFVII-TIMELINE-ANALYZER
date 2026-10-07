import { type CSSProperties, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type { Reference, TitleCode } from "../../api/client";
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

/** Where a game's story runs, first part to last. */
function spanOf(reference: Reference, code: TitleCode): [string, string] | undefined {
  const segment = (id: string) => reference.segments.find((s) => s.id === id)?.name ?? id;
  const title = reference.titles.find((t) => t.code === code);
  if (!title) return undefined;
  if (code === "og") {
    const first = reference.segments[0];
    const last = reference.segments.at(-1);
    return first && last ? [first.name, last.name] : undefined;
  }
  if (title.coverage) return [segment(title.coverage.from), segment(title.coverage.to)];
  const first = title.units[0];
  const last = title.units.at(-1);
  return first && last ? [first.name, last.name] : undefined;
}

/** Which way a key moves the glove: the arrows, or W A S D as in most PC games. */
const DIRECTIONS: Record<string, "up" | "down" | "left" | "right" | "first" | "last"> = {
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
  Home: "first",
  End: "last",
};

/** Where the glove can be: the commands, the games, or the bar above. */
type Zone = "commands" | "party" | "bar";

/** Keys belong to whatever is being typed in, and to any open window (the title screen, search). */
function keysAreFree(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return false;
  const target = event.target as HTMLElement | null;
  if (target?.closest("input, textarea, select, [contenteditable='true']")) return false;
  return document.querySelector("[role='dialog']") === null;
}

/**
 * The home menu, as the original's pause menu (decision 0017). The four games are the party: a
 * portrait of each, its year as LV, where its story runs, its parts as HP, and how many of them
 * the archive cites as MP.
 * The sections are the commands, chosen with the glove; the help window along the top says what
 * the highlighted command or game is; the side windows keep the play time, the archive's size and
 * where you are. Every window unfolds from its middle, one after another, as the game's do.
 * The glove moves with the arrow keys or W A S D anywhere on the screen: up and down within the
 * commands or the games, left to the games, right back to the commands, and up from the top of
 * either to Search and Credits in the bar (decision 0028).
 */
export function ClassicMenu() {
  const reference = useReference();
  const entities = useEntities();
  const sources = useSources();
  const { active, choose, go, ref, current } = useMenu();
  // One glove, wherever it was last moved — by the keys or by pointing (decision 0028): the
  // column it's in, and the game it last pointed at there.
  const [zone, setZone] = useState<Zone>("commands");
  const [memberIndex, setMemberIndex] = useState(0);
  const memberLinks = useRef<(HTMLAnchorElement | null)[]>([]);
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

  // Where the glove is, kept up to date the moment it moves, so keys pressed quickly (or held)
  // each start from where the last one left it; the state above mirrors it for drawing.
  const glove = useRef<{ zone: Zone; memberIndex: number; active: number }>({
    zone: "commands",
    memberIndex: 0,
    active: 0,
  });
  const moveTo = (to: Zone) => {
    glove.current.zone = to;
    setZone(to);
  };
  const pointAt = (i: number) => {
    const count = titles.length;
    if (count === 0) return;
    const to = (i + count) % count;
    glove.current.memberIndex = to;
    moveTo("party");
    setMemberIndex(to);
    memberLinks.current[to]?.focus({ preventScroll: true });
  };
  const goTo = (i: number) => {
    const count = SECTIONS.length;
    const to = (i + count) % count;
    glove.current.active = to;
    moveTo("commands");
    go(to);
  };

  // The arrow keys and W A S D, anywhere on the screen. Up from the top of either column reaches
  // the bar above (Search, Credits); down from the bar goes back to where the glove came from.
  const actions = useRef({ pointAt, goTo, moveTo });
  useEffect(() => {
    actions.current = { pointAt, goTo, moveTo };
  });
  const bar = useRef<{ index: number; from: "commands" | "party" }>({ index: 0, from: "commands" });
  const barItems = () => [
    ...document.querySelectorAll<HTMLElement>("[data-menu-bar] > a, [data-menu-bar] > button"),
  ];
  // The bar lives outside this menu, so its glove is marked on its items directly.
  useEffect(() => {
    barItems().forEach((item, i) => {
      if (zone === "bar" && i === bar.current.index) item.setAttribute("data-selected", "");
      else item.removeAttribute("data-selected");
    });
  });
  useEffect(
    () => () => {
      barItems().forEach((item) => {
        item.removeAttribute("data-selected");
      });
    },
    [],
  );

  useEffect(() => {
    const toBar = (index: number, focus: boolean) => {
      const g = glove.current;
      if (g.zone !== "bar") bar.current.from = g.zone;
      bar.current.index = index;
      actions.current.moveTo("bar");
      if (focus) barItems()[index]?.focus({ preventScroll: true });
    };
    const back = () => {
      const g = glove.current;
      if (bar.current.from === "party") actions.current.pointAt(g.memberIndex);
      else actions.current.goTo(g.active);
    };

    const onKey = (event: KeyboardEvent) => {
      const direction = DIRECTIONS[event.key];
      if (!direction || !keysAreFree(event)) return;
      const g = glove.current;
      const { pointAt: point, goTo: goCommand } = actions.current;
      event.preventDefault();
      const items = barItems();

      if (g.zone === "bar") {
        if (direction === "down") back();
        else if (direction === "left" || direction === "right") {
          const step = direction === "left" ? -1 : 1;
          toBar((bar.current.index + step + items.length) % items.length, true);
        }
      } else if (direction === "left") {
        point(g.memberIndex);
      } else if (direction === "right") {
        goCommand(g.active);
      } else if (g.zone === "party") {
        if (direction === "up" && g.memberIndex === 0) toBar(bar.current.index, true);
        else {
          const to = { up: g.memberIndex - 1, down: g.memberIndex + 1, first: 0, last: -1 }[
            direction
          ];
          point(to);
        }
      } else if (direction === "up" && g.active === 0) {
        toBar(bar.current.index, true);
      } else {
        const to = { up: g.active - 1, down: g.active + 1, first: 0, last: -1 }[direction];
        goCommand(to);
      }
    };
    // Pointing at the bar, or reaching it with Tab, moves the glove there.
    const barItemOf = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      const item = target?.closest<HTMLElement>("[data-menu-bar] > a, [data-menu-bar] > button");
      return item ? barItems().indexOf(item) : -1;
    };
    const onPointer = (event: PointerEvent) => {
      const i = barItemOf(event);
      if (i >= 0 && (glove.current.zone !== "bar" || i !== bar.current.index)) toBar(i, true);
    };
    const onFocus = (event: FocusEvent) => {
      const i = barItemOf(event);
      if (i >= 0) toBar(i, false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerover", onPointer);
    document.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerover", onPointer);
      document.removeEventListener("focusin", onFocus);
    };
  }, []);
  const items = entities.data?.items ?? [];
  const pointed = zone === "party" ? titles[memberIndex] : undefined;
  const help = pointed
    ? `${pointed.name}. ${coverageText(reference.data, pointed.code)}`
    : current?.text;

  return (
    <section aria-labelledby="home-title" className="ff7 classic" data-zone={zone}>
      <h1 id="home-title" className="sr-only">
        One story. Four tellings. Final Fantasy VII Timeline Analyzer.
      </h1>
      <p aria-live="polite" className="ff7-window classic-help ff7-text">
        {help}
      </p>

      {/* The party: the four games. */}
      <div className="ff7-window classic-party" data-pointing={zone === "party" ? "" : undefined}>
        <ul aria-label="The four tellings" className="classic-members">
          {titles.map((title, i) => {
            const art = artwork(TITLE_ART[title.code]);
            const units = sources.data?.titles.find((t) => t.code === title.code)?.units ?? [];
            const total = units.length || title.units.length;
            const cited = units.filter((u) => u.citations > 0).length;
            const span = reference.data && spanOf(reference.data, title.code);
            return (
              <li
                key={title.code}
                style={{ "--i": i, "--c": TITLE_COLOR[title.code] } as CSSProperties}
                className="classic-member"
              >
                <Link
                  ref={(el) => {
                    memberLinks.current[i] = el;
                  }}
                  to={archiveTitlePath(title.code)}
                  className="classic-member-link"
                  data-selected={zone === "party" && memberIndex === i ? "" : undefined}
                  onPointerEnter={() => {
                    if (zone !== "party" || memberIndex !== i) pointAt(i);
                  }}
                  onFocus={() => {
                    glove.current.memberIndex = i;
                    setMemberIndex(i);
                    moveTo("party");
                  }}
                >
                  <span aria-hidden="true" className="ff7-hand classic-member-hand">
                    ☞
                  </span>
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
                    {span && (
                      <span className="ff7-text classic-span">
                        <span className="sr-only">Runs from </span>
                        <span>{span[0]}</span>
                        <span aria-hidden="true" className="classic-span-track" />
                        <span className="sr-only"> to </span>
                        <span>{span[1]}</span>
                      </span>
                    )}
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
        <nav aria-label="Sections" className="ff7-window classic-commands">
          <ul>
            {SECTIONS.map((section, i) => (
              <li key={section.to}>
                <SectionLink
                  ref={ref(i)}
                  to={section.to}
                  word={section.name}
                  aria-current={i === active ? "true" : undefined}
                  onPointerEnter={() => {
                    if (zone !== "commands" || active !== i) goTo(i);
                  }}
                  onFocus={() => {
                    glove.current.active = i;
                    choose(i);
                    moveTo("commands");
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
