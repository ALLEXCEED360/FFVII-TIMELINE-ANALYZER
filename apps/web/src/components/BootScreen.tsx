import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { API_URL } from "../api/client";
import { artSrc, artwork } from "../art/manifest";
import { useReducedMotion } from "../lib/motion";
import { useUi } from "../stores/ui";
import "./BootScreen.css";

/** The shortest the title plays before it may leave on its own, so it reads as a beat. */
const MIN_MS = 2400;
/** How long it waits for the API to wake before giving up on it. */
const MAX_MS = 6000;
/** Keypresses in the first moments are ignored, so a stray key can't skip the whole thing. */
const ARM_MS = 700;
const LEAVE_MS = 560;
const SESSION_KEY = "ffvii-booted";

const TITLES = [
  { name: "Original", color: "var(--color-title-og)" },
  { name: "Remake", color: "var(--color-title-remake)" },
  { name: "INTERmission", color: "var(--color-title-intermission)" },
  { name: "Rebirth", color: "var(--color-title-rebirth)" },
];

/** Lifestream motes: where each rises from (% across), how big, how slow and how late. */
const MOTES = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 37 + 11) % 100,
  size: 2 + ((i * 7) % 5),
  duration: 7 + ((i * 13) % 9),
  delay: -((i * 1.7) % 12),
  sway: ((i % 5) - 2) * 18,
}));

const IGNORED = new Set(["Tab", "Shift", "Control", "Alt", "Meta", "F5", "F11", "F12"]);

type Status = "waking" | "online" | "offline";

