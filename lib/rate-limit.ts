import { createHash } from "node:crypto";

import { getRedis } from "@/lib/redis";

export async function checkRateLimit(params: {
  scope: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
}) {
  const identifierHash = createHash("sha256")
    .update(params.identifier)
    .digest("hex");
  const key = `rate-limit:${params.scope}:${identifierHash}`;

  try {
    const client = await getRedis();
    const count = await client.incr(key);
    if (count === 1) await client.expire(key, params.windowSeconds);
    return count <= params.limit;
  } catch (error) {
    console.error(`[rate-limit] scope=${params.scope} unavailable`, error);
    return true;
  }
}
