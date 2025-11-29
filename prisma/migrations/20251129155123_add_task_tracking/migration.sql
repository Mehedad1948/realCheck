-- AlterTable
ALTER TABLE "Dataset" ADD COLUMN     "requiredVotes" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "collectedVotes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "Task_status_collectedVotes_idx" ON "Task"("status", "collectedVotes");
