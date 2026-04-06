import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Re-export enums and types used across the app
export {
    BlockType,
    BlockCompletionState,
    WorkType,
    Lane,
    TaskStatus,
    Prisma,
    type Task,
    type TimeBlockInstance,
    type TimeBlockTemplate,
    type ScheduledTask,
    type DailyIntent,
    type WeeklyConstraint,
    type Workspace,
    type TaskStep,
} from '@prisma/client'

/** TimeBlockInstance with scheduledTasks and nested task — the standard query shape */
export type TimeBlockInstanceWithTasks = Prisma.TimeBlockInstanceGetPayload<{
    include: { scheduledTasks: { include: { task: true } } }
}>
