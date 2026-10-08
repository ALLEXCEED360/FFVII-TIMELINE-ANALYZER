import { type CSSProperties, useEffect, useRef, useState } from "react";
import "./Backdrop.css";
import { create } from "zustand";
import { artSrc, artwork } from "../art/manifest";

// The artwork behind every page: each page names it with `useBackdrop`, the shell draws it.

interface BackdropState {
  id: string | null;
  /** 0–1: how much of the artwork survives the dimming. */
  strength: number;
  /** The side darkened for text; "full" is a light veil over the whole screen. */
  side: "left" | "right" | "center" | "full";
  set: (next: Omit<BackdropState, "set">) => void;
}

const useBackdropStore = create<BackdropState>()((set) => ({
  id: null,
  strength: 0.5,
  side: "left",
  set,
}));

/** Clearing waits a moment, so the next page's artwork replaces it without a flash of bare page. */
let clearing: number | undefined;
const RELEASE_MS = 1500;

/** Show this artwork behind the page while it's mounted. */
export function useBackdrop(
  id: string | undefined,
  { strength = 0.5, side = "left" }: { strength?: number; side?: BackdropState["side"] } = {},
): void {
  const set = useBackdropStore((s) => s.set);
  useEffect(() => {
    window.clearTimeout(clearing);
    set({ id: id ?? null, strength, side });
  }, [id, strength, side, set]);
  useEffect(
    () => () => {
      window.clearTimeout(clearing);
      clearing = window.setTimeout(() => {
        set({ id: null, strength: 0.5, side: "left" });
      }, RELEASE_MS);
    },
    [set],
  );
}

/** How long a change of artwork takes (Backdrop.css), and so how long a picture leaving stays. */
const FADE_MS = 1200;

interface Layer {
  key: number;
  id: string;
  strength: number;
  leaving: boolean;
}

export function Backdrop() {
  const { id, strength, side } = useBackdropStore();
  // A layer per picture: the new one fades in over the rest, which fade out from where they are.
  const [layers, setLayers] = useState<Layer[]>(() =>
    id === null ? [] : [{ key: 0, id, strength, leaving: false }],
  );
  const serial = useRef(1);
  const timers = useRef<number[]>([]);
  useEffect(() => {
    setLayers((now) => {
      const top = now.findLast((l) => !l.leaving);
      if ((top?.id ?? null) === id) {
        return top && top.strength !== strength
          ? now.map((l) => (l === top ? { ...l, strength } : l))
          : now;
      }
      const leaving = now.filter((l) => !l.leaving).map((l) => l.key);
      if (leaving.length > 0) {
        timers.current.push(
          window.setTimeout(() => {
            setLayers((later) => later.filter((l) => !leaving.includes(l.key)));
          }, FADE_MS),
        );
      }
      const next = now.map((l) => (l.leaving ? l : { ...l, leaving: true }));
      if (id !== null) next.push({ key: serial.current++, id, strength, leaving: false });
      return next;
    });
  }, [id, strength]);
  useEffect(
    () => () => {
      timers.current.forEach((t) => {
        window.clearTimeout(t);
      });
    },
    [],
  );

  const layer = ({ key, id: layerId, strength: layerStrength, leaving }: Layer) => {
    const entry = artwork(layerId);
    if (!entry) return null;
    const lineart = entry.kind === "lineart";
    return (
      <img
        key={key}
        src={artSrc(entry)}
        alt=""
        decoding="async"
        className={`backdrop-art absolute inset-0 size-full ${leaving ? "is-leaving" : ""} ${
          lineart ? "object-contain object-right-top p-[6vh]" : "object-cover"
        }`}
        style={
          {
            "--o": lineart ? layerStrength * 0.55 : layerStrength,
            objectPosition: lineart ? undefined : entry.focus,
            maskImage:
              side === "full"
                ? undefined
                : "linear-gradient(to bottom, #000 0%, #000 30%, transparent 92%)",
          } as CSSProperties
        }
      />
    );
  };

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {layers.map(layer)}
      {/* Darkest where the text is. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            side === "full"
              ? "radial-gradient(ellipse at center, rgb(5 7 10 / 0.15), rgb(5 7 10 / 0.6) 100%)"
              : side === "center"
                ? "radial-gradient(ellipse at center, rgb(5 7 10 / 0.35), rgb(5 7 10 / 0.9) 80%)"
                : `linear-gradient(${side === "left" ? "100deg" : "260deg"}, rgb(5 7 10 / 0.94) 0%, rgb(5 7 10 / 0.72) 38%, rgb(5 7 10 / 0.2) 72%, rgb(5 7 10 / 0.05) 100%)`,
        }}
      />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-void/80 to-transparent" />
      {/* Midgar's plate as a compass: a ring, its eight sectors, and a sightline. */}
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full fill-none stroke-steel-100 opacity-[0.07]"
      >
        <circle cx="1500" cy="430" r="420" />
        <circle cx="1500" cy="430" r="610" />
        <circle cx="1500" cy="430" r="90" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4 + Math.PI / 8;
          return (
            <line
              key={i}
              x1={1500 + Math.cos(a) * 90}
              y1={430 + Math.sin(a) * 90}
              x2={1500 + Math.cos(a) * 610}
              y2={430 + Math.sin(a) * 610}
            />
          );
        })}
        <line x1="-100" y1="980" x2="2020" y2="160" />
      </svg>
      <div className="halftone absolute inset-0 opacity-50" />
    </div>
  );
}
