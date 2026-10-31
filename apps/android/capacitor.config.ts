import type { CapacitorConfig } from "@capacitor/cli";

// The Android app: the site's own build (apps/web/dist, made by scripts/build-web.ts) in a native
// shell, reading the same API as the website.
const config: CapacitorConfig = {
  appId: "io.github.allexceed360.ffviitimeline",
  appName: "FFVII Timeline",
  webDir: "../web/dist",
  plugins: {
    // Drawn edge to edge; the page keeps clear of the status and navigation bars with the
    // --safe-area-inset-* variables Capacitor sets, and the bars' icons are light, for a dark app.
    SystemBars: { insetsHandling: "css", style: "DARK" },
  },
};

export default config;
