import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import aerithDeath from "../test/entity-aerith-death.json";
import { renderAt, stubApi } from "../test/render";

/** What each moment says, without the "Details" on its button. */
const items = (region: HTMLElement) =>
  within(region)
    .getAllByRole("listitem")
    .map((li) => li.textContent.replace(/(Details|Open) ›$/, ""));

describe("divergence view", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("follows the story so far, in plain words", async () => {
    stubApi();
    renderAt("/divergence/event/aerith-death");
    const before = await screen.findByRole("region", { name: "The story so far" });
    const moments = items(before);
    expect(moments).toHaveLength(3);
    expect(moments[0]).toMatch(/^Nibelheim Incident5 years before the storyTold differently/);
    expect(moments[0]).toContain("Big change");
    expect(moments[0]).toContain("What changes: How it's shown");
  });

  it("says at the turning point what each telling does with it, and in which game", async () => {
    stubApi();
    renderAt("/divergence/event/aerith-death");
    const turn = await screen.findByRole("region", { name: "Death of Aerith" });
    const tellings = within(turn).getByRole("list", { name: "How each telling tells it" });
    const lines = items(tellings);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatch(/^The originalTold differently/);
    expect(lines[0]).toContain("Big change");
    expect(lines[1]).toMatch(/^The Remake TrilogyTold differently · in Rebirth/);
    expect(lines[2]).toMatch(/^Remake Trilogy · Zack survivesNot in this telling/);
  });

  it("follows each telling's own line after it", async () => {
    stubApi();
    renderAt("/divergence/event/aerith-death");
    const og = await screen.findByRole("region", { name: "The original" });
    expect(items(og)).toEqual(["Cloud's Memories RestoredOnly this telling has told it so far"]);
    const trilogy = screen.getByRole("region", { name: "The Remake Trilogy" });
    expect(items(trilogy)).toEqual(["Cloud's Memories RestoredNot reached yet"]);
    expect(
      screen.getByRole("region", { name: "Remake Trilogy · Zack survives" }).textContent,
    ).toContain("Nothing after this moment in this telling yet.");
  });

  it("asks for other worlds when they're switched on", async () => {
    const requests = stubApi();
    const { router } = renderAt("/divergence/event/aerith-death");
    await userEvent.click(await screen.findByRole("button", { name: "Include other worlds" }));
    expect(router.state.location.search).toBe("?worlds=1");
    await waitFor(() => {
      expect(requests.some((u) => u.searchParams.get("worlds") === "true")).toBe(true);
    });
    expect(requests[0]?.searchParams.get("worlds")).toBe("false");
  });

  it("opens a moment, and can make it the turning point", async () => {
    // The fixtures hold one event's details; Nibelheim borrows them under its own name.
    stubApi((url) =>
      url.pathname === "/entities/event_nibelheim_incident"
        ? {
            status: 200,
            body: { ...aerithDeath, id: "event_nibelheim_incident", name: "Nibelheim Incident" },
          }
        : undefined,
    );
    const { router } = renderAt("/divergence/event/aerith-death");
    const before = await screen.findByRole("region", { name: "The story so far" });
    // The whole card is the button; its name starts with the moment's.
    await userEvent.click(within(before).getByRole("button", { name: /^Nibelheim Incident/ }));
    expect(router.state.location.search).toBe("?node=event_nibelheim_incident");
    const details = screen.getByRole("complementary", { name: "Event details" });
    await userEvent.click(
      await within(details).findByRole("button", { name: "Make this the turning point" }),
    );
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/divergence/event/nibelheim-incident");
    });
    expect(router.state.location.search).toBe("");
  });

  it("offers nothing to re-root on the turning point itself", async () => {
    stubApi();
    renderAt("/divergence/event/aerith-death?node=event_aerith_death");
    const details = await screen.findByRole("complementary", { name: "Event details" });
    await within(details).findByRole("heading", { level: 2, name: "Death of Aerith" });
    expect(
      within(details).queryByRole("button", { name: "Make this the turning point" }),
    ).toBeNull();
    expect(within(details).queryByRole("link", { name: /See where the stories split/ })).toBeNull();
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
    const details = await screen.findByRole("complementary", { name: "Event details" });
    await within(details).findByRole("heading", { level: 2, name: "Death of Aerith" });
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
