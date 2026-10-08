import { useUi } from "../stores/ui";

/** The one spoiler measure (docs/model/spoilers.md): a notice on the first visit, then never again. */
export function SpoilerNotice() {
  const dismissed = useUi((s) => s.noticeDismissed);
  const dismiss = useUi((s) => s.dismissNotice);
  if (dismissed) return null;
  return (
    <aside
      aria-label="Spoiler notice"
      className="border-b border-night-700 bg-night-900/90 px-4 py-2.5 text-sm"
    >
      <div className="mx-auto flex max-w-[96rem] flex-wrap items-center gap-x-4 gap-y-2">
        <span className="m-label">Spoilers ahead</span>
        <p className="order-last basis-full text-steel-300 sm:order-none sm:basis-0 sm:flex-1">
          This archive covers the full stories of <em>Final Fantasy VII</em>, <em>Remake</em>,{" "}
          <em>INTERmission</em> and <em>Rebirth</em> — endings included.
        </p>
        <button type="button" className="m-choice ml-auto sm:ml-0" onClick={dismiss}>
          Understood
        </button>
      </div>
    </aside>
  );
}
