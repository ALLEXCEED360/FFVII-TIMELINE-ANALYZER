import { Disc3, Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { ALBUMS, TRACKS, type Track, byline, duration, trackOf } from "./library";
import { MUSIC_KEYS } from "./keys";
import { useMusic } from "./store";
import "./music.css";

/** Config's Music, as a player with a library: what's playing, then the albums and their tracks. */
export function MusicSetting() {
  const music = useMusic();
  const now = trackOf(music.current);
  const [shelf, setShelf] = useState<string | null>(null);
  const shown = shelf === null ? null : ALBUMS.find((a) => a.name === shelf);
  const list = shown ? shown.tracks : TRACKS;

  if (TRACKS.length === 0) {
    return (
      <section aria-labelledby="st-music" className="ff7-window st-window">
        <h2 id="st-music" className="m-heading st-window-name">
          Music
        </h2>
        <p className="st-says">No music has been added to the guide yet.</p>
      </section>
    );
  }

  const length = music.length || now?.length || 0;
  const progress = length > 0 ? Math.min(100, (music.time / length) * 100) : 0;

  return (
    <section aria-labelledby="st-music" className="ff7-window mp">
      <header className="mp-head">
        <h2 id="st-music" className="m-heading st-window-name">
          Music
        </h2>
        <p className="mp-intro">
          Background music, as in a game&apos;s menus: a random track as you begin, another when it
          ends, playing on from page to page.
        </p>
        <div role="radiogroup" aria-label="Music" className="mp-switch">
          {[
            { value: true, label: "On" },
            { value: false, label: "Off" },
          ].map((option) => (
            <label key={option.label} className="mp-switch-option">
              <input
                type="radio"
                name="music"
                checked={music.on === option.value}
                onChange={() => {
                  music.setOn(option.value);
                }}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </header>

      {/* What's playing: the record, its words, and the controls. */}
      <div className="mp-deck" data-off={!music.on || undefined}>
        <div className="mp-cover">
          {now?.cover ? (
            <img src={now.cover} alt="" width={160} height={160} />
          ) : (
            <Disc3 aria-hidden="true" className="mp-cover-icon" />
          )}
        </div>
        <div className="mp-deck-main">
          <p className="m-label mp-now-label">
            {!music.on ? "Music is off" : music.paused ? "Paused" : "Now playing"}
          </p>
          <p aria-live="polite" className="m-heading mp-now-title">
            {now ? now.title : "Starts as you click or press a key"}
          </p>
          {now && (
            <p className="mp-now-by">
              {byline(now)}
              {now.album && <span className="mp-now-album"> · {now.album}</span>}
            </p>
          )}
          <div className="mp-progress">
            <span className="mp-time">{duration(music.time)}</span>
            <input
              type="range"
              aria-label="Position in the track"
              min={0}
              max={Math.max(1, Math.round(length))}
              value={Math.round(music.time)}
              disabled={!now || !music.on}
              onChange={(event) => {
                music.seek(Number(event.target.value));
              }}
              className="mp-range"
              style={{ "--p": `${String(progress)}%` } as CSSProperties}
            />
            <span className="mp-time">{duration(length)}</span>
          </div>
          <div className="mp-controls">
            <button
              type="button"
              className="mp-mode"
              aria-label={music.shuffle ? "Shuffle (on)" : "In order"}
              title={music.shuffle ? "Shuffle: on" : "In order"}
              onClick={() => {
                music.setShuffle(!music.shuffle);
              }}
            >
              {music.shuffle ? (
                <Shuffle aria-hidden="true" className="mp-icon" />
              ) : (
                <Repeat aria-hidden="true" className="mp-icon" />
              )}
              <span>{music.shuffle ? "Shuffle" : "In order"}</span>
            </button>
            <button
              type="button"
              className="mp-button"
              aria-label="Previous track"
              title="Previous (X)"
              disabled={!music.on}
              onClick={music.previous}
            >
              <SkipBack aria-hidden="true" className="mp-icon" />
            </button>
            <button
              type="button"
              className="mp-button mp-play"
              aria-label={music.paused ? "Play" : "Pause"}
              title={`${music.paused ? "Play" : "Pause"} (P)`}
              disabled={!now || !music.on}
              onClick={music.togglePause}
            >
              {music.paused ? (
                <Play aria-hidden="true" className="mp-icon" />
              ) : (
                <Pause aria-hidden="true" className="mp-icon" />
              )}
            </button>
            <button
              type="button"
              className="mp-button"
              aria-label="Next track"
              title="Next (C)"
              disabled={!music.on}
              onClick={music.next}
            >
              <SkipForward aria-hidden="true" className="mp-icon" />
            </button>
            <label className="mp-volume">
              <Volume2 aria-hidden="true" className="mp-icon" />
              <span className="sr-only">Volume</span>
              <input
                type="range"
                min={0}
                max={100}
                value={music.volume}
                onChange={(event) => {
                  music.setVolume(Number(event.target.value));
                }}
                className="mp-range"
                style={{ "--p": `${String(music.volume)}%` } as CSSProperties}
              />
              <span className="mp-volume-value">{music.volume}%</span>
            </label>
          </div>
        </div>
      </div>

      {/* The library: the albums on a shelf, and the chosen one's tracks. */}
      <div className="mp-library">
        <nav aria-label="Albums" className="mp-shelf">
          <button
            type="button"
            aria-pressed={shelf === null}
            className="mp-album"
            onClick={() => {
              setShelf(null);
            }}
          >
            <span className="mp-album-art mp-album-all">
              <Disc3 aria-hidden="true" className="mp-icon" />
            </span>
            <span className="mp-album-text">
              <span className="mp-album-name">All tracks</span>
              <span className="mp-album-meta">{TRACKS.length} tracks</span>
            </span>
          </button>
          {ALBUMS.filter((a) => a.name).map((album) => (
            <button
              key={album.name}
              type="button"
              aria-pressed={shelf === album.name}
              className="mp-album"
              onClick={() => {
                setShelf(album.name ?? null);
              }}
            >
              <span className="mp-album-art">
                {album.cover && <img src={album.cover} alt="" width={56} height={56} />}
              </span>
              <span className="mp-album-text">
                <span className="mp-album-name">{album.name}</span>
                <span className="mp-album-meta">
                  {album.year ? `${String(album.year)} · ` : ""}
                  {album.tracks.length} tracks
                </span>
              </span>
              {album.tracks.some((t) => t.id === music.current) && music.on && (
                <span aria-hidden="true" className="mp-eq" data-paused={music.paused || undefined}>
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mp-list">
          <h3 className="m-heading mp-list-name">{shown?.name ?? "All tracks"}</h3>
          <ol aria-label="Tracks" className="mp-tracks">
            {list.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                number={i + 1}
                withAlbum={!shown}
                playing={music.on && track.id === music.current}
                paused={music.paused}
                onPlay={() => {
                  if (track.id === music.current && music.on) music.togglePause();
                  else music.play(track.id);
                }}
              />
            ))}
          </ol>
        </div>
      </div>

      <ul aria-label="Keys" className="mp-keys">
        {MUSIC_KEYS.map((k) => (
          <li key={k.does}>
            <kbd>{k.key}</kbd>
            <span>{k.does}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TrackRow({
  track,
  number,
  withAlbum,
  playing,
  paused,
  onPlay,
}: {
  track: Track;
  number: number;
  withAlbum: boolean;
  playing: boolean;
  paused: boolean;
  onPlay: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-current={playing || undefined}
        className="mp-track"
        onClick={onPlay}
      >
        <span aria-hidden="true" className="ff7-hand mp-glove">
          ☞
        </span>
        <span className="mp-track-no">
          {playing ? (
            <span aria-hidden="true" className="mp-eq" data-paused={paused || undefined}>
              <i />
              <i />
              <i />
            </span>
          ) : (
            number
          )}
        </span>
        <span className="mp-track-main">
          <span className="mp-track-title">{track.title}</span>
          <span className="mp-track-by">
            {byline(track)}
            {withAlbum && track.album && <span className="mp-track-album"> · {track.album}</span>}
          </span>
        </span>
        {playing && <span className="sr-only">{paused ? "(paused)" : "(playing)"}</span>}
        <span className="mp-track-length">{duration(track.length)}</span>
      </button>
    </li>
  );
}
