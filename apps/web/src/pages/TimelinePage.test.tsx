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
  it("tells the story in chapters, with which games tell each event", async () => {
    stubApi();
    renderAt("/timeline");
    expect(await screen.findByRole("heading", { name: "The Distant Past" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Midgar" })).toBeTruthy();

    const row = await eventRow("Nibelheim Incident");
    expect(row.textContent).toContain("5 years before the story");
    const marks = within(row).getByRole("list", { name: "Which games tell it" });
    expect(marks.textContent).toContain("OG: Shows it");
    expect(marks.textContent).toContain("Remake: Only mentions it");
    expect(marks.textContent).toContain("INTERmission: Not in this game");
  });

  it("opens an event's window, in plain words, and puts it in the URL", async () => {
    stubApi();
    const { router } = renderAt("/timeline");
    await userEvent.click(await screen.findByRole("button", { name: /^Death of Aerith/ }));

    const details = await screen.findByRole("complementary", { name: "Event details" });
    await within(details).findByRole("heading", { name: "Death of Aerith" });
    expect(within(details).getByText("How each game tells it")).toBeTruthy();
    expect(within(details).getAllByText("Shown as it happens").length).toBe(2);
    expect(within(details).getAllByText("Not in this game").length).toBe(2);
    expect(within(details).getByText("The game leaves this open.")).toBeTruthy();
    expect(within(details).getByRole("link", { name: /Compare the games/ })).toBeTruthy();
    expect(router.state.location.search).toBe("?event=event_aerith_death");

    await userEvent.click(within(details).getByRole("button", { name: "Close" }));
    expect(router.state.location.search).toBe("");
    expect(screen.getByText("Choose an event")).toBeTruthy();
  });

  it("hides the events only the games you turn off tell, keeping at least one game", async () => {
    stubApi();
    const { router } = renderAt("/timeline");
    await eventRow("Yuffie's Raid on Shinra Headquarters");
    const games = screen.getByRole("group", { name: "Games" });

    await userEvent.click(within(games).getByRole("button", { name: /INTERmission/ }));
    expect(router.state.location.search).toBe("?titles=og%2Cremake%2Crebirth");
    expect(screen.queryByRole("button", { name: /^Yuffie's Raid/ })).toBeNull();

    for (const name of [/^OG/, /^Remake/]) {
      await userEvent.click(within(games).getByRole("button", { name }));
    }
    expect(within(games).getByRole("button", { name: /Rebirth/ })).toHaveProperty("disabled", true);
  });

  it("follows the order one game shows things in", async () => {
    stubApi();
    const { router } = renderAt("/timeline");
    await userEvent.click(await screen.findByRole("button", { name: "As you play it" }));
    await userEvent.click(
      within(screen.getByRole("group", { name: "Game" })).getByRole("button", { name: /Rebirth/ }),
    );
    expect(router.state.location.search).toBe("?view=play&game=rebirth");

    const list = await screen.findByRole("region", { name: "Rebirth" });
    const first = within(list).getAllByRole("listitem")[0];
    expect(first?.textContent).toMatch(/1\.\s*Fall of the Sector 7 Plate/);
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
