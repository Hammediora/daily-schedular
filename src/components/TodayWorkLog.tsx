import { db } from "@operator-os/db";

function timeLabel(date: Date | null | undefined) {
  if (!date) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

const LANE_LABELS: Record<string, string> = {
  REVENUE: "Revenue", ASSET: "Asset", LEVERAGE: "Leverage", HEALTH: "Health",
};
const LANE_COLORS: Record<string, string> = {
  REVENUE: "#D4AF37", ASSET: "#1B4332", LEVERAGE: "#5A5A5A", HEALTH: "#8B4513",
};
const BLOCK_LABELS: Record<string, string> = {
  DEEP_WORK: "Deep Work", EXECUTION: "Execution", IBM: "IBM",
  HEALTH: "Health", REVIEW: "Review", BUILDER: "Builder", FAMILY: "Family",
};

export default async function TodayWorkLog({ workspaceId }: { workspaceId: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const doneTasks = await db.task.findMany({
    where: {
      workspaceId,
      status: "DONE",
      completedAt: { gte: today, lt: tomorrow },
    },
    orderBy: { completedAt: "asc" },
  });

  if (doneTasks.length === 0) return null;

  // Group by lane
  const byLane = (["REVENUE", "ASSET", "LEVERAGE", "HEALTH"] as const).map(lane => ({
    lane,
    tasks: doneTasks.filter(t => t.lane === lane),
  })).filter(g => g.tasks.length > 0);

  const revenueTasks = doneTasks.filter(t => t.lane === "REVENUE");
  const totalMins = doneTasks.reduce((s, t) => s + t.effortMins, 0);
  const totalActual = doneTasks.reduce((s, t) => s + (t.actualMinutes ?? 0), 0);
  const hasActuals = doneTasks.some(t => t.actualMinutes != null);

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <p className="font-sans text-xs uppercase tracking-widest text-muted font-semibold mb-1">Execution Log</p>
          <h3 className="font-serif text-xl font-semibold">Today's Work Log</h3>
        </div>
        <div className="text-right">
          <p className="font-sans text-2xl font-bold" style={{ color: "#1B4332" }}>{doneTasks.length}</p>
          <p className="font-sans text-xs text-muted">tasks · {totalMins}m est{hasActuals && ` · ${totalActual}m actual`}</p>
        </div>
      </div>

      {/* Revenue Actions highlight */}
      {revenueTasks.length > 0 && (
        <div className="mb-5 p-4 border border-border rounded" style={{ backgroundColor: "rgba(212,175,55,0.04)", borderColor: "#D4AF3730" }}>
          <p className="font-sans text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "#D4AF37" }}>
            Revenue Actions Today
          </p>
          <div className="space-y-1.5">
            {revenueTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between">
                <span className="font-sans text-sm text-foreground">{t.title}</span>
                <span className="font-sans text-xs text-muted">{timeLabel(t.completedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lane groups */}
      <div className="space-y-4">
        {byLane.map(({ lane, tasks }) => (
          <div key={lane}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: LANE_COLORS[lane] }} />
              <p className="font-sans text-xs uppercase tracking-widest font-semibold text-muted">
                {LANE_LABELS[lane]} · {tasks.length} task{tasks.length !== 1 ? "s" : ""} · {tasks.reduce((s, t) => s + t.effortMins, 0)}m
              </p>
            </div>
            <div className="space-y-1">
              {tasks.map(t => (
                <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: LANE_COLORS[lane] + "30" }}>
                      <svg viewBox="0 0 10 8" className="w-2 h-2">
                        <path d="M1 4l2.5 2.5L9 1" stroke={LANE_COLORS[lane]} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span className="font-sans text-sm text-foreground">{t.title}</span>
                    <span className="font-sans text-xs text-muted">
                      {t.effortMins}m est{t.actualMinutes != null && ` · ${t.actualMinutes}m actual`}
                    </span>
                  </div>
                  <span className="font-sans text-xs text-muted">{timeLabel(t.completedAt)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
