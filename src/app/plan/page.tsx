import { db } from "@operator-os/db";
import Sidebar from "@/components/Sidebar";
import { getLaneStats } from "@/lib/lane-stats";
import PlanClient from "./PlanClient";
import WeekOutcomesForm from "@/components/WeekOutcomesForm";
import BacklogLockPanel from "@/components/BacklogLockPanel";
import Link from "next/link";

const LANE_META: Record<string, string> = {
  REVENUE: "Revenue", ASSET: "Asset", LEVERAGE: "Leverage", HEALTH: "Health",
};
const BLOCK_LABELS: Record<string, string> = {
  DEEP_WORK: "Deep Work", EXECUTION: "Execution", IBM: "IBM",
  HEALTH: "Health", REVIEW: "Review", BUILDER: "Builder", FAMILY: "Family",
};

function weekRange(offsetWeeks: number) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  // Current week: Mon–Sun
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((dayOfWeek + 6) % 7) - offsetWeeks * 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return { weekStart, weekEnd };
}

async function getWeekStats(workspaceId: string, offsetWeeks: number) {
  const { weekStart, weekEnd } = weekRange(offsetWeeks);
  const [constraints, doneTasks] = await Promise.all([
    db.weeklyConstraint.findMany({ where: { workspaceId } }),
    db.task.findMany({
      where: { workspaceId, status: "DONE", completedAt: { gte: weekStart, lt: weekEnd } },
      select: { lane: true, effortMins: true },
    }),
  ]);
  const lanes = ["REVENUE", "ASSET", "LEVERAGE", "HEALTH"] as const;
  return lanes.map(lane => {
    const c = constraints.find(x => x.lane === lane);
    const required = c?.minimumMinutes ?? 300;
    const completed = doneTasks.filter(t => t.lane === lane).reduce((s, t) => s + t.effortMins, 0);
    const pct = Math.min(100, Math.round((completed / required) * 100));
    const sessionsCompleted = doneTasks.filter(t => t.lane === lane).length;
    return { lane, label: LANE_META[lane] ?? lane, completed, required, pct, sessionsCompleted };
  });
}

export default async function PlanPage() {
  const workspace = await db.workspace.findFirst();
  if (!workspace) return null;

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday

  // Next week: starting next Monday
  const offsetDays = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + offsetDays);
  nextMonday.setHours(0, 0, 0, 0);

  const nextWeekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(nextMonday);
    d.setDate(nextMonday.getDate() + i);
    return d;
  });

  const [sidebarStats, thisWeekStats, lastWeekStats] = await Promise.all([
    getLaneStats(workspace.id),
    getWeekStats(workspace.id, 0),
    getWeekStats(workspace.id, 1),
  ]);

  // Build next week block preview from templates + any existing instances
  const nextWeekEnd = new Date(nextMonday);
  nextWeekEnd.setDate(nextMonday.getDate() + 7);

  const [templates, existingInstances, backlogTasks, nextMondayIntent] = await Promise.all([
    db.timeBlockTemplate.findMany({ where: { workspaceId: workspace.id } }),
    db.timeBlockInstance.findMany({
      where: { workspaceId: workspace.id, date: { gte: nextMonday, lt: nextWeekEnd } },
      include: {
        scheduledTasks: {
          include: { task: { select: { id: true, title: true } } },
        },
      },
    }),
    db.task.findMany({
      where: { workspaceId: workspace.id, status: "BACKLOG" },
      select: { id: true, title: true, lane: true, workType: true, effortMins: true },
      orderBy: [{ impactScore: "desc" }],
      take: 50,
    }),
    db.dailyIntent.findUnique({
      where: { workspaceId_date: { workspaceId: workspace.id, date: nextMonday } },
    }),
  ]);

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const nextWeekPreview = nextWeekDays.map(day => {
    const dow = day.getDay();
    const dayKey = day.toISOString().split("T")[0];

    // Use existing instances if day is already planned, else preview from templates
    const existingForDay = existingInstances.filter(inst =>
      new Date(inst.date).toISOString().split("T")[0] === dayKey
    );

    const blocks = existingForDay.length > 0
      ? existingForDay.map(inst => ({
          type: inst.type as string,
          label: BLOCK_LABELS[inst.type as string] ?? inst.type,
          tasks: inst.scheduledTasks.length,
        }))
      : templates
          .filter(t => t.dayOfWeek === dow)
          .sort((a, b) => a.startMinute - b.startMinute)
          .map(t => ({
            type: t.type as string,
            label: BLOCK_LABELS[t.type as string] ?? t.type,
            tasks: 0,
          }));

    return {
      day: DAY_LABELS[dow],
      date: day.getDate().toString(),
      blocks,
    };
  });

  // Build available blocks for locking
  const availableBlocks = existingInstances
    .filter(inst => !["FAMILY", "IBM", "HEALTH"].includes(inst.type))
    .map(inst => {
      const d = new Date(inst.date);
      return {
        id: inst.id,
        dayLabel: DAY_LABELS[d.getDay()],
        blockLabel: BLOCK_LABELS[inst.type as string] ?? inst.type,
        startMinute: inst.startMinute,
      };
    })
    .sort((a, b) => a.startMinute - b.startMinute);

  // Build locked placements
  const lockedPlacements = existingInstances.flatMap(inst =>
    inst.scheduledTasks
      .filter((st: any) => st.isLocked)
      .map((st: any) => ({
        scheduledTaskId: st.id,
        taskId: st.task.id,
        taskTitle: st.task.title,
        blockId: inst.id,
        blockLabel: BLOCK_LABELS[inst.type as string] ?? inst.type,
        dayLabel: DAY_LABELS[new Date(inst.date).getDay()],
      }))
  );

  // Week outcomes
  const weekOutcomes = {
    outcome1: nextMondayIntent?.weekOutcome1 ?? "",
    outcome2: nextMondayIntent?.weekOutcome2 ?? "",
    outcome3: nextMondayIntent?.weekOutcome3 ?? "",
  };

  const { weekStart: thisWeekStart } = weekRange(0);
  const weekLabel = thisWeekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const nextWeekLabel = nextMonday.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " – " +
    new Date(nextMonday.getTime() + 6 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar workspaceName={workspace.name} workspaceId={workspace.id} laneStats={sidebarStats} />
      <main className="flex-1 px-16 py-12 max-w-5xl">
        <header className="flex justify-between items-end mb-12">
          <div>
            <p className="font-sans text-sm text-muted mb-2 tracking-wide uppercase">Weekly Ritual</p>
            <h2 className="font-serif text-4xl font-bold">Review & Plan</h2>
          </div>
          <Link href="/scorecard"
            className="font-sans text-sm text-muted border border-border px-4 py-2 rounded hover:bg-surface transition-colors">
            ← Scorecard
          </Link>
        </header>

        {/* Week Outcomes + Backlog Lock */}
        <div className="space-y-8 mb-12">
          <WeekOutcomesForm initial={weekOutcomes} />
          {existingInstances.length > 0 && (
            <BacklogLockPanel
              backlogTasks={backlogTasks}
              availableBlocks={availableBlocks}
              lockedPlacements={lockedPlacements}
            />
          )}
        </div>

        <PlanClient
          thisWeekStats={thisWeekStats}
          lastWeekStats={lastWeekStats}
          nextWeekPreview={nextWeekPreview}
          weekLabel={weekLabel}
          nextWeekLabel={nextWeekLabel}
        />
      </main>
    </div>
  );
}
