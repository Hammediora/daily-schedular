"use server";

import { db } from "@operator-os/db";
import { revalidatePath } from "next/cache";
import { Scheduler } from "@operator-os/core";

export async function generateWeekScheduleAction() {
    try {
        const workspace = await db.workspace.findFirst();
        if (!workspace) throw new Error("No workspace found");

        // Build Mon–Sun for next week (or this week if before Thursday)
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0=Sun
        // If Sunday, plan next week. Otherwise plan this week from tomorrow.
        const offsetDays = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // days until next Monday
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + offsetDays);
        nextMonday.setHours(0, 0, 0, 0);

        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(nextMonday);
            d.setDate(nextMonday.getDate() + i);
            return d;
        });

        // Get all backlog tasks
        const backlogTasks = await db.task.findMany({
            where: { workspaceId: workspace.id, status: "BACKLOG" },
        });

        let totalBlocksCreated = 0;
        let totalTasksScheduled = 0;

        for (const day of days) {
            const dow = day.getDay();

            // Check if instances already exist for this day
            const existing = await db.timeBlockInstance.findMany({
                where: { workspaceId: workspace.id, date: day },
            });
            if (existing.length > 0) continue; // skip days already planned

            // Get templates for this day of week
            const templates = await db.timeBlockTemplate.findMany({
                where: { workspaceId: workspace.id, dayOfWeek: dow },
            });
            if (templates.length === 0) continue;

            // Create block instances
            await db.timeBlockInstance.createMany({
                data: templates.map(t => ({
                    workspaceId: workspace.id,
                    date: day,
                    startMinute: t.startMinute,
                    durationMinutes: t.durationMinutes,
                    type: t.type,
                    isLocked: t.isLocked,
                })),
            });
            totalBlocksCreated += templates.length;

            // Fetch the created instances to run scheduler
            const instances = await db.timeBlockInstance.findMany({
                where: { workspaceId: workspace.id, date: day },
            });

            // Run scheduler for this day
            const placements = Scheduler.computeSchedule({
                backlogTasks,
                availableBlocks: instances,
                timezone: workspace.timezone,
            });

            if (placements.length > 0) {
                await db.$transaction(
                    placements.map(p =>
                        db.scheduledTask.upsert({
                            where: { taskId_timeBlockInstanceId: { taskId: p.taskId, timeBlockInstanceId: p.timeBlockInstanceId } },
                            create: {
                                taskId: p.taskId,
                                timeBlockInstanceId: p.timeBlockInstanceId,
                                allocatedMinutes: p.allocatedMinutes,
                                orderIndex: p.orderIndex,
                            },
                            update: { allocatedMinutes: p.allocatedMinutes, orderIndex: p.orderIndex },
                        })
                    )
                );
                totalTasksScheduled += placements.length;
            }
        }

        revalidatePath("/weekly");
        revalidatePath("/plan");

        return { success: true as const, daysPlanned: days.length, totalBlocksCreated, totalTasksScheduled };
    } catch (error) {
        console.error("generateWeekScheduleAction failed:", error);
        return { success: false as const, error: error instanceof Error ? error.message : "Unknown error" };
    }
}
