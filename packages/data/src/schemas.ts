import {
  ArcsSchema,
  CoverageSchema,
  ENTITY_FILE_KINDS,
  ErasSchema,
  IdRedirectsSchema,
  OgSegmentsSchema,
  WorldsSchema,
} from "@ffvii/shared";
import { z } from "zod";

/** Where the generated JSON Schemas live (referenced by .vscode/settings.json). */
export const SCHEMA_DIR = new URL("../schemas/", import.meta.url);

/**
 * JSON Schemas for every kind of data file, so the editor can autocomplete and check YAML as
 * it's typed. Cross-file rules can't be expressed here — `pnpm validate` remains the authority.
 */
export function generateSchemas(): Map<string, string> {
  const schemas = new Map<string, z.ZodType>([
    ...Object.values(ENTITY_FILE_KINDS).map(
      ({ folder, schema }) => [`${folder}.schema.json`, schema] as const,
    ),
    ["og-segments.schema.json", OgSegmentsSchema],
    ["coverage.schema.json", CoverageSchema],
    ["arcs.schema.json", ArcsSchema],
    ["eras.schema.json", ErasSchema],
    ["worlds.schema.json", WorldsSchema],
    ["id-redirects.schema.json", IdRedirectsSchema],
  ]);

  return new Map(
    [...schemas].map(([name, schema]) => [
      name,
      `${JSON.stringify(
        z.toJSONSchema(schema, { io: "input", unrepresentable: "any", reused: "ref" }),
        null,
        2,
      )}\n`,
    ]),
  );
}
