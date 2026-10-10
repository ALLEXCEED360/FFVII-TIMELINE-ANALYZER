import { cleanup, configure } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { useUi } from "../stores/ui";

// Pages are lazy-loaded, and the first import of a page can take a few
// seconds on a busy CI runner. Testing Library's default 1 s wait made tests flaky there.
configure({ asyncUtilTimeout: 5000 });

// jsdom can't play sound; the background music's player just records that it was asked to.
Object.defineProperty(HTMLMediaElement.prototype, "play", {
  configurable: true,
  value: () => Promise.resolve(),
});
Object.defineProperty(HTMLMediaElement.prototype, "pause", {
  configurable: true,
  value: () => undefined,
});

// jsdom doesn't scroll; pages that bring a chosen item into view still run.
Element.prototype.scrollIntoView = () => undefined;

// The title screen covers the app; its own tests turn it back on.
beforeEach(() => {
  useUi.setState({ boot: "off", bootReplay: 0 });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});
