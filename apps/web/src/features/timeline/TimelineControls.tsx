import { TellingChoices } from "../../components/TellingChoices";
import type { Telling } from "../../lib/tellings";
import type { TimelineParams } from "./params";

/** The timeline's choices: the order, whose story, and key moments only. */
export function TimelineControls({
  params,
  onChange,
}: {
  params: TimelineParams;
  onChange: (change: Partial<TimelineParams>) => void;
}) {
  const play = params.view === "play";
  return (
    <div className="m-panel tl-controls">
      <div className="tl-control">
        <p className="m-label" id="tl-order">
          Order
        </p>
        <div role="group" aria-labelledby="tl-order" className="m-choices">
          <button
            type="button"
            aria-pressed={!play}
            onClick={() => {
              onChange({ view: "story" });
            }}
            className="m-choice"
          >
            As it happened
          </button>
          <button
            type="button"
            aria-pressed={play}
            onClick={() => {
              onChange({ view: "play" });
            }}
            className="m-choice"
          >
            As you play it
          </button>
        </div>
      </div>

      <div className="tl-control">
        <p aria-hidden="true" className="m-label">
          {play ? "Play through" : "Show"}
        </p>
        {play ? (
          <TellingChoices<Telling>
            label="Play through"
            value={params.game}
            options={["og", "trilogy"]}
            onChange={(game) => {
              onChange({ game });
            }}
          />
        ) : (
          <TellingChoices
            label="Show"
            value={params.tellings}
            onChange={(tellings) => {
              onChange({ tellings });
            }}
          />
        )}
      </div>

      <div className="tl-control">
        <p aria-hidden="true" className="m-label">
          Moments
        </p>
        <div role="group" aria-label="Moments" className="m-choices">
          <button
            type="button"
            aria-pressed={params.keyOnly}
            onClick={() => {
              onChange({ keyOnly: !params.keyOnly });
            }}
            className="m-choice"
          >
            <span aria-hidden="true" className="tl-star">
              ★
            </span>
            Key moments only
          </button>
        </div>
      </div>
    </div>
  );
}
