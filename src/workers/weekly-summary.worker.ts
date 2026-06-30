import { prisma } from "@/lib/prisma";
import { closeRedis } from "@/lib/redis";
import { processWeeklySummaries } from "@/src/modules/summaries/weekly-summary.job";

const intervalMs = 60 * 60 * 1000;

async function runOnce() {
  try {
    const result = await processWeeklySummaries();
    console.log(
      `[weekly-summary-worker] eligible=${result.eligible} sent=${result.sent}`
    );
  } catch (error) {
    console.error("[weekly-summary-worker] failed", error);
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
