function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }

  return value;
}

export const env = {
  databaseUrl: () => requireEnv("DATABASE_URL"),
  redisUrl: () => process.env.REDIS_URL ?? "redis://localhost:6379",
  nextAuthSecret: () => requireEnv("NEXTAUTH_SECRET"),
  nextAuthUrl: () => process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  coinGeckoMarketsUrl: () =>
    process.env.COINGECKO_MARKETS_URL ??
    "https://api.coingecko.com/api/v3/coins/markets",
};
