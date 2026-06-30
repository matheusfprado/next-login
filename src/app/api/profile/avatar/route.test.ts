import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
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

import { DELETE, GET, POST } from "./route";

function avatarRequest(file: File) {
  const body = new FormData();
  body.append("avatar", file);
  return new Request("http://localhost/api/profile/avatar", { method: "POST", body });
}

describe("avatar do perfil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerSession.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("bloqueia upload sem autenticação", async () => {
    mocks.getServerSession.mockResolvedValue(null);
    const file = new File([new Uint8Array([0x89])], "avatar.png", { type: "image/png" });

    const response = await POST(avatarRequest(file));

    expect(response.status).toBe(401);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejeita arquivo com assinatura inválida", async () => {
    const file = new File(["não é png"], "avatar.png", { type: "image/png" });

    const response = await POST(avatarRequest(file));

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("salva imagem válida somente no usuário autenticado", async () => {
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([pngHeader], "avatar.png", { type: "image/png" });
    mocks.update.mockResolvedValue({ updatedAt: new Date("2026-06-30T12:00:00.000Z") });

    const response = await POST(avatarRequest(file));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { avatar: expect.stringMatching(/^data:image\/png;base64,/) },
      select: { updatedAt: true },
    });
    expect(body.avatar).toBe("/api/profile/avatar?v=1782820800000");
  });

  it("entrega e remove o avatar", async () => {
    mocks.findUnique.mockResolvedValue({ avatar: "data:image/png;base64,iVBORw0KGgo=" });

    const getResponse = await GET();
    expect(getResponse.status).toBe(200);
    expect(getResponse.headers.get("content-type")).toBe("image/png");

    const deleteResponse = await DELETE();
    expect(deleteResponse.status).toBe(204);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { avatar: null },
    });
  });
});
