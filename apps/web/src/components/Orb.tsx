import type { CSSProperties } from "react";
import { MATERIA, isKind } from "../lib/kinds";

/** A small materia orb in a kind's colour. */
export function Orb({ kind, size = "0.85rem" }: { kind: string; size?: string }) {
  const materia = isKind(kind) ? MATERIA[kind].color : "#7fd6ff";
  return (
    <span
      aria-hidden="true"
      className="materia"
      style={{ width: size, height: size, "--materia": materia } as CSSProperties}
    />
  );
}
