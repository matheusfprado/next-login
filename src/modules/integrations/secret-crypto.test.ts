import { afterEach, describe, expect, it, vi } from "vitest";

import { decryptSecret, encryptSecret } from "./secret-crypto";

describe("integration secret encryption", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("encrypts and authenticates a secret", () => {
    vi.stubEnv("INTEGRATION_ENCRYPTION_KEY", "test-key-with-at-least-thirty-two-characters");
    const encrypted = encryptSecret("binance-secret");
    expect(encrypted).not.toContain("binance-secret");
    expect(decryptSecret(encrypted)).toBe("binance-secret");
  });
});
