import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { renderAt, stubApi } from "../test/render";

const eventRow = async (name: string) => {
  const button = await screen.findByRole("button", { name: new RegExp(`^${name}`) });
  const row = button.closest("li");
  if (!row) throw new Error(`no row for ${name}`);
  return row;
};

describe("timeline page", () => {
  it("tells the story in chapters, with how each telling has each event", async () => {
    stubApi();
    renderAt("/timeline");
    expect(await screen.findByRole("heading", { name: "The Distant Past" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Midgar" })).toBeTruthy();

    const row = await eventRow("Nibelheim Incident");
    expect(row.textContent).toContain("5 years before the story");
    const marks = within(row).getByRole("list", { name: "Told in" });
    const items = within(marks).getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual(["Original", "Remake Trilogy"]);
  });

  it("opens an event's window, in plain words, and puts it in the URL", async () => {
    stubApi();
    const { router } = renderAt("/timeline");
    await userEvent.click(await screen.findByRole("button", { name: /^Death of Aerith/ }));

    const details = await screen.findByRole("complementary", { name: "Event details" });
    await within(details).findByRole("heading", { name: "Death of Aerith" });
    expect(within(details).getByText("How each telling tells it")).toBeTruthy();
    expect(within(details).getAllByText("Shown as it happens").length).toBe(2);
    expect(details.textContent).toContain("Rebirth · Shown as it happens");
    expect(within(details).getByText("The game leaves this open.")).toBeTruthy();
    expect(within(details).getByRole("link", { name: "Compare side by side" })).toBeTruthy();
    expect(router.state.location.search).toBe("?event=event_aerith_death");

    await userEvent.click(within(details).getByRole("button", { name: "Close" }));
    expect(router.state.location.search).toBe("");
    expect(screen.getByText("Choose any moment")).toBeTruthy();
  });

  it("shows one telling's events, or both", async () => {
    stubApi();
    const { router } = renderAt("/timeline");
    await eventRow("Yuffie's Raid on Shinra Headquarters");
    const show = screen.getByRole("group", { name: "Show" });

    await userEvent.click(within(show).getByRole("button", { name: "The original" }));
    expect(router.state.location.search).toBe("?in=original");
    expect(screen.queryByRole("button", { name: /^Yuffie's Raid/ })).toBeNull();

    await userEvent.click(within(show).getByRole("button", { name: "The Remake Trilogy" }));
    expect(router.state.location.search).toBe("?in=trilogy");
    expect(await eventRow("Yuffie's Raid on Shinra Headquarters")).toBeTruthy();
  });

  it("follows the order you play a telling in, game by game", async () => {
    stubApi();
    const { router } = renderAt("/timeline");
    await userEvent.click(await screen.findByRole("button", { name: "As you play it" }));
    await userEvent.click(
      within(screen.getByRole("group", { name: "Play through" })).getByRole("button", {
        name: "The Remake Trilogy",
      }),
    );
    expect(router.state.location.search).toBe("?view=play&game=trilogy");

    const remake = await screen.findByRole("region", { name: "Remake" });
    expect(within(remake).getAllByRole("listitem")[0]?.textContent).toMatch(/^☞1\./);
    // Numbered on through the trilogy, so Rebirth doesn't start again at 1.
    const rebirth = screen.getByRole("region", { name: "Rebirth" });
    const first = within(rebirth).getAllByRole("listitem")[0];
    expect(first?.textContent).not.toMatch(/^☞1\./);
    expect(first?.textContent).toContain("Fall of the Sector 7 Plate");
    expect(first?.textContent).toContain("Only mentioned, in another world");
  });

  it("can keep to the key moments", async () => {
    stubApi();
    renderAt("/timeline");
    await eventRow("Death of Ifalna");
    await userEvent.click(screen.getByRole("button", { name: /Key moments only/ }));
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /^Death of Ifalna/ })).toBeNull();
    });
    expect(screen.getByRole("button", { name: /^Death of Aerith/ })).toBeTruthy();
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
