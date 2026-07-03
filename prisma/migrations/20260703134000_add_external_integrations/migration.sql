CREATE TYPE "IntegrationProvider" AS ENUM ('BINANCE', 'METAMASK');

CREATE TABLE "ExternalConnection" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" "IntegrationProvider" NOT NULL,
  "label" TEXT NOT NULL,
  "walletAddress" TEXT,
  "chainId" TEXT,
  "apiKeyEncrypted" TEXT,
  "apiSecretEncrypted" TEXT,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExternalHolding" (
  "id" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "asset" TEXT NOT NULL,
  "amount" DECIMAL(36,18) NOT NULL,
  "source" TEXT NOT NULL,
  "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExternalHolding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExternalConnection_userId_provider_key" ON "ExternalConnection"("userId", "provider");
CREATE INDEX "ExternalConnection_userId_idx" ON "ExternalConnection"("userId");
CREATE UNIQUE INDEX "ExternalHolding_connectionId_asset_key" ON "ExternalHolding"("connectionId", "asset");
CREATE INDEX "ExternalHolding_connectionId_idx" ON "ExternalHolding"("connectionId");
ALTER TABLE "ExternalConnection" ADD CONSTRAINT "ExternalConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalHolding" ADD CONSTRAINT "ExternalHolding_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ExternalConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
