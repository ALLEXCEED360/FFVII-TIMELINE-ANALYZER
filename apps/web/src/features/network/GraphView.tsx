import type { Core, ElementDefinition, NodeSingular } from "cytoscape";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../lib/motion";
import { GRAPH_STYLE, phoneStyle } from "./style";

// The web (Cytoscape, loaded on demand), placed in rings by ringLayout (elements.ts). Changes apply
// as a diff, things gliding to their new places. Plain scroll scrolls the page; Ctrl/⌘ + scroll zooms.

type Cytoscape = typeof import("cytoscape");

let loaded: Promise<Cytoscape> | undefined;
function loadCytoscape(): Promise<Cytoscape> {
  loaded ??= import("cytoscape").then(({ default: cytoscape }) => cytoscape);
  return loaded;
}

/** How near, in screen pixels, a tap needs to be to count as a tap on something. */
const NEAR_TAP = 26;

const isTouch = () => window.matchMedia("(hover: none) and (pointer: coarse)").matches;
const isPhone = () => isTouch() && window.matchMedia("(max-width: 63.99rem)").matches;

/** The zoom and pan that show the whole web. On a phone, names too small to read aren't shown, so
 *  they get no room: the rings fill the field. */
function wholeWeb(instance: Core) {
  const box = instance.elements().boundingBox({ includeLabels: !isPhone() });
  const padding = 30;
  const zoom = Math.max(
    instance.minZoom(),
    Math.min(
      instance.maxZoom(),
      (instance.width() - padding * 2) / box.w,
      (instance.height() - padding * 2) / box.h,
    ),
  );
  const pan = {
    x: (instance.width() - zoom * (box.x1 + box.x2)) / 2,
    y: (instance.height() - zoom * (box.y1 + box.y2)) / 2,
  };
  return { zoom, pan };
}

