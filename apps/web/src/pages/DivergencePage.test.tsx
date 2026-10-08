import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAt, stubApi } from "../test/render";

describe("divergence landing page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("puts the big turning points first, then every moment where the games differ", async () => {
    stubApi();
    renderAt("/divergence");
    const turning = await screen.findByRole("region", { name: "The big turning points" });
    expect(
      within(turning)
        .getAllByRole("link")
        .map((l) => l.querySelector(".dv-card-name")?.textContent),
    ).toEqual(["Nibelheim Incident", "Death of Aerith"]);
    expect(within(turning).getByRole("link", { name: /Death of Aerith/ }).textContent).toContain(
      "2 changes, 2 big",
    );

    const all = screen.getByRole("region", { name: "Every moment where they differ" });
    const links = within(all).getAllByRole("link");
    expect(links.map((l) => l.querySelector(".dv-name")?.textContent)).toEqual([
      "Nibelheim Incident",
      "Bombing of Mako Reactor 1",
      "Fall of the Sector 7 Plate",
      "Death of Aerith",
    ]);
    expect(links[3]?.getAttribute("href")).toBe("/divergence/event/aerith-death");
    expect(all.textContent).toContain("5 years before the story");
  });

  it("always sets the original against the whole Remake Trilogy, with nothing to choose", async () => {
    const requests = stubApi();
    renderAt("/divergence");
    const all = await screen.findByRole("region", { name: "Every moment where they differ" });
    expect(screen.queryByRole("group", { name: "Pairs" })).toBeNull();
    expect(
      requests.some(
        (u) =>
          u.pathname === "/divergence" &&
          u.searchParams.get("titles") === "og,remake,intermission,rebirth",
      ),
    ).toBe(true);
    expect(
      within(all)
        .getByRole("link", { name: /^Death of Aerith/ })
        .getAttribute("href"),
    ).toBe("/divergence/event/aerith-death");
  });

  it("starts from any moment found by name, offering only moments", async () => {
    stubApi();
    const { router } = renderAt("/divergence");
    const picker = await screen.findByRole("region", { name: "Start from any moment" });
    await userEvent.type(within(picker).getByRole("searchbox"), "aerith");
    const moment = await within(picker).findByRole("link", { name: /Death of Aerith/ });
    // Aerith herself isn't a moment, so she isn't offered.
    expect(within(picker).queryByRole("link", { name: /Aerith Gainsborough/ })).toBeNull();
    await userEvent.click(moment);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/divergence/event/aerith-death");
    });
  });

  it("has no accessibility violations", async () => {
    stubApi();
    const { container } = renderAt("/divergence");
    await screen.findByRole("region", { name: "Every moment where they differ" });
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
