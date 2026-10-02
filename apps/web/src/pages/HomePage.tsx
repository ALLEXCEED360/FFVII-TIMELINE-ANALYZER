import { type CSSProperties, type KeyboardEvent, useRef, useState } from "react";
import { Link } from "react-router";
import { useEntities, useReference } from "../api/queries";
import { SECTION_ART, TITLE_ART } from "../art/manifest";
import { Artwork } from "../components/Artwork";
import { useBackdrop } from "../components/Backdrop";
import { SectionLink } from "../components/Wipe";
import { type PageName, preloadPage } from "../app/pages";
import { ENTITY_KINDS, KIND_LABELS, archiveTitlePath } from "../lib/paths";
import { TITLE_COLOR } from "../lib/titles";
import { useUi } from "../stores/ui";

/** The sections, each with its materia colour: green, blue, red, yellow, purple and white. */
const MENU: readonly {
  to: string;
  page: PageName;
  name: string;
  sub: string;
  text: string;
  paint: string;
  art: string;
}[] = [
  {
    to: "/timeline",
    page: "timeline",
    name: "Timeline",
    sub: "Chronology",
    text: "Every event in the order it happens in the story, or in the order each game shows it.",
    paint: "#4fd98f",
    art: SECTION_ART.timeline,
  },
  {
    to: "/compare",
    page: "compare",
    name: "Compare",
    sub: "Side by side",
    text: "The same event, character or place across the titles, with what changed between them.",
    paint: "#5aa9ff",
    art: SECTION_ART.compare,
  },
  {
    to: "/divergence",
    page: "divergence",
    name: "Divergence",
    sub: "Where they part",
    text: "Pick a moment and watch the shared history fork into a line for each telling.",
    paint: "#ff5f5f",
    art: SECTION_ART.divergence,
  },
  {
    to: "/network",
    page: "network",
    name: "Network",
    sub: "Connections",
    text: "Who is bound to whom, and the strongest path between any two of them.",
    paint: "#f4c84a",
    art: SECTION_ART.network,
  },
  {
    to: "/explore",
    page: "explore",
    name: "Explore",
    sub: "Every entry",
    text: "Browse every character, event, location and organization in the archive.",
    paint: "#b98cff",
    art: SECTION_ART.explore,
  },
  {
    to: "/archive",
    page: "archive",
    name: "Archive",
    sub: "Sources",
    text: "Each game part by part, what cites it, and the research behind every fact.",
    paint: "#e9f3ff",
    art: SECTION_ART.archive,
  },
];

// The words sit along an arc, like the game's menu: a tilt from −5° to +4° and a gentle bow.
const TILT = [-5, -3, -1.5, 0, 2, 4];
const BOW = [0, 1.4, 2.4, 2.8, 2.4, 1.3];

