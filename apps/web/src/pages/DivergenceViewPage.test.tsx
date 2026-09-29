import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAt, stubApi } from "../test/render";

const map = () => screen.getByRole("group", { name: /Divergence map/ });

describe("divergence view", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("draws the trunk and a line per branch, with a station per event shown", async () => {
    stubApi();
    renderAt("/divergence/event/aerith-death");
    await screen.findByRole("heading", { level: 1, name: "Death of Aerith" });
    const stations = within(map())
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label"));
    expect(stations).toEqual([
      "Nibelheim Incident — before the pivot: told differently",
      "Bombing of Mako Reactor 1 — before the pivot: told differently",
      "Fall of the Sector 7 Plate — before the pivot: told differently",
      "Death of Aerith — OG: Changed",
      "Death of Aerith — Rebirth: Changed",
      "Cloud's Memories Restored — OG: Not yet retold elsewhere",
      "Cloud's Memories Restored — Remake: Not yet reached",
      "Cloud's Memories Restored — Rebirth: Not yet reached",
    ]);
  });

  it("gives the same information as a list", async () => {
    stubApi();
    renderAt("/divergence/event/aerith-death");
    const og = await screen.findByRole("region", { name: "OG — from the pivot" });
    expect(
      within(og)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual([
      "Death of AerithChangedContext (major), Presentation (major)",
      "Cloud's Memories RestoredNot yet retold elsewhere",
    ]);
    expect(
      screen.getByRole("region", { name: "Rebirth · Zack survives — from the pivot" }).textContent,
    ).toContain("Doesn't show the pivot or anything after it.");
  });

  it("asks for other worlds when they're switched on", async () => {
    const requests = stubApi();
    const { router } = renderAt("/divergence/event/aerith-death");
    await userEvent.click(await screen.findByRole("button", { name: "Show other worlds" }));
    expect(router.state.location.search).toBe("?worlds=1");
    await waitFor(() => {
      expect(requests.some((u) => u.searchParams.get("worlds") === "true")).toBe(true);
    });
    expect(requests[0]?.searchParams.get("worlds")).toBe("false");
  });

  it("selects a station into the inspector, and re-roots the map on it", async () => {
    stubApi();
    const { router } = renderAt("/divergence/event/aerith-death?titles=og,rebirth");
    await screen.findByRole("heading", { level: 1, name: "Death of Aerith" });
    await userEvent.click(
      within(map()).getByRole("button", { name: /^Nibelheim Incident — before the pivot/ }),
    );
    expect(router.state.location.search).toBe("?titles=og%2Crebirth&node=event_nibelheim_incident");
    const inspector = screen.getByRole("complementary", { name: "Inspector" });
    await userEvent.click(within(inspector).getByRole("button", { name: "Re-root here" }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/divergence/event/nibelheim-incident");
    });
    expect(router.state.location.search).toBe("?titles=og%2Crebirth");
  });

  it("offers no re-root for the pivot itself", async () => {
    stubApi();
    renderAt("/divergence/event/aerith-death?node=event_aerith_death");
    const inspector = await screen.findByRole("complementary", { name: "Inspector" });
    await within(inspector).findByRole("heading", { level: 2, name: "Death of Aerith" });
    expect(within(inspector).queryByRole("button", { name: "Re-root here" })).toBeNull();
    expect(within(inspector).queryByRole("link", { name: "Divergence" })).toBeNull();
  });

  it("shows not found for an unknown event", async () => {
    stubApi();
    renderAt("/divergence/event/no-such-event");
    expect(await screen.findByRole("heading", { name: "No record found" })).toBeTruthy();
  });

  it("shows not found for an entity that isn't an event", async () => {
    stubApi();
    renderAt("/divergence/character/cloud-strife");
    expect(await screen.findByRole("heading", { name: "No record found" })).toBeTruthy();
  });

  it("has no accessibility violations", async () => {
    stubApi();
    const { container } = renderAt("/divergence/event/aerith-death?node=event_aerith_death");
    const inspector = await screen.findByRole("complementary", { name: "Inspector" });
    await within(inspector).findByRole("heading", { level: 2, name: "Death of Aerith" });
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
