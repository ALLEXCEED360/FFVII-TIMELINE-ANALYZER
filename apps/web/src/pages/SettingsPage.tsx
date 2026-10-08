import type { ReactNode } from "react";
import { SECTION_ART } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";
import { type BootSetting, type CursorSetting, type MotionSetting, useUi } from "../stores/ui";
import "../features/settings/settings.css";

interface Option<T extends string> {
  value: T;
  label: string;
  /** What the choice does, said once it's chosen. */
  says: string;
}

/** One setting: its choices as materia that light when chosen, and what the chosen one does. */
function Setting<T extends string>({
  name,
  legend,
  help,
  value,
  options,
  onChange,
  children,
}: {
  name: string;
  legend: string;
  help: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  children?: ReactNode;
}) {
  const chosen = options.find((o) => o.value === value);
  return (
    <fieldset className="m-panel st-setting">
      <legend className="m-heading st-name">{legend}</legend>
      <p className="st-help">{help}</p>
      <div className="st-options">
        {options.map((option) => (
          <label key={option.value} className="st-option">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => {
                onChange(option.value);
              }}
              className="sr-only"
            />
            <span aria-hidden="true" className="st-orb" />
            {option.label}
          </label>
        ))}
      </div>
      {chosen && (
        <p className="st-says" aria-live="polite">
          {chosen.says}
        </p>
      )}
      {children}
    </fieldset>
  );
}

const MOTION: readonly Option<MotionSetting>[] = [
  {
    value: "system",
    label: "Follow my device",
    says: "Moves as much as your device's own setting for motion allows.",
  },
  {
    value: "reduced",
    label: "Less movement",
    says: "Pages change without sliding or fading, and the title screen holds still.",
  },
  {
    value: "full",
    label: "Full movement",
    says: "Every window, fade and glow moves, whatever your device's setting.",
  },
];
const BOOT: readonly Option<BootSetting>[] = [
  {
    value: "always",
    label: "Every visit",
    says: "The title screen plays each time you open the guide.",
  },
  {
    value: "session",
    label: "Once a session",
    says: "The title screen plays the first time you open the guide, until you close the browser.",
  },
  { value: "off", label: "Never", says: "The guide opens straight on the menu." },
];
const CURSOR: readonly Option<CursorSetting>[] = [
  {
    value: "game",
    label: "Buster Sword",
    says: "Your pointer is Cloud's Buster Sword, on devices with a mouse.",
  },
  { value: "system", label: "My own pointer", says: "Your device's usual pointer." },
];

/** Settings: how the guide moves, opens and points. Saved in this browser. */
export function SettingsPage() {
  useBackdrop(SECTION_ART.settings, { strength: 0.5, side: "full" });
  const ui = useUi();

  return (
    <div className="st">
      <header>
        <p className="m-label">Config</p>
        <h1 className="m-heading m-title">Settings</h1>
        <p className="m-intro">
          How the guide moves, opens and points. Your choices are saved in this browser.
        </p>
      </header>

      <div className="st-grid">
        <Setting
          name="motion"
          legend="Motion"
          help="How much the pages move: windows opening, fades between pictures, the title screen."
          value={ui.motion}
          options={MOTION}
          onChange={ui.setMotion}
        />
        <Setting
          name="boot"
          legend="Title screen"
          help="The opening screen that plays while the guide gets ready."
          value={ui.boot}
          options={BOOT}
          onChange={ui.setBoot}
        >
          <button type="button" className="st-button" onClick={ui.replayBoot}>
            Play the title screen now
          </button>
        </Setting>
        <Setting
          name="cursor"
          legend="Pointer"
          help="What your mouse pointer looks like."
          value={ui.cursor}
          options={CURSOR}
          onChange={ui.setCursor}
        />
        <section aria-labelledby="st-spoilers" className="m-panel st-setting">
          <h2 id="st-spoilers" className="m-heading st-name">
            Spoiler warning
          </h2>
          <p className="st-help">
            This guide tells the whole story of every game, endings included. The warning at the top
            says so once, until you close it.
          </p>
          <p className="st-says" aria-live="polite">
            {ui.noticeDismissed ? "You've closed it." : "It's showing at the top of the page."}
          </p>
          <button
            type="button"
            className="st-button"
            onClick={ui.showNotice}
            disabled={!ui.noticeDismissed}
          >
            Show the warning again
          </button>
        </section>
      </div>
    </div>
  );
}
