import type { Core, ElementDefinition, NodeSingular } from "cytoscape";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../lib/motion";
import { GRAPH_STYLE } from "./style";

// The web (Cytoscape, loaded on demand), placed in rings by ringLayout (elements.ts). Changes apply
// as a diff, things gliding to their new places. Plain scroll scrolls the page; Ctrl/⌘ + scroll zooms.

type Cytoscape = typeof import("cytoscape");

let loaded: Promise<Cytoscape> | undefined;
function loadCytoscape(): Promise<Cytoscape> {
  loaded ??= import("cytoscape").then(({ default: cytoscape }) => cytoscape);
  return loaded;
}

export default function GraphView({
  elements,
  layoutKey,
  onSelect,
  onFocus,
  dashed = false,
}: {
  elements: ElementDefinition[];
  /** Whether a dashed line (a link only one story shows) can appear, to say so under the web. */
  dashed?: boolean;
  /** Changes when the set of entities changes, which fits the web to its field again. */
  layoutKey: string;
  onSelect: (id: string | null) => void;
  /** Double-click: make this entity the centre. */
  onFocus: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const cy = useRef<Core | null>(null);
  const [ready, setReady] = useState(false);
  // Hidden until its first layout settles, so it never shows as a heap in one corner.
  const [settled, setSettled] = useState(false);
  const settledRef = useRef(false);
  const reducedMotion = useReducedMotion();
  // A ring locks on to the chosen thing, pulsing, so it's clear which one the panel is about.
  const lock = useRef<HTMLSpanElement>(null);
  // Cytoscape's listeners are attached once; they call whatever handlers are current.
  const handlers = useRef({ onSelect, onFocus });
  useEffect(() => {
    handlers.current = { onSelect, onFocus };
  });

  // Create the instance once.
  useEffect(() => {
    let cancelled = false;
    void loadCytoscape().then((cytoscape) => {
      if (cancelled || !container.current) return;
      const instance = cytoscape({
        container: container.current,
        style: GRAPH_STYLE,
        minZoom: 0.25,
        maxZoom: 3,
        // A plain scroll scrolls the page, not the web (see the wheel handler below); on a touch
        // screen, where there's no wheel, two fingers pinch to zoom.
        userZoomingEnabled: window.matchMedia("(hover: none) and (pointer: coarse)").matches,
      });
      const placeLock = () => {
        const ring = lock.current;
        if (!ring) return;
        const node = instance.$("node.selected");
        if (node.empty() || !settledRef.current) {
          ring.style.opacity = "0";
          return;
        }
        const at = node.renderedPosition();
        const size = node.renderedOuterWidth() + 20;
        ring.style.opacity = "1";
        ring.style.left = `${String(at.x)}px`;
        ring.style.top = `${String(at.y)}px`;
        ring.style.width = `${String(size)}px`;
        ring.style.height = `${String(size)}px`;
      };
      instance.on("render", placeLock);
      instance.on("mouseover", "node", (event) => {
        const hood = (event.target as NodeSingular).closedNeighborhood();
        instance.batch(() => {
          instance.elements().not(hood).addClass("dim");
          hood.edges().addClass("lit");
          // The names of what it links to show, even out on the far rings.
          hood.nodes().addClass("named");
        });
        if (container.current) container.current.style.cursor = "pointer";
      });
      instance.on("mouseout", "node", () => {
        instance.batch(() => {
          instance.elements().removeClass("dim lit named");
        });
        if (container.current) container.current.style.cursor = "";
      });
      instance.on("tap", "node", (event) => {
        handlers.current.onSelect((event.target as NodeSingular).id());
      });
      instance.on("dbltap", "node", (event) => {
        handlers.current.onFocus((event.target as NodeSingular).id());
      });
      instance.on("tap", (event) => {
        if (event.target === instance) handlers.current.onSelect(null);
      });
      cy.current = instance;
      setReady(true);
    });
    return () => {
      cancelled = true;
      cy.current?.destroy();
      cy.current = null;
    };
  }, []);

  // Cytoscape only re-measures on window resize; refit whenever the box itself changes size.
  useEffect(() => {
    const instance = cy.current;
    const box = container.current;
    if (!ready || !instance || !box || typeof ResizeObserver === "undefined") return;
    let last = `${String(box.clientWidth)}x${String(box.clientHeight)}`;
    const observer = new ResizeObserver(() => {
      const size = `${String(box.clientWidth)}x${String(box.clientHeight)}`;
      if (size === last) return;
      last = size;
      instance.resize();
      instance.fit(undefined, 30);
    });
    observer.observe(box);
    return () => {
      observer.disconnect();
    };
  }, [ready]);

  // Ctrl/⌘ + scroll zooms around the pointer; a plain scroll is left to the page.
  useEffect(() => {
    const box = container.current;
    if (!ready || !box) return;
    const onWheel = (event: WheelEvent) => {
      const instance = cy.current;
      if (!instance || !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      const rect = box.getBoundingClientRect();
      instance.zoom({
        level: instance.zoom() * (event.deltaY < 0 ? 1.15 : 1 / 1.15),
        renderedPosition: { x: event.clientX - rect.left, y: event.clientY - rect.top },
      });
    };
    box.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      box.removeEventListener("wheel", onWheel);
    };
  }, [ready]);

  // Node transitions (selection, fading) follow the Motion setting too.
  useEffect(() => {
    const instance = cy.current;
    if (!ready || !instance) return;
    instance
      .style()
      .selector("node")
      .style("transition-duration", reducedMotion ? 0 : 150)
      .update();
  }, [ready, reducedMotion]);

  // Apply the elements as a diff: remove what's gone, add what's new, update the rest.
  useEffect(() => {
    const instance = cy.current;
    if (!ready || !instance) return;
    const wanted = new Map(elements.map((e) => [String(e.data.id), e]));
    instance.batch(() => {
      instance.elements().forEach((el) => {
        if (!wanted.has(el.id())) el.remove();
      });
      const toAdd: ElementDefinition[] = [];
      for (const [id, definition] of wanted) {
        const existing = instance.getElementById(id);
        if (existing.empty()) toAdd.push(definition);
        else {
          existing.data(definition.data);
          existing.classes(typeof definition.classes === "string" ? definition.classes : "");
          const to = definition.position;
          if (to && existing.isNode()) {
            const at = existing.position();
            if (Math.abs(at.x - to.x) > 0.5 || Math.abs(at.y - to.y) > 0.5) {
              // Glide to its new place once the web is showing; jump there before.
              if (settledRef.current && !reducedMotion) {
                existing.animate({ position: to }, { duration: 450, easing: "ease-in-out-cubic" });
              } else existing.position(to);
            }
          }
        }
      }
      // Nodes before edges, so every edge finds its endpoints.
      instance.add(toAdd.filter((e) => e.group === "nodes"));
      instance.add(toAdd.filter((e) => e.group === "edges"));
    });
  }, [elements, ready, reducedMotion]);

  // Fit the web to its field whenever the set of entities changes (after things have glided).
  useEffect(() => {
    const instance = cy.current;
    if (!ready || !instance || instance.nodes().empty()) return;
    instance.resize();
    if (!settledRef.current || reducedMotion) {
      instance.fit(undefined, 30);
      settledRef.current = true;
      setSettled(true);
      // The ring waits for the web to settle before it locks on.
      instance.emit("render");
      return;
    }
    instance.animate({ fit: { eles: instance.elements(), padding: 30 } }, { duration: 450 });
  }, [layoutKey, ready, reducedMotion]);

  const zoom = (factor: number) => {
    const instance = cy.current;
    if (!instance) return;
    instance.zoom({
      level: instance.zoom() * factor,
      renderedPosition: { x: instance.width() / 2, y: instance.height() / 2 },
    });
  };

  return (
    <div className="nw-graph">
      <div className="nw-graph-field">
        <div
          ref={container}
          // Cytoscape makes its container position: relative, so size it explicitly.
          className={`nw-graph-canvas ${settled ? "is-settled" : ""}`}
          role="img"
          aria-label="The web of links. The panel beside it and the list below it say the same in words."
        />
        <span ref={lock} aria-hidden="true" className="nw-lock" />
        {!settled && (
          <div role="status" className="nw-graph-loading">
            Drawing the web…
          </div>
        )}
      </div>
      <ul aria-label="How to use the web" className="nw-how">
        <li>
          <kbd>Tap</kbd> see its links
        </li>
        <li>
          <kbd>Double-tap</kbd> put it in the centre
        </li>
        <li>
          <kbd>Drag</kbd> move it, or the whole web
        </li>
        <li className="nw-how-mouse">
          <kbd>Ctrl + scroll</kbd> zoom
        </li>
        <li className="nw-how-touch">
          <kbd>Pinch</kbd> or <kbd>+</kbd> <kbd>−</kbd> zoom
        </li>
        {dashed && (
          <li className="nw-how-key">
            <span aria-hidden="true" className="nw-line nw-line-dashed" />
            only one of the two stories shows that link
          </li>
        )}
      </ul>
      <div className="nw-graph-tools">
        <button
          type="button"
          className="nw-tool"
          aria-label="Zoom in"
          onClick={() => {
            zoom(1.3);
          }}
        >
          +
        </button>
        <button
          type="button"
          className="nw-tool"
          aria-label="Zoom out"
          onClick={() => {
            zoom(1 / 1.3);
          }}
        >
          −
        </button>
        <button
          type="button"
          className="nw-tool nw-tool-wide"
          onClick={() => cy.current?.fit(undefined, 30)}
        >
          Show all
        </button>
      </div>
    </div>
  );
}
