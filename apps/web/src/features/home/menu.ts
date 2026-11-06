import { useRef, useState } from "react";
import { type PageName, preloadPage } from "../../app/pages";

/** The commands, each with a wide picture for the backdrop (none shared with a game's cover). */
export const SECTIONS: readonly {
  to: string;
  page: PageName;
  name: string;
  text: string;
  /** A few words under the name on a touch screen, so the commands read as places to go. */
  hint: string;
  art: string;
}[] = [
  {
    to: "/timeline",
    page: "timeline",
    name: "Timeline",
    hint: "Every event, in order",
    text: "Every event in the order it happens in the story, or in the order you play it.",
    art: "places/midgar-concept",
  },
  {
    to: "/compare",
    page: "compare",
    name: "Compare",
    hint: "What changed between the games",
    text: "The same event, character or place across the titles, with what changed between them.",
    art: "places/junon",
  },
  {
    to: "/divergence",
    page: "divergence",
    name: "Divergence",
    hint: "Where the stories split",
    text: "Pick a moment and watch the shared history fork into a line for each telling.",
    art: "key/aerith",
  },
  {
    to: "/network",
    page: "network",
    name: "Network",
    hint: "Who's linked to whom",
    text: "Who is bound to whom, and the strongest path between any two of them.",
    art: "places/shinra-lobby",
  },
  {
    to: "/explore",
    page: "explore",
    name: "Explore",
    hint: "Every character, moment and place",
    text: "Browse every character, event, location and organization in the archive.",
    art: "places/sector-7",
  },
  {
    to: "/archive",
    page: "archive",
    name: "Archive",
    hint: "Each game, part by part",
    text: "Each game part by part, and who and what each part shows.",
    art: "key/tifa",
  },
  {
    to: "/settings",
    page: "settings",
    name: "Config",
    hint: "Music, motion and more",
    text: "Music, motion, the title screen and the cursor, saved in this browser.",
    art: "key/barret-marlene",
  },
];

/** The chosen section (-1 for none yet), and moving the glove to another (with wrap). */
export function useMenu(initial = 0) {
  const [active, setActive] = useState(initial);
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
    const link = links.current[to];
    link?.focus({ preventScroll: true });
    // On a phone the commands scroll in their window: keep the chosen one in sight.
    const list = link?.closest("ul");
    if (link && list && list.scrollHeight > list.clientHeight)
      link.scrollIntoView({ block: "nearest" });
  };

  const ref = (i: number) => (el: HTMLAnchorElement | null) => {
    links.current[i] = el;
  };

  return { active, choose, go, ref, current: SECTIONS[active] };
}
