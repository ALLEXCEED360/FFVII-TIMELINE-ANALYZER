import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "../../lib/motion";

/** The open sheet's close, which lowers it before closing (for the Close inside it). */
const LowerSheet = createContext<() => void>(() => undefined);
export const useLowerSheet = () => useContext(LowerSheet);

/** Up from the foot of the screen, settling without a bounce. */
const RISE = "cubic-bezier(0.2, 0.8, 0.25, 1)";

/**
 * A chosen moment's details on a phone: a sheet that rises from the foot of the screen over the
 * dimmed page, so they open where the reader is looking and the page stays where it was. A tap
 * outside, Escape, the phone's Back or the window's own Close puts it away.
 */
export function DetailSheet({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  /** The details; a Close among them lowers the sheet through useLowerSheet. */
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const shade = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  // Only a tap that starts outside closes it.
  const tappedOutside = useRef(false);

  useLayoutEffect(() => {
    const [dim, up] = [shade.current, sheet.current];
    if (reduced || !dim || !up || typeof up.animate !== "function") return;
    dim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
    up.animate([{ transform: "translateY(100%)" }, { transform: "none" }], {
      duration: 340,
      easing: RISE,
    });
  }, [reduced]);

  // The page under it stays put while the sheet is read.
  useEffect(() => {
    const root = document.documentElement;
    const was = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = was;
    };
  }, []);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const [dim, up] = [shade.current, sheet.current];
    if (reduced || !dim || !up || typeof up.animate !== "function") {
      onClose();
      return;
    }
    const going = [
      up.animate([{ transform: "none" }, { transform: "translateY(100%)" }], {
        duration: 240,
        easing: "cubic-bezier(0.4, 0, 1, 1)",
        fill: "forwards",
      }),
      dim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: "forwards" }),
    ];
    void Promise.all(going.map((a) => a.finished)).finally(onClose);
  };
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={label} className="dv-sheet" data-sheet="">
      <div
        ref={shade}
        aria-hidden="true"
        className="dv-sheet-shade"
        onPointerDown={() => {
          tappedOutside.current = true;
        }}
        onClick={() => {
          if (tappedOutside.current) close();
        }}
      />
      <div ref={sheet} className="dv-sheet-body">
        <span aria-hidden="true" className="dv-sheet-grip" />
        <LowerSheet.Provider value={close}>{children}</LowerSheet.Provider>
      </div>
    </div>,
    document.body,
  );
}
