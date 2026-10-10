import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

/** Where "up" is from a page reached directly (a shared link, a bookmark), by its path. */
function parentOf(pathname: string): { to: string; name: string } {
  const [first = "", second] = pathname.split("/").filter(Boolean);
  const section = (to: string, name: string) => ({ to, name });
  if (["character", "event", "location", "organization"].includes(first)) {
    return section("/explore", "Explore");
  }
  if (first === "archive" && second) {
    const rest = pathname.split("/").filter(Boolean);
    return rest.length > 2
      ? section(`/archive/${second}`, "this game's archive")
      : section("/archive", "the Archive");
  }
  const names: Record<string, string> = {
    compare: "Compare",
    divergence: "Divergence",
    network: "Network",
  };
  // A web opens its menu on the same kind of thing: /network/event/… goes back to /network?kind=event.
  if (first === "network" && second) return section(`/network?kind=${second}`, "Network");
  if (second && first in names) return section(`/${first}`, names[first] ?? first);
  return section("/", "the menu");
}

/**
 * Back to the previous page, or up a level when there's no history; it floats in the corner once
 * the top one scrolls away.
 */
export function BackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const anchor = useRef<HTMLSpanElement>(null);
  const [away, setAway] = useState(false);

  // Float the button once the one at the top has scrolled up out of view.
  useEffect(() => {
    const el = anchor.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const watch = new IntersectionObserver(([entry]) => {
      setAway(entry !== undefined && !entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    watch.observe(el);
    return () => {
      watch.disconnect();
    };
  }, [location.pathname]);

  // The router marks the first page of a visit with the key "default": nothing in the archive
  // to go back to.
  const cameFromHere = location.key !== "default";
  const parent = parentOf(location.pathname);
  const control = (floating: boolean) => {
    const className = floating ? "m-back m-back-float" : "m-back";
    const arrow = (
      <span aria-hidden="true" className="m-back-arrow">
        ‹
      </span>
    );
    return cameFromHere ? (
      <button
        type="button"
        onClick={() => {
          void navigate(-1);
        }}
        className={className}
      >
        {arrow}
        Back
      </button>
    ) : (
      <Link to={parent.to} className={className}>
        {arrow}
        Back to {parent.name}
      </Link>
    );
  };

  return (
    <>
      <span ref={anchor} className="m-back-anchor">
        {control(false)}
      </span>
      {away && control(true)}
    </>
  );
}
