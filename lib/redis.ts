import { createClient } from "redis";

import { env } from "@/lib/env";

const globalForRedis = globalThis as unknown as {
  redis?: ReturnType<typeof createClient>;
};

export const redis =
  globalForRedis.redis ??
  createClient({
    url: env.redisUrl(),
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export async function getRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }

  return redis;
}

export async function closeRedis() {
  if (redis.isOpen) {
    await redis.quit();
  }
}
