import type { Reference, TitleCode } from "../../api/client";
import { TITLE_ORDER, titleShort } from "../../lib/reference";
import { TITLE_COLOR } from "../../lib/titles";
import { PRESETS, sameTitles, toggleTitle } from "./titles";

// The earlier title selector, still used by the divergence pages until they're redone in the
// modern look; the compare section uses features/compare/pieces.tsx (decision 0021).

/** Presets for the pairs the blueprint names, plus a toggle per title. */
export function TitleSelect({
  titles,
  reference,
  onChange,
}: {
  titles: readonly TitleCode[];
  reference: Reference | undefined;
  onChange: (titles: TitleCode[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label="Presets" className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="btn"
            aria-pressed={sameTitles(titles, preset.titles)}
            onClick={() => {
              onChange([...preset.titles]);
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div role="group" aria-label="Titles to compare" className="flex flex-wrap gap-1.5">
        {TITLE_ORDER.map((code) => {
          const on = titles.includes(code);
          return (
            <button
              key={code}
              type="button"
              className="btn"
              aria-pressed={on}
              disabled={on && titles.length <= 2}
              onClick={() => {
                onChange(toggleTitle(titles, code));
              }}
            >
              <span
                aria-hidden="true"
                className="size-2 rotate-45 border"
                style={{
                  borderColor: TITLE_COLOR[code],
                  background: on ? TITLE_COLOR[code] : "transparent",
                }}
              />
              {titleShort(reference, code)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
