import { type ComponentProps, type MouseEvent, useCallback, useEffect, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { create } from "zustand";
import { useReducedMotion } from "../lib/motion";
import "./Wipe.css";

// The transition between sections, as one of the original game's windows (decision 0018). The
// screen dims and a blue window draws across it as a line, then unfolds from its middle to fill
// it: the white glove points at where you're going, and an ATB gauge fills while the router does
// its work (including loading the page's code). When the new path has arrived the gauge is full,
// and the window folds back to a line and is gone, over the new page.
//
// Only moving between sections plays it — from the navigation and the home menu. Everything
// else (links inside a page, back and forward) just arrives. Under reduced motion there is none
// and navigation is immediate.

/** The window takes this long to cover the screen; the route changes after. */
export const COVER_MS = 650;
/** The word stays up at least this long, so it can be read even when the page is instant. */
const HOLD_MS = 500;
const REVEAL_MS = 700;
/** If the navigation never arrives, lift anyway. */
const MAX_MS = 5000;

interface WipeState {
  word: string;
  phase: "cover" | "reveal";
  since: number;
  /** The path it left from: any other means the new page has arrived. */
  from: string;
}

const useWipeStore = create<{ wipe: WipeState | null }>()(() => ({ wipe: null }));

/** Navigate to a section behind the wipe. */
export function useSectionNavigate() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { pathname } = useLocation();
  return useCallback(
    (to: string, word: string) => {
      const path = to.split("?")[0] ?? to;
      if (reduced || path === pathname) {
        void navigate(to);
        return;
      }
      if (useWipeStore.getState().wipe) return;
      useWipeStore.setState({ wipe: { word, phase: "cover", since: Date.now(), from: pathname } });
      window.setTimeout(() => void navigate(to), COVER_MS);
    },
    [navigate, reduced, pathname],
  );
}

/** Plain clicks go through the wipe; a new tab or window (modifier keys) is left to the browser. */
function useWipeClick(
  to: string,
  word: string,
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void,
) {
  const go = useSectionNavigate();
  return (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    go(to, word);
  };
}

/** A NavLink to a section, played through the wipe. */
export function SectionNavLink({
  to,
  word,
  onClick,
  ...props
}: ComponentProps<typeof NavLink> & { to: string; word: string }) {
  return <NavLink to={to} onClick={useWipeClick(to, word, onClick)} {...props} />;
}

/** A Link to a section, played through the wipe. */
export function SectionLink({
  to,
  word,
  onClick,
  ...props
}: ComponentProps<typeof Link> & { to: string; word: string }) {
  return <Link to={to} onClick={useWipeClick(to, word, onClick)} {...props} />;
}

export function Wipe() {
  const wipe = useWipeStore((s) => s.wipe);
  const { pathname } = useLocation();
  const timers = useRef<number[]>([]);

  // Reveal once the new path has arrived, after the hold.
  useEffect(() => {
    const current = useWipeStore.getState().wipe;
    if (current?.phase !== "cover" || pathname === current.from) return;
    // The new screen starts at its top, like any new screen of a game.
    window.scrollTo(0, 0);
    const wait = Math.max(0, COVER_MS + HOLD_MS - (Date.now() - current.since));
    timers.current.push(
      window.setTimeout(() => {
        useWipeStore.setState({ wipe: { ...current, phase: "reveal" } });
        timers.current.push(
          window.setTimeout(() => {
            useWipeStore.setState({ wipe: null });
          }, REVEAL_MS + 200),
        );
      }, wait),
    );
  }, [pathname, wipe]);

  // The safety catch.
  useEffect(() => {
    if (!wipe) return;
    const timer = window.setTimeout(() => {
      useWipeStore.setState({ wipe: null });
    }, MAX_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [wipe]);

  useEffect(
    () => () => {
      for (const t of timers.current) window.clearTimeout(t);
    },
    [],
  );

  // The window's lettering is the game's pixel font: have it ready before the first change.
  // (Not every environment has the font loading API: the tests' DOM doesn't.)
  useEffect(() => {
    if (!("fonts" in document)) return;
    void document.fonts.load('32px "Reactor7"').catch(() => undefined);
  }, []);

  if (!wipe) return null;

  return (
    <div
      aria-hidden="true"
      data-phase={wipe.phase}
      className="wipe pointer-events-none fixed inset-0 z-[80] overflow-hidden"
    >
      <div className="wipe-dim" />
      <div className="wipe-window">
        <span className="wipe-name">
          <span className="wipe-hand">☞</span>
          {wipe.word}
        </span>
        <span className="wipe-gauge-row">
          <span className="wipe-label">Loading</span>
          <span className="wipe-gauge" />
        </span>
      </div>
    </div>
  );
}
