-- Quality control for distributed labeling:
--   * per-evaluator trust estimated from golden answers (replaces the +1/-2 reputation counter)
--   * adaptive overlap: tasks escalate from requiredVotes up to maxVotes when votes disagree
--   * DISPUTED tasks for items evaluators still disagree on at the cap
--   * task leases, so a vote slot is never handed to more evaluators than it needs
--   * answer timing, to spot answers too fast to be real

-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'DISPUTED';

-- User
ALTER TABLE "User" ADD COLUMN     "goldAnswered" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastGoldCorrect" BOOLEAN,
ADD COLUMN     "trust" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
ALTER COLUMN "reputation" SET DEFAULT 75;

-- Dataset
ALTER TABLE "Dataset" ADD COLUMN     "maxVotes" INTEGER NOT NULL DEFAULT 4;
UPDATE "Dataset" SET "maxVotes" = LEAST("requiredVotes" + 2, 50);

-- Task
ALTER TABLE "Task" ADD COLUMN     "confidence" DOUBLE PRECISION,
ADD COLUMN     "targetVotes" INTEGER NOT NULL DEFAULT 2;
UPDATE "Task" t SET "targetVotes" = d."requiredVotes" FROM "Dataset" d WHERE d.id = t."datasetId";

-- Vote
ALTER TABLE "Vote" ADD COLUMN     "responseMs" INTEGER;

-- Trust from each evaluator's last 50 golden answers, with a Beta(3, 1) prior.
-- Keep in sync with services/trust.ts.
WITH recent AS (
  SELECT "userId", "isCorrect", "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt" DESC) AS rn
  FROM "Vote"
  WHERE "isCorrect" IS NOT NULL
),
stats AS (
  SELECT "userId",
    COUNT(*) FILTER (WHERE rn <= 50) AS window_total,
    COUNT(*) FILTER (WHERE rn <= 50 AND "isCorrect") AS window_correct,
    COUNT(*) AS total,
    BOOL_OR("isCorrect") FILTER (WHERE rn = 1) AS last_correct
  FROM recent
  GROUP BY "userId"
)
UPDATE "User" u SET
  "goldAnswered" = s.total,
  "lastGoldCorrect" = s.last_correct,
  "trust" = (s.window_correct + 3.0) / (s.window_total + 4.0)
FROM stats s
WHERE s."userId" = u.id;

UPDATE "User" SET "reputation" = ROUND("trust" * 100);

-- TaskAssignment
CREATE TABLE "TaskAssignment" (
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("taskId","userId")
);

-- CreateIndex
CREATE INDEX "TaskAssignment_userId_idx" ON "TaskAssignment"("userId");

-- CreateIndex
CREATE INDEX "Vote_userId_createdAt_idx" ON "Vote"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
