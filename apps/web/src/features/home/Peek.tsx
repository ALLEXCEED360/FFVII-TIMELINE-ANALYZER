import { type ReactNode, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "../../lib/motion";

/** Out of its place with a little overshoot, as a held message lifts on a phone. */
const LIFT = "cubic-bezier(0.2, 0.9, 0.3, 1.15)";
/** Back into place, settling without a bounce. */
const SETTLE = "cubic-bezier(0.4, 0, 0.2, 1)";

/** Whether a tap landed on one of the lifted windows, rather than the space around them. */
const onWindow = (target: EventTarget) =>
  target instanceof Element && target.closest(".peek-window") !== null;

/** Moves `item` from where it now sits back onto `from` (its place in the menu), corner to corner. */
function fromPlace(item: HTMLElement, from: DOMRect): string {
  const to = item.getBoundingClientRect();
  const x = from.left - to.left;
  const y = from.top - to.top;
  return `translate(${String(x)}px, ${String(y)}px) scale(${String(from.width / to.width)})`;
}

/**
 * A command or a game held on a touch screen: it lifts out of the menu over the blurred page, with
 * what it holds and a way in under it. A tap outside, Escape or the phone's Back puts it back.
 */
export function Peek({
  from,
  label,
  item,
  details,
  onClose,
}: {
  /** Where the held command or game sits in the menu. */
  from: DOMRect;
  label: string;
  /** The held command or game itself, as lifted. */
  item: ReactNode;
  /** What it holds, and the way in. */
  details: ReactNode;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const backdrop = useRef<HTMLDivElement>(null);
  const lifted = useRef<HTMLDivElement>(null);
  const more = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  // Only a tap that starts outside closes it, not the finger still down from the hold.
  const tappedOutside = useRef(false);

  useLayoutEffect(() => {
    const [shade, card, under] = [backdrop.current, lifted.current, more.current];
    if (reduced || !shade || !card || !under || typeof card.animate !== "function") return;
    shade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: "ease-out" });
    card.animate([{ transform: fromPlace(card, from) }, { transform: "none" }], {
      duration: 420,
      easing: LIFT,
    });
    under.animate(
      [
        { opacity: 0, transform: "translateY(-0.75rem) scale(0.94)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 260, delay: 140, easing: "ease-out", fill: "backwards" },
    );
  }, [from, reduced]);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const [shade, card, under] = [backdrop.current, lifted.current, more.current];
    if (reduced || !shade || !card || !under || typeof card.animate !== "function") {
      onClose();
      return;
    }
    const going = [
      under.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "forwards" }),
      card.animate([{ transform: "none" }, { transform: fromPlace(card, from) }], {
        duration: 280,
        easing: SETTLE,
        fill: "forwards",
      }),
      shade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, fill: "forwards" }),
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="ff7 peek"
      data-peek=""
      // The finger that held is often still down: no text selection or link menu under it.
      onContextMenu={(event) => {
        event.preventDefault();
      }}
      // A tap anywhere but on the two windows puts it back: the space between and around them
      // too, not only the shade behind.
      onPointerDown={(event) => {
        tappedOutside.current = !onWindow(event.target);
      }}
      onClick={(event) => {
        if (tappedOutside.current && !onWindow(event.target)) close();
        tappedOutside.current = false;
      }}
    >
      <div ref={backdrop} aria-hidden="true" className="peek-backdrop" />
      <div className="peek-stack">
        <div ref={lifted} className="peek-lifted">
          {item}
        </div>
        <div ref={more}>{details}</div>
      </div>
    </div>,
    document.body,
  );
}
