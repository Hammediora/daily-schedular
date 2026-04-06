import { db } from "@operator-os/db";
import Sidebar from "@/components/Sidebar";
import { getLaneStats } from "@/lib/lane-stats";
import { getOrGenerateWeekBlocks } from "@/lib/os-engine";
import WeeklyClient from "@/components/WeeklyClient";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function Weekly() {
  const workspace = await db.workspace.findFirst();
  if (!workspace) return null;

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  const dayDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const [instances, laneStats] = await Promise.all([
    getOrGenerateWeekBlocks(workspace.id, weekStart, workspace.timezone),
    getLaneStats(workspace.id),
  ]);

  // Serialize for client component
  const days = dayDates.map(d => ({
    date: d.toISOString(),
    dayLabel: DAY_LABELS[d.getDay()],
    dayNumber: d.getDate(),
    isToday: d.toDateString() === today.toDateString(),
  }));

  const blocksByDay = dayDates.map(day =>
    instances
      .filter(inst => new Date(inst.date).toDateString() === day.toDateString())
      .map(inst => ({
        id: inst.id,
        date: new Date(inst.date).toISOString(),
        startMinute: inst.startMinute,
        durationMinutes: inst.durationMinutes,
        type: inst.type,
        isLocked: inst.isLocked,
        completionState: inst.completionState,
        objective: inst.objective,
        parkingLotNotes: inst.parkingLotNotes,
        scheduledTasks: inst.scheduledTasks.map(st => ({
          id: st.id,
          orderIndex: st.orderIndex,
          allocatedMinutes: st.allocatedMinutes,
          task: {
            id: st.task.id,
            title: st.task.title,
            status: st.task.status,
            project: st.task.project,
            lane: st.task.lane,
            workType: st.task.workType,
            impactScore: st.task.impactScore,
            effortMins: st.task.effortMins,
            notes: st.task.notes,
          },
        })),
      }))
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <div className="hidden sm:block">
        <Sidebar workspaceName={workspace.name} workspaceId={workspace.id} laneStats={laneStats} />
      </div>

      <main className="flex-1 px-4 sm:px-12 py-6 sm:py-12 overflow-x-auto">
        <header className="flex justify-between items-end mb-8 sm:mb-12">
          <div>
            <p className="font-sans text-sm text-muted mb-2 tracking-wide uppercase">Strategic View</p>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold">Weekly Calendar</h2>
          </div>
        </header>

        <WeeklyClient days={days} blocksByDay={blocksByDay} />
      </main>
    </div>
  );
}
