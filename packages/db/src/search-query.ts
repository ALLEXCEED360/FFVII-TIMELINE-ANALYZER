// Turns what someone types into search terms. Pure, so it's unit-tested without a database.
// Numbers are ordinary terms here ("sector 7", "reactor 1"): the story has no calendar years.

const STOPWORDS = new Set(["a", "an", "and", "at", "in", "of", "on", "the", "to"]);

/** Lower-case words that must all match, with letters and digits only; at most six. */
export function parseQuery(input: string): string[] {
  const terms: string[] = [];
  for (const raw of input.toLowerCase().split(/\s+/)) {
    // Keep letters (any script) and digits; drop punctuation so terms are safe in tsquery.
    const term = raw.normalize("NFKD").replace(/[^\p{L}\p{N}]/gu, "");
    const long = term.length >= 2 || /^\d+$/.test(term);
    if (term && long && !STOPWORDS.has(term) && !terms.includes(term)) terms.push(term);
  }
  return terms.slice(0, 6);
}
