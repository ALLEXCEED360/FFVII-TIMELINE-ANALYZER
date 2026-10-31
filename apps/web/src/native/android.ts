import { App } from "@capacitor/app";
import type { createBrowserRouter } from "react-router";
import { useMusic } from "../features/music/store";
import { useUi } from "../stores/ui";

// The Android app's own wiring, loaded only inside it (main.tsx): the phone's back button, and the
// music resting while the app is out of sight.

type Router = ReturnType<typeof createBrowserRouter>;

export function startAndroid(router: Router): void {
  document.documentElement.dataset.native = "android";

  // Back closes what's open, then steps back through the pages, then home, then leaves the app.
  void App.addListener("backButton", ({ canGoBack }) => {
    const ui = useUi.getState();
    if (ui.paletteOpen) {
      ui.setPaletteOpen(false);
    } else if (document.querySelector(".mbar-menu[aria-expanded='true']")) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    } else if (canGoBack) {
      window.history.back();
    } else if (router.state.location.pathname !== "/") {
      void router.navigate("/");
    } else {
      void App.minimizeApp();
    }
  });

  // Switching away pauses the music; coming back picks it up again, if it was playing.
  let resting = false;
  void App.addListener("appStateChange", ({ isActive }) => {
    const music = useMusic.getState();
    if (!isActive && music.current !== null && !music.paused) {
      music.togglePause();
      resting = true;
    } else if (isActive && resting) {
      resting = false;
      if (music.paused) music.togglePause();
    }
  });
}
