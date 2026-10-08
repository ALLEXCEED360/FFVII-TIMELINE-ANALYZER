import type { CSSProperties } from "react";
import { CHOICE_NAME, TELLING, type TellingChoice } from "../lib/tellings";

/** A choice's colour: its telling's, or none for both. */
function colorOf(choice: TellingChoice): CSSProperties | undefined {
  return choice === "both" ? undefined : ({ "--c": TELLING[choice].color } as CSSProperties);
}

/** The one choice of games on the site: both tellings, the original, or the Remake Trilogy. */
export function TellingChoices<T extends TellingChoice>({
  label,
  value,
  onChange,
  options = ["both", "og", "trilogy"] as T[],
}: {
  label: string;
  value: T;
  onChange: (choice: T) => void;
  /** Leave out "both" where only one can be followed (a play order). */
  options?: readonly T[];
}) {
  return (
    <div role="group" aria-label={label} className="m-choices">
      {options.map((choice) => (
        <button
          key={choice}
          type="button"
          aria-pressed={value === choice}
          onClick={() => {
            onChange(choice);
          }}
          className="m-choice"
          style={colorOf(choice)}
        >
          {choice !== "both" && <span aria-hidden="true" className="m-choice-box" />}
          {CHOICE_NAME[choice]}
        </button>
      ))}
    </div>
  );
}
