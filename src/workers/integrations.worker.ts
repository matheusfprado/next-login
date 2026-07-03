import { syncAllBinanceConnections } from "@/src/modules/integrations/integration.service";

const intervalMs = Number(process.env.INTEGRATIONS_WORKER_INTERVAL_MS ?? 300_000);

async function run() {
  try {
    const result = await syncAllBinanceConnections();
    console.log(`[integrations-worker] synced=${result.synced}/${result.checked}`);
  } catch (error) {
    console.error("[integrations-worker] failed", error);
  }
}

void run();
setInterval(() => void run(), intervalMs);
