import type { CSSProperties, ReactNode } from "react";
import type { TitleCode } from "../../api/client";
import { TITLE_ORDER } from "../../lib/reference";
import { TITLE_COLOR } from "../../lib/titles";
import type { TimelineParams } from "./params";

/**
 * The few choices the timeline offers, in one window: the order (as it happened, or as you play
 * one game), which games to show, and whether to keep to the key moments.
 */
export function TimelineControls({
  params,
  titleName,
  onToggleTitle,
  onChange,
}: {
  params: TimelineParams;
  titleName: (code: TitleCode) => string;
  onToggleTitle: (code: TitleCode) => void;
  onChange: (change: Partial<TimelineParams>) => void;
}) {
  const play = params.view === "play";
  return (
    <div className="m-panel tl-controls">
      <fieldset className="tl-control">
        <legend className="m-label">Order</legend>
        <div className="m-choices">
          <Choice
            on={!play}
            onClick={() => {
              onChange({ view: "story" });
            }}
          >
            As it happened
          </Choice>
          <Choice
            on={play}
            onClick={() => {
              onChange({ view: "play" });
            }}
          >
            As you play it
          </Choice>
        </div>
      </fieldset>

      <fieldset className="tl-control">
        <legend className="m-label">{play ? "Game" : "Games"}</legend>
        <div className="m-choices">
          {TITLE_ORDER.map((code) => {
            const on = play ? params.game === code : params.titles.includes(code);
            return (
              <Choice
                key={code}
                on={on}
                color={TITLE_COLOR[code]}
                // At least one game stays shown.
                disabled={!play && on && params.titles.length === 1}
                onClick={() => {
                  if (play) onChange({ game: code });
                  else onToggleTitle(code);
                }}
              >
                {titleName(code)}
              </Choice>
            );
          })}
        </div>
      </fieldset>

      <div className="tl-control">
        <span aria-hidden="true" className="m-label tl-control-label">
          Show
        </span>
        <div className="m-choices">
          <Choice
            on={params.keyOnly}
            onClick={() => {
              onChange({ keyOnly: !params.keyOnly });
            }}
          >
            <span aria-hidden="true" className="tl-star">
              ★
            </span>
            Key moments only
          </Choice>
        </div>
      </div>
    </div>
  );
}

function Choice({
  on,
  color,
  disabled,
  onClick,
  children,
}: {
  on: boolean;
  color?: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className="m-choice"
      style={color ? ({ "--c": color } as CSSProperties) : undefined}
    >
      <span aria-hidden="true" className="m-choice-box" />
      {children}
    </button>
  );
}
