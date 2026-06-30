import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  compare: vi.fn(),
  createEmailVerificationToken: vi.fn(),
  sendEmailChangeVerificationEmail: vi.fn(),
  sendEmailChangeRequestedEmail: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("bcryptjs", () => ({
  default: { compare: mocks.compare },
}));

vi.mock("@/lib/authOptions", () => ({ authOptions: {} }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}));

vi.mock("@/src/modules/auth/tokens.service", () => ({
  createEmailVerificationToken: mocks.createEmailVerificationToken,
}));

vi.mock("@/src/modules/auth/auth-emails.service", () => ({
  sendEmailChangeVerificationEmail: mocks.sendEmailChangeVerificationEmail,
  sendEmailChangeRequestedEmail: mocks.sendEmailChangeRequestedEmail,
}));

import { PATCH } from "./route";

describe("atualização de perfil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerSession.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("retorna erros por campo para dados inválidos", async () => {
    const request = new Request("http://localhost/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", email: "email-invalido", phone: "1" }),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.fieldErrors).toMatchObject({
      name: expect.any(Array),
      email: expect.any(Array),
      phone: expect.any(Array),
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("atualiza nome e telefone do usuário autenticado", async () => {
    mocks.findUnique.mockResolvedValue({
      email: "user@example.com",
      password: "hash",
    });
    mocks.update.mockResolvedValue({
      id: "user-1",
      name: "Novo nome",
      email: "user@example.com",
      phone: "11999999999",
      updatedAt: new Date("2026-06-30T12:00:00.000Z"),
    });
    const request = new Request("http://localhost/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "  Novo nome  ",
        email: "user@example.com",
        phone: "11999999999",
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: { name: "Novo nome", phone: "11999999999" },
      })
    );
    expect(mocks.createEmailVerificationToken).not.toHaveBeenCalled();
  });

  it("exige a senha atual antes de iniciar a troca de e-mail", async () => {
    mocks.findUnique.mockResolvedValue({
      email: "user@example.com",
      password: "hash",
    });
    mocks.compare.mockResolvedValue(false);
    const request = new Request("http://localhost/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Usuário",
        email: "novo@example.com",
        currentPassword: "senha-incorreta",
        phone: "",
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.createEmailVerificationToken).not.toHaveBeenCalled();
  });
});
