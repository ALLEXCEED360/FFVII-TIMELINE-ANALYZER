import { useEffect, useRef } from "react";
import { useMediaQuery } from "../lib/useMediaQuery";
import { useUi } from "../stores/ui";

const INTERACTIVE = 'a, button, [role="button"], [role="option"], label, summary, select';
const TEXT = 'input:not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]';

/**
 * The game cursor: a Mako arrowhead in place of the system pointer, on devices that have one.
 * Over something you can act on it grows and lights; pressed, it gives way to a reticle. Over a
 * text field the system's own I-beam comes back. The native pointer is hidden only once this has
 * mounted (<html data-cursor="game">), so without JavaScript the page keeps its usual pointer.
 * It follows with a short transition, so it feels weighted but never late. Chosen in Settings.
 */
export function Cursor() {
  const setting = useUi((s) => s.cursor);
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)", false);
  const enabled = setting === "game" && finePointer;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!enabled) {
      delete root.dataset.cursor;
      return;
    }
    root.dataset.cursor = "game";
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    let x = -100;
    let y = -100;
    const place = () => {
      frame = 0;
      el.style.transform = `translate3d(${String(x)}px, ${String(y)}px, 0)`;
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      const target = event.target instanceof Element ? event.target : null;
      const overText = target?.closest(TEXT) != null;
      el.toggleAttribute("data-shown", !overText);
      el.toggleAttribute("data-hover", target?.closest(INTERACTIVE) != null);
      if (!frame) frame = requestAnimationFrame(place);
    };
    const onDown = () => {
      el.toggleAttribute("data-pressed", true);
    };
    const onUp = () => {
      el.toggleAttribute("data-pressed", false);
    };
    const onLeave = () => {
      el.toggleAttribute("data-shown", false);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      delete root.dataset.cursor;
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div ref={ref} aria-hidden="true" className="game-cursor">
      <svg viewBox="0 0 32 32" className="game-cursor-arrow">
        <path
          d="M3 2 L27 13 L16 16 L12 28 Z"
          className="fill-mako-400 stroke-ink"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M6 7 L21 13.6 L14.4 15.2"
          className="fill-none stroke-mako-200"
          strokeWidth="1.2"
        />
      </svg>
      <svg viewBox="0 0 32 32" className="game-cursor-reticle">
        <rect
          x="9"
          y="9"
          width="14"
          height="14"
          className="fill-none stroke-mako-300"
          strokeWidth="2"
        />
        <circle cx="16" cy="16" r="2" className="fill-mako-300" />
      </svg>
    </div>
  );
}
