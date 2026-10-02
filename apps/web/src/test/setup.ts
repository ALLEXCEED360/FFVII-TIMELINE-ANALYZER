import { cleanup, configure } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { useUi } from "../stores/ui";

// Pages are lazy-loaded, and the first import of a page (and D3, for the timeline) can take a few
// seconds on a busy CI runner. Testing Library's default 1 s wait made tests flaky there.
configure({ asyncUtilTimeout: 5000 });

// The title screen covers the app; its own tests turn it back on.
beforeEach(() => {
  useUi.setState({ boot: "off", bootReplay: 0 });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});
