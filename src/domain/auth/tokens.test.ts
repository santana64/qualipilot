import { describe, expect, it } from "vitest";
import { createOpaqueToken, hashToken, isExpired, signPayload, verifySignedPayload } from "./tokens";
import { isRateLimited } from "@/lib/rate-limit";

describe("auth tokens", () => {
  it("hashes opaque tokens without keeping raw values", () => {
    const token = createOpaqueToken();
    expect(hashToken(token)).not.toBe(token);
    expect(hashToken(token)).toHaveLength(64);
  });

  it("checks token expiry", () => {
    expect(isExpired(new Date("2026-01-01"), new Date("2026-05-02"))).toBe(true);
    expect(isExpired(new Date("2026-06-01"), new Date("2026-05-02"))).toBe(false);
  });

  it("signs and verifies payloads", () => {
    const token = signPayload({ userId: "u1", expiresAt: Date.now() + 1000 });
    expect(verifySignedPayload<{ userId: string }>(token)?.userId).toBe("u1");
    expect(verifySignedPayload(`${token}x`)).toBeNull();
  });

  it("detects rate limit threshold", () => {
    expect(isRateLimited(5, { limit: 5, windowSeconds: 60 })).toBe(true);
    expect(isRateLimited(4, { limit: 5, windowSeconds: 60 })).toBe(false);
  });
});
