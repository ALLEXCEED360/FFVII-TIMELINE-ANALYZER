import { Music2 } from "lucide-react";
import { useEffect, useState } from "react";
import { byline, trackOf } from "./library";
import { useMusic } from "./store";

/** How long the card stays before sliding away. */
const SHOW_MS = 5500;

/**
 * As a sports game's menus do when a song starts: a card slides in at the bottom right with its
 * album art, name and composer, then slides away. It shows again when the track changes.
 */
export function NowPlayingCard() {
  const started = useMusic((s) => s.started);
  const current = useMusic((s) => s.current);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    if (started === 0) return;
    setShown(started);
    const hide = window.setTimeout(() => {
      setShown(null);
    }, SHOW_MS);
    return () => {
      window.clearTimeout(hide);
    };
  }, [started]);

  const track = trackOf(current);
  if (shown === null || !track) return null;
  const by = byline(track);

  return (
    <aside key={shown} role="status" aria-label="Now playing" className="ff7-window np-card">
      <div className="np-art">
        {track.cover ? (
          <img src={track.cover} alt="" width={96} height={96} />
        ) : (
          <Music2 aria-hidden="true" className="np-art-icon" />
        )}
        <span aria-hidden="true" className="np-bars">
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="np-text">
        <p className="m-label np-kicker">Now playing</p>
        <p className="m-heading np-title">{track.title}</p>
        {by && <p className="np-by">{by}</p>}
        {track.album && <p className="np-album">{track.album}</p>}
      </div>
    </aside>
  );
}
