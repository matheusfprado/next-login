export function serializePortfolioEntry<
  T extends {
    amount: unknown;
    buyPrice: unknown;
    realizedProfit: unknown;
    totalFees: unknown;
  }
>(entry: T) {
  return {
    ...entry,
    amount: Number(entry.amount),
    buyPrice: Number(entry.buyPrice),
    realizedProfit: Number(entry.realizedProfit),
    totalFees: Number(entry.totalFees),
  };
}

export function serializePortfolioTransaction<
  T extends {
    amount: unknown;
    unitPrice: unknown;
    fee: unknown;
    realizedProfit: unknown;
  }
>(transaction: T) {
  return {
    ...transaction,
    amount: Number(transaction.amount),
    unitPrice: Number(transaction.unitPrice),
    fee: Number(transaction.fee),
    realizedProfit: Number(transaction.realizedProfit),
  };
}
