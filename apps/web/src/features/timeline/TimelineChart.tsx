import { FRAMING_LABELS, STATUS_LABELS } from "@ffvii/shared/labels";
import { select } from "d3-selection";
import { type ZoomBehavior, type ZoomTransform, zoom, zoomIdentity } from "d3-zoom";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TitleCode } from "../../api/client";
import { TITLE_COLOR } from "../../lib/titles";
import { useWidth } from "../../lib/useWidth";
import type { Marker, TimelineLayout } from "./layout";

// The timeline as SVG: one lane per title, eras across the top, a marker wherever a title shows an
// event, and threads linking the same event across lanes. Drag to pan; Ctrl/⌘ + wheel or the
// buttons to zoom. The list view is the keyboard- and screen-reader-friendly alternative.

const LANE_LABEL = 128;
const LANE_HEIGHT = 64;
const ERA_ROW = 26;
/** Event names are set at an angle, so neighbours a few pixels apart never collide. */
const LABEL_BAND = 126;
const LABEL_ANGLE = -56;
/** Longest label, in pixels along its slant. */
const LABEL_LENGTH = 150;
const PAD_RIGHT = 96;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

interface Props {
  layout: TimelineLayout;
  selected: string | null;
  onSelect: (eventId: string) => void;
  titleName: (code: TitleCode) => string;
  eventName: (eventId: string) => string;
}

