"use server";

import { db, Lane, WorkType, BlockType } from "@operator-os/db";
import { Scheduler } from "@operator-os/core";
import { revalidatePath } from "next/cache";

// ─── SHARED TYPES & VALIDATION ──────────────────────────────────────────────

type ActionResult = { success: true } | { success: false; error: string };

function assertNonEmpty(value: string | undefined | null, label: string): asserts value is string {
    if (!value || value.trim().length === 0) {
        throw new Error(`${label} is required`);
    }
}

function assertValidLane(value: string): asserts value is Lane {
    if (!Object.values(Lane).includes(value as Lane)) {
        throw new Error(`Invalid lane: ${value}`);
    }
}

function assertValidWorkType(value: string): asserts value is WorkType {
    if (!Object.values(WorkType).includes(value as WorkType)) {
        throw new Error(`Invalid work type: ${value}`);
    }
}

function assertValidBlockType(value: string): asserts value is BlockType {
    if (!Object.values(BlockType).includes(value as BlockType)) {
        throw new Error(`Invalid block type: ${value}`);
    }
}

// ─── TASK ACTIONS ─────────────────────────────────────────────────────────────

export async function completeTaskAction(taskId: string, actualMinutes?: number): Promise<ActionResult> {
    try {
        assertNonEmpty(taskId, "Task ID");
        await db.task.update({
            where: { id: taskId },
            data: {
                status: "DONE",
                completedAt: new Date(),
                ...(actualMinutes != null ? { actualMinutes } : {}),
            }
        });
        revalidatePath("/");
        revalidatePath("/tasks");
        revalidatePath("/now");
        revalidatePath("/weekly");
        return { success: true };
    } catch (error) {
        console.error("completeTaskAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function uncompleteTaskAction(taskId: string): Promise<ActionResult> {
    try {
        assertNonEmpty(taskId, "Task ID");
        await db.task.update({
            where: { id: taskId },
            data: { status: "SCHEDULED", completedAt: null }
        });
        revalidatePath("/");
        revalidatePath("/tasks");
        revalidatePath("/weekly");
        return { success: true };
    } catch (error) {
        console.error("uncompleteTaskAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
    try {
        assertNonEmpty(taskId, "Task ID");
        await db.scheduledTask.deleteMany({ where: { taskId } });
        await db.task.delete({ where: { id: taskId } });
        revalidatePath("/");
        revalidatePath("/tasks");
        return { success: true };
    } catch (error) {
        console.error("deleteTaskAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function createTaskAction(data: {
    title: string;
    lane: string;
    workType: string;
    project: string;
    impactScore: number;
    effortMins: number;
    deadline?: string;
    notes?: string;
}): Promise<ActionResult> {
    try {
        assertNonEmpty(data.title, "Title");
        assertNonEmpty(data.project, "Project");
        assertValidLane(data.lane);
        assertValidWorkType(data.workType);

        const workspace = await db.workspace.findFirst();
        if (!workspace) throw new Error("No workspace found");

        await db.task.create({
            data: {
                workspaceId: workspace.id,
                title: data.title,
                notes: data.notes,
                lane: data.lane as Lane,
                workType: data.workType as WorkType,
                project: data.project,
                impactScore: data.impactScore,
                effortMins: data.effortMins,
                deadline: data.deadline ? new Date(data.deadline) : undefined,
                status: "BACKLOG",
            }
        });

        revalidatePath("/");
        revalidatePath("/tasks");
        return { success: true };
    } catch (error) {
        console.error("createTaskAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function editTaskAction(taskId: string, data: {
    title: string;
    lane: string;
    workType: string;
    project: string;
    impactScore: number;
    effortMins: number;
    deadline?: string;
    notes?: string;
}): Promise<ActionResult> {
    try {
        assertNonEmpty(taskId, "Task ID");
        assertNonEmpty(data.title, "Title");
        assertValidLane(data.lane);
        assertValidWorkType(data.workType);

        await db.task.update({
            where: { id: taskId },
            data: {
                title: data.title,
                notes: data.notes,
                lane: data.lane as Lane,
                workType: data.workType as WorkType,
                project: data.project,
                impactScore: data.impactScore,
                effortMins: data.effortMins,
                deadline: data.deadline ? new Date(data.deadline) : null,
            }
        });

        revalidatePath("/");
        revalidatePath("/tasks");
        return { success: true };
    } catch (error) {
        console.error("editTaskAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

// ─── DAILY INTENT ACTIONS ─────────────────────────────────────────────────────

export async function updateDailyIntentAction(data: {
    mustAdvanceRevenue: boolean;
    mustExecuteDeepWork: boolean;
    mustTrain: boolean;
    mustProtectFamily: boolean;
    reflectionNotes?: string;
}): Promise<ActionResult> {
    try {
        const workspace = await db.workspace.findFirst();
        if (!workspace) throw new Error("No workspace");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await db.dailyIntent.upsert({
            where: { workspaceId_date: { workspaceId: workspace.id, date: today } },
            update: data,
            create: { workspaceId: workspace.id, date: today, ...data },
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("updateDailyIntentAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

// ─── WEEKLY CONSTRAINT ACTIONS ────────────────────────────────────────────────

export async function updateWeeklyConstraintAction(data: {
    lane: string;
    minimumMinutes: number;
    minimumSessions: number;
}): Promise<ActionResult> {
    try {
        assertValidLane(data.lane);

        const workspace = await db.workspace.findFirst();
        if (!workspace) throw new Error("No workspace");

        await db.weeklyConstraint.upsert({
            where: { workspaceId_lane: { workspaceId: workspace.id, lane: data.lane as Lane } },
            update: { minimumMinutes: data.minimumMinutes, minimumSessions: data.minimumSessions },
            create: {
                workspaceId: workspace.id,
                lane: data.lane as Lane,
                minimumMinutes: data.minimumMinutes,
                minimumSessions: data.minimumSessions,
            }
        });

        revalidatePath("/");
        revalidatePath("/settings");
        revalidatePath("/scorecard");
        return { success: true };
    } catch (error) {
        console.error("updateWeeklyConstraintAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

// ─── BLOCK TEMPLATE ACTIONS ────────────────────────────────────────────────────

export async function createBlockTemplateAction(data: {
    title: string;
    dayOfWeek: number;
    startMinute: number;
    durationMinutes: number;
    type: string;
    isLocked: boolean;
}): Promise<ActionResult> {
    try {
        assertNonEmpty(data.title, "Title");
        assertValidBlockType(data.type);

        const workspace = await db.workspace.findFirst();
        if (!workspace) throw new Error("No workspace");

        await db.timeBlockTemplate.create({
            data: {
                workspaceId: workspace.id,
                title: data.title,
                dayOfWeek: data.dayOfWeek,
                startMinute: data.startMinute,
                durationMinutes: data.durationMinutes,
                type: data.type as BlockType,
                isLocked: data.isLocked,
            }
        });

        revalidatePath("/settings/templates");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("createBlockTemplateAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function deleteBlockTemplateAction(templateId: string): Promise<ActionResult> {
    try {
        assertNonEmpty(templateId, "Template ID");
        await db.timeBlockTemplate.delete({ where: { id: templateId } });
        revalidatePath("/settings/templates");
        return { success: true };
    } catch (error) {
        console.error("deleteBlockTemplateAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

// ─── END OF DAY REVIEW ────────────────────────────────────────────────────────

export async function submitDailyReviewAction(reflectionNotes: string): Promise<ActionResult> {
    try {
        const workspace = await db.workspace.findFirst();
        if (!workspace) throw new Error("No workspace");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await db.dailyIntent.upsert({
            where: { workspaceId_date: { workspaceId: workspace.id, date: today } },
            update: { reflectionNotes },
            create: {
                workspaceId: workspace.id,
                date: today,
                mustAdvanceRevenue: true,
                mustExecuteDeepWork: true,
                mustTrain: true,
                mustProtectFamily: true,
                reflectionNotes,
            }
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("submitDailyReviewAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

// ─── BLOCK DETAIL ACTIONS ──────────────────────────────────────────────────────

export async function updateBlockObjectiveAction(blockId: string, objective: string): Promise<ActionResult> {
    try {
        assertNonEmpty(blockId, "Block ID");
        await db.timeBlockInstance.update({
            where: { id: blockId },
            data: { objective },
        });
        revalidatePath("/");
        revalidatePath("/now");
        revalidatePath("/weekly");
        return { success: true };
    } catch (error) {
        console.error("updateBlockObjectiveAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function updateBlockParkingLotAction(blockId: string, parkingLotNotes: string): Promise<ActionResult> {
    try {
        assertNonEmpty(blockId, "Block ID");
        await db.timeBlockInstance.update({
            where: { id: blockId },
            data: { parkingLotNotes },
        });
        revalidatePath("/");
        revalidatePath("/now");
        revalidatePath("/weekly");
        return { success: true };
    } catch (error) {
        console.error("updateBlockParkingLotAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function completeBlockAction(
    blockId: string,
    completionState: "COMPLETED" | "PARTIAL" | "SKIPPED" = "COMPLETED",
    completionReason?: string,
): Promise<ActionResult> {
    try {
        assertNonEmpty(blockId, "Block ID");
        const block = await db.timeBlockInstance.findUnique({
            where: { id: blockId },
            include: { scheduledTasks: { include: { task: true } } },
        });
        if (!block) return { success: false, error: "Block not found" };

        // For SKIPPED: ALL tasks go back to backlog
        // For COMPLETED/PARTIAL: only incomplete tasks go back
        const tasksToReturn = completionState === "SKIPPED"
            ? block.scheduledTasks
            : block.scheduledTasks.filter((st) => st.task.status !== "DONE");

        if (tasksToReturn.length > 0) {
            const taskIds = tasksToReturn.map((st) => st.taskId);
            const stIds = tasksToReturn.map((st) => st.id);

            await db.task.updateMany({
                where: { id: { in: taskIds } },
                data: { status: "BACKLOG" },
            });

            await db.scheduledTask.deleteMany({
                where: { id: { in: stIds } },
            });
        }

        // Record completion state on the block
        await db.timeBlockInstance.update({
            where: { id: blockId },
            data: {
                completionState,
                completionReason: completionReason ?? null,
                completedAt: new Date(),
            },
        });

        revalidatePath("/");
        revalidatePath("/now");
        revalidatePath("/tasks");
        revalidatePath("/weekly");
        return { success: true };
    } catch (error) {
        console.error("completeBlockAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function setBlockEnergyRatingAction(
    blockId: string,
    rating: number,
): Promise<ActionResult> {
    try {
        assertNonEmpty(blockId, "Block ID");
        if (rating < 1 || rating > 3) throw new Error("Rating must be 1-3");
        await db.timeBlockInstance.update({
            where: { id: blockId },
            data: { energyRating: rating },
        });
        revalidatePath("/");
        revalidatePath("/now");
        return { success: true };
    } catch (error) {
        console.error("setBlockEnergyRatingAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function bumpTaskAction(taskId: string): Promise<ActionResult> {
    try {
        assertNonEmpty(taskId, "Task ID");

        // Remove all scheduled entries for this task
        await db.scheduledTask.deleteMany({ where: { taskId } });

        // Set task back to BACKLOG for rescheduling
        await db.task.update({
            where: { id: taskId },
            data: { status: "BACKLOG" },
        });

        revalidatePath("/");
        revalidatePath("/now");
        revalidatePath("/tasks");
        revalidatePath("/weekly");
        return { success: true };
    } catch (error) {
        console.error("bumpTaskAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function reorderTaskInBlockAction(
    scheduledTaskId: string,
    direction: "up" | "down"
): Promise<ActionResult> {
    try {
        assertNonEmpty(scheduledTaskId, "Scheduled Task ID");

        const current = await db.scheduledTask.findUnique({
            where: { id: scheduledTaskId },
        });
        if (!current) return { success: false, error: "Scheduled task not found" };

        // Get all tasks in the same block, ordered
        const blockTasks = await db.scheduledTask.findMany({
            where: { timeBlockInstanceId: current.timeBlockInstanceId },
            orderBy: { orderIndex: "asc" },
        });

        const currentIdx = blockTasks.findIndex(t => t.id === scheduledTaskId);
        const swapIdx = direction === "up" ? currentIdx - 1 : currentIdx + 1;

        if (swapIdx < 0 || swapIdx >= blockTasks.length) {
            return { success: false, error: "Cannot move further" };
        }

        const swapTarget = blockTasks[swapIdx];

        // Swap orderIndex values
        await db.$transaction([
            db.scheduledTask.update({
                where: { id: current.id },
                data: { orderIndex: swapTarget.orderIndex },
            }),
            db.scheduledTask.update({
                where: { id: swapTarget.id },
                data: { orderIndex: current.orderIndex },
            }),
        ]);

        revalidatePath("/");
        revalidatePath("/now");
        revalidatePath("/weekly");
        return { success: true };
    } catch (error) {
        console.error("reorderTaskInBlockAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

// ─── TASK STEP ACTIONS ────────────────────────────────────────────────────────

export async function createTaskStepAction(taskId: string, description: string): Promise<ActionResult> {
    try {
        assertNonEmpty(taskId, "Task ID");
        assertNonEmpty(description, "Description");

        const count = await db.taskStep.count({ where: { taskId } });

        await db.taskStep.create({
            data: {
                taskId,
                description,
                isComplete: false,
                orderIndex: count,
            }
        });

        revalidatePath("/");
        revalidatePath("/now");
        return { success: true };
    } catch (error) {
        console.error("createTaskStepAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function toggleTaskStepAction(stepId: string, isComplete: boolean): Promise<ActionResult> {
    try {
        assertNonEmpty(stepId, "Step ID");
        await db.taskStep.update({
            where: { id: stepId },
            data: { isComplete },
        });
        revalidatePath("/");
        revalidatePath("/now");
        return { success: true };
    } catch (error) {
        console.error("toggleTaskStepAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function deleteTaskStepAction(stepId: string): Promise<ActionResult> {
    try {
        assertNonEmpty(stepId, "Step ID");
        await db.taskStep.delete({ where: { id: stepId } });
        revalidatePath("/");
        revalidatePath("/now");
        return { success: true };
    } catch (error) {
        console.error("deleteTaskStepAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

// ─── IBM CHECKLIST ACTIONS ────────────────────────────────────────────────────

export async function updateIbmChecklistAction(
    field: "ibmFollowUpDone" | "ibmOutreachDone" | "ibmDeepDiveDone" | "ibmRelationshipDone",
    value: boolean
): Promise<ActionResult> {
    try {
        const validFields = ["ibmFollowUpDone", "ibmOutreachDone", "ibmDeepDiveDone", "ibmRelationshipDone"] as const;
        if (!validFields.includes(field)) {
            throw new Error(`Unknown IBM field: ${field}`);
        }

        const workspace = await db.workspace.findFirst();
        if (!workspace) throw new Error("No workspace");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await db.dailyIntent.upsert({
            where: { workspaceId_date: { workspaceId: workspace.id, date: today } },
            update: { [field]: value },
            create: {
                workspaceId: workspace.id,
                date: today,
                mustAdvanceRevenue: true,
                mustExecuteDeepWork: true,
                mustTrain: true,
                mustProtectFamily: true,
                [field]: value,
            },
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("updateIbmChecklistAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

// ─── AUTO-RESCHEDULE ACTION ─────────────────────────────────────────────────

export async function autoRescheduleAction(workspaceId: string): Promise<ActionResult & { rescheduledCount?: number }> {
    try {
        assertNonEmpty(workspaceId, "Workspace ID");

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

        const backlogTasks = await db.task.findMany({
            where: { workspaceId, status: "BACKLOG" },
        });

        if (backlogTasks.length === 0) {
            return { success: true, rescheduledCount: 0 };
        }

        // Get remaining non-past, OPEN blocks today
        const remainingBlocks = await db.timeBlockInstance.findMany({
            where: {
                workspaceId,
                date: today,
                completionState: "OPEN",
            },
            include: {
                scheduledTasks: { select: { allocatedMinutes: true } },
            },
        });

        // Filter to blocks that haven't ended yet
        const futureBlocks = remainingBlocks.filter(
            b => b.startMinute + b.durationMinutes > nowMinutes
        );

        if (futureBlocks.length === 0) {
            return { success: true, rescheduledCount: 0 };
        }

        // Create virtual blocks with remaining capacity
        const blocksWithCapacity = futureBlocks.map(b => {
            const usedMinutes = b.scheduledTasks.reduce(
                (sum, st) => sum + (st.allocatedMinutes ?? 0), 0
            );
            return {
                ...b,
                durationMinutes: Math.max(0, b.durationMinutes - usedMinutes),
            };
        }).filter(b => b.durationMinutes > 0);

        const placements = Scheduler.computeSchedule({
            backlogTasks,
            availableBlocks: blocksWithCapacity,
            timezone: "America/Chicago",
        });

        if (placements.length === 0) {
            return { success: true, rescheduledCount: 0 };
        }

        // Deduplicate against existing
        const existingPairs = new Set(
            futureBlocks.flatMap(b =>
                (b as { scheduledTasks: { taskId?: string; timeBlockInstanceId?: string }[] })
                    .scheduledTasks?.map?.(() => "") ?? []
            )
        );

        // Fetch actual existing for dedup
        const existingScheduled = await db.scheduledTask.findMany({
            where: {
                timeBlockInstanceId: { in: futureBlocks.map(b => b.id) },
            },
            select: { taskId: true, timeBlockInstanceId: true },
        });

        const existingSet = new Set(
            existingScheduled.map(s => `${s.taskId}__${s.timeBlockInstanceId}`)
        );

        const newPlacements = placements.filter(
            p => !existingSet.has(`${p.taskId}__${p.timeBlockInstanceId}`)
        );

        if (newPlacements.length > 0) {
            await db.$transaction(
                newPlacements.map(p => db.scheduledTask.create({
                    data: {
                        taskId: p.taskId,
                        timeBlockInstanceId: p.timeBlockInstanceId,
                        allocatedMinutes: p.allocatedMinutes,
                        orderIndex: p.orderIndex,
                    },
                }))
            );

            await db.task.updateMany({
                where: { id: { in: newPlacements.map(p => p.taskId) } },
                data: { status: "SCHEDULED" },
            });
        }

        revalidatePath("/");
        revalidatePath("/now");
        revalidatePath("/tasks");
        revalidatePath("/weekly");
        return { success: true, rescheduledCount: newPlacements.length };
    } catch (error) {
        console.error("autoRescheduleAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

// ─── AUTO-REBALANCE ACTION (FIX PLAN) ───────────────────────────────────────

export async function autoRebalanceAction(): Promise<ActionResult & { tasksScheduled?: number; message?: string }> {
    try {
        const workspace = await db.workspace.findFirst();
        if (!workspace) throw new Error("No workspace");

        const today = new Date();
        const nowMinutes = today.getHours() * 60 + today.getMinutes();

        // Calculate week boundaries
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const todayDate = new Date(today);
        todayDate.setHours(0, 0, 0, 0);

        // Get constraints and completed work
        const [constraints, doneTasks] = await Promise.all([
            db.weeklyConstraint.findMany({ where: { workspaceId: workspace.id } }),
            db.task.findMany({
                where: { workspaceId: workspace.id, status: "DONE", completedAt: { gte: weekStart, lt: weekEnd } },
                select: { lane: true, effortMins: true },
            }),
        ]);

        // Find deficit lanes
        const lanes = ["REVENUE", "ASSET", "LEVERAGE", "HEALTH"] as const;
        const deficitLanes = lanes.filter(lane => {
            const c = constraints.find(x => x.lane === lane);
            const required = c?.minimumMinutes ?? 300;
            const completed = doneTasks.filter(t => t.lane === lane).reduce((s, t) => s + t.effortMins, 0);
            return completed < required;
        });

        if (deficitLanes.length === 0) {
            return { success: true, tasksScheduled: 0, message: "All lanes on track" };
        }

        // Get backlog tasks for deficit lanes
        const backlogTasks = await db.task.findMany({
            where: {
                workspaceId: workspace.id,
                status: "BACKLOG",
                lane: { in: deficitLanes as unknown as Lane[] },
            },
        });

        if (backlogTasks.length === 0) {
            return { success: true, tasksScheduled: 0, message: "No backlog tasks for deficit lanes" };
        }

        // Get remaining OPEN blocks this week
        const remainingBlocks = await db.timeBlockInstance.findMany({
            where: {
                workspaceId: workspace.id,
                date: { gte: todayDate, lt: weekEnd },
                completionState: "OPEN",
            },
            include: {
                scheduledTasks: { select: { allocatedMinutes: true } },
            },
        });

        // Filter to future blocks (for today check time, for future days include all)
        const futureBlocks = remainingBlocks.filter(b => {
            const blockDate = new Date(b.date);
            blockDate.setHours(0, 0, 0, 0);
            if (blockDate.getTime() === todayDate.getTime()) {
                return b.startMinute + b.durationMinutes > nowMinutes;
            }
            return true;
        });

        // Subtract used capacity
        const blocksWithCapacity = futureBlocks.map(b => {
            const usedMinutes = b.scheduledTasks.reduce(
                (sum, st) => sum + (st.allocatedMinutes ?? 0), 0
            );
            return {
                ...b,
                durationMinutes: Math.max(0, b.durationMinutes - usedMinutes),
            };
        }).filter(b => b.durationMinutes > 0);

        const placements = Scheduler.computeSchedule({
            backlogTasks,
            availableBlocks: blocksWithCapacity,
            timezone: workspace.timezone,
        });

        if (placements.length === 0) {
            return { success: true, tasksScheduled: 0, message: "No compatible blocks available" };
        }

        // Deduplicate
        const existingScheduled = await db.scheduledTask.findMany({
            where: {
                timeBlockInstanceId: { in: futureBlocks.map(b => b.id) },
            },
            select: { taskId: true, timeBlockInstanceId: true },
        });
        const existingSet = new Set(
            existingScheduled.map(s => `${s.taskId}__${s.timeBlockInstanceId}`)
        );
        const newPlacements = placements.filter(
            p => !existingSet.has(`${p.taskId}__${p.timeBlockInstanceId}`)
        );

        if (newPlacements.length > 0) {
            await db.$transaction(
                newPlacements.map(p => db.scheduledTask.create({
                    data: {
                        taskId: p.taskId,
                        timeBlockInstanceId: p.timeBlockInstanceId,
                        allocatedMinutes: p.allocatedMinutes,
                        orderIndex: p.orderIndex,
                    },
                }))
            );

            await db.task.updateMany({
                where: { id: { in: newPlacements.map(p => p.taskId) } },
                data: { status: "SCHEDULED" },
            });
        }

        revalidatePath("/");
        revalidatePath("/weekly");
        revalidatePath("/plan");
        revalidatePath("/scorecard");
        return {
            success: true,
            tasksScheduled: newPlacements.length,
            message: `${newPlacements.length} tasks scheduled into remaining blocks`,
        };
    } catch (error) {
        console.error("autoRebalanceAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

// ─── WEEKLY PLAN ACTIONS ────────────────────────────────────────────────────

export async function updateWeekOutcomesAction(
    outcome1: string,
    outcome2: string,
    outcome3: string,
): Promise<ActionResult> {
    try {
        const workspace = await db.workspace.findFirst();
        if (!workspace) throw new Error("No workspace");

        // Store on next Monday's DailyIntent
        const today = new Date();
        const dayOfWeek = today.getDay();
        const offsetDays = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + offsetDays);
        nextMonday.setHours(0, 0, 0, 0);

        await db.dailyIntent.upsert({
            where: { workspaceId_date: { workspaceId: workspace.id, date: nextMonday } },
            create: {
                workspaceId: workspace.id,
                date: nextMonday,
                weekOutcome1: outcome1 || null,
                weekOutcome2: outcome2 || null,
                weekOutcome3: outcome3 || null,
            },
            update: {
                weekOutcome1: outcome1 || null,
                weekOutcome2: outcome2 || null,
                weekOutcome3: outcome3 || null,
            },
        });

        revalidatePath("/plan");
        return { success: true };
    } catch (error) {
        console.error("updateWeekOutcomesAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function lockTaskToBlockAction(
    taskId: string,
    blockInstanceId: string,
): Promise<ActionResult> {
    try {
        assertNonEmpty(taskId, "Task ID");
        assertNonEmpty(blockInstanceId, "Block Instance ID");

        await db.scheduledTask.upsert({
            where: { taskId_timeBlockInstanceId: { taskId, timeBlockInstanceId: blockInstanceId } },
            create: {
                taskId,
                timeBlockInstanceId: blockInstanceId,
                orderIndex: 0,
                isLocked: true,
            },
            update: { isLocked: true },
        });

        await db.task.update({
            where: { id: taskId },
            data: { status: "SCHEDULED" },
        });

        revalidatePath("/plan");
        revalidatePath("/weekly");
        return { success: true };
    } catch (error) {
        console.error("lockTaskToBlockAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function unlockTaskFromBlockAction(
    scheduledTaskId: string,
): Promise<ActionResult> {
    try {
        assertNonEmpty(scheduledTaskId, "Scheduled Task ID");

        const st = await db.scheduledTask.findUnique({
            where: { id: scheduledTaskId },
        });
        if (!st) return { success: false, error: "Scheduled task not found" };

        await db.scheduledTask.delete({ where: { id: scheduledTaskId } });

        // Check if task has other placements
        const remaining = await db.scheduledTask.count({
            where: { taskId: st.taskId },
        });

        if (remaining === 0) {
            await db.task.update({
                where: { id: st.taskId },
                data: { status: "BACKLOG" },
            });
        }

        revalidatePath("/plan");
        revalidatePath("/weekly");
        return { success: true };
    } catch (error) {
        console.error("unlockTaskFromBlockAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}
