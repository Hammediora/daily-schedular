import { db } from "@operator-os/db";
import { getLaneForecast } from "@/lib/lane-forecast";
import FixPlanButton from "@/components/FixPlanButton";

type Lane = "REVENUE" | "ASSET" | "LEVERAGE" | "HEALTH";
type BlockTypeString = "DEEP_WORK" | "EXECUTION" | "IBM" | "HEALTH" | "REVIEW" | "BUILDER" | "FAMILY";

interface LaneStatus {
  lane: Lane;
  completedMinutes: number;
  requiredMinutes: number;
  pct: number;
  behindPace: boolean;
}

interface NonNegotiable {
  label: string;
  required: boolean;
  complete: boolean;
}

// Lane display config
const LANE_META: Record<Lane, { label: string; color: string }> = {
  REVENUE:  { label: "Revenue",  color: "#D4AF37" },
  ASSET:    { label: "Asset",    color: "#1B4332" },
  LEVERAGE: { label: "Leverage", color: "#5A5A5A" },
  HEALTH:   { label: "Health",   color: "#1B4332" },
};

export default async function DailyCommandPanel({ workspaceId }: { workspaceId: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find start of current week (Monday)
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Pull DailyIntent + Lane Forecast
  const [intent, forecast] = await Promise.all([
    db.dailyIntent.findUnique({
      where: { workspaceId_date: { workspaceId, date: today } }
    }),
    getLaneForecast(workspaceId),
  ]);

  // Pull WeeklyConstraints
  const constraints = await db.weeklyConstraint.findMany({
    where: { workspaceId }
  });

  // Pull tasks completed THIS week
  const doneTasks = await db.task.findMany({
    where: {
      workspaceId,
      status: "DONE",
      completedAt: { gte: weekStart, lt: weekEnd }
    }
  });

  // Pull today's completed blocks by type
  const todayInstances = await db.timeBlockInstance.findMany({
    where: { workspaceId, date: today },
    include: {
      scheduledTasks: {
        include: { task: true }
      }
    }
  });

  const todayDoneTasks = doneTasks.filter(t => {
    const completed = t.completedAt;
    return completed && completed >= today;
  });

  // Calculate lane statuses
  const laneStatuses: LaneStatus[] = (["REVENUE", "ASSET", "LEVERAGE", "HEALTH"] as Lane[]).map(lane => {
    const constraint = constraints.find((c: any) => c.lane === lane);
    const requiredMinutes = constraint?.minimumMinutes ?? 300;

    const completedMinutes = doneTasks
      .filter(t => t.lane === lane)
      .reduce((sum, t) => sum + t.effortMins, 0);

    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Mon=1, Sun=7
    const weekFraction = dayOfWeek / 5; // 5-day work week
    const expectedByNow = requiredMinutes * weekFraction;
    const pct = Math.min(100, Math.round((completedMinutes / requiredMinutes) * 100));
    const behindPace = completedMinutes < expectedByNow * 0.8; // 20% tolerance

    return { lane, completedMinutes, requiredMinutes, pct, behindPace };
  });

  // Non-negotiable status
  const deepWorkDone = todayInstances.some(b =>
    (b.type as BlockTypeString) === "DEEP_WORK" && b.scheduledTasks.some(st => st.task.status === "DONE")
  );
  const healthDone = todayInstances.some(b => (b.type as BlockTypeString) === "HEALTH");
  const revenueDone = todayDoneTasks.some(t => t.lane === "REVENUE");
  const familyBlock = todayInstances.some(b => (b.type as BlockTypeString) === "FAMILY");

  const nonNegotiables: NonNegotiable[] = [
    { label: "Deep Work Session", required: intent?.mustExecuteDeepWork ?? true, complete: deepWorkDone },
    { label: "Revenue Advanced", required: intent?.mustAdvanceRevenue ?? true, complete: revenueDone },
    { label: "Health Block", required: intent?.mustTrain ?? true, complete: healthDone },
    { label: "Family Time Protected", required: intent?.mustProtectFamily ?? true, complete: familyBlock },
  ];

  // Required outcomes (3 max)
  const requiredOutcomes = [
    intent?.mustAdvanceRevenue && "Advance Revenue",
    intent?.mustExecuteDeepWork && "Execute Deep Work",
    intent?.mustTrain && "Complete Health Block",
  ].filter(Boolean) as string[];

  // Closure check
  const allNonNegsDone = nonNegotiables.filter(n => n.required).every(n => n.complete);

  const hourNow = new Date().getHours() + new Date().getMinutes() / 60;
  const isEndOfDay = hourNow >= 21.5;

  return (
    <div className="mb-12 space-y-8">

      {/* Closure State */}
      {allNonNegsDone && (
        <div className="py-6 text-center border-b border-border">
          <p
            className="font-serif text-2xl font-semibold tracking-wide"
            style={{ borderBottom: "1px solid #D4AF37", display: "inline-block", paddingBottom: "4px" }}
          >
            Operator day complete.
          </p>
        </div>
      )}

      {/* Required Outcomes */}
      <div>
        <p className="font-sans text-xs uppercase tracking-widest text-muted mb-4 font-semibold">
          Today's Required Outcomes
        </p>
        <div className="flex flex-wrap gap-3">
          {requiredOutcomes.map((outcome) => (
            <span
              key={outcome}
              className="font-sans text-sm font-medium px-4 py-2 border border-border rounded bg-surface"
            >
              {outcome}
            </span>
          ))}
        </div>
      </div>

      {/* Non-Negotiables */}
      <div>
        <p className="font-sans text-xs uppercase tracking-widest text-muted mb-4 font-semibold">
          Non-Negotiables
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {nonNegotiables.map((item) => (
            <div
              key={item.label}
              className="border border-border rounded p-3 flex items-center gap-3"
              style={{
                backgroundColor: item.complete ? "rgba(27,67,50,0.05)" : "rgba(244,235,220,0.5)",
              }}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: item.complete ? "#1B4332" : "#D4AF37",
                }}
              />
              <p
                className="font-sans text-xs font-medium leading-snug"
                style={{
                  color: item.complete ? "#1B4332" : "#5A5A5A",
                  textDecoration: item.complete ? "none" : "underline",
                  textDecorationColor: "#D4AF37",
                  textUnderlineOffset: "2px",
                }}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Lane Performance */}
      <div>
        <p className="font-sans text-xs uppercase tracking-widest text-muted mb-4 font-semibold">
          Lane Performance — This Week
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {laneStatuses.map(({ lane, pct, completedMinutes, requiredMinutes, behindPace }) => (
            <div key={lane} className="space-y-2">
              <div className="flex justify-between items-baseline">
                <p className="font-sans text-xs font-semibold text-foreground">
                  {LANE_META[lane].label}
                </p>
                <p className="font-sans text-xs text-muted">{pct}%</p>
              </div>
              {/* Track */}
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: LANE_META[lane].color,
                  }}
                />
              </div>
              <p className="font-sans text-xs text-muted">
                {completedMinutes}m / {requiredMinutes}m
                {behindPace && pct < 100 && (
                  <span style={{ color: "#D4AF37", marginLeft: "6px" }}>· Behind pace</span>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Lane Forecast — shortfall alerts */}
      {forecast.some(f => f.status !== "on_track") && (
        <div>
          <p className="font-sans text-xs uppercase tracking-widest text-muted mb-4 font-semibold">
            Projected Shortfalls
          </p>
          <div className="space-y-2">
            {forecast.filter(f => f.status !== "on_track").map(f => (
              <div key={f.lane} className="flex items-center justify-between border border-border rounded p-3"
                style={{
                  backgroundColor: f.status === "will_miss" ? "rgba(212,175,55,0.06)" : "rgba(90,90,90,0.04)",
                  borderColor: f.status === "will_miss" ? "#D4AF3730" : undefined,
                }}>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.color }} />
                  <span className="font-sans text-sm font-semibold">{f.label}</span>
                  <span className="font-sans text-xs text-muted">
                    Need {f.remainingRequired}m more
                    {f.projectedShortfall > 0 && ` · Shortfall: ${f.projectedShortfall}m`}
                  </span>
                </div>
                <span className="font-sans text-xs font-semibold px-2 py-0.5 rounded" style={{
                  color: f.status === "will_miss" ? "#D4AF37" : "#5A5A5A",
                  backgroundColor: f.status === "will_miss" ? "#D4AF3715" : "#5A5A5A10",
                }}>
                  {f.status === "will_miss" ? "Will Miss" : "At Risk"}
                </span>
              </div>
            ))}
          </div>
          <FixPlanButton hasShortfall={forecast.some(f => f.projectedShortfall > 0)} />
        </div>
      )}

      {/* End of Day Review trigger */}
      {isEndOfDay && !allNonNegsDone && (
        <div className="border border-border rounded p-5 bg-surface">
          <p className="font-serif text-base font-semibold mb-1">Daily Review</p>
          <p className="font-sans text-sm text-muted">
            Some non-negotiables were not completed today. Reflect briefly and set tomorrow's direction.
          </p>
        </div>
      )}

    </div>
  );
}
