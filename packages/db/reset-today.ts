/**
 * Reset today's schedule — clears stale TimeBlockInstances and ScheduledTasks.
 * Run this when you need to force the engine to regenerate from fresh templates.
 * Usage: pnpm --filter db exec tsx reset-today.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const workspace = await prisma.workspace.findFirst();
    if (!workspace) {
        console.error("No workspace found.");
        process.exit(1);
    }

    // 1. Find today's instances
    const instances = await prisma.timeBlockInstance.findMany({
        where: { workspaceId: workspace.id, date: today }
    });

    if (instances.length === 0) {
        console.log("No instances for today — nothing to clear.");
        return;
    }

    const instanceIds = instances.map(i => i.id);

    // 2. Delete ScheduledTasks for those instances
    const deleted = await prisma.scheduledTask.deleteMany({
        where: { timeBlockInstanceId: { in: instanceIds } }
    });

    // 3. Reset any tasks that were SCHEDULED back to BACKLOG
    await prisma.task.updateMany({
        where: { workspaceId: workspace.id, status: "SCHEDULED" },
        data: { status: "BACKLOG" }
    });

    // 4. Delete the instances themselves
    await prisma.timeBlockInstance.deleteMany({
        where: { id: { in: instanceIds } }
    });

    console.log(`✅ Cleared ${instances.length} block instances and ${deleted.count} scheduled tasks.`);
    console.log("   Reload http://localhost:3000 and the engine will regenerate today's schedule.");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
