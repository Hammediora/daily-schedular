import { PrismaClient, Role, Lane, BlockType, WorkType, TaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Database — Phase 5 Operator OS...");

    // 1. Create Seed User
    const user = await prisma.user.upsert({
        where: { email: "founder@example.com" },
        update: {},
        create: {
            email: "founder@example.com",
            name: "Founder",
            clerkId: "seed_clerk_id_123",
        },
    });

    // 2. Create or Update Workspace
    let workspace = await prisma.workspace.findFirst({
        where: { members: { some: { userId: user.id } } }
    });

    if (!workspace) {
        workspace = await prisma.workspace.create({
            data: {
                name: "Operator — Hammed",
                timezone: "America/Chicago",
                members: {
                    create: {
                        userId: user.id,
                        role: Role.OWNER,
                    },
                },
            },
        });
    } else {
        workspace = await prisma.workspace.update({
            where: { id: workspace.id },
            data: { name: "Operator — Hammed", timezone: "America/Chicago" }
        });
    }

    const workspaceId = workspace.id;

    // 3. WeeklyConstraints (enforcement per lane per week)
    const constraints = [
        { lane: Lane.REVENUE, minimumMinutes: 300, minimumSessions: 3 },
        { lane: Lane.ASSET, minimumMinutes: 480, minimumSessions: 2 },
        { lane: Lane.LEVERAGE, minimumMinutes: 120, minimumSessions: 1 },
        { lane: Lane.HEALTH, minimumMinutes: 300, minimumSessions: 5 },
    ];

    for (const c of constraints) {
        await prisma.weeklyConstraint.upsert({
            where: { workspaceId_lane: { workspaceId, lane: c.lane } },
            update: { minimumMinutes: c.minimumMinutes, minimumSessions: c.minimumSessions },
            create: {
                workspaceId,
                lane: c.lane,
                minimumMinutes: c.minimumMinutes,
                minimumSessions: c.minimumSessions,
            },
        });
    }

    // 5. Time Block Templates (Founder Baseline)
    await prisma.timeBlockTemplate.deleteMany({ where: { workspaceId } });

    const templates: Array<{
        workspaceId: string;
        title: string;
        dayOfWeek: number;
        startMinute: number;
        durationMinutes: number;
        type: BlockType;
        isLocked: boolean;
    }> = [];

    // Monday–Friday: Deep Work, IBM, Health, Execution, Family
    for (let day = 1; day <= 5; day++) {
        templates.push({
            workspaceId, title: "Deep Work", dayOfWeek: day,
            startMinute: 6 * 60, durationMinutes: 120,
            type: BlockType.DEEP_WORK, isLocked: true,
        });
        templates.push({
            workspaceId, title: "IBM", dayOfWeek: day,
            startMinute: 8 * 60 + 30, durationMinutes: 510,
            type: BlockType.IBM, isLocked: true,
        });
        templates.push({
            workspaceId, title: "Health", dayOfWeek: day,
            startMinute: 17 * 60 + 30, durationMinutes: 60,
            type: BlockType.HEALTH, isLocked: true,
        });
        templates.push({
            workspaceId, title: "Execution", dayOfWeek: day,
            startMinute: 19 * 60, durationMinutes: 90,
            type: BlockType.EXECUTION, isLocked: false,
        });
        // FAMILY block — locked and sacred
        templates.push({
            workspaceId, title: "Family", dayOfWeek: day,
            startMinute: 20 * 60 + 30, durationMinutes: 60,
            type: BlockType.FAMILY, isLocked: true,
        });
    }

    // Saturday: Builder Block
    templates.push({
        workspaceId, title: "Builder", dayOfWeek: 6,
        startMinute: 9 * 60, durationMinutes: 240,
        type: BlockType.BUILDER, isLocked: false,
    });

    // Sunday: Review
    templates.push({
        workspaceId, title: "Weekly Review", dayOfWeek: 0,
        startMinute: 18 * 60, durationMinutes: 60,
        type: BlockType.REVIEW, isLocked: true,
    });

    await prisma.timeBlockTemplate.createMany({ data: templates });

    // 6. Scorecard for this week
    const now = new Date();
    const weekStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

    await prisma.scorecard.upsert({
        where: { workspaceId_weekStartDate: { workspaceId, weekStartDate } },
        update: {},
        create: {
            workspaceId, weekStartDate,
            revenueScore: 0, assetScore: 0, leverageScore: 0, healthScore: 0, discipline: 0,
        }
    });

    // 7. DailyIntent for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailyIntent.upsert({
        where: { workspaceId_date: { workspaceId, date: today } },
        update: {},
        create: {
            workspaceId,
            date: today,
            mustAdvanceRevenue: true,
            mustExecuteDeepWork: true,
            mustTrain: true,
            mustProtectFamily: true,
        },
    });

    // 8. Tasks (full real pipeline)
    // Must delete ScheduledTasks first due to FK constraint
    await prisma.scheduledTask.deleteMany({ where: { task: { workspaceId } } });
    await prisma.task.deleteMany({ where: { workspaceId } });

    const tasksToCreate = [
        // REVENUE
        { lane: Lane.REVENUE, project: "Vinimora", impactScore: 9, effortMins: 90, title: "Send 5 targeted outreach messages (Chicago SMB)", workType: WorkType.EXECUTION },
        { lane: Lane.REVENUE, project: "Vinimora", impactScore: 8, effortMins: 120, title: "Refine service pricing tiers (Operator Edition)", workType: WorkType.DEEP },
        { lane: Lane.REVENUE, project: "IBM", impactScore: 8, effortMins: 60, title: "Follow up on DS8K prospect opportunity", workType: WorkType.SOCIAL },
        { lane: Lane.REVENUE, project: "Vinimora", impactScore: 7, effortMins: 90, title: "Build 1 case study template page", workType: WorkType.EXECUTION },

        // ASSET
        { lane: Lane.ASSET, project: "Citaspace", impactScore: 9, effortMins: 120, title: "Improve Stripe Connect onboarding UX", workType: WorkType.DEEP },
        { lane: Lane.ASSET, project: "Operator OS", impactScore: 10, effortMins: 120, title: "Implement scheduling engine v1", workType: WorkType.DEEP },
        { lane: Lane.ASSET, project: "Citaspace", impactScore: 8, effortMins: 90, title: "Refactor transaction sync logic (Plaid cleanup)", workType: WorkType.DEEP },
        { lane: Lane.ASSET, project: "Infra", impactScore: 7, effortMins: 60, title: "Optimize CI/CD deploy workflow", workType: WorkType.ADMIN },

        // LEVERAGE
        { lane: Lane.LEVERAGE, project: "IBM", impactScore: 7, effortMins: 60, title: "Deep dive: Fusion vs vanilla Kubernetes positioning", workType: WorkType.DEEP },
        { lane: Lane.LEVERAGE, project: "Personal Brand", impactScore: 6, effortMins: 45, title: "Write LinkedIn post on hybrid cloud storage strategy", workType: WorkType.SOCIAL },
        { lane: Lane.LEVERAGE, project: "Infra", impactScore: 7, effortMins: 60, title: "Implement Redis queue for background scheduling", workType: WorkType.DEEP },

        // HEALTH
        { lane: Lane.HEALTH, project: "Personal", impactScore: 10, effortMins: 60, title: "Lift — Upper Body Strength", workType: WorkType.RECOVERY },
        { lane: Lane.HEALTH, project: "Personal", impactScore: 9, effortMins: 45, title: "Zone 2 Cardio", workType: WorkType.RECOVERY },
        { lane: Lane.HEALTH, project: "Personal", impactScore: 8, effortMins: 30, title: "Mobility + Stretch", workType: WorkType.RECOVERY },
    ];

    for (const t of tasksToCreate) {
        await prisma.task.create({
            data: {
                workspaceId,
                title: t.title,
                lane: t.lane as Lane,
                workType: t.workType as WorkType,
                project: t.project,
                impactScore: t.impactScore,
                effortMins: t.effortMins,
                status: TaskStatus.BACKLOG,
            }
        });
    }

    console.log("✅ Operator OS Phase 5 seed complete.");
    console.log("   Workspace:", workspaceId);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
