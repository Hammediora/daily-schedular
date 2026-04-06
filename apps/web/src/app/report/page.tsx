export const dynamic = "force-dynamic";

import { db } from "@operator-os/db";
import Sidebar from "@/components/Sidebar";
import { getLaneStats } from "@/lib/lane-stats";
import WeeklyReport from "@/components/WeeklyReport";

const LANE_META: Record<string, { label: string; color: string }> = {
  REVENUE: { label: "Revenue", color: "#D4AF37" },
  ASSET: { label: "Asset", color: "#1B4332" },
  LEVERAGE: { label: "Leverage", color: "#5A5A5A" },
  HEALTH: { label: "Health", color: "#8B4513" },
};
const BLOCK_LABELS: Record<string, string> = {
  DEEP_WORK: "Deep Work", EXECUTION: "Execution", IBM: "IBM",
  HEALTH: "Health", REVIEW: "Review", BUILDER: "Builder", FAMILY: "Family",
};

export default async function ReportPage() {
  const workspace = await db.workspace.findFirst();
  if (!workspace) return null;

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const weekLabel = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " – " + new Date(weekEnd.getTime() - 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const [laneStats, constraints, doneTasks, blockInstances] = await Promise.all([
    getLaneStats(workspace.id),
    db.weeklyConstraint.findMany({ where: { workspaceId: workspace.id } }),
    db.task.findMany({
      where: {
        workspaceId: workspace.id,
        status: "DONE",
        completedAt: { gte: weekStart, lt: weekEnd },
      },
      select: { title: true, lane: true, effortMins: true },
    }),
    db.timeBlockInstance.findMany({
      where: { workspaceId: workspace.id, date: { gte: weekStart, lt: weekEnd } },
      include: {
        scheduledTasks: { select: { taskId: true } },
      },
    }),
  ]);

  // Lanes
  const lanes = (["REVENUE", "ASSET", "LEVERAGE", "HEALTH"] as const).map(lane => {
    const meta = LANE_META[lane];
    const tasks = doneTasks.filter(t => t.lane === lane);
    const constraint = constraints.find(c => c.lane === lane);
    return {
      lane,
      label: meta.label,
      color: meta.color,
      completedTasks: tasks.map(t => ({
        title: t.title,
        effortMins: t.effortMins,
        actualMinutes: (t as any).actualMinutes ?? null,
      })),
      totalEstimated: tasks.reduce((s, t) => s + t.effortMins, 0),
      totalActual: tasks.reduce((s, t) => s + ((t as any).actualMinutes ?? 0), 0),
      requiredMinutes: constraint?.minimumMinutes ?? 300,
    };
  });

  // Block summaries
  const blockTypes = [...new Set(blockInstances.map(b => b.type))];
  const blocks = blockTypes.map(type => {
    const ofType = blockInstances.filter(b => b.type === type);
    const energyRatings = ofType.filter(b => (b as any).energyRating != null).map(b => (b as any).energyRating as number);
    return {
      type,
      label: BLOCK_LABELS[type] ?? type,
      total: ofType.length,
      completed: ofType.filter(b => (b as any).completionState === "COMPLETED").length,
      partial: ofType.filter(b => (b as any).completionState === "PARTIAL").length,
      skipped: ofType.filter(b => (b as any).completionState === "SKIPPED").length,
      avgEnergy: energyRatings.length > 0
        ? energyRatings.reduce((s, v) => s + v, 0) / energyRatings.length
        : null,
    };
  });

  // Accuracy (actual / estimated for tasks with actual data)
  const tasksWithActual = doneTasks.filter(t => (t as any).actualMinutes != null);
  const overallAccuracy = tasksWithActual.length > 0
    ? Math.round(
        (tasksWithActual.reduce((s, t) => s + ((t as any).actualMinutes as number), 0) /
         tasksWithActual.reduce((s, t) => s + t.effortMins, 0)) * 100
      )
    : null;

  // Count unique tasks scheduled across all blocks
  const totalScheduled = new Set(blockInstances.flatMap(b => b.scheduledTasks.map(st => st.taskId))).size;
  const bumpedTasks = Math.max(0, totalScheduled - doneTasks.length);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar workspaceName={workspace.name} workspaceId={workspace.id} laneStats={laneStats} />
      <main className="flex-1 px-4 sm:px-16 py-6 sm:py-12 max-w-5xl">
        <header className="mb-12">
          <p className="font-sans text-sm text-muted mb-2 tracking-wide uppercase">Week of {weekLabel}</p>
          <h2 className="font-serif text-4xl font-bold">Weekly Report</h2>
        </header>

        <WeeklyReport
          weekLabel={weekLabel}
          lanes={lanes}
          blocks={blocks}
          totalTasks={totalScheduled}
          completedTasks={doneTasks.length}
          bumpedTasks={bumpedTasks}
          overallAccuracy={overallAccuracy}
        />
      </main>
    </div>
  );
}
