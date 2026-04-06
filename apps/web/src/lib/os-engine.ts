import { db } from "@operator-os/db";
import { Scheduler } from "@operator-os/core";

export async function getOrGenerateTodayBlocks(workspaceId: string, timezone: string = "America/Chicago") {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const fetchInstances = () => db.timeBlockInstance.findMany({
        where: { workspaceId, date: todayDate },
        include: {
            scheduledTasks: {
                include: { task: true },
                orderBy: { orderIndex: "asc" }
            }
        },
        orderBy: { startMinute: "asc" }
    });

    let instances = await fetchInstances();

    // If no instances exist, create them from today's templates
    if (instances.length === 0) {
        const dayOfWeek = todayDate.getDay();
        const templates = await db.timeBlockTemplate.findMany({
            where: { workspaceId, dayOfWeek }
        });

        if (templates.length > 0) {
            await db.timeBlockInstance.createMany({
                data: templates.map((t) => ({
                    workspaceId,
                    date: todayDate,
                    startMinute: t.startMinute,
                    durationMinutes: t.durationMinutes,
                    type: t.type,
                    isLocked: t.isLocked,
                }))
            });
            instances = await fetchInstances();
        }
    }

    // Run scheduler if there are backlog tasks not yet placed
    const backlogTasks = await db.task.findMany({
        where: { workspaceId, status: "BACKLOG" }
    });

    if (backlogTasks.length > 0 && instances.length > 0) {
        const placements = Scheduler.computeSchedule({
            backlogTasks,
            availableBlocks: instances,
            timezone
        });

        if (placements.length > 0) {
            const existingPairs = new Set(
                instances.flatMap(inst =>
                    inst.scheduledTasks.map(st => `${st.taskId}__${st.timeBlockInstanceId}`)
                )
            );

            const newPlacements = placements.filter(
                p => !existingPairs.has(`${p.taskId}__${p.timeBlockInstanceId}`)
            );

            if (newPlacements.length > 0) {
                await db.$transaction(
                    newPlacements.map((p) => db.scheduledTask.create({
                        data: {
                            taskId: p.taskId,
                            timeBlockInstanceId: p.timeBlockInstanceId,
                            allocatedMinutes: p.allocatedMinutes,
                            orderIndex: p.orderIndex,
                        }
                    }))
                );

                const scheduledIds = newPlacements.map((p) => p.taskId);
                await db.task.updateMany({
                    where: { id: { in: scheduledIds } },
                    data: { status: "SCHEDULED" }
                });
            }
        }

        instances = await fetchInstances();
    }

    return instances;
}

/**
 * Ensures all 7 days of the given week have TimeBlockInstances generated from templates.
 * Skips days that already have instances. Does NOT re-run the scheduler on existing days.
 * Returns all instances for the week ordered by date and startMinute.
 */
export async function getOrGenerateWeekBlocks(
    workspaceId: string,
    weekStart: Date,
    timezone: string = "America/Chicago"
) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Fetch all templates once
    const templates = await db.timeBlockTemplate.findMany({ where: { workspaceId } });

    // Fetch all existing instances for the week at once
    const existing = await db.timeBlockInstance.findMany({
        where: { workspaceId, date: { gte: weekStart, lt: weekEnd } },
        select: { date: true }
    });

    // Build set of days that already have blocks (ISO date string)
    const coveredDays = new Set(
        existing.map(inst => new Date(inst.date).toISOString().split("T")[0])
    );

    // Generate missing days
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
    });

    const backlogTasks = await db.task.findMany({
        where: { workspaceId, status: "BACKLOG" }
    });

    for (const day of days) {
        const dayKey = day.toISOString().split("T")[0];
        if (coveredDays.has(dayKey)) continue; // already filled

        const dow = day.getDay();
        const dayTemplates = templates.filter(t => t.dayOfWeek === dow);
        if (dayTemplates.length === 0) continue;

        await db.timeBlockInstance.createMany({
            data: dayTemplates.map(t => ({
                workspaceId,
                date: day,
                startMinute: t.startMinute,
                durationMinutes: t.durationMinutes,
                type: t.type,
                isLocked: t.isLocked,
            }))
        });

        if (backlogTasks.length > 0) {
            const dayInstances = await db.timeBlockInstance.findMany({
                where: { workspaceId, date: day },
            });

            const placements = Scheduler.computeSchedule({
                backlogTasks,
                availableBlocks: dayInstances,
                timezone,
            });

            if (placements.length > 0) {
                await db.$transaction(
                    placements.map(p =>
                        db.scheduledTask.upsert({
                            where: {
                                taskId_timeBlockInstanceId: {
                                    taskId: p.taskId,
                                    timeBlockInstanceId: p.timeBlockInstanceId,
                                }
                            },
                            create: {
                                taskId: p.taskId,
                                timeBlockInstanceId: p.timeBlockInstanceId,
                                allocatedMinutes: p.allocatedMinutes,
                                orderIndex: p.orderIndex,
                            },
                            update: {}
                        })
                    )
                );
            }
        }
    }

    // Return all instances for the week with tasks
    return db.timeBlockInstance.findMany({
        where: { workspaceId, date: { gte: weekStart, lt: weekEnd } },
        include: {
            scheduledTasks: {
                include: { task: true },
                orderBy: { orderIndex: "asc" }
            }
        },
        orderBy: [{ date: "asc" }, { startMinute: "asc" }]
    });
}

