-- AlterEnum
ALTER TYPE "SavedContentType" ADD VALUE 'STORAGE';

-- AlterTable
ALTER TABLE "DailyContent" ADD COLUMN     "storageConceptExplanation" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "storageConceptTitle" TEXT NOT NULL DEFAULT '';
