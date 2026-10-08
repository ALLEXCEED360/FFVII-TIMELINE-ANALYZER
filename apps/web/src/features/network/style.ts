import type { StylesheetJson } from "cytoscape";
import { MATERIA } from "../../lib/kinds";
import { CATEGORY_WORDS } from "./words";

// How the web is drawn (Cytoscape can't read CSS variables). Each kind has a colour and a shape,
// so colour is never the only cue; people wear their portraits.

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
      "font-size": 12,
      "font-weight": 600,
      "text-valign": "bottom",
      "text-margin-y": 7,
      "text-wrap": "wrap",
      "text-max-width": "120px",
      "text-outline-color": OUTLINE,
      "text-outline-width": 3,
      width: 30,
      height: 30,
      "background-fill": "radial-gradient",
      "background-gradient-stop-positions": [0, 45, 100],
      "border-width": 2,
      "border-opacity": 0.9,
      "transition-property": "opacity, width, height, border-width",
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
  // People wear their portraits, cut out over their green orb.
  {
    selector: "node.portrait",
    style: {
      width: 46,
      height: 46,
      "background-image": "data(image)",
      "background-fit": "cover",
      "background-clip": "node",
      "background-position-y": "0%",
      "background-image-containment": "over",
      "border-width": 3,
    },
  },
  {
    selector: "node.center",
    style: {
      width: 70,
      height: 70,
      "font-family": "Optimus Princeps, Georgia, serif",
      "font-size": 17,
      "text-margin-y": 9,
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
  {
    selector: "edge",
    style: {
      width: 2,
      "curve-style": "bezier",
      "target-arrow-shape": "triangle",
      "arrow-scale": 0.9,
      "line-opacity": 0.6,
      label: "data(label)",
      "font-family": "Inter Variable, system-ui, sans-serif",
      "font-size": 10,
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
