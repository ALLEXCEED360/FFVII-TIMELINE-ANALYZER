import { useEffect } from "react";
import { useMediaQuery } from "../lib/useMediaQuery";
import { useUi } from "../stores/ui";

/** Cloud's Buster Sword, by Cursors-4U: a stylesheet that animates the pointer (credited on /credits). */
const SWORD = "/cursors/buster-sword.css";

/** Cloud's Buster Sword as the pointer: its stylesheet loads only while chosen and a mouse is present. */
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
