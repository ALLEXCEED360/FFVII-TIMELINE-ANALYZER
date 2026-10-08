import { describe, expect, it } from "vitest";
import { parseTellingChoice, setTellingChoice, tellingsIn, titlesOf } from "./tellings";

describe("tellings", () => {
  it("puts Remake, INTERmission and Rebirth together as the Remake Trilogy", () => {
    expect(titlesOf("og")).toEqual(["og"]);
    expect(titlesOf("trilogy")).toEqual(["remake", "intermission", "rebirth"]);
    expect(titlesOf("both")).toEqual(["og", "remake", "intermission", "rebirth"]);
    expect(tellingsIn(["rebirth"])).toEqual(["trilogy"]);
    expect(tellingsIn(["og", "intermission"])).toEqual(["og", "trilogy"]);
  });

  it("reads and writes the choice as ?in=, dropping older ?titles=", () => {
    expect(parseTellingChoice(new URLSearchParams("in=original"))).toBe("og");
    expect(parseTellingChoice(new URLSearchParams("titles=remake"))).toBe("trilogy");
    expect(parseTellingChoice(new URLSearchParams())).toBe("both");
    const next = setTellingChoice(new URLSearchParams("titles=og&q=x"), "trilogy");
    expect(next.toString()).toBe("q=x&in=trilogy");
    expect(setTellingChoice(next, "both").toString()).toBe("q=x");
  });
});
