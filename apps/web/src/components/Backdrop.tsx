import { useEffect, useState } from "react";
import { create } from "zustand";
import { artSrc, artwork } from "../art/manifest";

// The layer behind every screen. A game menu sits over artwork, not over a flat colour, and
// that is most of what makes it feel like a place rather than a document. Each page names its
// artwork with `useBackdrop`; the shell draws it, fixed behind everything, dimmed hard on the
// side where the text lives and faded to ink further down, where the data is.

interface BackdropState {
  id: string | null;
  /** 0–1: how much of the artwork survives the dimming. */
  strength: number;
  /**
   * Where the readable column is; that side is darkened most. "full" shows the artwork across the
   * whole screen under a light veil, for a page that is itself a set of windows (the home menu).
   */
  side: "left" | "right" | "center" | "full";
  set: (next: Omit<BackdropState, "set">) => void;
}

const useBackdropStore = create<BackdropState>()((set) => ({
  id: null,
  strength: 0.5,
  side: "left",
  set,
}));

/** Show this artwork behind the page while it's mounted. */
export function useBackdrop(
  id: string | undefined,
  { strength = 0.5, side = "left" }: { strength?: number; side?: BackdropState["side"] } = {},
): void {
  const set = useBackdropStore((s) => s.set);
  useEffect(() => {
    set({ id: id ?? null, strength, side });
  }, [id, strength, side, set]);
  useEffect(
    () => () => {
      set({ id: null, strength: 0.5, side: "left" });
    },
    [set],
  );
}

/** How long a new artwork takes to fade in (the art-in animation below). */
const FADE_MS = 700;

export function Backdrop() {
  const { id, strength, side } = useBackdropStore();
  // The artwork shown before this one stays underneath while the new one fades in over it, so a
  // change is a crossfade rather than a flash of the page colour — and then goes. Both are drawn
  // dimmed, so one left underneath would show through and blend into the new one.
  const [layers, setLayers] = useState<{ current: string | null; previous: string | null }>({
    current: id,
    previous: null,
  });
  if (layers.current !== id) setLayers({ current: id, previous: layers.current });
  useEffect(() => {
    if (layers.previous === null) return;
    const done = window.setTimeout(() => {
      setLayers((now) => ({ ...now, previous: null }));
    }, FADE_MS);
    return () => {
      window.clearTimeout(done);
    };
  }, [layers]);

  const layer = (layerId: string | null, fading: boolean) => {
    const entry = layerId === null ? undefined : artwork(layerId);
    if (!entry) return null;
    const lineart = entry.kind === "lineart";
    return (
      <img
        key={`${fading ? "in" : "under"}-${entry.id}`}
        src={artSrc(entry)}
        alt=""
        decoding="async"
        className={`absolute inset-0 size-full ${fading ? "animate-[art-in_0.7s_var(--ease-out-expo)_both]" : ""} ${
          lineart ? "object-contain object-right-top p-[6vh]" : "object-cover"
        }`}
        style={{
          objectPosition: lineart ? undefined : entry.focus,
          opacity: lineart ? strength * 0.55 : strength,
          maskImage:
            side === "full"
              ? undefined
              : "linear-gradient(to bottom, #000 0%, #000 30%, transparent 92%)",
        }}
      />
    );
  };

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {layers.previous !== layers.current && layer(layers.previous, false)}
      {layer(layers.current, true)}
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