function sessionSeen(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

/** Whether the title screen should play now, from the Settings choice. */
function shouldPlay(): boolean {
  const { boot } = useUi.getState();
  return boot === "always" || (boot === "session" && !sessionSeen());
}

/**
 * The title screen (decision 0016). Midgar at night under a sky of stars, Amano's Meteor faint
 * above, the Lifestream's motes rising; the title as the series sets its own, in engraved silver
 * capitals with the series' lettering ruled above; and the request for a button, quiet between
 * two hairlines. Meanwhile it wakes the API (the free host sleeps) and reports how that went.
 *
 * On the home page it waits for a key or a tap, as a title screen does; opened on any other page
 * (a shared link) it steps aside by itself once the archive has answered. Settings chooses whether
 * it plays on every visit, once per session, or never — and can play it again.
 */
export function BootScreen() {
  const replay = useUi((s) => s.bootReplay);
  // The replay count when it last closed: it's open until then, and again after each replay.
  const [closedAt, setClosedAt] = useState(() => (shouldPlay() ? -1 : 0));
  if (closedAt >= replay) return null;
  return (
    <Title
      key={replay}
      // Played again from Settings, it waits to be dismissed like on the home page.
      replayed={replay > 0}
      onDone={() => {
        setClosedAt(replay);
      }}
    />
  );
}

function Title({ onDone, replayed }: { onDone: () => void; replayed: boolean }) {
  const reduced = useReducedMotion();
  const { pathname } = useLocation();
  const [waitForInput] = useState(() => replayed || pathname === "/");
  const [status, setStatus] = useState<Status>("waking");
  const [minElapsed, setMinElapsed] = useState(false);
  const [armed, setArmed] = useState(false);
  const [dismissed, setLeaving] = useState(false);
  const [touch] = useState(
    () => typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches,
  );
  const prompt = useRef<HTMLButtonElement>(null);
  const setBooted = useUi((s) => s.setBooted);
  const midgar = artwork("places/midgar-concept");
  const meteor = artwork("key/og-meteor");
  // Dismissed — or, away from the home page, stepping aside once the archive has answered.
  const leaving = dismissed || (!waitForInput && minElapsed && status !== "waking");

  // Wake the API.
  useEffect(() => {
    const controller = new AbortController();
    const giveUp = window.setTimeout(() => {
      controller.abort();
    }, MAX_MS);
    fetch(`${API_URL}/health`, { signal: controller.signal })
      .then((response) => {
        setStatus(response.ok ? "online" : "offline");
      })
      .catch(() => {
        setStatus("offline");
      });
    return () => {
      window.clearTimeout(giveUp);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    prompt.current?.focus({ preventScroll: true });
    const arm = window.setTimeout(
      () => {
        setArmed(true);
      },
      reduced ? 0 : ARM_MS,
    );
    const min = window.setTimeout(
      () => {
        setMinElapsed(true);
      },
      reduced ? 300 : MIN_MS,
    );
    return () => {
      window.clearTimeout(arm);
      window.clearTimeout(min);
    };
  }, [reduced]);

  // Any key or tap begins.
  useEffect(() => {
    if (!armed || leaving) return;
    const begin = () => {
      setLeaving(true);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || IGNORED.has(event.key)) return;
      event.preventDefault();
      begin();
    };
    const onPointer = (event: PointerEvent) => {
      if (event.button === 0) begin();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [armed, leaving]);

  useEffect(() => {
    if (!leaving) return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Storage unavailable: it will simply play again next time.
    }
    const done = window.setTimeout(
      () => {
        setBooted();
        onDone();
      },
      reduced ? 0 : LEAVE_MS,
    );
    return () => {
      window.clearTimeout(done);
    };
  }, [leaving, onDone, reduced, setBooted]);

  const tellings = (
    <p className="boot-tellings">
      {TITLES.map((title) => (
        <span key={title.name}>
          <span aria-hidden="true" style={{ background: title.color }} />
          {title.name}
        </span>
      ))}
    </p>
  );

  const statusText =
    status === "waking"
      ? "Contacting the archive…"
      : status === "online"
        ? "Archive online"
        : "Archive unreachable — continuing offline";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="boot-title"
      aria-describedby="boot-status"
      data-leaving={leaving || undefined}
      className="boot fixed inset-0 z-[200] grid overflow-hidden bg-ink select-none"
    >
      {/* Midgar at night, and a sky of stars above it. */}
      {midgar && (
        <img
          src={artSrc(midgar)}
          alt=""
          className="boot-city absolute inset-x-0 bottom-0 h-[70%] w-full object-cover object-[50%_60%]"
        />
      )}
      <div aria-hidden="true" className="boot-stars absolute inset-0" />
      {meteor && <img src={artSrc(meteor)} alt="" className="boot-meteor absolute" />}
      <div aria-hidden="true" className="motion-only absolute inset-0 overflow-hidden">
        {MOTES.map((mote, i) => (
          <span
            key={i}
            className="boot-mote"
            style={
              {
                left: `${String(mote.x)}%`,
                width: mote.size,
                height: mote.size,
                animationDuration: `${String(mote.duration)}s`,
                animationDelay: `${String(mote.delay)}s`,
                "--sway": `${String(mote.sway)}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div aria-hidden="true" className="boot-veil absolute inset-0" />

      <div className="relative z-10 grid h-full w-full grid-rows-[1fr_auto] px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-10">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 id="boot-title" className="flex flex-col items-center">
            <span className="en-ff">
              <span aria-hidden="true" className="en-rule" />
              Final Fantasy VII
              <span aria-hidden="true" className="en-rule en-rule-r" />
            </span>
            <span className="en-name">Timeline Analyzer</span>
          </h1>
          {tellings}
        </div>
        <div className="flex flex-col items-center gap-7">
          <button
            ref={prompt}
            type="button"
            onClick={() => {
              setLeaving(true);
            }}
            className="boot-press"
          >
            {touch ? "Tap the screen" : "Press any button"}
          </button>
          <p id="boot-status" aria-live="polite" className="boot-small">
            {statusText}
          </p>
          <div className="boot-small flex w-full flex-wrap justify-between gap-2">
            <span>Non-commercial fan project · Artwork © Square Enix</span>
            <span>v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
