import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUi } from "../stores/ui";
import { renderAt, stubApi } from "../test/render";

describe("title screen", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useUi.setState({ boot: "session" });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens the archive on the home page and waits for a button", async () => {
    stubApi();
    renderAt("/");
    const dialog = await screen.findByRole("dialog", { name: /Timeline\s*Analyzer/ });
    expect(dialog.textContent).toContain("Press any button");
    expect(await screen.findByText("Archive online")).toBeTruthy();
    // It stays until asked to go.
    await new Promise((resolve) => setTimeout(resolve, 800));
    await userEvent.keyboard("{Enter}");
    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(sessionStorage.getItem("ffvii-booted")).toBe("1");
  });

  it("plays once per session by default", () => {
    sessionStorage.setItem("ffvii-booted", "1");
    stubApi();
    renderAt("/");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("never plays when switched off", () => {
    useUi.setState({ boot: "off" });
    stubApi();
    renderAt("/");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("steps aside by itself on a shared link, once the archive answers", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    stubApi();
    renderAt("/credits");
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(await screen.findByText("Archive online")).toBeTruthy();
    for (let i = 0; i < 8; i += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
    }
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("can be played again from Settings", async () => {
    useUi.setState({ boot: "off" });
    stubApi();
    renderAt("/settings");
    await userEvent.click(await screen.findByRole("button", { name: "Play the title screen now" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
  });
});
