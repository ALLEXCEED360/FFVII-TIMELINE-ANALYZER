import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAt, stubApi } from "../test/render";

/** What a game's panel says it does with the subject. */
function statusOf(title: string) {
  const panel = screen.getByRole("region", { name: title });
  return panel.querySelector(".cmp-status")?.textContent;
}

describe("comparison page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a panel per game saying, in plain words, what it does with the subject", async () => {
    stubApi();
    renderAt("/compare/event/aerith-death");
    await screen.findByRole("heading", { level: 1, name: "Death of Aerith" });
    expect(statusOf("OG")).toBe("Shows it");
    expect(statusOf("Remake")).toBe("Not in this game");
    expect(statusOf("Rebirth")).toBe("Shows it");
    expect(screen.getByText("Told differently")).toBeTruthy();
    expect(screen.getAllByText("Shown as it happens")).toHaveLength(2);
  });

  it("says when the Remake series hasn't reached an event yet", async () => {
    stubApi();
    renderAt("/compare/event/cloud-memories-restored");
    await screen.findByRole("heading", { level: 1, name: "Cloud's Memories Restored" });
    expect(statusOf("Remake")).toBe("Hasn't reached this part yet");
    expect(statusOf("Rebirth")).toBe("Hasn't reached this part yet");
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

  it("says a connection differs only where a game shows both ends without it", async () => {
    stubApi();
    renderAt("/compare/location/sector-7?titles=og,remake");
    const table = await screen.findByRole("table", { name: "Which games show each connection" });
    const midgar = within(table).getByRole("row", { name: /Midgar/ });
    expect(within(midgar).getByText("Differs between games")).toBeTruthy();
    expect(within(midgar).getByText("Shows both, but not connected")).toBeTruthy();
  });

  it("doesn't count a connection against a game that doesn't show both ends", async () => {
    stubApi();
    renderAt("/compare/character/tifa-lockhart?titles=og,rebirth");
    const table = await screen.findByRole("table", { name: "Which games show each connection" });
    const memories = within(table).getByRole("row", { name: /Cloud's Memories Restored/ });
    expect(within(memories).getByText("In every game")).toBeTruthy();
    expect(within(memories).getByText("Doesn't show both")).toBeTruthy();
    // A person isn't "shown as it happens": that line is for events.
    expect(screen.queryByText("Shown as it happens")).toBeNull();
  });

  it("switches titles with presets, keeping them in the URL", async () => {
    const requests = stubApi();
    const { router } = renderAt("/compare/event/aerith-death");
    await screen.findByRole("heading", { level: 1, name: "Death of Aerith" });
    await userEvent.click(screen.getByRole("button", { name: "OG vs Rebirth" }));
    expect(router.state.location.search).toBe("?titles=og%2Crebirth");
    await waitFor(() => {
      expect(requests.some((url) => url.searchParams.get("titles") === "og,rebirth")).toBe(true);
    });
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
    expect(tabs.map((t) => t.textContent)).toEqual(["OG", "Remake", "Rebirth"]);
    expect(screen.getByRole("tablist", { name: "Games" })).toBeTruthy();
    await userEvent.click(tabs[2]!);
    expect(tabs[2]?.getAttribute("aria-selected")).toBe("true");
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
