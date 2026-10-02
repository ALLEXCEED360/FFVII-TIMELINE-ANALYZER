import { Link } from "react-router";
import { SHORTCUT_LABEL } from "../search/CommandPalette";
import { useUi } from "../../stores/ui";

/**
 * The bar across the top of the home menu, as one of the menu's own windows: the same width and
 * scale, so the two line up. It carries the name, search and the credits; the sections and Config
 * are the menu's commands, so they aren't repeated here.
 */
export function HomeBar() {
  const openPalette = useUi((s) => s.setPaletteOpen);
  return (
    <header className="ff7 home-bar">
      <div className="ff7-window home-bar-window">
        <Link to="/" aria-label="Timeline Analyzer — home menu" className="home-bar-logo">
          <span aria-hidden="true" className="materia home-bar-orb" />
          <span aria-hidden="true" className="flex flex-col">
            <span className="ff7-text ff7-label home-bar-series">Final Fantasy VII</span>
            <span className="ff7-text home-bar-name">Timeline Analyzer</span>
          </span>
        </Link>
        <div className="home-bar-tools">
          <button
            type="button"
            onClick={() => {
              openPalette(true);
            }}
            aria-keyshortcuts="Control+K Meta+K"
            aria-label="Search"
            className="ff7-text home-bar-item"
          >
            <span aria-hidden="true" className="ff7-hand">
              ☞
            </span>
            Search
            <kbd className="ff7-label home-bar-kbd">{SHORTCUT_LABEL}</kbd>
          </button>
          <Link to="/credits" className="ff7-text home-bar-item">
            <span aria-hidden="true" className="ff7-hand">
              ☞
            </span>
            Credits
          </Link>
        </div>
      </div>
    </header>
  );
}
