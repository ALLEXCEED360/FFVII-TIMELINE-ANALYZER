import { useEffect } from "react";
import { useMediaQuery } from "../lib/useMediaQuery";
import { useUi } from "../stores/ui";

/** Cloud's Buster Sword, by Cursors-4U: a stylesheet that animates the pointer (credited on /credits). */
const SWORD = "/cursors/buster-sword.css";

/**
 * The game cursor: Cloud's Buster Sword in place of the system pointer, on devices that have one.
 * Its stylesheet is loaded only while it's chosen in Settings (and a mouse is present), so it
 * costs nothing otherwise, and taken away again when it isn't. While it's on, everything shows
 * the sword (<html data-cursor="sword">), rather than the system's hand over some controls.
 */
export function Cursor() {
  const setting = useUi((s) => s.cursor);
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)", false);
  const enabled = setting === "game" && finePointer;

  useEffect(() => {
    if (!enabled) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = SWORD;
    document.head.append(link);
    document.documentElement.dataset.cursor = "sword";
    return () => {
      link.remove();
      delete document.documentElement.dataset.cursor;
    };
  }, [enabled]);

  return null;
}
