import { z } from "zod";

const finitePositiveNumber = z
  .number()
  .finite("Valor inválido.")
  .positive("O valor deve ser maior que zero.");

const finiteNonNegativeNumber = z
  .number()
  .finite("Valor inválido.")
  .nonnegative("O valor não pode ser negativo.");

export const createPortfolioEntrySchema = z
  .object({
    coinId: z.string().trim().min(1).max(100),
    coinName: z.string().trim().min(1).max(100),
    type: z.enum(["BUY", "SELL"]).default("BUY"),
    amount: finitePositiveNumber,
    unitPrice: finitePositiveNumber.optional(),
    buyPrice: finitePositiveNumber.optional(),
    fee: finiteNonNegativeNumber.default(0),
    occurredAt: z.iso.datetime().optional(),
  })
  .refine((data) => data.unitPrice !== undefined || data.buyPrice !== undefined, {
    message: "Informe o preço unitário.",
    path: ["unitPrice"],
  })
  .transform(({ buyPrice, ...data }) => ({
    ...data,
    unitPrice: data.unitPrice ?? buyPrice!,
  }));

export const updatePortfolioEntrySchema = z
  .object({
    coinName: z.string().trim().min(1).max(100).optional(),
    amount: finiteNonNegativeNumber.optional(),
    buyPrice: finiteNonNegativeNumber.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhuma alteração fornecida.",
  });

export const portfolioTransactionsQuerySchema = z.object({
  coinId: z.string().trim().min(1).max(100).optional(),
  type: z.enum(["BUY", "SELL", "ADJUSTMENT"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePortfolioEntryInput = z.infer<
  typeof createPortfolioEntrySchema
>;
export type UpdatePortfolioEntryInput = z.infer<
  typeof updatePortfolioEntrySchema
>;
