import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAt, stubApi } from "../test/render";

function statusOf(title: string) {
  const column = screen.getByRole("heading", { level: 2, name: title }).parentElement;
  return column!.querySelector(".chip")?.textContent;
}

describe("comparison page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a column per title with its stored or derived status", async () => {
    stubApi();
    renderAt("/compare/event/aerith-death");
    await screen.findByRole("heading", { level: 1, name: "Death of Aerith" });
    expect(statusOf("OG")).toBe("Depicted");
    expect(statusOf("Remake")).toBe("Not in this title");
    expect(statusOf("Rebirth")).toBe("Depicted");
    expect(screen.getByText("Changed")).toBeTruthy();
  });

  it("says when the Remake series hasn't reached an event yet", async () => {
    stubApi();
    renderAt("/compare/event/cloud-memories-restored");
    await screen.findByRole("heading", { level: 1, name: "Cloud's Memories Restored" });
    expect(statusOf("Remake")).toBe("Not yet reached");
    expect(statusOf("Rebirth")).toBe("Not yet reached");
  });

  it("groups differences by category and cites both sides", async () => {
    stubApi();
    renderAt("/compare/event/aerith-death");
    const section = await screen.findByRole("region", { name: /Documented differences/ });
    expect(within(section).getByRole("heading", { name: "Presentation" })).toBeTruthy();
    expect(within(section).getByRole("heading", { name: "Context" })).toBeTruthy();
    expect(
      within(section).getAllByText(
        /Sources: OG · Disc 1 · The Forgotten Capital; Rebirth · Ch\. 14/,
      ),
    ).toHaveLength(2);
  });

  it("marks a connection version-specific only where a title depicts both ends", async () => {
    stubApi();
    renderAt("/compare/location/sector-7?titles=og,remake");
    const table = await screen.findByRole("table", {
      name: "Which titles establish each connection",
    });
    const midgar = within(table).getByRole("row", { name: /Midgar/ });
    expect(within(midgar).getByText("Version-specific")).toBeTruthy();
    expect(within(midgar).getByText("Not established")).toBeTruthy();
  });

  it("doesn't count a connection against a title that doesn't depict both ends", async () => {
    stubApi();
    renderAt("/compare/character/tifa-lockhart?titles=og,rebirth");
    const tifaTable = await screen.findByRole("table", {
      name: "Which titles establish each connection",
    });
    const memories = within(tifaTable).getByRole("row", { name: /Cloud's Memories Restored/ });
    expect(within(memories).getByText("Shared")).toBeTruthy();
    expect(within(memories).getByText(/Not applicable/)).toBeTruthy();
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
