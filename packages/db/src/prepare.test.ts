import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fingerprintOf } from "./prepare.ts";

describe("fingerprintOf", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "ffvii-fingerprint-"));
    await mkdir(join(dir, "entities"));
    await writeFile(join(dir, "entities", "cloud.yaml"), "name: Cloud Strife\n");
    await writeFile(join(dir, "arcs.yaml"), "- midgar\n");
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("is the same for the same files", async () => {
    expect(await fingerprintOf([dir])).toBe(await fingerprintOf([dir]));
  });

  it("changes when a file changes, appears or is renamed", async () => {
    const before = await fingerprintOf([dir]);
    await writeFile(join(dir, "arcs.yaml"), "- midgar\n- kalm\n");
    const edited = await fingerprintOf([dir]);
    expect(edited).not.toBe(before);
    await writeFile(join(dir, "entities", "tifa.yaml"), "name: Tifa Lockhart\n");
    const added = await fingerprintOf([dir]);
    expect(added).not.toBe(edited);
    await rm(join(dir, "entities", "tifa.yaml"));
    await writeFile(join(dir, "entities", "tifa-lockhart.yaml"), "name: Tifa Lockhart\n");
    expect(await fingerprintOf([dir])).not.toBe(added);
  });

  it("ignores test files", async () => {
    const before = await fingerprintOf([dir]);
    await writeFile(join(dir, "arcs.test.ts"), "// a test\n");
    expect(await fingerprintOf([dir])).toBe(before);
  });
});
