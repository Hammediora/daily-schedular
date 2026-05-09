-- CreateEnum
CREATE TYPE "SavedContentType" AS ENUM ('WORD', 'TECH', 'QUOTE', 'MENTAL_MODEL', 'POEM');

-- CreateTable
CREATE TABLE "DailyContent" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "word" TEXT NOT NULL,
    "wordDefinition" TEXT NOT NULL,
    "wordExample" TEXT NOT NULL,
    "techTip" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "quoteAuthor" TEXT NOT NULL,
    "mentalModel" TEXT NOT NULL,
    "mentalModelExplanation" TEXT NOT NULL,
    "poem" TEXT NOT NULL,
    "poemTitle" TEXT NOT NULL,
    "poemAuthor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedContent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" "SavedContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyContent_date_key" ON "DailyContent"("date");

-- AddForeignKey
ALTER TABLE "SavedContent" ADD CONSTRAINT "SavedContent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