export function TimelineChart({ layout, selected, onSelect, titleName, eventName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const width = useWidth(containerRef);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [hovered, setHovered] = useState<{ marker: Marker; cx: number; cy: number } | null>(null);

  const hasColumns = layout.columns.length > 0;
  const top = (layout.eras.length > 0 ? ERA_ROW : 0) + (hasColumns ? LABEL_BAND : 8);
  const height = top + layout.lanes.length * LANE_HEIGHT + 8;
  const plotWidth = Math.max(200, width - LANE_LABEL - PAD_RIGHT);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .extent([
        [LANE_LABEL, 0],
        [LANE_LABEL + plotWidth, height],
      ])
      .translateExtent([
        [LANE_LABEL, 0],
        [LANE_LABEL + plotWidth, height],
      ])
      // Plain wheel scrolls the page; Ctrl/⌘ + wheel zooms. Dragging pans, except from a marker:
      // pressing a marker only selects it.
      .filter((event: Event) => {
        if (event.type === "wheel") {
          return (event as WheelEvent).ctrlKey || (event as WheelEvent).metaKey;
        }
        const onMarker = (event.target as Element | null)?.closest('[role="button"]');
        return !(event as MouseEvent).button && !onMarker;
      })
      .on("zoom", (event: { transform: ZoomTransform }) => {
        setTransform(event.transform);
      });
    zoomRef.current = behavior;
    select(svg).call(behavior);
    return () => {
      select(svg).on(".zoom", null);
    };
  }, [plotWidth, height]);

  const zoomBy = (factor: number) => {
    const svg = svgRef.current;
    if (svg && zoomRef.current) zoomRef.current.scaleBy(select(svg), factor);
  };
  const reset = () => {
    const svg = svgRef.current;
    if (svg && zoomRef.current) zoomRef.current.transform(select(svg), zoomIdentity);
  };

  const x = (fraction: number) => transform.applyX(LANE_LABEL + fraction * plotWidth);
  const laneY = (title: TitleCode) =>
    top + layout.lanes.indexOf(title) * LANE_HEIGHT + LANE_HEIGHT / 2;

  const selectedMarkers = useMemo(
    () => new Set(layout.markers.filter((m) => m.eventId === selected).map((m) => m.title)),
    [layout.markers, selected],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-1">
        <span className="label mr-2 hidden md:inline">Drag to pan · Ctrl/⌘ + scroll to zoom</span>
        <button
          type="button"
          className="btn px-2.5"
          onClick={() => {
            zoomBy(1.6);
          }}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className="btn px-2.5"
          onClick={() => {
            zoomBy(1 / 1.6);
          }}
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          className="btn"
          onClick={reset}
          disabled={transform.k === 1 && transform.x === 0}
        >
          Reset
        </button>
      </div>
      <div ref={containerRef} className="panel relative overflow-hidden">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          role="group"
          aria-label="Timeline chart. Use the list view for a text version."
          className="block cursor-grab touch-none select-none active:cursor-grabbing"
        >
          <defs>
            <clipPath id="timeline-plot">
              <rect x={LANE_LABEL} y={0} width={plotWidth + PAD_RIGHT} height={height} />
            </clipPath>
          </defs>

          {/* Lanes */}
          {layout.lanes.map((title, i) => (
            <g key={title}>
              <rect
                x={0}
                y={top + i * LANE_HEIGHT}
                width={width}
                height={LANE_HEIGHT}
                fill={i % 2 === 0 ? "rgb(255 255 255 / 0.015)" : "transparent"}
              />
              <rect
                x={0}
                y={top + i * LANE_HEIGHT + 14}
                width={3}
                height={LANE_HEIGHT - 28}
                fill={TITLE_COLOR[title]}
              />
              <text
                x={14}
                y={top + i * LANE_HEIGHT + LANE_HEIGHT / 2}
                dominantBaseline="middle"
                className="fill-steel-200 font-display text-[13px] font-semibold tracking-wider uppercase"
              >
                {titleName(title)}
              </text>
            </g>
          ))}

          <g clipPath="url(#timeline-plot)">
            {/* Era bands */}
            {layout.eras.map((era, i) => (
              <g key={era.id}>
                <rect
                  x={x(era.x0)}
                  y={0}
                  width={Math.max(0, x(era.x1) - x(era.x0))}
                  height={height}
                  fill={i % 2 === 0 ? "rgb(88 224 168 / 0.025)" : "transparent"}
                />
                <line
                  x1={x(era.x0)}
                  x2={x(era.x0)}
                  y1={0}
                  y2={height}
                  className="stroke-night-700"
                />
                <text
                  x={x(era.x0) + 8}
                  y={17}
                  className="fill-steel-400 font-mono text-[10px] tracking-[0.14em] uppercase"
                >
                  {fit(era.name, x(era.x1) - x(era.x0) - 14, 7.4)}
                  <title>{era.name}</title>
                </text>
              </g>
            ))}

            {/* Selected column */}
            {selected &&
              layout.columns
                .filter((c) => c.eventId === selected)
                .map((c) => (
                  <line
                    key={c.eventId}
                    x1={x(c.x)}
                    x2={x(c.x)}
                    y1={top - 4}
                    y2={height}
                    className="stroke-mako-400/40"
                    strokeWidth={10}
                  />
                ))}

            {/* Event labels, slanted so that close neighbours don't collide */}
            {layout.columns.map((column) => {
              const cx = x(column.x);
              const baseline = top - 8;
              const isSelected = column.eventId === selected;
              return (
                <g key={column.eventId}>
                  <line
                    x1={cx}
                    x2={cx}
                    y1={baseline + 2}
                    y2={top}
                    className={isSelected ? "stroke-mako-400" : "stroke-night-600"}
                  />
                  <text
                    x={cx + 3}
                    y={baseline}
                    transform={`rotate(${String(LABEL_ANGLE)} ${String(cx)} ${String(baseline)})`}
                    className={`cursor-pointer text-[11px] ${
                      isSelected
                        ? "fill-mako-200 font-semibold"
                        : column.importance === 3
                          ? "fill-steel-200 font-medium"
                          : "fill-steel-400"
                    }`}
                    onClick={() => {
                      onSelect(column.eventId);
                    }}
                  >
                    {fit(column.name, LABEL_LENGTH, 6.1)}
                    <title>{column.name}</title>
                  </text>
                </g>
              );
            })}

            {/* Threads linking the same event across lanes */}
            {layout.connectors.map((c) => (
              <line
                key={`${c.eventId}-${c.from.title}-${c.to.title}`}
                x1={x(c.from.x)}
                y1={laneY(c.from.title)}
                x2={x(c.to.x)}
                y2={laneY(c.to.title)}
                className={c.eventId === selected ? "stroke-mako-400" : "stroke-night-500"}
                strokeWidth={c.eventId === selected ? 2 : 1}
                strokeDasharray={c.from.x === c.to.x ? undefined : "3 3"}
              />
            ))}

            {/* Markers */}
            {layout.markers.map((marker) => (
              <MarkerGlyph
                key={`${marker.eventId}-${marker.title}`}
                marker={marker}
                cx={x(marker.x)}
                cy={laneY(marker.title)}
                selected={marker.eventId === selected && selectedMarkers.has(marker.title)}
                label={markerLabel(marker, eventName(marker.eventId), titleName(marker.title))}
                onSelect={onSelect}
                onHover={(on) => {
                  setHovered(on ? { marker, cx: x(marker.x), cy: laneY(marker.title) } : null);
                }}
              />
            ))}
          </g>
        </svg>
        {hovered && (
          <HoverPreview
            marker={hovered.marker}
            left={hovered.cx}
            top={hovered.cy}
            width={width}
            event={eventName(hovered.marker.eventId)}
            title={titleName(hovered.marker.title)}
          />
        )}
      </div>
    </div>
  );
}

