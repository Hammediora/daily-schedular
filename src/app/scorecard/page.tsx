import { db } from "@operator-os/db";
import Sidebar from "@/components/Sidebar";
import { getLaneStats } from "@/lib/lane-stats";
import Link from "next/link";

const LANE_META: Record<string, { label: string; desc: string; color: string }> = {
  REVENUE:  { label: "Revenue",  desc: "Client work, outreach, deals", color: "#D4AF37" },
  ASSET:    { label: "Asset",    desc: "Citaspace, Operator OS",        color: "#1B4332" },
  LEVERAGE: { label: "Leverage", desc: "Skills, systems, brand",        color: "#5A5A5A" },
  HEALTH:   { label: "Health",   desc: "Strength, cardio, recovery",    color: "#8B4513" },
};

function weekRange(offsetWeeks: number) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7) - offsetWeeks * 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return { weekStart, weekEnd };
}

async function getWeekLaneMinutes(workspaceId: string, offsetWeeks: number) {
  const { weekStart, weekEnd } = weekRange(offsetWeeks);
  const done = await db.task.findMany({
    where: { workspaceId, status: "DONE", completedAt: { gte: weekStart, lt: weekEnd } },
    select: { lane: true, effortMins: true },
  });
  const lanes = ["REVENUE", "ASSET", "LEVERAGE", "HEALTH"] as const;
  return Object.fromEntries(
    lanes.map(lane => [lane, done.filter(t => t.lane === lane).reduce((s, t) => s + t.effortMins, 0)])
  ) as Record<string, number>;
}

