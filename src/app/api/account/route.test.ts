import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("@/lib/authOptions", () => ({ authOptions: {} }));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { deleteMany: mocks.deleteMany } },
}));

import { DELETE } from "./route";

describe("exclusão de conta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bloqueia exclusão sem sessão", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    const response = await DELETE();

    expect(response.status).toBe(401);
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("exclui somente o ID completo do usuário autenticado", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user-complete-id" } });
    mocks.deleteMany.mockResolvedValue({ count: 1 });

    const response = await DELETE();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { id: "user-complete-id" },
    });
    expect(body).toEqual({ success: true, signOutRequired: true });
  });
});
