import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAt, stubApi } from "../test/render";

describe("divergence landing page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists the divergence points, linking to each one's map", async () => {
    stubApi();
    renderAt("/divergence");
    const list = await screen.findByRole("list", { name: "Divergence points" });
    const links = within(list).getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual([
      "Nibelheim Incident",
      "Bombing of Mako Reactor 1",
      "Fall of the Sector 7 Plate",
      "Death of Aerith",
    ]);
    expect(links[3]?.getAttribute("href")).toBe("/divergence/event/aerith-death");
  });

  it("keeps the chosen titles in the URL, the request and the links", async () => {
    const requests = stubApi();
    const { router } = renderAt("/divergence");
    await userEvent.click(await screen.findByRole("button", { name: "OG vs Rebirth" }));
    await waitFor(() => {
      expect(router.state.location.search).toBe("?titles=og%2Crebirth");
    });
    await waitFor(() => {
      expect(
        requests.some(
          (u) => u.pathname === "/divergence" && u.searchParams.get("titles") === "og,rebirth",
        ),
      ).toBe(true);
    });
    expect(screen.getByRole("link", { name: "Death of Aerith" }).getAttribute("href")).toBe(
      "/divergence/event/aerith-death?titles=og,rebirth",
    );
  });

  it("has no accessibility violations", async () => {
    stubApi();
    const { container } = renderAt("/divergence");
    await screen.findByRole("link", { name: "Death of Aerith" });
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
