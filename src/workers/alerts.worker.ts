import { prisma } from "@/lib/prisma";
import { closeRedis } from "@/lib/redis";
import { processPriceAlerts } from "@/src/modules/alerts/alerts.job";

const intervalMs = Number(process.env.ALERTS_WORKER_INTERVAL_MS ?? 60_000);

async function runOnce() {
  try {
    const result = await processPriceAlerts();
    console.log(
      `[alerts-worker] checked=${result.checked} triggered=${result.triggered}`
    );
  } catch (error) {
    console.error("[alerts-worker] failed", error);
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
