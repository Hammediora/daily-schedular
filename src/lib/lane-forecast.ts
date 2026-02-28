import { db } from "@operator-os/db";

type Lane = "REVENUE" | "ASSET" | "LEVERAGE" | "HEALTH";

export interface LaneForecast {
  lane: Lane;
  label: string;
  color: string;
  requiredMinutes: number;
  completedMinutes: number;
  scheduledMinutes: number;
  remainingRequired: number;
  availableCapacityMinutes: number;
  projectedShortfall: number;
  status: "on_track" | "at_risk" | "will_miss";
}

const LANE_META: Record<Lane, { label: string; color: string }> = {
  REVENUE:  { label: "Revenue",  color: "#D4AF37" },
  ASSET:    { label: "Asset",    color: "#1B4332" },
  LEVERAGE: { label: "Leverage", color: "#5A5A5A" },
  HEALTH:   { label: "Health",   color: "#8B4513" },
};

// Which block types can serve each lane (derived from Scheduler.COMPATIBILITY_MAP)
// REVENUE tasks can be DEEP, EXECUTION, ADMIN, SOCIAL → DEEP_WORK, EXECUTION, BUILDER, REVIEW
// ASSET tasks can be DEEP, EXECUTION → DEEP_WORK, EXECUTION, BUILDER
// LEVERAGE tasks can be DEEP, EXECUTION, ADMIN → DEEP_WORK, EXECUTION, BUILDER, REVIEW
// HEALTH tasks are RECOVERY → HEALTH (but HEALTH is protected, so capacity = 0)
const LANE_COMPATIBLE_BLOCK_TYPES: Record<Lane, string[]> = {
  REVENUE:  ["DEEP_WORK", "EXECUTION", "BUILDER", "REVIEW"],
  ASSET:    ["DEEP_WORK", "EXECUTION", "BUILDER"],
  LEVERAGE: ["DEEP_WORK", "EXECUTION", "BUILDER", "REVIEW"],
  HEALTH:   ["HEALTH"],
};

export async function getLaneForecast(workspaceId: string): Promise<LaneForecast[]> {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // Week boundaries (Monday-based)
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [constraints, doneTasks, blocksWithTasks, blocksForCapacity] = await Promise.all([
    db.weeklyConstraint.findMany({ where: { workspaceId } }),

    // Tasks completed this week
    db.task.findMany({
      where: { workspaceId, status: "DONE", completedAt: { gte: weekStart, lt: weekEnd } },
      select: { lane: true, effortMins: true },
    }),

    // Blocks with their scheduled tasks (to find future scheduled tasks)
    db.timeBlockInstance.findMany({
      where: { workspaceId, date: { gte: today, lt: weekEnd } },
      include: {
        scheduledTasks: {
          include: { task: { select: { lane: true, effortMins: true, status: true } } },
        },
      },
    }),

    // Blocks for capacity calculation
    db.timeBlockInstance.findMany({
      where: {
        workspaceId,
        date: { gte: today, lt: weekEnd },
      },
      include: {
        scheduledTasks: { select: { allocatedMinutes: true } },
      },
    }),
  ]);

  const isFutureBlock = (b: { date: Date; startMinute: number; durationMinutes: number }) => {
    const blockDate = new Date(b.date);
    blockDate.setHours(0, 0, 0, 0);
    if (blockDate.getTime() > today.getTime()) return true;
    if (blockDate.getTime() === today.getTime()) {
      return b.startMinute + b.durationMinutes > nowMinutes;
    }
    return false;
  };

  // Filter to only future blocks, also filter OPEN completion state in JS
  const futureBlocks = blocksForCapacity.filter(b =>
    isFutureBlock(b) && ((b as any).completionState ?? "OPEN") === "OPEN"
  );

  // Extract future scheduled tasks from blocks
  const futureScheduledTasks = blocksWithTasks
    .filter(isFutureBlock)
    .flatMap(b => b.scheduledTasks.filter(st => st.task.status !== "DONE"));

  return (["REVENUE", "ASSET", "LEVERAGE", "HEALTH"] as Lane[]).map(lane => {
    const constraint = constraints.find(c => c.lane === lane);
    const requiredMinutes = constraint?.minimumMinutes ?? 300;

    const completedMinutes = doneTasks
      .filter(t => t.lane === lane)
      .reduce((sum, t) => sum + ((t as any).actualMinutes ?? t.effortMins), 0);

    const scheduledMinutes = futureScheduledTasks
      .filter(st => st.task.lane === lane)
      .reduce((sum, st) => sum + st.task.effortMins, 0);

    const remainingRequired = Math.max(0, requiredMinutes - completedMinutes - scheduledMinutes);

    // Available capacity in compatible block types
    const compatibleTypes = LANE_COMPATIBLE_BLOCK_TYPES[lane];
    const availableCapacityMinutes = futureBlocks
      .filter(b => compatibleTypes.includes(b.type))
      .reduce((sum, b) => {
        const used = b.scheduledTasks.reduce((s, st) => s + (st.allocatedMinutes ?? 0), 0);
        return sum + Math.max(0, b.durationMinutes - used);
      }, 0);

    const projectedShortfall = Math.max(0, remainingRequired - availableCapacityMinutes);

    let status: "on_track" | "at_risk" | "will_miss";
    if (projectedShortfall > 0) {
      status = "will_miss";
    } else if (remainingRequired > availableCapacityMinutes * 0.7) {
      status = "at_risk";
    } else {
      status = "on_track";
    }

    return {
      lane,
      ...LANE_META[lane],
      requiredMinutes,
      completedMinutes,
      scheduledMinutes,
      remainingRequired,
      availableCapacityMinutes,
      projectedShortfall,
      status,
    };
  });
}
