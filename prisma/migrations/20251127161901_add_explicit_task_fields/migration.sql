/*
  Warnings:

  - You are about to drop the column `textContent` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "textContent",
ADD COLUMN     "text_content" TEXT;
