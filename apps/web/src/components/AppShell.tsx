import { NavLink, Outlet } from "react-router";
import {
  CommandPalette,
  SHORTCUT_LABEL,
  useSearchShortcut,
} from "../features/search/CommandPalette";
import { useUi } from "../stores/ui";
import { SpoilerNotice } from "./SpoilerNotice";

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/timeline", label: "Timeline", end: false },
  { to: "/compare", label: "Compare", end: false },
  { to: "/network", label: "Network", end: false },
  { to: "/explore", label: "Explore", end: false },
] as const;

/** Header, navigation, search and footer around every page (blueprint §18, §20, §26). */
export function AppShell() {
  useSearchShortcut();
  const openPalette = useUi((s) => s.setPaletteOpen);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-night-900 focus:p-2"
      >
        Skip to content
      </a>
      <SpoilerNotice />
      <header className="border-b border-night-700 bg-night-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3">
          <NavLink to="/" className="group flex items-center gap-3">
            <span
              aria-hidden="true"
              className="size-3 rotate-45 border-2 border-mako-400 transition group-hover:bg-mako-400"
            />
            <span className="font-display text-sm font-semibold tracking-[0.18em] text-steel-100 uppercase">
              FFVII <span className="text-mako-300">Timeline Analyzer</span>
            </span>
          </NavLink>
          <nav aria-label="Main">
            <ul className="flex gap-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `block rounded px-3 py-1.5 font-mono text-xs tracking-[0.12em] uppercase transition ${
                        isActive
                          ? "bg-mako-900/60 text-mako-200"
                          : "text-steel-400 hover:text-steel-100"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <button
            type="button"
            onClick={() => {
              openPalette(true);
            }}
            className="btn ml-auto min-w-48 justify-between text-steel-400 normal-case"
            aria-keyshortcuts="Control+K Meta+K"
          >
            <span>Search…</span>
            <kbd className="rounded border border-night-600 px-1.5 text-[10px]">
              {SHORTCUT_LABEL}
            </kbd>
          </button>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[96rem] flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-night-800 px-4 py-5 text-xs text-steel-400">
        <p className="mx-auto max-w-[96rem]">
          Non-commercial fan project. Not affiliated with or endorsed by Square Enix.{" "}
          <em>Final Fantasy VII</em> and all related names belong to Square Enix.
        </p>
      </footer>

      <CommandPalette />
    </div>
  );
}
