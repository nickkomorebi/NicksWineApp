-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Wine" ADD COLUMN     "deletedAt" TIMESTAMP(3);
