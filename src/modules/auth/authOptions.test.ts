import type { JWT } from "next-auth/jwt";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
}));

vi.mock("@next-auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(() => ({})),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((config: unknown) => config),
}));

vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mocks.findUnique } },
}));

vi.mock("@/src/modules/auth/auth-emails.service", () => ({
  sendNewLoginEmail: vi.fn(),
}));

vi.mock("@/src/modules/auth/login-otp.service", () => ({
  consumeLoginOtp: vi.fn(),
}));

import { authOptions } from "@/lib/authOptions";

describe("atualização da sessão", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recarrega nome e e-mail do banco ao atualizar a sessão", async () => {
    mocks.findUnique.mockResolvedValue({
      name: "Matheus Prado",
      email: "matheus@example.com",
      avatar: "data:image/png;base64,abc",
      updatedAt: new Date("2026-06-30T12:00:00.000Z"),
    });
    const jwtCallback = authOptions.callbacks?.jwt;
    if (!jwtCallback) throw new Error("Callback JWT não configurado");

    const token = {
      id: "user-1",
      name: "Usuário",
      email: "matheus@example.com",
    } as JWT;
    const result = await jwtCallback({
      token,
      trigger: "update",
      session: {},
    } as Parameters<typeof jwtCallback>[0]);

    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { name: true, email: true, avatar: true, updatedAt: true },
    });
    expect(result).toMatchObject({
      name: "Matheus Prado",
      email: "matheus@example.com",
      picture: "/api/profile/avatar?v=1782820800000",
    });
  });
});
