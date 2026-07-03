import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { fetchTopCryptoMarkets } from "@/src/modules/crypto/coingecko.service";
import { fetchBinanceBalances } from "./binance-account.service";
import { decryptSecret, encryptSecret } from "./secret-crypto";

interface HoldingInput { asset: string; amount: number }

export async function listIntegrations(userId: string) {
  const connections = await prisma.externalConnection.findMany({
    where: { userId }, include: { holdings: { orderBy: { asset: "asc" } } }, orderBy: { createdAt: "asc" },
  });
  return connections.map((connection) => ({
    id: connection.id,
    provider: connection.provider,
    label: connection.label,
    walletAddress: connection.walletAddress,
    chainId: connection.chainId,
    lastSyncedAt: connection.lastSyncedAt,
    holdings: connection.holdings.map((holding) => ({ asset: holding.asset, amount: Number(holding.amount), syncedAt: holding.syncedAt })),
  }));
}

export async function connectBinance(userId: string, apiKey: string, apiSecret: string) {
  const holdings = await fetchBinanceBalances(apiKey, apiSecret);
  const connection = await prisma.externalConnection.upsert({
    where: { userId_provider: { userId, provider: "BINANCE" } },
    create: { userId, provider: "BINANCE", label: "Binance", apiKeyEncrypted: encryptSecret(apiKey), apiSecretEncrypted: encryptSecret(apiSecret) },
    update: { apiKeyEncrypted: encryptSecret(apiKey), apiSecretEncrypted: encryptSecret(apiSecret) },
  });
  await replaceHoldings(connection.id, "BINANCE", holdings);
  return connection;
}

export async function connectMetaMask(userId: string, walletAddress: string, chainId: string) {
  return prisma.externalConnection.upsert({
    where: { userId_provider: { userId, provider: "METAMASK" } },
    create: { userId, provider: "METAMASK", label: "MetaMask", walletAddress, chainId },
    update: { walletAddress, chainId },
  });
}

export async function disconnectIntegration(userId: string, id: string) {
  await prisma.externalConnection.deleteMany({ where: { id, userId } });
}

export async function syncIntegration(userId: string, id: string, metamaskHoldings?: HoldingInput[]) {
  const connection = await prisma.externalConnection.findFirst({ where: { id, userId } });
  if (!connection) throw new Error("Conexão não encontrada.");
  let holdings: HoldingInput[];
  if (connection.provider === "BINANCE") {
    if (!connection.apiKeyEncrypted || !connection.apiSecretEncrypted) throw new Error("Credenciais ausentes.");
    holdings = await fetchBinanceBalances(decryptSecret(connection.apiKeyEncrypted), decryptSecret(connection.apiSecretEncrypted));
  } else {
    holdings = metamaskHoldings ?? [];
  }
  await replaceHoldings(connection.id, connection.provider, holdings);
}

export async function importHoldings(userId: string) {
  const [holdings, markets] = await Promise.all([
    prisma.externalHolding.findMany({ where: { connection: { userId } } }),
    fetchTopCryptoMarkets(),
  ]);
  const totals = new Map<string, number>();
  holdings.forEach((holding) => totals.set(holding.asset, (totals.get(holding.asset) ?? 0) + Number(holding.amount)));
  let imported = 0;
  for (const [symbol, amount] of totals) {
    const market = markets.find((item) => item.symbol.toUpperCase() === symbol.toUpperCase());
    if (!market || amount <= 0) continue;
    await prisma.portfolio.upsert({
      where: { userId_coinId: { userId, coinId: market.id } },
      create: { userId, coinId: market.id, coinName: market.name, amount: new Prisma.Decimal(amount), buyPrice: new Prisma.Decimal(market.current_price) },
      update: { amount: new Prisma.Decimal(amount), coinName: market.name },
    });
    imported += 1;
  }
  return { imported };
}

export async function syncAllBinanceConnections() {
  const connections = await prisma.externalConnection.findMany({ where: { provider: "BINANCE" } });
  let synced = 0;
  for (const connection of connections) {
    try { await syncIntegration(connection.userId, connection.id); synced += 1; } catch (error) { console.error(`[integrations] sync failed id=${connection.id}`, error); }
  }
  return { checked: connections.length, synced };
}

async function replaceHoldings(connectionId: string, source: string, holdings: HoldingInput[]) {
  await prisma.$transaction(async (tx) => {
    await tx.externalHolding.deleteMany({ where: { connectionId } });
    if (holdings.length > 0) {
      await tx.externalHolding.createMany({ data: holdings.map((holding) => ({ connectionId, source, asset: holding.asset.toUpperCase(), amount: new Prisma.Decimal(holding.amount) })) });
    }
    await tx.externalConnection.update({ where: { id: connectionId }, data: { lastSyncedAt: new Date() } });
  });
}
