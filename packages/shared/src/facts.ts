import { z } from "zod";
import { type Locator, SourcesSchema } from "./locators.ts";

// Every fact carries citations and a certainty (docs/canon-and-sources.md §5–6).

export const CertaintySchema = z.enum(["stated", "inferred", "ambiguous"]);
export type Certainty = z.infer<typeof CertaintySchema>;

export const NotesSchema = z.string().trim().min(1);

export const factShape = {
  sources: SourcesSchema,
  certainty: CertaintySchema,
  notes: NotesSchema.optional(),
};

export interface FactFields {
  sources: Locator[];
  certainty: Certainty;
  notes?: string | undefined;
}

/** Inferred and ambiguous facts must explain themselves in `notes`. */
export function checkFact(fact: FactFields, ctx: z.RefinementCtx): void {
  if (fact.certainty !== "stated" && fact.notes === undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["notes"],
      message: `${fact.certainty} facts need \`notes\` (${
        fact.certainty === "inferred"
          ? "show the reasoning"
          : "describe what is shown and what is left open"
      })`,
    });
  }
}
