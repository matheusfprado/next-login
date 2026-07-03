import { z } from "zod";

export const connectIntegrationSchema = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("BINANCE"),
    apiKey: z.string().trim().min(10).max(256),
    apiSecret: z.string().trim().min(10).max(256),
  }),
  z.object({
    provider: z.literal("METAMASK"),
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    chainId: z.string().regex(/^0x[a-fA-F0-9]+$/),
  }),
]);

export const metamaskSyncSchema = z.object({
  holdings: z.array(z.object({
    asset: z.string().trim().min(1).max(20),
    amount: z.number().finite().nonnegative(),
  })).max(100).default([]),
});
