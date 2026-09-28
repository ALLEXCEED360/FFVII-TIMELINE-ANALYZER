export interface Issue {
  level: "error" | "warning";
  /** Path of the file relative to the data folder, if the issue belongs to one. */
  file?: string;
  /** Location inside the file, e.g. `edges[2].target`. */
  path?: string;
  message: string;
}

export function formatPath(path: readonly PropertyKey[]): string {
  return path
    .map((part, index) =>
      typeof part === "number" ? `[${String(part)}]` : `${index > 0 ? "." : ""}${String(part)}`,
    )
    .join("");
}

export function formatIssue(issue: Issue): string {
  const where = [issue.file, issue.path].filter(Boolean).join(" → ");
  return `${issue.level.padEnd(7)} ${where ? `${where}: ` : ""}${issue.message}`;
}
