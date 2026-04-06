import { MobileAccordion } from "@/components/ui/Accordion";

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

interface LaneGroup {
  lane: string;
  label: string;
  color: string;
  completedTasks: { title: string; effortMins: number; actualMinutes: number | null }[];
  totalEstimated: number;
  totalActual: number;
  requiredMinutes: number;
}

interface BlockSummary {
  type: string;
  label: string;
  total: number;
  completed: number;
  partial: number;
  skipped: number;
  avgEnergy: number | null;
}

interface Props {
  weekLabel: string;
  lanes: LaneGroup[];
  blocks: BlockSummary[];
  totalTasks: number;
  completedTasks: number;
  bumpedTasks: number;
  overallAccuracy: number | null;
}

export default function WeeklyReport({ weekLabel, lanes, blocks, totalTasks, completedTasks, bumpedTasks, overallAccuracy }: Props) {
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-12">

      {/* Summary header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border border-border rounded p-5 text-center">
          <p className="font-serif text-3xl font-bold" style={{ color: "#1B4332" }}>{completedTasks}</p>
          <p className="font-sans text-xs text-muted mt-1">Tasks Done</p>
        </div>
        <div className="border border-border rounded p-5 text-center">
          <p className="font-serif text-3xl font-bold">{completionRate}%</p>
          <p className="font-sans text-xs text-muted mt-1">Completion Rate</p>
        </div>
        <div className="border border-border rounded p-5 text-center">
          <p className="font-serif text-3xl font-bold" style={{ color: overallAccuracy != null ? (overallAccuracy > 120 ? "#D4AF37" : "#1B4332") : "#5A5A5A" }}>
            {overallAccuracy != null ? `${overallAccuracy}%` : "—"}
          </p>
          <p className="font-sans text-xs text-muted mt-1">Estimation Accuracy</p>
        </div>
        <div className="border border-border rounded p-5 text-center">
          <p className="font-serif text-3xl font-bold" style={{ color: bumpedTasks > 0 ? "#D4AF37" : "#5A5A5A" }}>{bumpedTasks}</p>
          <p className="font-sans text-xs text-muted mt-1">Tasks Bumped</p>
        </div>
      </div>

      {/* Wins — completed tasks by lane */}
      <section>
        <MobileAccordion title="Wins">
          <p className="font-sans text-xs uppercase tracking-widest text-muted font-semibold mb-4">Wins</p>
          <div className="space-y-4">
            {lanes.filter(l => l.completedTasks.length > 0).map(lane => (
              <div key={lane.lane}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lane.color }} />
                  <p className="font-sans text-sm font-semibold">{lane.label}</p>
                  <p className="font-sans text-xs text-muted">
                    {lane.completedTasks.length} tasks · {lane.totalEstimated}m est
                    {lane.totalActual > 0 && ` · ${lane.totalActual}m actual`}
                  </p>
                </div>
                <div className="space-y-1 ml-4">
                  {lane.completedTasks.map((t, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                      <span className="font-sans text-sm text-foreground">{t.title}</span>
                      <span className="font-sans text-xs text-muted">
                        {t.effortMins}m{t.actualMinutes != null && ` → ${t.actualMinutes}m`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </MobileAccordion>
      </section>

      {/* Misses — lanes below target */}
      <section>
        <MobileAccordion title="Misses">
          <p className="font-sans text-xs uppercase tracking-widest text-muted font-semibold mb-4">Misses</p>
          <div className="space-y-3">
            {lanes.filter(l => l.totalEstimated < l.requiredMinutes).map(lane => {
              const deficit = lane.requiredMinutes - lane.totalEstimated;
              const pct = Math.round((lane.totalEstimated / lane.requiredMinutes) * 100);
              return (
                <div key={lane.lane} className="border border-border rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lane.color }} />
                      <span className="font-sans text-sm font-semibold">{lane.label}</span>
                    </div>
                    <span className="font-sans text-xs font-semibold" style={{ color: "#D4AF37" }}>
                      {deficit}m short
                    </span>
                  </div>
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: lane.color }} />
                  </div>
                  <p className="font-sans text-xs text-muted mt-1">{lane.totalEstimated}m / {lane.requiredMinutes}m</p>
                </div>
              );
            })}
            {lanes.every(l => l.totalEstimated >= l.requiredMinutes) && (
              <p className="font-sans text-sm text-muted italic">All lanes hit their targets this week.</p>
            )}
          </div>
        </MobileAccordion>
      </section>

      {/* Block Utilization */}
      <section>
        <MobileAccordion title="Block Utilization">
          <p className="font-sans text-xs uppercase tracking-widest text-muted font-semibold mb-4">Block Utilization</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {blocks.filter(b => b.total > 0).map(b => (
              <div key={b.type} className="border border-border rounded p-4">
                <p className="font-sans text-sm font-semibold mb-2">{b.label}</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-sans text-xs text-muted">Total</span>
                    <span className="font-sans text-xs font-semibold">{b.total}</span>
                  </div>
                  {b.completed > 0 && (
                    <div className="flex justify-between">
                      <span className="font-sans text-xs" style={{ color: "#1B4332" }}>Completed</span>
                      <span className="font-sans text-xs font-semibold">{b.completed}</span>
                    </div>
                  )}
                  {b.partial > 0 && (
                    <div className="flex justify-between">
                      <span className="font-sans text-xs" style={{ color: "#D4AF37" }}>Partial</span>
                      <span className="font-sans text-xs font-semibold">{b.partial}</span>
                    </div>
                  )}
                  {b.skipped > 0 && (
                    <div className="flex justify-between">
                      <span className="font-sans text-xs text-muted">Skipped</span>
                      <span className="font-sans text-xs font-semibold">{b.skipped}</span>
                    </div>
                  )}
                  {b.avgEnergy != null && (
                    <div className="flex justify-between border-t border-border pt-1 mt-1">
                      <span className="font-sans text-xs text-muted">Avg Energy</span>
                      <span className="font-sans text-xs font-semibold">{b.avgEnergy.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </MobileAccordion>
      </section>
    </div>
  );
}
