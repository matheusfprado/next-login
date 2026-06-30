import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    portfolio: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    portfolioTransaction: { create: vi.fn() },
  };
  return { tx, transaction: vi.fn() };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}));

import { registerPortfolioMovement } from "./portfolio.service";

describe("registerPortfolioMovement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (operation) =>
      operation(mocks.tx)
    );
  });

  it("recalcula o preço médio incluindo a taxa da compra", async () => {
    mocks.tx.portfolio.findUnique.mockResolvedValue({
      id: "position-1",
      amount: new Prisma.Decimal(2),
      buyPrice: new Prisma.Decimal(100),
      totalFees: new Prisma.Decimal(5),
      realizedProfit: new Prisma.Decimal(0),
    });
    mocks.tx.portfolio.update.mockImplementation(async ({ data }) => ({
      id: "position-1",
      ...data,
    }));

    await registerPortfolioMovement("user-1", {
      coinId: "bitcoin",
      coinName: "Bitcoin",
      type: "BUY",
      amount: 1,
      unitPrice: 130,
      fee: 10,
    });

    const update = mocks.tx.portfolio.update.mock.calls[0][0];
    expect(Number(update.data.amount)).toBe(3);
    expect(Number(update.data.buyPrice)).toBeCloseTo(113.333333, 5);
    expect(Number(update.data.totalFees)).toBe(15);
    expect(mocks.tx.portfolioTransaction.create).toHaveBeenCalledOnce();
  });

  it("calcula lucro realizado e mantém o preço médio na venda", async () => {
    mocks.tx.portfolio.findUnique.mockResolvedValue({
      id: "position-1",
      amount: new Prisma.Decimal(2),
      buyPrice: new Prisma.Decimal(100),
      totalFees: new Prisma.Decimal(5),
      realizedProfit: new Prisma.Decimal(10),
    });
    mocks.tx.portfolio.update.mockImplementation(async ({ data }) => ({
      id: "position-1",
      ...data,
    }));

    await registerPortfolioMovement("user-1", {
      coinId: "bitcoin",
      coinName: "Bitcoin",
      type: "SELL",
      amount: 0.5,
      unitPrice: 150,
      fee: 2,
    });

    const update = mocks.tx.portfolio.update.mock.calls[0][0];
    expect(Number(update.data.amount)).toBe(1.5);
    expect(Number(update.data.realizedProfit)).toBe(33);
    expect(Number(update.data.totalFees)).toBe(7);
    const movement = mocks.tx.portfolioTransaction.create.mock.calls[0][0];
    expect(Number(movement.data.realizedProfit)).toBe(23);
  });
});
