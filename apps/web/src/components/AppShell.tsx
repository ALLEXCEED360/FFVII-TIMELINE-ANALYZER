import { NavLink, Outlet } from "react-router";
import {
  CommandPalette,
  SHORTCUT_LABEL,
  useSearchShortcut,
} from "../features/search/CommandPalette";
import { type PageName, preloadPage } from "../app/pages";
import { useMotionAttribute } from "../lib/motion";
import { type MotionSetting, useUi } from "../stores/ui";
import { SpoilerNotice } from "./SpoilerNotice";

const NAV: readonly { to: string; label: string; end: boolean; page?: PageName }[] = [
  { to: "/", label: "Home", end: true },
  { to: "/timeline", label: "Timeline", end: false, page: "timeline" },
  { to: "/compare", label: "Compare", end: false, page: "compare" },
  { to: "/network", label: "Network", end: false, page: "network" },
  { to: "/divergence", label: "Divergence", end: false, page: "divergence" },
  { to: "/explore", label: "Explore", end: false, page: "explore" },
  { to: "/archive", label: "Archive", end: false, page: "archive" },
];

/** Header, navigation, search and footer around every page (blueprint §18, §20, §26). */
export function AppShell() {
  useSearchShortcut();
  useMotionAttribute();
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
          {/* On narrow screens the sections scroll sideways on their own row; the page doesn't. */}
          <nav
            aria-label="Main"
            className="order-last -mx-4 w-screen overflow-x-auto px-4 lg:order-none lg:mx-0 lg:w-auto lg:overflow-visible lg:px-0"
          >
            <ul className="flex w-max gap-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    // Start loading the section's code before the click lands.
                    onPointerEnter={() => {
                      if (item.page) preloadPage(item.page);
                    }}
                    onFocus={() => {
                      if (item.page) preloadPage(item.page);
                    }}
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
            className="btn ml-auto min-w-0 flex-1 justify-between text-steel-400 normal-case sm:min-w-48 sm:flex-none"
            aria-keyshortcuts="Control+K Meta+K"
          >
            <span>Search…</span>
            <kbd className="hidden rounded border border-night-600 px-1.5 text-[10px] sm:inline">
              {SHORTCUT_LABEL}
            </kbd>
          </button>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[96rem] flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-night-800 px-4 py-5 text-xs text-steel-400">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-4">
          <p>
            Non-commercial fan project. Not affiliated with or endorsed by Square Enix.{" "}
            <em>Final Fantasy VII</em> and all related names belong to Square Enix.
          </p>
          <MotionControl />
        </div>
      </footer>

      <CommandPalette />
    </div>
  );
}

const MOTION_OPTIONS: readonly { value: MotionSetting; label: string }[] = [
  { value: "system", label: "System" },
  { value: "reduced", label: "Reduced" },
  { value: "full", label: "Full" },
];

/** The reduced-motion option (blueprint §33): follow the system, or choose. Remembered. */
function MotionControl() {
  const motion = useUi((s) => s.motion);
  const setMotion = useUi((s) => s.setMotion);
  return (
    <fieldset className="flex items-center gap-2">
      <legend className="sr-only">Motion</legend>
      <span aria-hidden="true" className="label">
        Motion
      </span>
      <div className="flex gap-1">
        {MOTION_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="btn min-h-6 cursor-pointer px-2 py-0.5 has-checked:border-mako-400 has-checked:text-mako-200 has-focus-visible:outline-2 has-focus-visible:outline-mako-400"
          >
            <input
              type="radio"
              name="motion"
              value={option.value}
              checked={motion === option.value}
              onChange={() => {
                setMotion(option.value);
              }}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
