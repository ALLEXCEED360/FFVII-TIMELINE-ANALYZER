import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { ARTWORK } from "../art/manifest";
import { renderAt, stubApi } from "../test/render";

describe("credits", () => {
  it("names who made what, and lists every picture with a way to its source", async () => {
    stubApi();
    renderAt("/credits");
    expect(await screen.findByRole("heading", { level: 1, name: "Credits" })).toBeTruthy();
    expect(screen.getByText("Tetsuya Nomura")).toBeTruthy();
    const pictures = screen.getByRole("list", { name: "Pictures" });
    expect(within(pictures).getAllByRole("listitem")).toHaveLength(ARTWORK.length);
    const sources = within(pictures).getAllByRole("link", { name: /See the original/ });
    expect(sources[0]?.getAttribute("target")).toBe("_blank");
  });

  it("shows one kind of picture at a time", async () => {
    stubApi();
    renderAt("/credits");
    await userEvent.click(await screen.findByRole("button", { name: /^Characters/ }));
    const characters = ARTWORK.filter((art) => art.id.startsWith("characters/"));
    expect(
      within(screen.getByRole("list", { name: "Pictures" })).getAllByRole("listitem"),
    ).toHaveLength(characters.length);
  });

  it("has no accessibility violations", async () => {
    stubApi();
    const { container } = renderAt("/credits");
    await screen.findByRole("heading", { level: 1, name: "Credits" });
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
