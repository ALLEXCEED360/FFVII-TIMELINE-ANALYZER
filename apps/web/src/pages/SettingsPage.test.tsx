import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { useUi } from "../stores/ui";
import { renderAt, stubApi } from "../test/render";

describe("settings", () => {
  it("offers each setting's choices in plain words, and says what the chosen one does", async () => {
    stubApi();
    renderAt("/settings");
    const motion = await screen.findByRole("group", { name: "Motion" });
    expect(
      within(motion)
        .getAllByRole("radio")
        .map((r) => r.closest("label")?.textContent),
    ).toEqual(["Follow my device", "Less movement", "Full movement"]);
    await userEvent.click(within(motion).getByText("Less movement"));
    expect(useUi.getState().motion).toBe("reduced");
    expect(within(motion).getByText(/without sliding or fading/)).toBeTruthy();
  });

  it("brings the spoiler warning back once it's closed", async () => {
    stubApi();
    useUi.setState({ noticeDismissed: true });
    renderAt("/settings");
    await userEvent.click(await screen.findByRole("button", { name: "Show the warning again" }));
    expect(useUi.getState().noticeDismissed).toBe(false);
    expect(screen.getByRole("complementary", { name: "Spoiler notice" })).toBeTruthy();
  });

  it("has no accessibility violations", async () => {
    stubApi();
    const { container } = renderAt("/settings");
    await screen.findByRole("group", { name: "Motion" });
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
