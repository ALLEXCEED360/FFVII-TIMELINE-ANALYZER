import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderAt, stubApi } from "../test/render";

describe("back button", () => {
  it("goes up a level when the page was opened directly", async () => {
    stubApi();
    renderAt("/divergence/event/aerith-death");
    const back = await screen.findByRole("link", { name: "Back to Divergence" });
    expect(back.getAttribute("href")).toBe("/divergence");
  });

  it("goes back to the menu from a section", async () => {
    stubApi();
    renderAt("/timeline");
    expect(
      (await screen.findByRole("link", { name: "Back to the menu" })).getAttribute("href"),
    ).toBe("/");
  });

  it("returns to the previous page after moving within the archive", async () => {
    stubApi();
    const { router } = renderAt("/divergence");
    const all = await screen.findByRole("region", { name: "Every moment where they differ" });
    await userEvent.click(all.querySelector("a")!);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/divergence/event/nibelheim-incident");
    });
    await userEvent.click(await screen.findByRole("button", { name: "Back" }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/divergence");
    });
  });

  it("isn't on the home menu", async () => {
    stubApi();
    renderAt("/");
    await screen.findByRole("navigation", { name: "Sections" });
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    expect(screen.queryByRole("link", { name: /^Back to/ })).toBeNull();
  });
});
