import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAt, stubApi } from "../test/render";

// A page that throws while rendering: the error shows inside the site's shell, not a blank page.
vi.mock("./ExplorePage", () => ({
  ExplorePage: () => {
    throw new Error("boom");
  },
}));

describe("route errors", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows a recoverable error inside the shell", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    stubApi();
    renderAt("/explore");
    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByRole("heading", { name: "This page ran into a problem" }),
    ).toBeTruthy();
    expect(within(alert).getByRole("button", { name: "Reload" })).toBeTruthy();
    expect(within(alert).getByRole("link", { name: "Back to home" }).getAttribute("href")).toBe(
      "/",
    );
    // The rest of the site is still there.
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
  });
});
