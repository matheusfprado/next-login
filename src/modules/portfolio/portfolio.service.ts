import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  CreatePortfolioEntryInput,
  UpdatePortfolioEntryInput,
} from "./portfolio.schemas";

export class PortfolioDomainError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export async function registerPortfolioMovement(
  userId: string,
  input: CreatePortfolioEntryInput
) {
  return runSerializable(async (tx) => {
    const current = await tx.portfolio.findUnique({
      where: { userId_coinId: { userId, coinId: input.coinId } },
    });
    const amount = new Prisma.Decimal(input.amount);
    const unitPrice = new Prisma.Decimal(input.unitPrice);
    const fee = new Prisma.Decimal(input.fee);

    if (input.type === "SELL" && (!current || current.amount.lessThan(amount))) {
      throw new PortfolioDomainError("Saldo insuficiente para esta venda.", 422);
    }

    let realizedProfit = new Prisma.Decimal(0);
    let position;

    if (input.type === "BUY") {
      const currentAmount = current?.amount ?? new Prisma.Decimal(0);
      const currentCost = current
        ? current.amount.mul(current.buyPrice)
        : new Prisma.Decimal(0);
      const nextAmount = currentAmount.add(amount);
      const nextAveragePrice = currentCost
        .add(amount.mul(unitPrice))
        .add(fee)
        .div(nextAmount);

      position = current
        ? await tx.portfolio.update({
            where: { id: current.id },
            data: {
              coinName: input.coinName,
              amount: nextAmount,
              buyPrice: nextAveragePrice,
              totalFees: current.totalFees.add(fee),
            },
          })
        : await tx.portfolio.create({
            data: {
              userId,
              coinId: input.coinId,
              coinName: input.coinName,
              amount: nextAmount,
              buyPrice: nextAveragePrice,
              totalFees: fee,
            },
          });
    } else {
      const nextAmount = current!.amount.sub(amount);
      realizedProfit = amount.mul(unitPrice.sub(current!.buyPrice)).sub(fee);
      position = await tx.portfolio.update({
        where: { id: current!.id },
        data: {
          coinName: input.coinName,
          amount: nextAmount,
          realizedProfit: current!.realizedProfit.add(realizedProfit),
          totalFees: current!.totalFees.add(fee),
        },
      });
    }

    await tx.portfolioTransaction.create({
      data: {
        userId,
        coinId: input.coinId,
        coinName: input.coinName,
        type: input.type,
        amount,
        unitPrice,
        fee,
        realizedProfit,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
      },
    });

    return position;
  });
}

export async function updatePortfolioPosition(
  userId: string,
  portfolioId: string,
  input: UpdatePortfolioEntryInput
) {
  return runSerializable(async (tx) => {
    const current = await tx.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!current) {
      throw new PortfolioDomainError("Ativo não encontrado.", 404);
    }

    const nextAmount =
      input.amount === undefined ? current.amount : new Prisma.Decimal(input.amount);
    const nextBuyPrice =
      input.buyPrice === undefined
        ? current.buyPrice
        : new Prisma.Decimal(input.buyPrice);
    const amountDelta = nextAmount.sub(current.amount);

    const updated = await tx.portfolio.update({
      where: { id: current.id },
      data: {
        coinName: input.coinName,
        amount: nextAmount,
        buyPrice: nextBuyPrice,
      },
    });

    await tx.portfolioTransaction.create({
      data: {
        userId,
        coinId: current.coinId,
        coinName: input.coinName ?? current.coinName,
        type: "ADJUSTMENT",
        amount: amountDelta,
        unitPrice: nextBuyPrice,
      },
    });

    return updated;
  });
}

export async function removePortfolioPosition(
  userId: string,
  portfolioId: string
) {
  return runSerializable(async (tx) => {
    const current = await tx.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!current) {
      throw new PortfolioDomainError("Ativo não encontrado.", 404);
    }

    await tx.portfolioTransaction.create({
      data: {
        userId,
        coinId: current.coinId,
        coinName: current.coinName,
        type: "ADJUSTMENT",
        amount: current.amount.negated(),
        unitPrice: current.buyPrice,
      },
    });
    await tx.portfolio.delete({ where: { id: current.id } });
  });
}

async function runSerializable<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>
) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (
        attempt < 3 &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Falha inesperada ao processar movimentação.");
}
