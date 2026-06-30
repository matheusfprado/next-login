import { prisma } from "@/lib/prisma";
import { closeRedis } from "@/lib/redis";
import { processPriceAlerts } from "@/src/modules/alerts/alerts.job";
import {
  processAbruptVariationAlerts,
  processGoalAlerts,
} from "@/src/modules/notifications/email-notifications.job";

const intervalMs = Number(process.env.ALERTS_WORKER_INTERVAL_MS ?? 60_000);

async function runOnce() {
  try {
    const [result, goals, variations] = await Promise.all([
      processPriceAlerts(),
      processGoalAlerts(),
      processAbruptVariationAlerts(),
    ]);
    console.log(
      `[alerts-worker] price=${result.triggered}/${result.checked} goals=${goals.sent}/${goals.checked} variations=${variations.sent}/${variations.checked}`
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
