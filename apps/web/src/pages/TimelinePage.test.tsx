import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { renderAt, stubApi } from "../test/render";

describe("timeline page", () => {
  it("draws a marker in each lane that shows an event", async () => {
    stubApi();
    renderAt("/timeline");
    const og = await screen.findByRole("button", {
      name: /Nibelheim Incident — OG: Depicted · False account/,
    });
    expect(og).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Nibelheim Incident — Remake: Referenced · Vision/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: /Nibelheim Incident — Rebirth: Depicted · Disputed account/,
      }),
    ).toBeTruthy();
    // Rebirth only mentions the plate fall in another world.
    expect(
      screen.getByRole("button", {
        name: /Fall of the Sector 7 Plate — Rebirth: Referenced · Mentioned · in another world/,
      }),
    ).toBeTruthy();
  });

  it("opens the inspector for a selected event and puts it in the URL", async () => {
    stubApi();
    const { router } = renderAt("/timeline");
    await userEvent.click(await screen.findByRole("button", { name: /Death of Aerith — Rebirth/ }));

    const inspector = await screen.findByRole("complementary", { name: "Inspector" });
    await within(inspector).findByRole("heading", { name: "Death of Aerith" });
    expect(within(inspector).getAllByText("Left open").length).toBeGreaterThan(0);
    expect(within(inspector).getAllByText(/Rebirth · Ch\. 14/).length).toBeGreaterThan(0);
    expect(router.state.location.search).toBe("?event=event_aerith_death");

    await userEvent.click(within(inspector).getByRole("button", { name: "Close inspector" }));
    expect(router.state.location.search).toBe("");
  });

  it("asks the API for the chosen titles", async () => {
    const requests = stubApi();
    renderAt("/timeline");
    await userEvent.click(await screen.findByRole("button", { name: /INTERmission/ }));
    await waitFor(() => {
      expect(
        requests.some((url) => url.searchParams.get("titles") === "og,remake,intermission,rebirth"),
      ).toBe(true);
    });
  });

  it("lists events with every title's status in the list layout", async () => {
    stubApi();
    renderAt("/timeline?layout=list");
    const item = (await screen.findByRole("button", { name: "Cloud's Memories Restored" })).closest(
      "li",
    );
    expect(item?.textContent).toMatch(/OG\s*Depicted/);
    expect(item?.textContent).toMatch(/Rebirth\s*—/);
  });

  it("shows an error with a retry when the API is down", async () => {
    stubApi(() => ({ status: 500, body: { error: "internal", message: "Something went wrong." } }));
    renderAt("/timeline");
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });

  it("has no accessibility violations", async () => {
    stubApi();
    const { container } = renderAt("/timeline?event=event_aerith_death");
    await screen.findByRole("heading", { name: "Death of Aerith" });
    const results = await axe.run(container, {
      // jsdom can't compute colours; contrast is checked in the browser.
      rules: { "color-contrast": { enabled: false } },
    });
    expect(
      results.violations.map(
        (v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => n.html.slice(0, 120)).join(" | ")}`,
      ),
    ).toEqual([]);
  });
});