export default async function Scorecard() {
  const workspace = await db.workspace.findFirst();
  if (!workspace) return null;

  const today = new Date();
  const { weekStart } = weekRange(0);
  const { weekStart: lastWeekStart } = weekRange(1);

  // Fetch all data in parallel
  const [sidebarStats, constraints, thisWeekMinutes, lastWeekMinutes, week2Minutes, week3Minutes, week4Minutes] =
    await Promise.all([
      getLaneStats(workspace.id),
      db.weeklyConstraint.findMany({ where: { workspaceId: workspace.id } }),
      getWeekLaneMinutes(workspace.id, 0),
      getWeekLaneMinutes(workspace.id, 1),
      getWeekLaneMinutes(workspace.id, 2),
      getWeekLaneMinutes(workspace.id, 3),
      getWeekLaneMinutes(workspace.id, 4),
    ]);

  const lanes = ["REVENUE", "ASSET", "LEVERAGE", "HEALTH"] as const;

  const laneStats = lanes.map(lane => {
    const c = constraints.find(x => x.lane === lane);
    const required = c?.minimumMinutes ?? 300;
    const sessions = c?.minimumSessions ?? 1;
    const thisWeek = thisWeekMinutes[lane] ?? 0;
    const lastWeek = lastWeekMinutes[lane] ?? 0;
    const pct = Math.min(100, Math.round((thisWeek / required) * 100));
    const lastPct = Math.min(100, Math.round((lastWeek / required) * 100));
    const delta = pct - lastPct;
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    const pace = Math.min(100, Math.round((dayOfWeek / 5) * 100));
    const isBehind = pct < pace * 0.8;
    const isDone = pct >= 100;
    return { lane, required, thisWeek, lastWeek, pct, lastPct, delta, pace, isBehind, isDone, sessions };
  });

  const disciplineScore = Math.round(laneStats.reduce((s, l) => s + l.pct, 0) / laneStats.length);
  const lastDisciplineScore = Math.round(laneStats.reduce((s, l) => s + l.lastPct, 0) / laneStats.length);
  const disciplineDelta = disciplineScore - lastDisciplineScore;

  // 4-week trend — discipline score per week
  const allWeeksMinutes = [thisWeekMinutes, lastWeekMinutes, week2Minutes, week3Minutes, week4Minutes];
  const trend = allWeeksMinutes.map((wm, i) => {
    const { weekStart: ws } = weekRange(i);
    const label = i === 0 ? "This week" : i === 1 ? "Last week" : ws.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const score = Math.round(
      lanes.map(lane => {
        const c = constraints.find(x => x.lane === lane);
        const required = c?.minimumMinutes ?? 300;
        return Math.min(100, Math.round(((wm[lane] ?? 0) / required) * 100));
      }).reduce((a, b) => a + b, 0) / lanes.length
    );
    return { label, score };
  }).reverse(); // oldest first

  const weekStr = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  const isSunday = today.getDay() === 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar workspaceName={workspace.name} workspaceId={workspace.id} laneStats={sidebarStats} />

      <main className="flex-1 px-16 py-12 max-w-5xl">
        <header className="flex justify-between items-end mb-12">
          <div>
            <p className="font-sans text-sm text-muted mb-2 tracking-wide uppercase">{weekStr}</p>
            <h2 className="font-serif text-4xl font-bold">Scorecard</h2>
          </div>
          <div className="flex items-end gap-8">
            {/* Last week comparison */}
            <div className="text-right">
              <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">Last Week</p>
              <p className="font-serif text-2xl font-bold text-muted">{lastDisciplineScore}</p>
            </div>
            <div className="text-right">
              <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">This Week</p>
              <div className="flex items-baseline gap-2">
                <p className="font-serif text-5xl font-bold" style={{ color: disciplineScore >= 70 ? "#1B4332" : "#D4AF37" }}>
                  {disciplineScore}
                </p>
                {disciplineDelta !== 0 && (
                  <span
                    className="font-sans text-sm font-bold"
                    style={{ color: disciplineDelta > 0 ? "#1B4332" : "#D4AF37" }}
                  >
                    {disciplineDelta > 0 ? "↑" : "↓"}{Math.abs(disciplineDelta)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Sunday prompt */}
        {isSunday && (
          <div className="mb-10 border border-border rounded p-5 flex items-center justify-between"
            style={{ backgroundColor: "rgba(212,175,55,0.04)", borderColor: "#D4AF3730" }}>
            <div>
              <p className="font-sans text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: "#D4AF37" }}>Sunday Planning</p>
              <p className="font-sans text-sm text-foreground">Review this week and generate next week's schedule.</p>
            </div>
            <Link href="/plan" className="font-sans text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded">
              Plan Next Week →
            </Link>
          </div>
        )}

        {/* 4-week trend */}
        <div className="mb-10 bg-surface border border-border rounded p-6">
          <p className="font-sans text-xs uppercase tracking-widest text-muted font-semibold mb-5">4-Week Discipline Trend</p>
          <div className="flex items-end gap-3 h-20">
            {trend.map(({ label, score }, i) => {
              const isThisWeek = i === trend.length - 1;
              const barColor = isThisWeek ? (score >= 70 ? "#1B4332" : "#D4AF37") : "#D4D4D4";
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="font-sans text-xs text-muted">{score > 0 ? score : "—"}</span>
                  <div className="w-full rounded-t" style={{
                    height: `${Math.max(4, score)}%`,
                    backgroundColor: barColor,
                    minHeight: "4px",
                  }} />
                  <span className="font-sans text-xs text-muted text-center whitespace-nowrap">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lane Cards */}
        <div className="space-y-4">
          {laneStats.map(({ lane, required, thisWeek, lastWeek, pct, lastPct, delta, isBehind, isDone, sessions }) => {
            const meta = LANE_META[lane] ?? { label: lane, desc: "", color: "#5A5A5A" };
            return (
              <div key={lane} className="bg-surface border border-border rounded p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-serif text-xl font-semibold">{meta.label}</h3>
                    <p className="font-sans text-xs text-muted mt-0.5">{meta.desc}</p>
                  </div>
                  <div className="text-right flex items-start gap-6">
                    {/* Last week */}
                    <div className="text-right">
                      <p className="font-sans text-xs text-muted mb-1">Last week</p>
                      <p className="font-sans text-sm font-semibold text-muted">{lastPct}%</p>
                      <p className="font-sans text-xs text-muted">{lastWeek}m</p>
                    </div>
                    {/* This week */}
                    <div className="text-right">
                      <p className="font-sans text-xs text-muted mb-1">This week</p>
                      <div className="flex items-baseline gap-1.5">
                        <p className="font-sans text-2xl font-bold" style={{ color: isDone ? "#1B4332" : isBehind ? "#D4AF37" : "#1C1C1C" }}>
                          {pct}%
                        </p>
                        {delta !== 0 && (
                          <span className="font-sans text-xs font-bold" style={{ color: delta > 0 ? "#1B4332" : "#D4AF37" }}>
                            {delta > 0 ? "↑" : "↓"}{Math.abs(delta)}
                          </span>
                        )}
                      </div>
                      <p className="font-sans text-xs text-muted">{thisWeek}m / {required}m</p>
                    </div>
                  </div>
                </div>

                {/* Progress track — this week vs last week overlay */}
                <div className="relative h-1.5 bg-border rounded-full overflow-hidden mb-2">
                  {/* Last week ghost bar */}
                  {lastPct > 0 && (
                    <div className="absolute h-full rounded-full opacity-20"
                      style={{ width: `${lastPct}%`, backgroundColor: meta.color }} />
                  )}
                  {/* This week */}
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: isDone ? "#1B4332" : isBehind ? "#D4AF37" : meta.color }} />
                </div>

                <div className="flex justify-between font-sans text-xs text-muted">
                  <span>{isBehind && !isDone ? (
                    <span style={{ color: "#D4AF37" }}>Behind pace</span>
                  ) : isDone ? (
                    <span style={{ color: "#1B4332" }}>Target met ✓</span>
                  ) : "On track"}</span>
                  <span>Target: {required}m</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Plan link at bottom */}
        <div className="mt-12 pt-8 border-t border-border flex justify-between items-center">
          <p className="font-sans text-sm text-muted">Review your execution. Plan the next move.</p>
          <Link href="/plan" className="font-sans text-sm font-medium text-foreground border border-border px-4 py-2 rounded hover:bg-surface transition-colors">
            Weekly Planning →
          </Link>
        </div>
      </main>
    </div>
  );
}
