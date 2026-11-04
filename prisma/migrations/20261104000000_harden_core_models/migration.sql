-- Hardens the core models while preserving existing data:
--   * free-text status / dataType columns become enums
--   * money moves from floating point dollars to integer cents
--   * votes record their payout, tasks record their consensus result
--   * an append-only ledger backs every balance change

-- Enums
CREATE TYPE "DatasetStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');
CREATE TYPE "DataType" AS ENUM ('TEXT', 'IMAGE');
CREATE TYPE "TaskStatus" AS ENUM ('ACTIVE', 'COMPLETED');
CREATE TYPE "LedgerType" AS ENUM ('TOP_UP', 'TASK_CHARGE', 'TASK_REWARD', 'ADJUSTMENT');

-- User: dollars (float) -> cents (int), plus Telegram profile fields
ALTER TABLE "User" RENAME COLUMN "balance" TO "balanceCents";
ALTER TABLE "User" ALTER COLUMN "balanceCents" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "balanceCents" TYPE INTEGER USING ROUND("balanceCents" * 100)::INTEGER;
ALTER TABLE "User" ALTER COLUMN "balanceCents" SET DEFAULT 0;
ALTER TABLE "User"
  ADD COLUMN "allowsWriteToPm" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isPremium" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "languageCode" TEXT,
  ADD COLUMN "lastSeenAt" TIMESTAMP(3),
  ADD COLUMN "photoUrl" TEXT;

-- Dataset: reward was already in cents, only the name changes
ALTER TABLE "Dataset" RENAME COLUMN "reward" TO "rewardCents";

ALTER TABLE "Dataset" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Dataset" ALTER COLUMN "status" TYPE "DatasetStatus" USING (
  CASE UPPER("status")
    WHEN 'ACTIVE' THEN 'ACTIVE'
    WHEN 'COMPLETED' THEN 'COMPLETED'
    ELSE 'PAUSED'
  END
)::"DatasetStatus";
ALTER TABLE "Dataset" ALTER COLUMN "status" SET DEFAULT 'PAUSED';

ALTER TABLE "Dataset" ALTER COLUMN "dataType" TYPE "DataType" USING (
  CASE UPPER("dataType") WHEN 'IMAGE' THEN 'IMAGE' ELSE 'TEXT' END
)::"DataType";

-- Task
ALTER TABLE "Task" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "TaskStatus" USING (
  CASE UPPER("status") WHEN 'COMPLETED' THEN 'COMPLETED' ELSE 'ACTIVE' END
)::"TaskStatus";
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
ALTER TABLE "Task"
  ADD COLUMN "agreement" DOUBLE PRECISION,
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "consensusLabel" TEXT;

-- Vote
ALTER TABLE "Vote" ADD COLUMN "rewardCents" INTEGER NOT NULL DEFAULT 0;

-- Ledger
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "datasetId" TEXT,
    "voteId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- Opening balances, so balanceCents always equals the sum of the ledger.
INSERT INTO "LedgerEntry" ("id", "userId", "type", "amountCents", "note")
SELECT gen_random_uuid()::TEXT, "id", 'ADJUSTMENT', "balanceCents", 'Opening balance (migrated)'
FROM "User"
WHERE "balanceCents" <> 0;

-- Indexes
DROP INDEX "Task_datasetId_idx";
DROP INDEX "Task_status_collectedVotes_idx";
CREATE INDEX "Task_datasetId_status_collectedVotes_idx" ON "Task"("datasetId", "status", "collectedVotes");
CREATE INDEX "Dataset_status_createdAt_idx" ON "Dataset"("status", "createdAt");
CREATE INDEX "Vote_taskId_idx" ON "Vote"("taskId");
CREATE INDEX "LedgerEntry_userId_createdAt_idx" ON "LedgerEntry"("userId", "createdAt");
CREATE INDEX "LedgerEntry_datasetId_idx" ON "LedgerEntry"("datasetId");

-- Foreign keys
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
