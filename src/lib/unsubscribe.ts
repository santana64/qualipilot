import { signPayload, verifySignedPayload } from "@/domain/auth/tokens";

type UnsubscribePayload = {
  userId: string;
  kind: "reminders";
  expiresAt: number;
};

export function createReminderUnsubscribeUrl(userId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const token = signPayload({
    userId,
    kind: "reminders",
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 365,
  });
  return `${appUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function verifyReminderUnsubscribeToken(token: string) {
  const payload = verifySignedPayload<UnsubscribePayload>(token);
  if (!payload || payload.kind !== "reminders" || payload.expiresAt <= Date.now()) return null;
  return payload.userId;
}
