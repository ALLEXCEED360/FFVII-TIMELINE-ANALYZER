import {
  Columns3,
  Compass,
  GitBranch,
  Hourglass,
  Library,
  type LucideIcon,
  Menu,
  Search,
  Waypoints,
  X,
} from "lucide-react";
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
export const NAV: readonly { to: string; label: string; page: PageName; icon: LucideIcon }[] = [
  { to: "/timeline", label: "Timeline", page: "timeline", icon: Hourglass },
  { to: "/compare", label: "Compare", page: "compare", icon: Columns3 },
  { to: "/divergence", label: "Divergence", page: "divergence", icon: GitBranch },
  { to: "/network", label: "Network", page: "network", icon: Waypoints },
  { to: "/explore", label: "Explore", page: "explore", icon: Compass },
  { to: "/archive", label: "Archive", page: "archive", icon: Library },
];

/**
 * The bar across the top of every page. On the home menu it is one of the menu's own windows, in
 * the original game's style (decision 0017); everywhere else it is the modern bar (decision 0020).
 */
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
        <div className="site-bar-tools">
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

/**
 * Every other page's bar, in the modern games' style: the name (back to the home menu), the
 * sections with the one you're in lit, and a search box. Too narrow for a row of sections, they
 * fold into a Menu panel.
 */
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
            <span className="ff7-text mbar-name">Timeline Analyzer</span>
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
                    className="ff7-text mbar-link"
                  >
                    <item.icon aria-hidden="true" className="mbar-icon" />
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
              className="ff7-text mbar-menu"
            >
              {menuOpen ? (
                <X aria-hidden="true" className="mbar-icon" />
              ) : (
                <Menu aria-hidden="true" className="mbar-icon" />
              )}
              Menu
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
