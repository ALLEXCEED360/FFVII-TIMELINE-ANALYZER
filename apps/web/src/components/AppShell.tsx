import { Search, Settings2 } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useMatches } from "react-router";
import {
  CommandPalette,
  SHORTCUT_LABEL,
  useSearchShortcut,
} from "../features/search/CommandPalette";
import { type PageName, preloadPage } from "../app/pages";
import { useMotionAttribute } from "../lib/motion";
import { useUi } from "../stores/ui";
import { Backdrop } from "./Backdrop";
import { BootScreen } from "./BootScreen";
import { Cursor } from "./Cursor";
import { SpoilerNotice } from "./SpoilerNotice";
import { SectionNavLink, Wipe } from "./Wipe";
import { HomeBar } from "../features/home/HomeBar";

/** The sections, in menu order. The home menu lists the same ones (features/home/menu.ts). */
export const NAV: readonly { to: string; label: string; page: PageName }[] = [
  { to: "/timeline", label: "Timeline", page: "timeline" },
  { to: "/compare", label: "Compare", page: "compare" },
  { to: "/divergence", label: "Divergence", page: "divergence" },
  { to: "/network", label: "Network", page: "network" },
  { to: "/explore", label: "Explore", page: "explore" },
  { to: "/archive", label: "Archive", page: "archive" },
];

/** Routes that draw edge to edge (the home menu) set `handle: { bleed: true }`. */
function useBleed(): boolean {
  return useMatches().some((match) => (match.handle as { bleed?: boolean } | undefined)?.bleed);
}

/** Header, navigation, search and footer around every page (blueprint §18, §20, §26). */
export function AppShell() {
  useSearchShortcut();
  useMotionAttribute();
  const openPalette = useUi((s) => s.setPaletteOpen);
  const { pathname } = useLocation();
  const bleed = useBleed();
  const isHome = pathname === "/";

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-paper focus:px-3 focus:py-1.5 focus:font-display focus:font-bold focus:text-ink focus:uppercase"
      >
        Skip to content
      </a>
      <Backdrop />
      <SpoilerNotice />
      {/* The home menu has a bar of its own, as one of its windows; it lists the sections as
          commands, so the bar doesn't repeat them. */}
      {isHome ? (
        <HomeBar />
      ) : (
        <header className="relative z-30 bg-gradient-to-b from-void/95 to-void/60 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[96rem] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
            <Link
              to="/"
              className="group flex items-center gap-3"
              aria-label="Timeline Analyzer — home menu"
            >
              <span
                aria-hidden="true"
                className="materia size-6 transition-transform group-hover:scale-110"
              />
              <span aria-hidden="true" className="flex flex-col leading-none">
                <span className="font-mono text-[0.5625rem] tracking-[0.32em] text-mako-300 uppercase">
                  Final Fantasy VII
                </span>
                <span className="font-display text-[1.35rem] font-extrabold tracking-wide text-steel-100 uppercase italic transition-colors group-hover:text-mako-200">
                  Timeline Analyzer
                </span>
              </span>
            </Link>
            {/* On narrow screens the sections scroll sideways on their own row; the page doesn't. */}
            {
              <nav
                aria-label="Main"
                className="order-last -mx-4 w-screen overflow-x-auto px-4 lg:order-none lg:mx-0 lg:w-auto lg:overflow-visible lg:px-0"
              >
                <ul className="flex w-max gap-0.5">
                  {NAV.map((item, i) => (
                    <li key={item.to}>
                      <SectionNavLink
                        to={item.to}
                        word={item.label}
                        // Start loading the section's code before the click lands.
                        onPointerEnter={() => {
                          preloadPage(item.page);
                        }}
                        onFocus={() => {
                          preloadPage(item.page);
                        }}
                        className={({ isActive }) =>
                          `slant flex items-baseline gap-1.5 px-4 py-1.5 transition-colors duration-200 ${
                            isActive
                              ? "bg-paper text-ink"
                              : "text-steel-300 hover:bg-steel-100/10 hover:text-steel-100"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              aria-hidden="true"
                              className={`font-mono text-[0.5625rem] ${isActive ? "text-mako-700" : "text-mako-400"}`}
                            >
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="font-display text-[0.9375rem] font-bold tracking-[0.08em] uppercase italic">
                              {item.label}
                            </span>
                          </>
                        )}
                      </SectionNavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            }
            <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
              <button
                type="button"
                onClick={() => {
                  openPalette(true);
                }}
                className="btn min-w-0 flex-1 justify-between normal-case not-italic sm:min-w-52 sm:flex-none"
                aria-keyshortcuts="Control+K Meta+K"
                aria-label="Search"
              >
                <span className="flex items-center gap-2 font-sans text-sm font-normal tracking-normal text-steel-300 normal-case">
                  <Search aria-hidden="true" className="size-3.5" />
                  <span className="hidden min-[26rem]:inline">Search…</span>
                </span>
                <kbd className="hidden font-mono text-[10px] text-steel-400 not-italic sm:inline">
                  {SHORTCUT_LABEL}
                </kbd>
              </button>
              <NavLink
                to="/settings"
                aria-label="Settings"
                className={({ isActive }) =>
                  `btn px-3! py-1.5! ${isActive ? "bg-paper! text-ink!" : ""}`
                }
              >
                <Settings2 aria-hidden="true" className="size-4" />
              </NavLink>
            </div>
          </div>
          <div aria-hidden="true" className="rule absolute inset-x-0 bottom-0" />
        </header>
      )}

      <main
        id="main"
        className={
          // Clipped sideways: a page arrives leaning, and mustn't make the window scroll meanwhile.
          bleed
            ? "flex flex-1 flex-col overflow-x-clip"
            : "mx-auto w-full max-w-[96rem] flex-1 overflow-x-clip px-4 py-7 sm:px-6"
        }
      >
        {/* Keyed by path, so each new page settles in; changing only the query doesn't. */}
        <div key={pathname} className={`page-enter ${bleed ? "flex flex-1 flex-col" : ""}`}>
          <Outlet />
        </div>
      </main>

      {/* The home menu has its own windows for all of this; the footer would only repeat them. */}
      {!isHome && (
        <footer className="relative border-t border-steel-100/10 bg-void/85 px-4 py-4 text-xs text-steel-400 sm:px-6">
          <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <p className="max-w-3xl">
              Non-commercial fan project. Not affiliated with or endorsed by Square Enix.{" "}
              <em>Final Fantasy VII</em> and all related names and artwork belong to Square Enix.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <p aria-hidden="true" className="hidden items-center gap-5 lg:flex">
                <span className="hint">
                  <span className="hint-key">{SHORTCUT_LABEL.replace(/\s*K$/, "")}</span>
                  <span className="hint-key">K</span>
                  Search
                </span>
                <span className="hint">
                  <span className="hint-key">⇥</span>
                  Move
                </span>
                <span className="hint">
                  <span className="hint-key">↵</span>
                  Confirm
                </span>
              </p>
              <Link
                to="/credits"
                className="inline-block min-h-6 py-1 font-display text-sm font-bold tracking-widest text-steel-200 uppercase italic hover:text-mako-300"
              >
                Credits
              </Link>
              <Link
                to="/settings"
                className="inline-block min-h-6 py-1 font-display text-sm font-bold tracking-widest text-steel-200 uppercase italic hover:text-mako-300"
              >
                Settings
              </Link>
            </div>
          </div>
        </footer>
      )}

      <CommandPalette />
      <Wipe />
      <BootScreen />
      <Cursor />
    </div>
  );
}
