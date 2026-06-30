import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  findUnique: vi.fn(),
  deleteMany: vi.fn(),
  compare: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("bcryptjs", () => ({
  default: { compare: mocks.compare },
}));

vi.mock("@/lib/authOptions", () => ({ authOptions: {} }));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mocks.findUnique, deleteMany: mocks.deleteMany } },
}));

import { DELETE } from "./route";

function deleteRequest(body: unknown) {
  return new Request("http://localhost/api/account", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("exclusão de conta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bloqueia exclusão sem sessão", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    const response = await DELETE(deleteRequest({ currentPassword: "senha", confirmation: "EXCLUIR" }));

    expect(response.status).toBe(401);
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("exige confirmação explícita", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user-complete-id" } });

    const response = await DELETE(deleteRequest({ currentPassword: "senha", confirmation: "excluir" }));

    expect(response.status).toBe(400);
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("bloqueia exclusão com senha incorreta", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user-complete-id" } });
    mocks.findUnique.mockResolvedValue({ password: "hash" });
    mocks.compare.mockResolvedValue(false);

    const response = await DELETE(deleteRequest({ currentPassword: "incorreta", confirmation: "EXCLUIR" }));

    expect(response.status).toBe(400);
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("exclui somente o ID completo do usuário autenticado", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user-complete-id" } });
    mocks.findUnique.mockResolvedValue({ password: "hash" });
    mocks.compare.mockResolvedValue(true);
    mocks.deleteMany.mockResolvedValue({ count: 1 });

    const response = await DELETE(deleteRequest({ currentPassword: "senha-segura", confirmation: "EXCLUIR" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { id: "user-complete-id" },
    });
    expect(mocks.compare).toHaveBeenCalledWith("senha-segura", "hash");
    expect(body).toEqual({ success: true, signOutRequired: true });
  });
});
