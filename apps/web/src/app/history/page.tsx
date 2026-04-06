import { db } from "@operator-os/db";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { getLaneStats } from "@/lib/lane-stats";

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

const BLOCK_LABELS: Record<string, string> = {
  DEEP_WORK: "Deep Work", EXECUTION: "Execution", IBM: "IBM",
  HEALTH: "Health", REVIEW: "Review", BUILDER: "Builder", FAMILY: "Family",
};

export default async function HistoryPage() {
  const workspace = await db.workspace.findFirst();
  if (!workspace) return null;

  // Get last 14 days of block instances
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  cutoff.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [instances, laneStats] = await Promise.all([
    db.timeBlockInstance.findMany({
      where: { workspaceId: workspace.id, date: { gte: cutoff, lt: today } },
      include: { scheduledTasks: { include: { task: true }, orderBy: { orderIndex: "asc" } } },
      orderBy: [{ date: "desc" }, { startMinute: "asc" }],
    }),
    getLaneStats(workspace.id),
  ]);

  // Group by date
  const byDate = instances.reduce<Record<string, typeof instances>>((acc, inst) => {
    const key = new Date(inst.date).toISOString().split("T")[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(inst);
    return acc;
  }, {});

  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar workspaceName={workspace.name} workspaceId={workspace.id} laneStats={laneStats} />
      <main className="flex-1 px-4 sm:px-16 py-6 sm:py-12 max-w-4xl">
        <header className="mb-12">
          <p className="font-sans text-sm text-muted mb-2 tracking-wide uppercase">Execution Record</p>
          <h2 className="font-serif text-4xl font-bold">History</h2>
          <p className="font-sans text-sm text-muted mt-2">Last 14 days of executed blocks.</p>
        </header>

        {dates.length === 0 ? (
          <p className="font-sans text-sm text-muted">No history yet — keep executing.</p>
        ) : (
          <div className="space-y-12">
            {dates.map(dateKey => {
              const dayBlocks = byDate[dateKey];
              const dateObj = new Date(dateKey + "T12:00:00");
              const dayLabel = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

              const totalTasks = dayBlocks.flatMap(b => b.scheduledTasks).length;
              const doneTasks = dayBlocks.flatMap(b => b.scheduledTasks).filter(st => st.task.status === "DONE").length;

              return (
                <div key={dateKey}>
                  <div className="flex items-baseline justify-between mb-4">
                    <p className="font-sans text-sm font-semibold text-foreground">{dayLabel}</p>
                    <p className="font-sans text-xs text-muted">
                      {doneTasks}/{totalTasks} tasks completed
                    </p>
                  </div>

                  <div className="space-y-3">
                    {dayBlocks.map(block => {
                      const blockDone = block.scheduledTasks.filter(st => st.task.status === "DONE").length;
                      const blockTotal = block.scheduledTasks.length;
                      const isEmpty = blockTotal === 0;

                      return (
                        <div key={block.id} className="border border-border rounded p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <p className="font-sans text-sm font-medium">
                                {BLOCK_LABELS[block.type as string] ?? block.type}
                              </p>
                              <span className="font-sans text-xs text-muted">
                                {formatMinutes(block.startMinute)} – {formatMinutes(block.startMinute + block.durationMinutes)}
                              </span>
                            </div>
                            {!isEmpty && (
                              <span className={`font-sans text-xs font-semibold ${blockDone === blockTotal ? "text-primary" : "text-muted"}`}>
                                {blockDone}/{blockTotal}
                              </span>
                            )}
                          </div>

                          {isEmpty ? (
                            <p className="font-sans text-xs text-muted">Empty</p>
                          ) : (
                            <ul className="space-y-1">
                              {block.scheduledTasks.map(st => (
                                <li key={st.id} className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.task.status === "DONE" ? "bg-primary" : "bg-border"}`} />
                                  <span className={`font-sans text-xs ${st.task.status === "DONE" ? "text-muted line-through" : "text-foreground"}`}>
                                    {st.task.title}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
