import { describe, expect, it } from "vitest";
import { parseTimelineParams, timelineSearch } from "./params";

describe("timeline params", () => {
  it("defaults to every game, in the order things happen", () => {
    expect(parseTimelineParams(new URLSearchParams())).toEqual({
      titles: ["og", "remake", "intermission", "rebirth"],
      view: "story",
      game: "og",
      keyOnly: false,
      event: null,
    });
  });

  it("keeps titles in release order and drops unknown ones", () => {
    const params = parseTimelineParams(new URLSearchParams("titles=rebirth,zz,og"));
    expect(params.titles).toEqual(["og", "rebirth"]);
  });

  it("falls back to every game when no valid title is left, and to OG for an unknown game", () => {
    const params = parseTimelineParams(new URLSearchParams("titles=zz&view=play&game=zz"));
    expect(params.titles).toEqual(["og", "remake", "intermission", "rebirth"]);
    expect(params.game).toBe("og");
  });

  it("still understands the key-moments setting by its old name", () => {
    expect(parseTimelineParams(new URLSearchParams("major=1")).keyOnly).toBe(true);
  });

  it("round-trips, leaving defaults out of the URL", () => {
    const params = parseTimelineParams(
      new URLSearchParams("titles=og,intermission&view=play&game=rebirth&key=1&event=event_x"),
    );
    expect(timelineSearch(params).toString()).toBe(
      "titles=og%2Cintermission&view=play&game=rebirth&key=1&event=event_x",
    );
    expect(timelineSearch(parseTimelineParams(new URLSearchParams())).toString()).toBe("");
  });
});