/** The entry point (blueprint §20): a game's main menu, then the titles and the archive in numbers. */
export function HomePage() {
  const reference = useReference();
  const entities = useEntities();
  const items = entities.data?.items ?? [];
  const [active, setActive] = useState(0);
  const booted = useUi((s) => s.booted);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const current = MENU[active] ?? MENU[0];
  useBackdrop(current?.art, { strength: 0.6, side: "left" });

  const choose = (i: number) => {
    setActive(i);
    const item = MENU[i];
    if (item) preloadPage(item.page);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const step = { ArrowDown: 1, ArrowUp: -1, Home: -active, End: MENU.length - 1 - active }[
      event.key
    ];
    if (step === undefined) return;
    event.preventDefault();
    const next = (active + step + MENU.length) % MENU.length;
    choose(next);
    links.current[next]?.focus();
  };

  if (!current) return null;
  const paint = { "--paint": current.paint } as CSSProperties;

  return (
    <div className="flex flex-col">
      <section
        aria-labelledby="home-title"
        className="relative isolate flex min-h-[calc(100dvh-4.75rem)] flex-col justify-center overflow-hidden px-4 py-10 sm:px-8 lg:px-[max(2rem,calc((100vw-96rem)/2+2rem))]"
        style={paint}
      >
        <div className="relative z-10 flex max-w-2xl flex-col gap-4">
          <p className="eyebrow">Final Fantasy VII · narrative archive</p>
          <h1
            id="home-title"
            className="font-title text-[clamp(2.1rem,4.4vw,3.6rem)] leading-[0.92] font-black tracking-tight text-steel-100 uppercase"
            style={{ textShadow: "0.04em 0.04em 0 var(--color-mako-700)" }}
          >
            One story.
            <br />
            <span className="text-mako-300">Four tellings.</span>
          </h1>
          <p className="max-w-lg text-steel-300">
            How <em>Final Fantasy VII</em>, <em>Remake</em>, <em>INTERmission</em> and{" "}
            <em>Rebirth</em> tell the same events, characters and places — where they agree, where
            they change, and where they part.
          </p>
        </div>

        {/* The menu. Arrow keys move along it; Enter opens, behind the wipe. */}
        <nav aria-label="Sections" className="relative z-10 mt-8 lg:mt-10" onKeyDown={onKeyDown}>
          <ol key={String(booted)} className="flex flex-col gap-2 lg:gap-0">
            {MENU.map((item, i) => {
              const on = i === active;
              return (
                <li
                  key={item.to}
                  className="rise lg:[margin-left:var(--bow)] lg:[transform:rotate(var(--tilt))]"
                  style={
                    {
                      "--i": i,
                      "--tilt": `${String(TILT[i] ?? 0)}deg`,
                      "--bow": `${String(BOW[i] ?? 0)}rem`,
                    } as CSSProperties
                  }
                >
                  <SectionLink
                    ref={(el) => {
                      links.current[i] = el;
                    }}
                    to={item.to}
                    word={item.name}
                    onPointerEnter={() => {
                      choose(i);
                    }}
                    onFocus={() => {
                      choose(i);
                    }}
                    aria-current={on ? "true" : undefined}
                    className="group relative flex w-max max-w-full flex-wrap items-baseline gap-x-3 py-0.5 outline-offset-4 lg:py-0"
                  >
                    {/* The chosen word's slab of paint, running off the left edge. */}
                    <span
                      aria-hidden="true"
                      className={`absolute top-[8%] -bottom-[6%] -left-[60vw] -right-[0.35em] origin-right -skew-x-[18deg] transition-transform duration-300 ease-[var(--ease-out-expo)] ${
                        on ? "scale-x-100" : "scale-x-0"
                      }`}
                      style={{ background: item.paint }}
                    >
                      <span className="absolute inset-x-0 -bottom-[0.3rem] h-[0.3rem] bg-ink/70" />
                    </span>
                    <span
                      aria-hidden="true"
                      className={`relative font-mono text-xs lg:hidden ${on ? "text-ink" : "text-mako-300"}`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`relative font-title leading-[0.82] font-black tracking-[-0.02em] uppercase transition-[font-size,color] duration-300 ease-[var(--ease-out-expo)] ${
                        on
                          ? "text-[clamp(2.5rem,6vw,5.4rem)] text-ink"
                          : "text-[clamp(2.1rem,4.2vw,3.7rem)] text-steel-100 group-hover:text-mako-200"
                      }`}
                      style={{
                        textShadow: on
                          ? "0.04em 0.04em 0 rgb(243 237 224 / 0.9)"
                          : "0.05em 0.05em 0 var(--color-ink)",
                      }}
                    >
                      <span className="text-[1.3em]">{item.name.slice(0, 1)}</span>
                      {item.name.slice(1)}
                    </span>
                    <span
                      className={`relative font-display text-xs font-bold tracking-[0.14em] uppercase italic sm:text-sm ${
                        on ? "text-ink" : "text-steel-400"
                      }`}
                    >
                      <span className="sr-only"> — </span>
                      {item.sub}
                    </span>
                  </SectionLink>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* The corner: a giant number and the section's name standing on end. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-4 right-4 hidden flex-col items-end lg:flex xl:right-10"
        >
          <span
            key={active}
            className="rise font-title text-[clamp(7rem,24vh,15rem)] leading-[0.8] font-black text-steel-100"
            style={{ textShadow: `0.04em 0.04em 0 ${current.paint}` }}
          >
            {String(active + 1).padStart(2, "0")}
          </span>
          <span
            className="mt-6 mr-2 font-display text-[clamp(1.2rem,2.2vw,2rem)] font-bold tracking-[0.5em] text-steel-100 uppercase italic [writing-mode:vertical-rl]"
            style={{ textShadow: `0.08em 0.08em 0 ${current.paint}` }}
          >
            {current.name}
          </span>
        </div>

        {/* The brief: what the chosen section holds. */}
        <div
          aria-live="polite"
          className="panel absolute right-4 bottom-6 z-10 hidden w-[min(27rem,34vw)] border-l-4 p-5 lg:block xl:right-10"
          style={{ borderLeftColor: current.paint }}
        >
          <p className="eyebrow" style={{ color: current.paint }}>
            {current.sub}
          </p>
          <p className="mt-1 font-title text-3xl leading-none font-black text-steel-100 uppercase">
            {current.name}
          </p>
          <p className="mt-2 text-sm text-steel-300">{current.text}</p>
          <p aria-hidden="true" className="mt-4 flex gap-5 border-t border-steel-100/10 pt-3">
            <span className="hint">
              <span className="hint-key">↑</span>
              <span className="hint-key">↓</span>
              Move
            </span>
            <span className="hint">
              <span className="hint-key">↵</span>
              Open
            </span>
          </p>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-14 px-4 pt-6 pb-14 sm:px-6">
        <section aria-labelledby="home-titles" className="flex flex-col gap-5">
          <h2 id="home-titles" className="section-title">
            The four tellings
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(reference.data?.titles ?? []).map((title, i) => (
              <li key={title.code} className="rise" style={{ "--i": i } as CSSProperties}>
                <Link
                  to={archiveTitlePath(title.code)}
                  className="panel panel-link group flex h-full flex-col overflow-hidden"
                >
                  <span className="relative block aspect-[4/3] overflow-hidden">
                    <Artwork
                      id={TITLE_ART[title.code]}
                      decorative
                      className="size-full object-cover saturate-[0.85] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-105 group-hover:saturate-100"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/10 to-transparent" />
                    <span
                      aria-hidden="true"
                      className="absolute top-3 left-0 h-1.5 w-16 -skew-x-[20deg]"
                      style={{ background: TITLE_COLOR[title.code] }}
                    />
                  </span>
                  <span className="relative -mt-10 flex flex-col gap-1 px-4 pb-4">
                    <span className="font-title text-2xl leading-none font-black text-steel-100 uppercase">
                      {title.shortName}
                    </span>
                    <span className="text-sm text-steel-300">{title.name}</span>
                    <span className="label mt-2">
                      {title.released.slice(0, 4)} ·{" "}
                      {title.units.length > 0
                        ? `${String(title.units.filter((u) => /^\d+$/.test(u.key)).length)} chapters`
                        : "3 discs"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {items.length > 0 && (
          <section aria-labelledby="home-dataset" className="flex flex-col gap-5">
            <h2 id="home-dataset" className="section-title">
              The archive in numbers
            </h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ENTITY_KINDS.map((kind) => (
                <div key={kind} className="panel flex flex-col-reverse gap-1 p-4">
                  <dt className="label">
                    <Link to={`/explore?kind=${kind}`} className="hover:text-mako-300">
                      {KIND_LABELS[kind].many}
                    </Link>
                  </dt>
                  <dd className="font-display text-5xl leading-none font-extrabold text-steel-100 italic">
                    {items.filter((e) => e.kind === kind).length}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-steel-400">
              Every fact cites the disc or chapter it comes from, and was checked against the games.{" "}
              <Link
                to="/archive/research"
                className="text-steel-200 underline underline-offset-2 hover:text-mako-300"
              >
                How facts are checked
              </Link>
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
