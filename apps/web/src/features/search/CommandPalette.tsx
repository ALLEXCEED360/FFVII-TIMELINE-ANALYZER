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
import { ErrorMessage } from "../../components/QueryState";
import { titleShort } from "../../lib/reference";
import { useDebounced } from "../../lib/useDebounced";
import { useUi } from "../../stores/ui";
import { buildGroups } from "./palette";

/** Ctrl/⌘ + K from anywhere (blueprint §26). */
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

/** The global search palette: a modal combobox with results grouped by kind. */
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-void/70 p-4 pt-[12vh] backdrop-blur-sm">
      {/* Clicking the backdrop closes; keyboard users have Escape. */}
      <div aria-hidden="true" className="absolute inset-0" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the archive"
        className="panel relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden shadow-2xl shadow-black/60"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-night-700 px-4 py-3">
          <span aria-hidden="true" className="size-2 rotate-45 bg-mako-400" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeKey ? `${listId}-${activeKey}` : undefined}
            aria-label="Search characters, events, locations, organizations and arcs"
            placeholder="Search characters, events, places…"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActive(0);
            }}
            className="flex-1 bg-transparent text-base text-steel-100 outline-none placeholder:text-steel-400"
          />
          <kbd className="label rounded border border-night-600 px-1.5">Esc</kbd>
        </div>

        <div className="overflow-y-auto p-2">
          {!q.trim() ? (
            <p className="px-2 py-3 text-sm text-steel-400">
              Try <em>Cloud</em>, <em>Aeris</em>, <em>Sector 7</em> or <em>Lifestream</em>. Typos
              are fine.
            </p>
          ) : search.isError ? (
            <div className="p-2">
              <ErrorMessage error={search.error} />
            </div>
          ) : search.isPending ? (
            <p role="status" className="px-2 py-3 text-sm text-steel-400">
              Searching…
            </p>
          ) : flat.length === 0 ? (
            <p role="status" className="px-2 py-3 text-sm text-steel-400">
              Nothing found for “{q.trim()}”.
            </p>
          ) : (
            <div id={listId} role="listbox" aria-label="Results">
              {groups.map((group) => (
                <div
                  key={group.key}
                  role="group"
                  aria-labelledby={`${listId}-${group.key}-label`}
                  className="mb-2"
                >
                  <p id={`${listId}-${group.key}-label`} className="label px-2 py-1">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    const position = positionOf.get(item.key) ?? -1;
                    const isActive = position === active;
                    return (
                      <div
                        key={item.key}
                        id={`${listId}-${item.key}`}
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => {
                          setActive(position);
                        }}
                        onClick={() => {
                          go(item.href);
                        }}
                        className={`flex cursor-pointer flex-col rounded px-2 py-1.5 ${
                          isActive ? "bg-mako-900/60 text-mako-200" : "text-steel-100"
                        }`}
                      >
                        <span className="text-sm">{item.label}</span>
                        {item.hint && <span className="text-xs text-steel-400">{item.hint}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="label flex gap-4 border-t border-night-700 px-4 py-2">
          <span>↑↓ Move</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
        </p>
      </div>
    </div>
  );
}