function MarkerGlyph({
  marker,
  cx,
  cy,
  selected,
  label,
  onSelect,
  onHover,
}: {
  marker: Marker;
  cx: number;
  cy: number;
  selected: boolean;
  label: string;
  onSelect: (id: string) => void;
  onHover: (on: boolean) => void;
}) {
  const color = TITLE_COLOR[marker.title];
  const r = selected ? 9 : 7;
  const diamond = `M ${String(cx)} ${String(cy - r)} L ${String(cx + r)} ${String(cy)} L ${String(cx)} ${String(cy + r)} L ${String(cx - r)} ${String(cy)} Z`;
  const unreliable = marker.framing === "false_account" || marker.framing === "disputed_account";
  const otherWorldOnly = !marker.worlds.includes("world_main");

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={selected}
      className="cursor-pointer outline-none [&:focus-visible>path]:stroke-mako-300"
      onClick={() => {
        onSelect(marker.eventId);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(marker.eventId);
        }
      }}
      onPointerEnter={() => {
        onHover(true);
      }}
      onPointerLeave={() => {
        onHover(false);
      }}
      onFocus={() => {
        onHover(true);
      }}
      onBlur={() => {
        onHover(false);
      }}
    >
      {/* A generous invisible hit area */}
      <circle cx={cx} cy={cy} r={14} fill="transparent" />
      {selected && (
        <circle cx={cx} cy={cy} r={16} fill={color} opacity={0.18} className="timeline-glow" />
      )}
      {unreliable && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 5}
          fill="none"
          stroke={color}
          strokeDasharray="2 3"
          opacity={0.9}
        />
      )}
      {marker.status === "omitted" ? (
        <path
          d={`M ${String(cx - 5)} ${String(cy - 5)} L ${String(cx + 5)} ${String(cy + 5)} M ${String(cx + 5)} ${String(cy - 5)} L ${String(cx - 5)} ${String(cy + 5)}`}
          className="stroke-steel-400"
          strokeWidth={2}
        />
      ) : (
        <path
          d={diamond}
          fill={marker.status === "depicted" ? color : "var(--color-night-950)"}
          stroke={color}
          strokeWidth={2}
          strokeDasharray={otherWorldOnly ? "2 2" : undefined}
        />
      )}
      {marker.playRank !== null && (
        <text
          x={cx}
          y={cy + r + 13}
          textAnchor="middle"
          className="fill-steel-400 font-mono text-[9px]"
        >
          {marker.playRank}
        </text>
      )}
      {marker.overridden && (
        <circle cx={cx + r + 3} cy={cy - r - 1} r={2.5} className="fill-ember-400" />
      )}
    </g>
  );
}

/**
 * A preview of a marker on hover or focus (blueprint §21). Decorative for assistive technology:
 * the marker's own label already says all of this.
 */
function HoverPreview({
  marker,
  left,
  top,
  width,
  event,
  title,
}: {
  marker: Marker;
  left: number;
  top: number;
  width: number;
  event: string;
  title: string;
}) {
  const flip = left > width - 240;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-10 w-56 rounded border border-night-600 bg-night-900/95 p-2.5 shadow-lg shadow-black/50 backdrop-blur"
      style={{
        left: flip ? left - 232 : left + 16,
        top: Math.max(4, top - 28),
        borderLeft: `2px solid ${TITLE_COLOR[marker.title]}`,
      }}
    >
      <p className="text-sm font-semibold text-steel-100">{event}</p>
      <p className="mt-0.5 font-mono text-[10px] tracking-wider text-steel-400 uppercase">
        {title} · {STATUS_LABELS[marker.status]}
        {marker.framing && marker.framing !== "direct"
          ? ` · ${FRAMING_LABELS[marker.framing]}`
          : ""}
      </p>
      {!marker.worlds.includes("world_main") && (
        <p className="mt-0.5 text-xs text-steel-300">Only in another world</p>
      )}
      <p className="mt-1.5 text-[11px] text-mako-300">Select to inspect</p>
    </div>
  );
}

function markerLabel(marker: Marker, event: string, title: string): string {
  const parts = [`${event} — ${title}: ${STATUS_LABELS[marker.status]}`];
  if (marker.framing && marker.framing !== "direct") parts.push(FRAMING_LABELS[marker.framing]);
  if (!marker.worlds.includes("world_main")) parts.push("in another world");
  if (marker.overridden) parts.push("placed at a different time in this title");
  if (marker.playRank !== null) parts.push(`#${String(marker.playRank)} in play order`);
  return parts.join(" · ");
}

/** Shortens text to fit `pixels`, at roughly `charWidth` per character; empty if nothing fits. */
function fit(text: string, pixels: number, charWidth: number): string {
  const max = Math.floor(pixels / charWidth);
  if (max < 4) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
