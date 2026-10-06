import { Outlet, ScrollRestoration, useLocation, useMatches } from "react-router";
import { CommandPalette, useSearchShortcut } from "../features/search/CommandPalette";
import { useMotionAttribute } from "../lib/motion";
import { BackButton } from "./BackButton";
import { Backdrop } from "./Backdrop";
import { BootScreen } from "./BootScreen";
import { Cursor } from "./Cursor";
import { SpoilerNotice } from "./SpoilerNotice";
import { SiteBar } from "./SiteBar";
import { Wipe } from "./Wipe";

/** Routes that draw edge to edge (the home menu) set `handle: { bleed: true }`. */
function useBleed(): boolean {
  return useMatches().some((match) => (match.handle as { bleed?: boolean } | undefined)?.bleed);
}

/**
 * The bar, search and the overlays around every page (blueprint §18, §20). There is no footer
 * (decision 0020): the disclaimer is on the title screen and the Credits page.
 */
export function AppShell() {
  useSearchShortcut();
  useMotionAttribute();
  const { pathname } = useLocation();
  const bleed = useBleed();

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
      <SiteBar />

      <main
        id="main"
        className={
          // Clipped sideways: a page arrives leaning, and mustn't make the window scroll meanwhile.
          bleed
            ? "flex flex-1 flex-col overflow-x-clip"
            : "mx-auto w-full max-w-(--page-max) flex-1 overflow-x-clip px-(--page-pad) py-8"
        }
      >
        {/* Every page but the home menu (which bleeds to the edges) has a way back. */}
        {!bleed && <BackButton />}
        {/* Keyed by path, so each new page settles in; changing only the query doesn't. */}
        <div key={pathname} className={`page-enter ${bleed ? "flex flex-1 flex-col" : ""}`}>
          <Outlet />
        </div>
      </main>

      {/* A new page opens at its top; Back returns to where you were on the page before. Keyed by
          the page, so a change of choices within it (an event chosen, a game shown) stays put. */}
      <ScrollRestoration getKey={(location) => location.pathname} />
      <CommandPalette />
      <Wipe />
      <BootScreen />
      <Cursor />
    </div>
  );
}
