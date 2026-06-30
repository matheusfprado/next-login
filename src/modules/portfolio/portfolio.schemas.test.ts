import { describe, expect, it } from "vitest";

import { createPortfolioEntrySchema } from "./portfolio.schemas";

describe("createPortfolioEntrySchema", () => {
  it("aceita uma posição válida", () => {
    const result = createPortfolioEntrySchema.safeParse({
      coinId: "bitcoin",
      coinName: "Bitcoin",
      amount: 0.25,
      buyPrice: 60_000,
    });

    expect(result.success).toBe(true);
  });

  it.each([
    ["quantidade zero", { amount: 0 }],
    ["quantidade negativa", { amount: -1 }],
    ["preço inválido", { buyPrice: Number.NaN }],
    ["moeda vazia", { coinId: "" }],
  ])("rejeita %s", (_label, invalidField) => {
    const result = createPortfolioEntrySchema.safeParse({
      coinId: "bitcoin",
      coinName: "Bitcoin",
      amount: 1,
      buyPrice: 60_000,
      ...invalidField,
    });

    expect(result.success).toBe(false);
  });
});
