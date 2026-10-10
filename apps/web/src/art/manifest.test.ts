import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ARTWORK,
  MOMENT_ART,
  PLACE_ART,
  SECTION_ART,
  TITLE_ART,
  artFor,
  artwork,
  pictureFor,
  sceneFor,
} from "./manifest";
import { CREDITED, creditFor } from "./credits";

const ROOT = join(import.meta.dirname, "..", "..");
const PUBLIC_ART = join(ROOT, "public", "art");
const DATA = join(ROOT, "..", "..", "data");

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

/** A WebP's pixel size, from its header (VP8, VP8L or VP8X). */
function webpSize(path: string): [number, number] {
  const b = readFileSync(path);
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    return [1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff)];
  }
  return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
}

const ENTITY_IDS = new Set(
  ["characters", "events", "locations", "organizations"].flatMap((dir) =>
    readdirSync(join(DATA, dir)).map((file) => file.replace(/\.yaml$/, "")),
  ),
);

describe("art manifest", () => {
  it("lists every image in public/art, and nothing that isn't there", () => {
    const files = filesUnder(PUBLIC_ART)
      .map((path) =>
        relative(PUBLIC_ART, path)
          .replaceAll("\\", "/")
          .replace(/\.webp$/, ""),
      )
      .sort();
    expect(ARTWORK.map((entry) => entry.id).sort()).toEqual(files);
  });

  it("has a small square version of every image, for the network's orbs (make_thumbs.py)", () => {
    for (const entry of ARTWORK) {
      const path = join(ROOT, "public", "thumbs", `${entry.id}.webp`);
      expect([entry.id, existsSync(path)]).toEqual([entry.id, true]);
      expect([entry.id, ...webpSize(path)]).toEqual([entry.id, 192, 192]);
    }
  });

  it("records each image's real size, so the page can reserve its space", () => {
    for (const entry of ARTWORK) {
      const path = join(PUBLIC_ART, `${entry.id}.webp`);
      expect(existsSync(path)).toBe(true);
      expect([entry.id, ...webpSize(path)]).toEqual([entry.id, entry.width, entry.height]);
    }
  });

  it("names only real entities as subjects", () => {
    for (const entry of ARTWORK) {
      for (const subject of entry.subjects)
        expect([entry.id, ENTITY_IDS.has(subject)]).toEqual([entry.id, true]);
    }
  });

  it("describes and credits every image, and credits nothing else", () => {
    for (const entry of ARTWORK) {
      expect(entry.alt.length).toBeGreaterThan(20);
      const credit = creditFor(entry);
      expect(credit.title).not.toBe("");
      // Every image says where it came from: a wiki file, or a note.
      if (credit.wiki === undefined) expect(credit.source).toBeTruthy();
      else expect(credit.wiki).toMatch(/\.(png|jpe?g)$/);
    }
    expect([...CREDITED].sort()).toEqual(ARTWORK.map((entry) => entry.id).sort());
  });

  it("gives every section and title a backdrop that exists", () => {
    for (const id of [...Object.values(SECTION_ART), ...Object.values(TITLE_ART)]) {
      expect(artwork(id)).toBeDefined();
    }
  });

  it("pairs each character's modern look with the original's artwork where both exist", () => {
    const characters = [...ENTITY_IDS].filter((id) => id.startsWith("character_"));
    for (const id of characters) expect([id, artFor(id).main?.era]).toEqual([id, "modern"]);
    expect(artFor("character_cloud_strife").original?.id).toBe("characters/cloud-og");
    expect(artFor("character_jenova").original).toBeUndefined();
  });

  it("gives every moment its own picture, and never a figure as a page's backdrop", () => {
    const moments = [...ENTITY_IDS].filter((id) => id.startsWith("event_"));
    for (const id of moments)
      expect([id, artwork(MOMENT_ART[id] ?? "")?.id]).toEqual([id, MOMENT_ART[id]]);
    const pictures = moments.map((id) => pictureFor(id, "event")?.id);
    expect(new Set(pictures).size).toBe(moments.length);
    for (const id of moments) expect(sceneFor(id)?.kind).not.toBe("cutout");
  });

  it("gives each chosen place and group a picture that exists, and shows it on their page", () => {
    for (const [id, art] of Object.entries(PLACE_ART)) {
      expect([id, ENTITY_IDS.has(id), artwork(art)?.id]).toEqual([id, true, art]);
      expect(pictureFor(id, id.split("_")[0] ?? "")?.id).toBe(art);
      // A cut-out tagged with the place would stand in front of its picture on the page.
      expect([id, artFor(id).main?.kind]).not.toEqual([id, "cutout"]);
    }
  });
});
