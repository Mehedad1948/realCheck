/*
  Warnings:

  - You are about to drop the column `options` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `reward` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Task` table. All the data in the column will be lost.
  - Added the required column `dataType` to the `Dataset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question` to the `Dataset` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Dataset" ADD COLUMN     "dataType" TEXT NOT NULL,
ADD COLUMN     "options" TEXT[],
ADD COLUMN     "question" TEXT NOT NULL,
ADD COLUMN     "reward" INTEGER NOT NULL DEFAULT 50;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "options",
DROP COLUMN "question",
DROP COLUMN "reward",
DROP COLUMN "type";
