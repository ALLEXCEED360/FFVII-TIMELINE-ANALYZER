import type { Reference } from "../../api/client";
import { titleShort, worldName } from "../../lib/reference";
import { TITLE_COLOR } from "../../lib/titles";
import { type DivergenceLayout, MARKING_LABELS, type Marking } from "./layout";

// The divergence map (docs/features/divergence.md): one trunk line of shared history that forks,
// at the pivot, into a line per title — and per world, forking again from its title. Stations are
// shaped by how each branch shows the event, so the map reads without relying on colour.

const LEFT = 150;
const COL = 150;
const TOP = 70;
const LANE = 58;
const PAD = 40;

interface Props {
  layout: DivergenceLayout;
  reference: Reference | undefined;
  selected: string | null;
  onSelect: (eventId: string) => void;
}

export function DivergenceMap({ layout, reference, selected, onSelect }: Props) {
  const width = LEFT + layout.columns * COL + PAD;
  const height = TOP + layout.lanes.length * LANE + PAD / 2;
  const x = (column: number) => LEFT + column * COL + COL / 2;
  const laneY = (row: number) => TOP + row * LANE + LANE / 2;
  const trunkY = laneY((layout.lanes.length - 1) / 2);
  const rowOf = new Map(layout.lanes.map((l) => [l.key, l.row]));
  const forkX = x(layout.pivotColumn) - COL / 2;
  const laneName = (lane: DivergenceLayout["lanes"][number]) =>
    lane.world === "world_main"
      ? titleShort(reference, lane.title)
      : `${titleShort(reference, lane.title)} · ${worldName(reference, lane.world)}`;

  return (
    <div className="panel overflow-x-auto">
      <svg
        width={width}
        height={height}
        role="group"
        aria-label="Divergence map. The list below has the same information as text."
        className="block"
      >
        {/* Selected event column */}
        {layout.headers
          .filter((h) => h.eventId === selected)
          .map((h) => (
            <rect
              key={h.eventId}
              x={x(h.column) - COL / 2 + 6}
              y={TOP - 8}
              width={COL - 12}
              height={height - TOP}
              rx={6}
              className="fill-mako-400/10"
            />
          ))}

        {/* Column headers */}
        {layout.headers.map((h, i) => (
          <g key={h.eventId}>
            <text
              x={x(h.column)}
              y={i % 2 === 0 ? 22 : 42}
              textAnchor="middle"
              className={`cursor-pointer text-[11px] ${h.eventId === selected ? "fill-mako-200 font-semibold" : h.pivot ? "fill-steel-100 font-semibold" : "fill-steel-300"}`}
              onClick={() => {
                onSelect(h.eventId);
              }}
            >
              {fit(h.name, COL * 2 - 16)}
              <title>{h.name}</title>
            </text>
            <line
              x1={x(h.column)}
              x2={x(h.column)}
              y1={i % 2 === 0 ? 28 : 48}
              y2={TOP - 10}
              className="stroke-night-600"
            />
          </g>
        ))}

        {/* Pivot marker */}
        <line
          x1={forkX}
          x2={forkX}
          y1={TOP - 6}
          y2={height - 6}
          className="stroke-mako-500/60"
          strokeDasharray="4 4"
        />
        <text
          x={forkX + 4}
          y={height - 10}
          className="fill-mako-300 font-mono text-[9px] tracking-widest uppercase"
        >
          Pivot
        </text>

        {/* Lane labels */}
        {layout.lanes.map((lane) => (
          <text
            key={lane.key}
            x={12}
            y={laneY(lane.row)}
            dominantBaseline="middle"
            className="fill-steel-200 font-display text-[12px] font-semibold tracking-wider uppercase"
          >
            {fit(laneName(lane), LEFT - 20)}
            <title>{laneName(lane)}</title>
          </text>
        ))}

        {/* Trunk */}
        {layout.trunk.length > 0 && (
          <line
            x1={x(0) - COL / 3}
            x2={forkX}
            y1={trunkY}
            y2={trunkY}
            className="stroke-steel-300"
            strokeWidth={4}
            strokeLinecap="round"
          />
        )}

        {/* Forks and lanes */}
        {layout.lanes.map((lane) => {
          const y = laneY(lane.row);
          const color = TITLE_COLOR[lane.title];
          const parentRow = lane.parent ? rowOf.get(lane.parent) : undefined;
          const fromY = parentRow === undefined ? trunkY : laneY(parentRow);
          const startX = parentRow === undefined ? forkX : forkX + COL / 4;
          const endX = x(layout.laneEnds[lane.key] ?? layout.pivotColumn);
          const dash = lane.world === "world_main" ? undefined : "6 5";
          return (
            <g key={lane.key}>
              <path
                d={`M ${String(startX - (parentRow === undefined ? 0 : COL / 4))} ${String(fromY)} C ${String(startX + COL / 4)} ${String(fromY)}, ${String(startX + COL / 4)} ${String(y)}, ${String(x(layout.pivotColumn))} ${String(y)}`}
                fill="none"
                stroke={color}
                strokeWidth={4}
                strokeDasharray={dash}
                opacity={0.9}
              />
              {endX > x(layout.pivotColumn) && (
                <line
                  x1={x(layout.pivotColumn)}
                  x2={endX}
                  y1={y}
                  y2={y}
                  stroke={color}
                  strokeWidth={4}
                  strokeDasharray={dash}
                  strokeLinecap="round"
                />
              )}
            </g>
          );
        })}

        {/* Trunk stops */}
        {layout.trunk.map((stop) => (
          <g
            key={stop.eventId}
            role="button"
            tabIndex={0}
            aria-label={`${nameOf(layout, stop.eventId)} — before the pivot: ${stop.summary === "shared" ? "told alike" : "told differently"}`}
            aria-pressed={stop.eventId === selected}
            className="cursor-pointer"
            onClick={() => {
              onSelect(stop.eventId);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(stop.eventId);
              }
            }}
          >
            <circle cx={x(stop.column)} cy={trunkY} r={14} fill="transparent" />
            {stop.summary === "shared" ? (
              <circle
                cx={x(stop.column)}
                cy={trunkY}
                r={7}
                className="fill-steel-200 stroke-night-900"
                strokeWidth={2}
              />
            ) : (
              <path
                d={diamond(x(stop.column), trunkY, 9)}
                className="fill-night-900 stroke-mako-300"
                strokeWidth={2.5}
              />
            )}
          </g>
        ))}

        {/* Branch stops */}
        {layout.stops.map((stop) => {
          const lane = layout.lanes.find((l) => l.key === stop.lane);
          if (!lane) return null;
          const cx = x(stop.column);
          const cy = laneY(lane.row);
          return (
            <g
              key={`${stop.eventId}-${stop.lane}`}
              role="button"
              tabIndex={0}
              aria-label={`${nameOf(layout, stop.eventId)} — ${laneName(lane)}: ${MARKING_LABELS[stop.marking]}`}
              aria-pressed={stop.eventId === selected}
              className="cursor-pointer"
              onClick={() => {
                onSelect(stop.eventId);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(stop.eventId);
                }
              }}
            >
              <title>{`${nameOf(layout, stop.eventId)} — ${laneName(lane)}: ${MARKING_LABELS[stop.marking]}`}</title>
              <circle cx={cx} cy={cy} r={16} fill="transparent" />
              <StationGlyph
                marking={stop.marking}
                cx={cx}
                cy={cy}
                color={TITLE_COLOR[lane.title]}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function nameOf(layout: DivergenceLayout, eventId: string): string {
  return layout.headers.find((h) => h.eventId === eventId)?.name ?? eventId;
}

function diamond(cx: number, cy: number, r: number): string {
  return `M ${String(cx)} ${String(cy - r)} L ${String(cx + r)} ${String(cy)} L ${String(cx)} ${String(cy + r)} L ${String(cx - r)} ${String(cy)} Z`;
}

/** One shape per marking, so the map is readable without colour. */
export function StationGlyph({
  marking,
  cx,
  cy,
  color,
}: {
  marking: Marking;
  cx: number;
  cy: number;
  color: string;
}) {
  switch (marking) {
    case "shared":
      return (
        <circle cx={cx} cy={cy} r={8} fill={color} className="stroke-night-950" strokeWidth={2} />
      );
    case "changed":
      return (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={13}
            fill="none"
            className="stroke-mako-300"
            strokeWidth={1.5}
          />
          <path d={diamond(cx, cy, 9)} fill={color} className="stroke-night-950" strokeWidth={2} />
        </>
      );
    case "only_here":
      return (
        <rect
          x={cx - 7}
          y={cy - 7}
          width={14}
          height={14}
          fill={color}
          className="stroke-night-950"
          strokeWidth={2}
        />
      );
    case "not_yet_retold":
      return (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={8}
            fill="var(--color-night-950)"
            stroke={color}
            strokeWidth={2.5}
          />
          <path
            d={`M ${String(cx + 12)} ${String(cy)} l 6 0 m -3 -3 l 3 3 l -3 3`}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
          />
        </>
      );
    case "omitted":
      return (
        <>
          <circle cx={cx} cy={cy} r={9} className="fill-night-950" />
          <path
            d={`M ${String(cx - 5)} ${String(cy - 5)} L ${String(cx + 5)} ${String(cy + 5)} M ${String(cx + 5)} ${String(cy - 5)} L ${String(cx - 5)} ${String(cy + 5)}`}
            className="stroke-ember-400"
            strokeWidth={2.5}
          />
        </>
      );
    case "not_yet_reached":
      return (
        <circle
          cx={cx}
          cy={cy}
          r={8}
          className="fill-night-950 stroke-steel-400"
          strokeWidth={2}
          strokeDasharray="3 3"
        />
      );
    case "undocumented":
      return (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={8}
            className="fill-night-950 stroke-night-500"
            strokeWidth={2}
          />
          <text x={cx} y={cy + 4} textAnchor="middle" className="fill-steel-400 text-[10px]">
            ?
          </text>
        </>
      );
  }
}

function fit(text: string, pixels: number): string {
  const max = Math.floor(pixels / 6.2);
  return text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text;
}
