import type { FastifyReply, FastifyRequest } from "fastify";

export const NOT_FOUND = { error: "not_found", message: "No such entity." } as const;
export const REMOVED = {
  error: "removed",
  message: "This entity was removed from the dataset.",
} as const;

/** A retired ID (ids.md §6): 308 to the replacement, or 404 if the entity was removed. */
export function redirectRetired(
  request: FastifyRequest,
  reply: FastifyReply,
  { oldId, newId }: { oldId: string; newId: string | null },
) {
  if (newId === null) return reply.code(404).send(REMOVED);
  const url = request.url.replace(encodeURIComponent(oldId), encodeURIComponent(newId));
  return reply.redirect(url, 308);
}
