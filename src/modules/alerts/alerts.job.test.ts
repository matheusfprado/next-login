import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  updateMany: vi.fn(),
  sendEmail: vi.fn(),
  getCachedCoinPrice: vi.fn(),
  fetchTopCryptoMarkets: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    priceAlert: {
      findMany: mocks.findMany,
      updateMany: mocks.updateMany,
    },
  },
}));

vi.mock("@/lib/email", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/src/modules/crypto/crypto-cache.service", () => ({
  getCachedCoinPrice: mocks.getCachedCoinPrice,
}));
vi.mock("@/src/modules/crypto/coingecko.service", () => ({
  fetchTopCryptoMarkets: mocks.fetchTopCryptoMarkets,
}));

import { processPriceAlerts } from "./alerts.job";

describe("processamento de alertas por e-mail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.fetchTopCryptoMarkets.mockResolvedValue([]);
  });

  it("envia e marca o alerta do usuário quando o alvo é atingido", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: "alert-1",
        coinId: "bitcoin",
        coinName: "Bitcoin",
        targetPrice: 100,
        direction: "ABOVE",
        deliveryMethod: "EMAIL",
        user: {
          email: "user@example.com",
          emailVerified: new Date(),
          preferences: { emailAlerts: true },
        },
      },
    ]);
    mocks.getCachedCoinPrice.mockResolvedValue(120);

    const result = await processPriceAlerts("user-1");

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "ACTIVE", userId: "user-1" } })
    );
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: "Alerta de preço: Bitcoin",
      })
    );
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["alert-1"] } },
      data: { status: "TRIGGERED", triggeredAt: expect.any(Date) },
    });
    expect(result.triggered).toBe(1);
    expect(result.triggeredAlerts).toEqual([{ id: "alert-1", price: 120 }]);
  });

  it("não envia quando o e-mail ainda não foi confirmado", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: "alert-1",
        coinId: "bitcoin",
        coinName: "Bitcoin",
        targetPrice: 100,
        direction: "ABOVE",
        deliveryMethod: "EMAIL",
        user: {
          email: "user@example.com",
          emailVerified: null,
          preferences: { emailAlerts: true },
        },
      },
    ]);
    mocks.getCachedCoinPrice.mockResolvedValue(120);

    const result = await processPriceAlerts("user-1");

    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(result.triggered).toBe(0);
  });

  it("consulta o mercado quando o preço não está no Redis", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: "alert-1",
        coinId: "bitcoin",
        coinName: "Bitcoin",
        targetPrice: 100,
        direction: "ABOVE",
        deliveryMethod: "EMAIL",
        user: {
          email: "user@example.com",
          emailVerified: new Date(),
          preferences: { emailAlerts: true },
        },
      },
    ]);
    mocks.getCachedCoinPrice.mockRejectedValue(new Error("Redis indisponível"));
    mocks.fetchTopCryptoMarkets.mockResolvedValue([
      { id: "bitcoin", current_price: 50 },
    ]);

    await processPriceAlerts();

    expect(mocks.fetchTopCryptoMarkets).toHaveBeenCalledOnce();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});
