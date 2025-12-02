-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "imageUrls" TEXT[];

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" DROP DEFAULT;
