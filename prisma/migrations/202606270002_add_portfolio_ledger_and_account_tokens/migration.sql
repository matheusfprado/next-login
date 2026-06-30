CREATE TYPE "PortfolioTransactionType" AS ENUM ('BUY', 'SELL', 'ADJUSTMENT');

ALTER TABLE "User" ADD COLUMN "emailVerified" TIMESTAMP(3);
UPDATE "User" SET "emailVerified" = CURRENT_TIMESTAMP WHERE "email" IS NOT NULL;

ALTER TABLE "Portfolio"
  ADD COLUMN "realizedProfit" DECIMAL(36,18) NOT NULL DEFAULT 0,
  ADD COLUMN "totalFees" DECIMAL(36,18) NOT NULL DEFAULT 0;

ALTER TABLE "UserPreference" ADD COLUMN "lastWeeklySummaryAt" TIMESTAMP(3);

CREATE TABLE "PortfolioTransaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "coinId" TEXT NOT NULL,
  "coinName" TEXT NOT NULL,
  "type" "PortfolioTransactionType" NOT NULL,
  "amount" DECIMAL(36,18) NOT NULL,
  "unitPrice" DECIMAL(36,18) NOT NULL,
  "fee" DECIMAL(36,18) NOT NULL DEFAULT 0,
  "realizedProfit" DECIMAL(36,18) NOT NULL DEFAULT 0,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PortfolioTransaction_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PortfolioTransaction" (
  "id", "userId", "coinId", "coinName", "type", "amount", "unitPrice", "occurredAt", "createdAt"
)
SELECT
  'migrated_' || "id", "userId", "coinId", "coinName", 'BUY'::"PortfolioTransactionType",
  "amount", "buyPrice", "createdAt", "createdAt"
FROM "Portfolio";

WITH aggregated AS (
  SELECT
    MIN("id") AS "keepId",
    "userId",
    "coinId",
    MAX("coinName") AS "coinName",
    SUM("amount") AS "amount",
    CASE
      WHEN SUM("amount") = 0 THEN 0
      ELSE SUM("amount" * "buyPrice") / SUM("amount")
    END AS "buyPrice"
  FROM "Portfolio"
  GROUP BY "userId", "coinId"
)
UPDATE "Portfolio" AS portfolio
SET
  "coinName" = aggregated."coinName",
  "amount" = aggregated."amount",
  "buyPrice" = aggregated."buyPrice"
FROM aggregated
WHERE portfolio."id" = aggregated."keepId";

DELETE FROM "Portfolio"
WHERE "id" NOT IN (
  SELECT MIN("id") FROM "Portfolio" GROUP BY "userId", "coinId"
);

CREATE TABLE "EmailVerificationToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Portfolio_userId_coinId_key" ON "Portfolio"("userId", "coinId");
CREATE INDEX "PortfolioTransaction_userId_occurredAt_idx" ON "PortfolioTransaction"("userId", "occurredAt");
CREATE INDEX "PortfolioTransaction_userId_coinId_occurredAt_idx" ON "PortfolioTransaction"("userId", "coinId", "occurredAt");
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

ALTER TABLE "PortfolioTransaction"
  ADD CONSTRAINT "PortfolioTransaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailVerificationToken"
  ADD CONSTRAINT "EmailVerificationToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PasswordResetToken"
  ADD CONSTRAINT "PasswordResetToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
