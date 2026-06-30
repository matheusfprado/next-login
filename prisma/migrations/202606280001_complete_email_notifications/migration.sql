CREATE TYPE "EmailVerificationPurpose" AS ENUM ('ACCOUNT_VERIFICATION', 'EMAIL_CHANGE');
CREATE TYPE "EmailNotificationType" AS ENUM ('GOAL_ACHIEVED', 'ABRUPT_VARIATION');

ALTER TABLE "EmailVerificationToken"
ADD COLUMN "email" TEXT,
ADD COLUMN "purpose" "EmailVerificationPurpose" NOT NULL DEFAULT 'ACCOUNT_VERIFICATION';

UPDATE "EmailVerificationToken" token
SET "email" = "User"."email"
FROM "User"
WHERE token."userId" = "User"."id";

DELETE FROM "EmailVerificationToken" WHERE "email" IS NULL;
ALTER TABLE "EmailVerificationToken" ALTER COLUMN "email" SET NOT NULL;

ALTER TABLE "InvestmentGoal" ADD COLUMN "achievedNotifiedAt" TIMESTAMP(3);

CREATE TABLE "EmailNotification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "EmailNotificationType" NOT NULL,
  "key" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailNotification_userId_type_key_key"
ON "EmailNotification"("userId", "type", "key");
CREATE INDEX "EmailNotification_createdAt_idx" ON "EmailNotification"("createdAt");
ALTER TABLE "EmailNotification" ADD CONSTRAINT "EmailNotification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
