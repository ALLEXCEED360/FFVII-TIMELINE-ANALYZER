import { SECTION_ART } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";
import { type BootSetting, type CursorSetting, type MotionSetting, useUi } from "../stores/ui";

/** One setting as a row of a game's config screen: a name, what it does, and its choices. */
function Choice<T extends string>({
  name,
  legend,
  help,
  value,
  options,
  onChange,
}: {
  name: string;
  legend: string;
  help: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="panel p-5">
      <legend className="float-left w-full font-display text-2xl font-extrabold tracking-wide text-steel-100 uppercase italic">
        {legend}
      </legend>
      <div className="clear-left flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-steel-300">{help}</p>
        <div className="flex shrink-0 flex-wrap gap-1">
          {options.map((option) => (
            <label
              key={option.value}
              className="btn min-h-8 cursor-pointer has-checked:bg-mako-400 has-checked:text-ink has-checked:shadow-none has-focus-visible:shadow-[inset_0_0_0_2px_var(--color-steel-100)]"
            >
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
              {option.label}
            </label>
          ))}
        </div>
      </div>
    </fieldset>
  );
}

const MOTION: readonly { value: MotionSetting; label: string }[] = [
  { value: "system", label: "System" },
  { value: "reduced", label: "Reduced" },
  { value: "full", label: "Full" },
];
const BOOT: readonly { value: BootSetting; label: string }[] = [
  { value: "always", label: "Every visit" },
  { value: "session", label: "Once a session" },
  { value: "off", label: "Never" },
];
const CURSOR: readonly { value: CursorSetting; label: string }[] = [
  { value: "game", label: "Game" },
  { value: "system", label: "System" },
];

/** How the interface behaves (blueprint §33): motion, the title screen and the pointer. Remembered. */
export function SettingsPage() {
  useBackdrop(SECTION_ART.settings, { strength: 0.45 });
  const ui = useUi();

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="eyebrow">Config</p>
        <h1 className="page-title">Settings</h1>
        <p className="text-steel-300">Saved in this browser.</p>
      </header>

      <div className="flex flex-col gap-3">
        <Choice
          name="motion"
          legend="Motion"
          help="Wipes, arrivals and the title screen's movement. System follows your device's reduced-motion setting."
          value={ui.motion}
          options={MOTION}
          onChange={ui.setMotion}
        />
        <Choice
          name="boot"
          legend="Title screen"
          help="The screen that plays when the archive opens, while it wakes the server."
          value={ui.boot}
          options={BOOT}
          onChange={ui.setBoot}
        />
        <Choice
          name="cursor"
          legend="Cursor"
          help="The Mako arrowhead, or your system's own pointer. Only on devices with a mouse."
          value={ui.cursor}
          options={CURSOR}
          onChange={ui.setCursor}
        />
      </div>

      <div>
        <button type="button" className="btn btn-primary px-6 py-2" onClick={ui.replayBoot}>
          Play the title screen
        </button>
      </div>
    </div>
  );
}
