/*
  Warnings:

  - You are about to drop the column `content` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `correctAnswer` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrls` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `isValidation` on the `Task` table. All the data in the column will be lost.
  - You are about to alter the column `reward` on the `Task` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "content",
DROP COLUMN "correctAnswer",
DROP COLUMN "imageUrls",
DROP COLUMN "isValidation",
ADD COLUMN     "correct_answer" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "image_urls" TEXT[],
ADD COLUMN     "is_validation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "text_content" TEXT,
ALTER COLUMN "reward" DROP DEFAULT,
ALTER COLUMN "reward" SET DATA TYPE INTEGER;
