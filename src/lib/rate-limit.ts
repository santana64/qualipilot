import { prisma } from "@/lib/db";
import { RateLimitError } from "@/lib/errors";

export type RateLimitRule = {
  limit: number;
  windowSeconds: number;
};

export const RATE_LIMITS: Record<string, RateLimitRule> = {
  login: { limit: 8, windowSeconds: 15 * 60 },
  register: { limit: 5, windowSeconds: 60 * 60 },
  forgotPassword: { limit: 4, windowSeconds: 60 * 60 },
  resetPassword: { limit: 5, windowSeconds: 60 * 60 },
  resendVerification: { limit: 3, windowSeconds: 60 * 60 },
};

export function isRateLimited(count: number, rule: RateLimitRule): boolean {
  return count >= rule.limit;
}

export async function assertRateLimit(action: keyof typeof RATE_LIMITS, key: string) {
  const rule = RATE_LIMITS[action];
  const since = new Date(Date.now() - rule.windowSeconds * 1000);
  const count = await prisma.rateLimitEvent.count({
    where: {
      action,
      key,
      createdAt: { gte: since },
    },
  });
  if (isRateLimited(count, rule)) {
    throw new RateLimitError();
  }
  await prisma.rateLimitEvent.create({
    data: { action, key },
  });
}
