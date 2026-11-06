-- Evaluator payouts:
--   * ledger buckets: rewards wait in PENDING for a hold period before becoming AVAILABLE
--   * platform fee charged to dataset owners on top of each reward
--   * clawback of unreleased rewards when an evaluator is suspended
--   * TON wallets linked with ton_proof, and withdrawals reviewed by hand
-- Existing entries are all AVAILABLE, matching existing balances, so no backfill is needed.

-- CreateEnum
CREATE TYPE "LedgerBucket" AS ENUM ('AVAILABLE', 'PENDING');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('REQUESTED', 'APPROVED', 'SENDING', 'SENT', 'REJECTED', 'FAILED');

-- AlterEnum

ALTER TYPE "LedgerType" ADD VALUE 'PLATFORM_FEE';
ALTER TYPE "LedgerType" ADD VALUE 'REWARD_RELEASE';
ALTER TYPE "LedgerType" ADD VALUE 'CLAWBACK';
ALTER TYPE "LedgerType" ADD VALUE 'REWARD_REFUND';
ALTER TYPE "LedgerType" ADD VALUE 'WITHDRAWAL';
ALTER TYPE "LedgerType" ADD VALUE 'WITHDRAWAL_REVERSAL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pendingCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "availableAt" TIMESTAMP(3),
ADD COLUMN     "bucket" "LedgerBucket" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "settledAt" TIMESTAMP(3),
ADD COLUMN     "withdrawalId" TEXT;

-- CreateTable
CREATE TABLE "TonWallet" (
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TonWallet_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "asset" TEXT NOT NULL DEFAULT 'USDT',
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'REQUESTED',
    "queryId" BIGSERIAL NOT NULL,
    "txHash" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TonWallet_address_key" ON "TonWallet"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Withdrawal_queryId_key" ON "Withdrawal"("queryId");

-- CreateIndex
CREATE INDEX "Withdrawal_status_createdAt_idx" ON "Withdrawal"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Withdrawal_userId_createdAt_idx" ON "Withdrawal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_userId_bucket_settledAt_idx" ON "LedgerEntry"("userId", "bucket", "settledAt");

-- AddForeignKey
ALTER TABLE "TonWallet" ADD CONSTRAINT "TonWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

