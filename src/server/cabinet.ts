import { prisma } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import { assertCanUseCabinetMode } from "@/server/billing";

export async function assertValidClientForUser(userId: string, clientId?: string | null) {
  if (!clientId) return null;
  await assertCanUseCabinetMode(userId);
  const client = await prisma.cabinetClient.findFirst({
    where: { id: clientId, userId, status: "ACTIVE" },
  });
  if (!client) {
    throw new DomainError("Client cabinet introuvable.");
  }
  return client;
}