export default function GraphView({
  elements,
  layoutKey,
  center,
  onSelect,
  onFocus,
  dashed = false,
  foot,
}: {
  elements: ElementDefinition[];
  /** Whether a dashed line (a link only one story shows) can appear, to say so under the web. */
  dashed?: boolean;
  /** Changes when the set of entities changes, which fits the web to its field again. */
  layoutKey: string;
  /** The web's centre: putting something else there starts the web afresh. */
  center: string;
  onSelect: (id: string | null) => void;
  /** Double-click: make this entity the centre. */
  onFocus: (id: string) => void;
  /** Shown under the web in place of how to use it. */
  foot?: ReactNode;
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
  // What's been dragged somewhere stays there, until Reset or a new centre.
  const placed = useRef(new Set<string>());
  const placedFor = useRef(center);
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
        style: isPhone() ? phoneStyle(GRAPH_STYLE) : GRAPH_STYLE,
        // Low enough that a big web fits whole in a phone's small field.
        minZoom: 0.1,
        maxZoom: 3,
        // A plain scroll scrolls the page, not the web (see the wheel handler below); on a touch
        // screen, where there's no wheel, two fingers pinch to zoom.
        userZoomingEnabled: isTouch(),
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
      instance.on("dragfree", "node", (event) => {
        placed.current.add((event.target as NodeSingular).id());
      });
      instance.on("tap", "node", (event) => {
        handlers.current.onSelect((event.target as NodeSingular).id());
      });
      instance.on("dbltap", "node", (event) => {
        handlers.current.onFocus((event.target as NodeSingular).id());
      });
      instance.on("tap", (event) => {
        if (event.target !== instance) return;
        // A finger is wider than these: the nearest thing, if it's close, is what was meant.
        let nearest: { id: string; away: number } | null = null;
        if (isTouch()) {
          const tap = event.renderedPosition;
          instance.nodes().forEach((node) => {
            const at = node.renderedPosition();
            const away = Math.hypot(at.x - tap.x, at.y - tap.y);
            if (away <= NEAR_TAP && (!nearest || away < nearest.away)) {
              nearest = { id: node.id(), away };
            }
          });
        }
        handlers.current.onSelect((nearest as { id: string } | null)?.id ?? null);
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
      instance.viewport(wholeWeb(instance));
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
    if (placedFor.current !== center) {
      placedFor.current = center;
      placed.current.clear();
    }
    instance.batch(() => {
      instance.elements().forEach((el) => {
        if (wanted.has(el.id())) return;
        placed.current.delete(el.id());
        el.remove();
      });
      const toAdd: ElementDefinition[] = [];
      for (const [id, definition] of wanted) {
        const existing = instance.getElementById(id);
        if (existing.empty()) toAdd.push(definition);
        else {
          existing.data(definition.data);
          existing.classes(typeof definition.classes === "string" ? definition.classes : "");
          const to = definition.position;
          if (to && existing.isNode() && !placed.current.has(id)) {
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
      // Each with its own copy of its place: Cytoscape moves the object it's given, and Reset needs
      // these to stay the home a dragged thing goes back to.
      instance.add(
        toAdd
          .filter((e) => e.group === "nodes")
          .map((e) => (e.position ? { ...e, position: { ...e.position } } : e)),
      );
      instance.add(toAdd.filter((e) => e.group === "edges"));
    });
  }, [elements, center, ready, reducedMotion]);

  // Something chosen from a list may be off the field: bring it into view.
  useEffect(() => {
    const instance = cy.current;
    if (!ready || !instance || !settledRef.current) return;
    const chosen = instance.$("node.selected");
    if (chosen.empty()) return;
    const at = chosen.renderedPosition();
    if (at.x >= 0 && at.y >= 0 && at.x <= instance.width() && at.y <= instance.height()) return;
    instance.animate(
      { center: { eles: chosen } },
      { duration: reducedMotion ? 0 : 300, easing: "ease-in-out-cubic" },
    );
  }, [elements, ready, reducedMotion]);

  // Fit the web to its field whenever the set of entities changes (after things have glided).
  useEffect(() => {
    const instance = cy.current;
    if (!ready || !instance || instance.nodes().empty()) return;
    instance.resize();
    if (!settledRef.current || reducedMotion) {
      instance.viewport(wholeWeb(instance));
      settledRef.current = true;
      setSettled(true);
      // The ring waits for the web to settle before it locks on.
      instance.emit("render");
      return;
    }
    instance.animate(wholeWeb(instance), { duration: 450 });
  }, [layoutKey, ready, reducedMotion]);

  const zoom = (factor: number) => {
    const instance = cy.current;
    if (!instance) return;
    // Pressing quickly: finish the last step, so each press counts in full.
    instance.stop(true, true);
    const level = instance.zoom() * factor;
    const chosen = instance.$("node.selected");
    if (chosen.empty()) {
      instance.zoom({
        level,
        renderedPosition: { x: instance.width() / 2, y: instance.height() / 2 },
      });
      return;
    }
    // Something chosen: the zoom is about it, and brings it to the middle of the field.
    const at = chosen.position();
    const to = Math.min(instance.maxZoom(), Math.max(instance.minZoom(), level));
    instance.animate(
      {
        zoom: to,
        pan: { x: instance.width() / 2 - to * at.x, y: instance.height() / 2 - to * at.y },
      },
      { duration: reducedMotion ? 0 : 220, easing: "ease-in-out-cubic" },
    );
  };

  // Everything back in its ring, nothing chosen, the whole web in view.
  const reset = () => {
    const instance = cy.current;
    if (!instance) return;
    placed.current.clear();
    handlers.current.onSelect(null);
    instance.stop(true, true);
    const homes = new Map(elements.map((e) => [String(e.data.id), e.position]));
    const going: Promise<void>[] = [];
    instance.nodes().forEach((node) => {
      const home = homes.get(node.id());
      if (!home) return;
      node.stop(true, true);
      if (reducedMotion) node.position(home);
      else {
        going.push(
          new Promise<void>((done) => {
            node.animate(
              { position: home },
              {
                duration: 450,
                easing: "ease-in-out-cubic",
                complete: () => {
                  done();
                },
              },
            );
          }),
        );
      }
    });
    void Promise.all(going).then(() => {
      if (cy.current !== instance) return;
      instance.animate(wholeWeb(instance), { duration: reducedMotion ? 0 : 300 });
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
      {foot ?? (
        <ul aria-label="How to use the web" className="nw-how">
          <li>
            <kbd>Tap</kbd> see its links
          </li>
          <li className="nw-how-mouse">
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
      )}
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
        <button type="button" className="nw-tool nw-tool-wide" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}
