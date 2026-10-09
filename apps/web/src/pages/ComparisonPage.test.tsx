import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAt, stubApi } from "../test/render";

/** What a telling's panel says it does with the subject. */
function statusOf(title: string) {
  const panel = screen.getByRole("region", { name: title });
  return panel.querySelector(".cmp-status")?.textContent;
}

describe("comparison page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sets the original beside the Remake Trilogy, naming the trilogy's game that tells it", async () => {
    const requests = stubApi();
    renderAt("/compare/event/aerith-death");
    await screen.findByRole("heading", { level: 1, name: "Death of Aerith" });
    expect(statusOf("The original")).toBe("Shows it");
    expect(statusOf("The Remake Trilogy")).toBe("Shows it");
    expect(screen.getByText("Told differently")).toBeTruthy();
    expect(screen.getAllByText("Shown as it happens")).toHaveLength(2);
    const trilogy = screen.getByRole("region", { name: "The Remake Trilogy" });
    expect(within(trilogy).getByText("Rebirth")).toBeTruthy();
    // No choice of games: it always asks for every one.
    expect(screen.queryByRole("group", { name: "Pairs" })).toBeNull();
    expect(
      requests.some((url) => url.searchParams.get("titles") === "og,remake,intermission,rebirth"),
    ).toBe(true);
  });

  it("says when the Remake Trilogy hasn't reached an event yet", async () => {
    stubApi();
    renderAt("/compare/event/cloud-memories-restored");
    await screen.findByRole("heading", { level: 1, name: "Cloud's Memories Restored" });
    expect(statusOf("The Remake Trilogy")).toBe("Hasn't reached this part yet");
  });

  it("groups changes by kind, in plain words, and cites both sides", async () => {
    stubApi();
    renderAt("/compare/event/aerith-death");
    const section = await screen.findByRole("region", { name: /What changes/ });
    expect(within(section).getByRole("heading", { name: "How it's shown" })).toBeTruthy();
    expect(within(section).getByRole("heading", { name: "What surrounds it" })).toBeTruthy();
    // Each difference cites both sides, linked to their place in the archive.
    const og = within(section).getAllByRole("link", {
      name: "OG · Disc 1 · The Forgotten Capital",
    });
    const rebirth = within(section).getAllByRole("link", { name: "Rebirth · Ch. 14" });
    expect(og.map((l) => l.getAttribute("href"))).toEqual([
      "/archive/og/forgotten-capital",
      "/archive/og/forgotten-capital",
    ]);
    expect(rebirth).toHaveLength(2);
  });

  it("says a connection is only in one telling where the other shows both ends without it", async () => {
    stubApi();
    renderAt("/compare/location/sector-7");
    const only = await screen.findAllByRole("region", { name: /^Only in/ });
    expect(only.some((r) => within(r).queryByRole("link", { name: /Midgar/ }))).toBe(true);
    const both = screen.getByRole("region", { name: "In both" });
    expect(within(both).queryByRole("link", { name: /Midgar/ })).toBeNull();
  });

  it("doesn't count a connection against a telling that doesn't show both ends", async () => {
    stubApi();
    renderAt("/compare/character/tifa-lockhart");
    const both = await screen.findByRole("region", { name: "In both" });
    expect(within(both).getByRole("link", { name: /Cloud's Memories Restored/ })).toBeTruthy();
    // A person isn't "shown as it happens": that line is for events.
    expect(screen.queryByText("Shown as it happens")).toBeNull();
  });

  it("uses tabs instead of columns on narrow screens", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    stubApi();
    renderAt("/compare/event/aerith-death");
    const tabs = await screen.findAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Original", "Remake Trilogy"]);
    expect(screen.getByRole("tablist", { name: "Tellings" })).toBeTruthy();
    await userEvent.click(tabs[1]!);
    await waitFor(() => {
      expect(screen.getAllByRole("tab")[1]?.getAttribute("aria-selected")).toBe("true");
    });
    expect(within(screen.getByRole("tabpanel")).getByText(/Cloud appears to block/)).toBeTruthy();
  });

  it("has no accessibility violations", async () => {
    stubApi();
    const { container } = renderAt("/compare/event/aerith-death");
    await screen.findByRole("heading", { level: 1, name: "Death of Aerith" });
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
