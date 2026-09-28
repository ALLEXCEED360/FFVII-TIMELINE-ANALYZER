import type { FastifyReply, FastifyRequest } from "fastify";

export const NOT_FOUND = { error: "not_found", message: "No such entity." } as const;
export const REMOVED = {
  error: "removed",
  message: "This entity was removed from the dataset.",
} as const;

/**
 * Answers a lookup that found a retired ID (docs/conventions/ids.md §6): a permanent redirect to
 * the same route with the replacement ID, or 404 if the entity was removed.
 */
export function redirectRetired(
  request: FastifyRequest,
  reply: FastifyReply,
  { oldId, newId }: { oldId: string; newId: string | null },
) {
  if (newId === null) return reply.code(404).send(REMOVED);
  const url = request.url.replace(encodeURIComponent(oldId), encodeURIComponent(newId));
  return reply.redirect(url, 308);
}
