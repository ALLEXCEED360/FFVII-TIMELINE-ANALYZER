import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router";
import { useReference, useSearch } from "../../api/queries";
import { Orb } from "../../components/Orb";
import { ErrorMessage } from "../../components/QueryState";
import { titleShort } from "../../lib/reference";
import { useDebounced } from "../../lib/useDebounced";
import { useUi } from "../../stores/ui";
import { buildGroups } from "./palette";
import "./search.css";

/** Names to try, one tap each. */
const TRIES = ["Cloud", "Aeris", "Sector 7", "Lifestream"];

/** Ctrl/⌘ + K from anywhere. */
export function useSearchShortcut() {
  const setOpen = useUi((s) => s.setPaletteOpen);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!useUi.getState().paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [setOpen]);
}

export const SHORTCUT_LABEL =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";

/** The global search: one of the original's windows, results grouped by kind, the glove on the chosen. */
export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  if (!open) return null;
  return <Palette />;
}

function Palette() {
  const setOpen = useUi((s) => s.setPaletteOpen);
  const navigate = useNavigate();
  const reference = useReference();
  const [input, setInput] = useState("");
  const q = useDebounced(input, 150);
  const search = useSearch(q);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const groups = useMemo(
    () =>
      q.trim() && search.data
        ? buildGroups(search.data.items, reference.data?.arcs ?? [], search.data.terms, (code) =>
            titleShort(reference.data, code),
          )
        : [],
    [q, search.data, reference.data],
  );
  const flat = groups.flatMap((g) => g.items);

  // Focus the input on open, and give focus back to where it was on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => {
      previous?.focus();
    };
  }, []);

  const close = () => {
    setOpen(false);
  };
  const go = (href: string) => {
    close();
    void navigate(href);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown" && flat.length > 0) {
      event.preventDefault();
      setActive((i) => (i + 1) % flat.length);
    } else if (event.key === "ArrowUp" && flat.length > 0) {
      event.preventDefault();
      setActive((i) => (i - 1 + flat.length) % flat.length);
    } else if (event.key === "Enter") {
      const item = flat[active];
      if (item) {
        event.preventDefault();
        go(item.href);
      }
    }
  };

  const activeKey = flat[active]?.key;
  const positionOf = new Map(flat.map((item, i) => [item.key, i]));

  return (
    <div className="ff7 sp">
      {/* Clicking outside closes; keyboard users have Escape. */}
      <div aria-hidden="true" className="sp-shade" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the archive"
        className="sp-dialog"
        onKeyDown={onKeyDown}
      >
        {/* The original's name entry: a label, the text, and a way out. */}
        <div className="ff7-window sp-head">
          <Orb kind="character" size="1.1rem" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeKey ? `${listId}-${activeKey}` : undefined}
            aria-label="Search characters, events, locations, organizations and arcs"
            placeholder="Type a name"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActive(0);
            }}
            className="ff7-text sp-input"
          />
          <button type="button" onClick={close} className="ff7-text sp-close">
            Close
          </button>
        </div>

        <div className="ff7-window sp-body">
          {!q.trim() ? (
            <div className="sp-start">
              <p className="ff7-text">Who or what are you looking for? Typos are fine.</p>
              <ul aria-label="Try" className="sp-tries">
                {TRIES.map((word) => (
                  <li key={word}>
                    <button
                      type="button"
                      onClick={() => {
                        setInput(word);
                        setActive(0);
                        inputRef.current?.focus();
                      }}
                      className="ff7-text sp-try"
                    >
                      {word}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : search.isError ? (
            <ErrorMessage error={search.error} />
          ) : search.isPending ? (
            <p role="status" className="ff7-text sp-note">
              Searching…
            </p>
          ) : flat.length === 0 ? (
            <p role="status" className="ff7-text sp-note">
              Nothing found for “{q.trim()}”.
            </p>
          ) : (
            <div id={listId} role="listbox" aria-label="Results">
              {groups.map((group) => (
                <div
                  key={group.key}
                  role="group"
                  aria-labelledby={`${listId}-${group.key}-label`}
                  className="sp-group"
                >
                  <p id={`${listId}-${group.key}-label`} className="ff7-text ff7-label sp-kind">
                    <Orb kind={group.key} />
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    const position = positionOf.get(item.key) ?? -1;
                    return (
                      <div
                        key={item.key}
                        id={`${listId}-${item.key}`}
                        role="option"
                        aria-selected={position === active}
                        onMouseEnter={() => {
                          setActive(position);
                        }}
                        onClick={() => {
                          go(item.href);
                        }}
                        className="sp-option"
                      >
                        <span aria-hidden="true" className="ff7-hand sp-glove">
                          ☞
                        </span>
                        <span className="ff7-text sp-name">{item.label}</span>
                        {item.hint && <span className="sp-hint">{item.hint}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Keys, where there's a keyboard. */}
        <p className="ff7-window ff7-text sp-keys">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> Move
          </span>
          <span>
            <kbd>Enter</kbd> Open
          </span>
          <span>
            <kbd>Esc</kbd> Close
          </span>
        </p>
      </div>
    </div>
  );
}
