import { useEffect, useRef } from "react";
import { TRACKS, trackOf } from "./library";
import { NowPlayingCard } from "./NowPlayingCard";
import { useMusicKeys } from "./keys";
import { useMusic } from "./store";
import "./music.css";

/**
 * The background music, as in a sports game's menus: from the first press, a random track, then
 * another when it ends, playing on from page to page. A card in the corner says what's starting;
 * Config and the keys (C next, X previous, P pause) control it.
 */
export default function BackgroundMusic() {
  const on = useMusic((s) => s.on);
  const current = useMusic((s) => s.current);
  const paused = useMusic((s) => s.paused);
  const volume = useMusic((s) => s.volume);
  const seekTo = useMusic((s) => s.seekTo);
  const audio = useRef<HTMLAudioElement | null>(null);
  // Files that fail in a row; past the whole library, it stops trying.
  const failures = useRef(0);
  useMusicKeys();

  useEffect(() => {
    const element = new Audio();
    element.preload = "auto";
    const { next, setSounding, setTime, markStarted } = useMusic.getState();
    // The card shows once per track, when it first sounds.
    let announced: string | null = null;
    const onEnded = () => {
      next();
    };
    const onError = () => {
      failures.current += 1;
      if (failures.current < TRACKS.length) next();
    };
    const onPlaying = () => {
      failures.current = 0;
      setSounding(true);
      const id = element.dataset.track ?? null;
      if (id !== announced) {
        announced = id;
        markStarted();
      }
    };
    const onPause = () => {
      setSounding(false);
    };
    const onTime = () => {
      setTime(element.currentTime, Number.isFinite(element.duration) ? element.duration : 0);
    };
    element.addEventListener("ended", onEnded);
    element.addEventListener("error", onError);
    element.addEventListener("playing", onPlaying);
    element.addEventListener("pause", onPause);
    element.addEventListener("timeupdate", onTime);
    element.addEventListener("loadedmetadata", onTime);
    audio.current = element;
    return () => {
      element.pause();
      element.removeAttribute("src");
      element.removeEventListener("ended", onEnded);
      element.removeEventListener("error", onError);
      element.removeEventListener("playing", onPlaying);
      element.removeEventListener("pause", onPause);
      element.removeEventListener("timeupdate", onTime);
      element.removeEventListener("loadedmetadata", onTime);
      setSounding(false);
      audio.current = null;
    };
  }, []);

  // On, and nothing chosen yet: a random track.
  useEffect(() => {
    if (on && current === null && TRACKS.length > 0) useMusic.getState().next();
  }, [on, current]);

  // The chosen track into the player.
  useEffect(() => {
    const element = audio.current;
    const track = trackOf(current);
    if (!element || !track || element.dataset.track === track.id) return;
    element.dataset.track = track.id;
    element.src = track.url;
  }, [current]);

  // A position asked for.
  useEffect(() => {
    const element = audio.current;
    if (!element || seekTo === null) return;
    element.currentTime = seekTo;
  }, [seekTo]);

  // Play or pause. A browser that still says no waits for the next press.
  useEffect(() => {
    const element = audio.current;
    if (!element || !current) return;
    if (!on || paused) {
      element.pause();
      return;
    }
    const retry = () => {
      void element.play().catch(() => undefined);
    };
    element.play().catch(() => {
      window.addEventListener("pointerdown", retry, { once: true });
      window.addEventListener("keydown", retry, { once: true });
    });
    return () => {
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
    };
  }, [on, paused, current]);

  useEffect(() => {
    if (audio.current) audio.current.volume = volume / 100;
  }, [volume]);

  return <NowPlayingCard />;
}
