import { closeRedis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { updateCryptoPrices } from "@/src/modules/crypto/crypto-prices.job";
import { cleanupCryptoPriceHistory } from "@/src/modules/crypto/crypto-history.repository";

const intervalMs = Number(process.env.CRYPTO_PRICES_WORKER_INTERVAL_MS ?? 60_000);
const retentionDays = Number(process.env.CRYPTO_HISTORY_RETENTION_DAYS ?? 90);
const cleanupIntervalMs = 24 * 60 * 60 * 1000;
let lastCleanupAt = 0;

async function runOnce() {
  try {
    const result = await updateCryptoPrices();
    console.log(`[crypto-prices-worker] updated=${result.count}`);

    if (Date.now() - lastCleanupAt >= cleanupIntervalMs) {
      const cleanup = await cleanupCryptoPriceHistory(retentionDays);
      lastCleanupAt = Date.now();
      console.log(`[crypto-prices-worker] history-deleted=${cleanup.count}`);
    }
  } catch (error) {
    console.error("[crypto-prices-worker] failed", error);
  }
}

void runOnce();
const interval = setInterval(() => void runOnce(), intervalMs);

async function shutdown() {
  clearInterval(interval);
  await closeRedis();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
