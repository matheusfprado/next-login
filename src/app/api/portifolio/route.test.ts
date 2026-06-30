import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  findMany: vi.fn(),
  registerMovement: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("@/lib/authOptions", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    portfolio: {
      findMany: mocks.findMany,
    },
  },
}));

vi.mock("@/src/modules/portfolio/portfolio.service", () => ({
  PortfolioDomainError: class PortfolioDomainError extends Error {
    status = 422;
  },
  registerPortfolioMovement: mocks.registerMovement,
}));

import { GET, POST } from "./route";

describe("API de carteira", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bloqueia requisições sem sessão", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("rejeita payload inválido antes de acessar o banco", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    const request = new Request("http://localhost/api/portifolio", {
      method: "POST",
      body: JSON.stringify({
        coinId: "bitcoin",
        coinName: "Bitcoin",
        amount: -1,
        buyPrice: 60_000,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(mocks.registerMovement).not.toHaveBeenCalled();
  });

  it("cria uma posição vinculada ao usuário autenticado", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.registerMovement.mockResolvedValue({
      id: "position-1",
      userId: "user-1",
      coinId: "bitcoin",
      coinName: "Bitcoin",
      amount: "0.25",
      buyPrice: "60000",
      realizedProfit: "0",
      totalFees: "0",
    });
    const request = new Request("http://localhost/api/portifolio", {
      method: "POST",
      body: JSON.stringify({
        coinId: "bitcoin",
        coinName: "Bitcoin",
        amount: 0.25,
        buyPrice: 60_000,
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mocks.registerMovement).toHaveBeenCalledWith("user-1", {
        coinId: "bitcoin",
        coinName: "Bitcoin",
        type: "BUY",
        amount: 0.25,
        unitPrice: 60_000,
        fee: 0,
    });
    expect(body).toMatchObject({ amount: 0.25, buyPrice: 60_000 });
  });

  it("lista somente as posições do usuário autenticado", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.findMany.mockResolvedValue([
      {
        id: "position-1",
        amount: "1.5",
        buyPrice: "100",
        realizedProfit: "0",
        totalFees: "2",
      },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", amount: { gt: 0 } },
      orderBy: { createdAt: "desc" },
    });
    expect(body[0]).toMatchObject({ amount: 1.5, buyPrice: 100 });
  });
});
