-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "Lane" AS ENUM ('REVENUE', 'ASSET', 'LEVERAGE', 'HEALTH');

-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('DEEP_WORK', 'EXECUTION', 'IBM', 'HEALTH', 'REVIEW', 'BUILDER', 'FAMILY');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('DEEP', 'EXECUTION', 'ADMIN', 'SOCIAL', 'RECOVERY');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('BACKLOG', 'SCHEDULED', 'DONE', 'BUMPED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BlockCompletionState" AS ENUM ('OPEN', 'COMPLETED', 'PARTIAL', 'SKIPPED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyConstraint" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "lane" "Lane" NOT NULL,
    "minimumMinutes" INTEGER NOT NULL,
    "minimumSessions" INTEGER NOT NULL,

    CONSTRAINT "WeeklyConstraint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyIntent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mustAdvanceRevenue" BOOLEAN NOT NULL DEFAULT true,
    "mustExecuteDeepWork" BOOLEAN NOT NULL DEFAULT true,
    "mustTrain" BOOLEAN NOT NULL DEFAULT true,
    "mustProtectFamily" BOOLEAN NOT NULL DEFAULT true,
    "reflectionNotes" TEXT,
    "ibmFollowUpDone" BOOLEAN NOT NULL DEFAULT false,
    "ibmOutreachDone" BOOLEAN NOT NULL DEFAULT false,
    "ibmDeepDiveDone" BOOLEAN NOT NULL DEFAULT false,
    "ibmRelationshipDone" BOOLEAN NOT NULL DEFAULT false,
    "weekOutcome1" TEXT,
    "weekOutcome2" TEXT,
    "weekOutcome3" TEXT,

    CONSTRAINT "DailyIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeBlockTemplate" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "type" "BlockType" NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TimeBlockTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeBlockInstance" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "type" "BlockType" NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "objective" TEXT,
    "parkingLotNotes" TEXT,
    "completionState" "BlockCompletionState" NOT NULL DEFAULT 'OPEN',
    "completionReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "energyRating" INTEGER,

    CONSTRAINT "TimeBlockInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "lane" "Lane" NOT NULL,
    "workType" "WorkType" NOT NULL,
    "project" TEXT NOT NULL,
    "impactScore" INTEGER NOT NULL,
    "effortMins" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'BACKLOG',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "actualMinutes" INTEGER,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskStep" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledTask" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "timeBlockInstanceId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "allocatedMinutes" INTEGER,
    "actualMinutes" INTEGER,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ScheduledTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scorecard" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "weekStartDate" DATE NOT NULL,
    "revenueScore" INTEGER NOT NULL DEFAULT 0,
    "assetScore" INTEGER NOT NULL DEFAULT 0,
    "leverageScore" INTEGER NOT NULL DEFAULT 0,
    "healthScore" INTEGER NOT NULL DEFAULT 0,
    "discipline" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Scorecard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_userId_workspaceId_key" ON "WorkspaceMember"("userId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyConstraint_workspaceId_lane_key" ON "WeeklyConstraint"("workspaceId", "lane");

-- CreateIndex
CREATE UNIQUE INDEX "DailyIntent_workspaceId_date_key" ON "DailyIntent"("workspaceId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledTask_taskId_timeBlockInstanceId_key" ON "ScheduledTask"("taskId", "timeBlockInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Scorecard_workspaceId_weekStartDate_key" ON "Scorecard"("workspaceId", "weekStartDate");

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyConstraint" ADD CONSTRAINT "WeeklyConstraint_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyIntent" ADD CONSTRAINT "DailyIntent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeBlockTemplate" ADD CONSTRAINT "TimeBlockTemplate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeBlockInstance" ADD CONSTRAINT "TimeBlockInstance_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskStep" ADD CONSTRAINT "TaskStep_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledTask" ADD CONSTRAINT "ScheduledTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledTask" ADD CONSTRAINT "ScheduledTask_timeBlockInstanceId_fkey" FOREIGN KEY ("timeBlockInstanceId") REFERENCES "TimeBlockInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scorecard" ADD CONSTRAINT "Scorecard_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

