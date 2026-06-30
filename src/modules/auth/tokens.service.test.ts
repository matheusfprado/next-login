import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  emailVerificationToken: {
    deleteMany: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  },
  user: { updateMany: vi.fn() },
  passwordResetToken: { deleteMany: vi.fn(), create: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  consumeEmailVerificationToken,
  createEmailVerificationToken,
  hashToken,
} from "@/src/modules/auth/tokens.service";

describe("email verification tokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.emailVerificationToken.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.emailVerificationToken.create.mockResolvedValue({ id: "token-1" });
    prismaMock.emailVerificationToken.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.$transaction.mockImplementation(async (operation) =>
      typeof operation === "function"
        ? operation(prismaMock)
        : Promise.all(operation)
    );
  });

  it("stores only the token hash with a 24-hour expiration", async () => {
    const token = await createEmailVerificationToken(
      "user-1",
      "user@example.com"
    );

    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(prismaMock.emailVerificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        email: "user@example.com",
        purpose: "ACCOUNT_VERIFICATION",
        tokenHash: hashToken(token),
        expiresAt: expect.any(Date),
      }),
    });
  });

  it("consumes a valid account token once and verifies the matching user", async () => {
    prismaMock.emailVerificationToken.findFirst.mockResolvedValue({
      id: "token-1",
      userId: "user-1",
      email: "user@example.com",
      purpose: "ACCOUNT_VERIFICATION",
      user: { email: "user@example.com" },
    });

    await expect(consumeEmailVerificationToken("raw-token")).resolves.toEqual({
      userId: "user-1",
      email: "user@example.com",
      previousEmail: "user@example.com",
      purpose: "ACCOUNT_VERIFICATION",
    });
    expect(prismaMock.emailVerificationToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { usedAt: expect.any(Date) } })
    );
    expect(prismaMock.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1", email: "user@example.com" },
      })
    );
  });

  it("rejects an unknown or expired token", async () => {
    prismaMock.emailVerificationToken.findFirst.mockResolvedValue(null);
    await expect(consumeEmailVerificationToken("invalid-token")).resolves.toBeNull();
  });
});
