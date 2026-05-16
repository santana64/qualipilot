import { NotFoundError, UnauthorizedError } from "@/lib/errors";

export function assertUserOwnsResource(resource: { userId: string } | null | undefined, userId: string) {
  if (!resource) throw new NotFoundError();
  if (resource.userId !== userId) throw new UnauthorizedError("Vous devez être connecté.");
}
