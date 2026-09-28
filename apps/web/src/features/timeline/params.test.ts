import { describe, expect, it } from "vitest";
import { parseTimelineParams, timelineSearch } from "./params";

describe("timeline params", () => {
  it("defaults to OG, Remake and Rebirth in the in-universe chart", () => {
    expect(parseTimelineParams(new URLSearchParams())).toEqual({
      titles: ["og", "remake", "rebirth"],
      view: "world",
      layout: "chart",
      arc: null,
      majorOnly: false,
      event: null,
    });
  });

  it("keeps titles in release order and drops unknown ones", () => {
    const params = parseTimelineParams(new URLSearchParams("titles=rebirth,zz,og"));
    expect(params.titles).toEqual(["og", "rebirth"]);
  });

  it("falls back to the defaults when no valid title is left", () => {
    expect(parseTimelineParams(new URLSearchParams("titles=zz")).titles).toEqual([
      "og",
      "remake",
      "rebirth",
    ]);
  });

  it("round-trips, leaving defaults out of the URL", () => {
    const params = parseTimelineParams(
      new URLSearchParams("titles=og,intermission&view=play&layout=list&major=1&event=event_x"),
    );
    expect(timelineSearch(params).toString()).toBe(
      "titles=og%2Cintermission&view=play&layout=list&major=1&event=event_x",
    );
    expect(timelineSearch(parseTimelineParams(new URLSearchParams())).toString()).toBe("");
  });
});
