import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { type PageName, preloadPage } from "../app/pages";
import { SHORTCUT_LABEL } from "../features/search/CommandPalette";
import { useMediaQuery } from "../lib/useMediaQuery";
import { useUi } from "../stores/ui";
import { SectionNavLink } from "./Wipe";
import "./ff7.css";
import "./modern.css";

/** The sections, in menu order. The home menu lists the same ones (features/home/menu.ts). */
export const NAV: readonly { to: string; label: string; page: PageName }[] = [
  { to: "/timeline", label: "Timeline", page: "timeline" },
  { to: "/compare", label: "Compare", page: "compare" },
  { to: "/divergence", label: "Divergence", page: "divergence" },
  { to: "/network", label: "Network", page: "network" },
  { to: "/explore", label: "Explore", page: "explore" },
  { to: "/archive", label: "Archive", page: "archive" },
];

/** The top bar: one of the menu's windows on the home page, the modern bar everywhere else. */
export function SiteBar() {
  const { pathname } = useLocation();
  return pathname === "/" ? <MenuBar /> : <ModernBar pathname={pathname} />;
}

function useOpenSearch() {
  const openPalette = useUi((s) => s.setPaletteOpen);
  return () => {
    openPalette(true);
  };
}

const Hand = () => (
  <span aria-hidden="true" className="ff7-hand">
    ☞
  </span>
);

/** The home menu's bar: the name, search and the credits, in one of its windows. */
function MenuBar() {
  const openSearch = useOpenSearch();
  return (
    <header className="ff7 site-bar">
      <div className="ff7-window site-bar-window">
        <Link to="/" aria-label="Timeline Analyzer — home menu" className="site-bar-logo">
          <span aria-hidden="true" className="materia site-bar-orb" />
          <span aria-hidden="true" className="flex flex-col">
            <span className="ff7-text ff7-label site-bar-series">Final Fantasy VII</span>
            <span className="ff7-text site-bar-name">Timeline Analyzer</span>
          </span>
        </Link>
        <div className="site-bar-tools" data-menu-bar="">
          <button
            type="button"
            onClick={openSearch}
            aria-keyshortcuts="Control+K Meta+K"
            aria-label="Search"
            title={`Search (${SHORTCUT_LABEL})`}
            className="ff7-text site-bar-item"
          >
            <Hand />
            <Search aria-hidden="true" />
            Search
          </button>
          <Link to="/credits" className="ff7-text site-bar-item">
            <Hand />
            Credits
          </Link>
        </div>
      </div>
    </header>
  );
}

/** The modern bar: home, the sections (in a Menu panel when narrow) and search. */
function ModernBar({ pathname }: { pathname: string }) {
  const openSearch = useOpenSearch();
  const wide = useMediaQuery("(min-width: 80rem)");
  // The Menu panel belongs to the page it was opened on, so going somewhere closes it.
  const [menuOn, setMenuOn] = useState<string | null>(null);
  const menuOpen = menuOn === pathname;
  // Escape closes it too.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="mbar">
      <div className="mbar-inner">
        <Link to="/" aria-label="Timeline Analyzer — home menu" className="mbar-logo">
          <span aria-hidden="true" className="materia mbar-orb" />
          <span aria-hidden="true" className="mbar-title">
            <span className="mbar-series">Final Fantasy VII</span>
            <span className="mbar-name">Timeline Analyzer</span>
          </span>
        </Link>

        {(wide || menuOpen) && (
          <nav
            id="site-sections"
            aria-label="Main"
            className={wide ? "mbar-nav" : "m-panel mbar-drop"}
          >
            <ul>
              {NAV.map((item) => (
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
                    className="mbar-link"
                  >
                    {item.label}
                  </SectionNavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="mbar-tools">
          <button
            type="button"
            onClick={openSearch}
            aria-keyshortcuts="Control+K Meta+K"
            aria-label="Search"
            className="mbar-search"
          >
            <Search aria-hidden="true" className="mbar-icon" />
            <span className="mbar-search-text">Search the archive…</span>
          </button>
          {!wide && (
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="site-sections"
              onClick={() => {
                setMenuOn(menuOpen ? null : pathname);
              }}
              className="mbar-menu"
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
