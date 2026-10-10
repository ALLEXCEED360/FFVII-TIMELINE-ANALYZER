import type { StylesheetJson } from "cytoscape";
import { MATERIA } from "../../lib/kinds";
import { CATEGORY_WORDS } from "./words";

// How the web is drawn (Cytoscape can't read CSS variables). Each kind has a colour and a shape,
// so colour is never the only cue; people wear their portraits. Names sit outside their ring, on the
// side ringLayout chose; the far rings are small dots whose names show when they're pointed at.

export const KIND_SHAPE = {
  character: "ellipse",
  event: "diamond",
  location: "round-rectangle",
  organization: "hexagon",
} as const;

const TEXT = "#eef2fb";
const OUTLINE = "#05080d";
const ACCENT = "#7fd6ff";
const MAKO = "#8ef0c6";

export const GRAPH_STYLE: StylesheetJson = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      color: TEXT,
      "font-family": "Inter Variable, system-ui, sans-serif",
      "font-size": 18,
      "font-weight": 600,
      "text-valign": "bottom",
      "text-margin-y": 8,
      "text-wrap": "wrap",
      "text-max-width": "150px",
      "text-outline-color": OUTLINE,
      "text-outline-width": 3,
      width: 28,
      height: 28,
      "background-fill": "radial-gradient",
      "background-gradient-stop-positions": [0, 45, 100],
      "border-width": 2,
      "border-opacity": 0.9,
      "transition-property": "opacity, width, height, border-width, text-opacity",
      "transition-duration": 150,
    },
  },
  ...Object.entries(MATERIA).map(([kind, { color, light, deep }]) => ({
    selector: `node.${kind}`,
    style: {
      shape: KIND_SHAPE[kind as keyof typeof KIND_SHAPE],
      "background-gradient-stop-colors": [light, color, deep],
      "border-color": color,
    },
  })),
  { selector: "node.event", style: { width: 24, height: 24 } },
  // Each name on the side of its ring that faces out.
  {
    selector: "node.name-right",
    style: {
      "text-halign": "right",
      "text-valign": "center",
      "text-margin-x": 11,
      "text-margin-y": 0,
      "text-justification": "left",
    },
  },
  {
    selector: "node.name-left",
    style: {
      "text-halign": "left",
      "text-valign": "center",
      "text-margin-x": -11,
      "text-margin-y": 0,
      "text-justification": "right",
    },
  },
  { selector: "node.name-top", style: { "text-valign": "top", "text-margin-y": -8 } },
  // Above and below the centre the ring is tightest side to side, so those names are narrower.
  { selector: "node.name-top, node.name-bottom", style: { "text-max-width": "105px" } },
  // Everything wears its picture: people their portraits, moments, places and groups their own
  // scenes, so no two look alike. The shape (and the edge, in its materia's colour) says the kind:
  // a person's circle, a moment's diamond, a place's rounded square, a group's hexagon.
  {
    selector: "node.pictured",
    style: {
      width: 46,
      height: 46,
      "background-image": "data(image)",
      "background-fit": "cover",
      "background-clip": "node",
      "background-image-containment": "over",
      "border-width": 3,
    },
  },
  { selector: "node.pictured.event", style: { width: 54, height: 54 } },
  { selector: "node.pictured.organization", style: { width: 50, height: 50 } },
  ...Object.entries(MATERIA).map(([kind, { color }]) => ({
    selector: `node.pictured.${kind}`,
    style: {
      "underlay-color": color,
      "underlay-opacity": 0.22,
      "underlay-padding": 5,
      "underlay-shape": "ellipse" as const,
    },
  })),
  // Two or three steps away: small and nameless until pointed at, chosen, or next to the chosen.
  { selector: "node.far", style: { width: 16, height: 16, "text-opacity": 0, "font-size": 16 } },
  { selector: "node.far.pictured", style: { width: 28, height: 28, "border-width": 2 } },
  { selector: "node.far.pictured.event", style: { width: 32, height: 32 } },
  {
    selector: "node.far.named, node.far.near, node.far.selected, node.far.on-path",
    style: { "text-opacity": 1 },
  },
  {
    selector: "node.center",
    style: {
      width: 74,
      height: 74,
      "font-family": "Optimus Princeps, Georgia, serif",
      "font-size": 22,
      "text-margin-y": 10,
      "border-width": 4,
      "underlay-color": MAKO,
      "underlay-opacity": 0.28,
      "underlay-padding": 12,
      "underlay-shape": "ellipse",
    },
  },
  { selector: "node.expanded", style: { "border-style": "dashed" } },
  {
    selector: "node.selected",
    style: {
      "border-color": ACCENT,
      "border-width": 5,
      "underlay-color": ACCENT,
      "underlay-opacity": 0.35,
      "underlay-padding": 10,
      "underlay-shape": "ellipse",
    },
  },
  { selector: "node.on-path", style: { "border-color": MAKO, "border-width": 4 } },
  // The chosen thing's name steps out past the ring locked on to it (GraphView).
  { selector: "node.selected", style: { "text-margin-y": 22 } },
  { selector: "node.selected.name-top", style: { "text-margin-y": -22 } },
  { selector: "node.selected.name-right", style: { "text-margin-x": 24, "text-margin-y": 0 } },
  { selector: "node.selected.name-left", style: { "text-margin-x": -24, "text-margin-y": 0 } },
  {
    selector: "edge",
    style: {
      width: 2,
      "curve-style": "bezier",
      "target-arrow-shape": "triangle",
      "arrow-scale": 0.8,
      "line-opacity": 0.55,
      label: "data(label)",
      "font-family": "Inter Variable, system-ui, sans-serif",
      "font-size": 12,
      color: TEXT,
      "text-rotation": "autorotate",
      "text-outline-color": OUTLINE,
      "text-outline-width": 3,
      "text-opacity": 0,
    },
  },
  ...Object.entries(CATEGORY_WORDS).map(([category, { color }]) => ({
    selector: `edge.${category}`,
    style: { "line-color": color, "target-arrow-color": color },
  })),
  { selector: "edge.single-title", style: { "line-style": "dashed" } },
  // Links between things out on the rings stay faint, so the web never becomes a tangle.
  { selector: "edge.rim", style: { width: 1.4, "line-opacity": 0.16, "arrow-scale": 0.6 } },
  // A thing pointed at or chosen: its links light up, with their words.
  { selector: "edge.near, edge.lit", style: { width: 3.5, "line-opacity": 1, "text-opacity": 1 } },
  {
    selector: "edge.on-path",
    style: {
      width: 5,
      "line-color": MAKO,
      "target-arrow-color": MAKO,
      "line-opacity": 1,
      "text-opacity": 1,
      color: MAKO,
    },
  },
  { selector: ".faded, .dim", style: { opacity: 0.14 } },
];
