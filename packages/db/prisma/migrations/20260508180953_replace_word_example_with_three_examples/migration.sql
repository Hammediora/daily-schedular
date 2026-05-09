/*
  Warnings:

  - You are about to drop the column `wordExample` on the `DailyContent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DailyContent" DROP COLUMN "wordExample",
ADD COLUMN     "wordBusiness" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "wordCasual" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "wordTechnical" TEXT NOT NULL DEFAULT '';
