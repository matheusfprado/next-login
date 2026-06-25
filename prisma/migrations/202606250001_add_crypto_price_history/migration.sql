CREATE TABLE "CryptoPriceHistory" (
    "id" TEXT NOT NULL,
    "coinId" TEXT NOT NULL,
    "coinName" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "priceUsd" DOUBLE PRECISION NOT NULL,
    "marketCap" DOUBLE PRECISION,
    "volume24h" DOUBLE PRECISION,
    "change24h" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CryptoPriceHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CryptoPriceHistory_coinId_createdAt_idx" ON "CryptoPriceHistory"("coinId", "createdAt");
CREATE INDEX "CryptoPriceHistory_createdAt_idx" ON "CryptoPriceHistory"("createdAt");
