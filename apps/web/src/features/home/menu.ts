import { useRef, useState } from "react";
import { type PageName, preloadPage } from "../../app/pages";

/** The commands, each with a wide picture for the backdrop (none shared with a game's cover). */
export const SECTIONS: readonly {
  to: string;
  page: PageName;
  name: string;
  text: string;
  art: string;
}[] = [
  {
    to: "/timeline",
    page: "timeline",
    name: "Timeline",
    text: "Every event in the order it happens in the story, or in the order you play it.",
    art: "places/midgar-concept",
  },
  {
    to: "/compare",
    page: "compare",
    name: "Compare",
    text: "The same event, character or place across the titles, with what changed between them.",
    art: "places/junon",
  },
  {
    to: "/divergence",
    page: "divergence",
    name: "Divergence",
    text: "Pick a moment and watch the shared history fork into a line for each telling.",
    art: "key/aerith",
  },
  {
    to: "/network",
    page: "network",
    name: "Network",
    text: "Who is bound to whom, and the strongest path between any two of them.",
    art: "places/shinra-lobby",
  },
  {
    to: "/explore",
    page: "explore",
    name: "Explore",
    text: "Browse every character, event, location and organization in the archive.",
    art: "places/sector-7",
  },
  {
    to: "/archive",
    page: "archive",
    name: "Archive",
    text: "Each game part by part, what cites it, and the research behind every fact.",
    art: "key/tifa",
  },
  {
    to: "/settings",
    page: "settings",
    name: "Config",
    text: "Motion, the title screen and the cursor, saved in this browser.",
    art: "key/barret-marlene",
  },
];

/** The chosen section, and moving the glove to another (with wrap). */
export function useMenu() {
  const [active, setActive] = useState(0);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);

  const choose = (i: number) => {
    setActive(i);
    const section = SECTIONS[i];
    if (section) preloadPage(section.page);
  };

  /** Move the glove to a command, wrapping round, and focus it. */
  const go = (i: number) => {
    const count = SECTIONS.length;
    const to = (i + count) % count;
    choose(to);
    links.current[to]?.focus({ preventScroll: true });
  };

  const ref = (i: number) => (el: HTMLAnchorElement | null) => {
    links.current[i] = el;
  };

  return { active, choose, go, ref, current: SECTIONS[active] ?? SECTIONS[0] };
}
