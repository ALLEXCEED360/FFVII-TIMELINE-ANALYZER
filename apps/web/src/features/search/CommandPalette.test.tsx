import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderAt, stubApi } from "../../test/render";

describe("search palette", () => {
  it("opens with Ctrl+K and closes with Escape, returning focus", async () => {
    stubApi();
    renderAt("/");
    const trigger = await screen.findByRole("button", { name: /Search/ });
    trigger.focus();
    await userEvent.keyboard("{Control>}k{/Control}");
    const input = await screen.findByRole("combobox");
    expect(document.activeElement).toBe(input);

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("groups results by kind and explains alias matches", async () => {
    stubApi();
    renderAt("/");
    await userEvent.click(await screen.findByRole("button", { name: /Search/ }));
    await userEvent.type(screen.getByRole("combobox"), "aeris");
    const option = await screen.findByRole("option", { name: /Aerith Gainsborough/ });
    expect(option.textContent).toContain("Also known as Aeris");
    expect(screen.getByRole("group", { name: "Characters" })).toBeTruthy();
  });

  it("moves with the arrow keys and opens the active result with Enter", async () => {
    stubApi();
    const { router } = renderAt("/");
    await userEvent.click(await screen.findByRole("button", { name: /Search/ }));
    await userEvent.type(screen.getByRole("combobox"), "nibelheim");
    await screen.findByRole("option", { name: /Nibelheim Incident/ });

    const options = screen.getAllByRole("option");
    expect(options[0]?.getAttribute("aria-selected")).toBe("true");
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("option")[1]?.getAttribute("aria-selected")).toBe("true");

    const target = screen.getAllByRole("option")[1]?.textContent ?? "";
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(target).toContain("Nibelheim Incident");
    expect(router.state.location.pathname).toBe("/event/nibelheim-incident");
  });

  it("says so when nothing matches", async () => {
    stubApi();
    renderAt("/");
    await userEvent.click(await screen.findByRole("button", { name: /Search/ }));
    await userEvent.type(screen.getByRole("combobox"), "zzzz");
    expect(await screen.findByText(/Nothing found/)).toBeTruthy();
  });
});
