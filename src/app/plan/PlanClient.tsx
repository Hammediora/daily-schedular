"use client";

import { useState, useTransition } from "react";
import { generateWeekScheduleAction } from "./actions";
import { submitDailyReviewAction } from "@/app/actions";

const LANE_COLORS: Record<string, string> = {
  REVENUE: "#D4AF37", ASSET: "#1B4332", LEVERAGE: "#5A5A5A", HEALTH: "#8B4513",
};

interface WeekStat {
  lane: string;
  label: string;
  completed: number;
  required: number;
  pct: number;
  sessionsCompleted: number;
}

interface NextWeekPreview {
  day: string;
  date: string;
  blocks: { type: string; label: string; tasks: number }[];
}

export default function PlanClient({
  thisWeekStats,
  lastWeekStats,
  nextWeekPreview,
  weekLabel,
  nextWeekLabel,
}: {
  thisWeekStats: WeekStat[];
  lastWeekStats: WeekStat[];
  nextWeekPreview: NextWeekPreview[];
  weekLabel: string;
  nextWeekLabel: string;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ daysPlanned: number; totalBlocksCreated: number; totalTasksScheduled: number } | null>(null);
  const [reflections, setReflections] = useState("");

  const thisWeekScore = Math.round(thisWeekStats.reduce((s, l) => s + l.pct, 0) / thisWeekStats.length);
  const lastWeekScore = Math.round(lastWeekStats.reduce((s, l) => s + l.pct, 0) / lastWeekStats.length);
  const delta = thisWeekScore - lastWeekScore;

  const handleGenerate = () => {
    startTransition(async () => {
      const r = await generateWeekScheduleAction();
      if (r.success) {
        setResult({ daysPlanned: r.daysPlanned, totalBlocksCreated: r.totalBlocksCreated, totalTasksScheduled: r.totalTasksScheduled });
      }
    });
  };

  const BLOCK_LABELS: Record<string, string> = {
    DEEP_WORK: "Deep Work", EXECUTION: "Execution", IBM: "IBM",
    HEALTH: "Health", REVIEW: "Review", BUILDER: "Builder", FAMILY: "Family",
  };

  return (
    <div className="space-y-16">

      {/* === SECTION 1: THIS WEEK REVIEW === */}
      <section>
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <p className="font-sans text-xs uppercase tracking-widest text-muted font-semibold mb-1">Week of {weekLabel}</p>
            <h3 className="font-serif text-2xl font-semibold">This Week's Execution</h3>
          </div>
          <div className="flex items-baseline gap-3">
            {lastWeekScore > 0 && (
              <span className="font-sans text-xs text-muted">Last week: {lastWeekScore}</span>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-4xl font-bold" style={{ color: thisWeekScore >= 70 ? "#1B4332" : "#D4AF37" }}>
                {thisWeekScore}
              </span>
              {delta !== 0 && (
                <span className="font-sans text-sm font-bold" style={{ color: delta > 0 ? "#1B4332" : "#D4AF37" }}>
                  {delta > 0 ? "↑" : "↓"}{Math.abs(delta)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {thisWeekStats.map(stat => {
            const last = lastWeekStats.find(l => l.lane === stat.lane);
            const d = stat.pct - (last?.pct ?? 0);
            return (
              <div key={stat.lane} className="bg-surface border border-border rounded p-5">
                <div className="flex justify-between items-start mb-3">
                  <p className="font-sans text-sm font-semibold">{stat.label}</p>
                  <div className="text-right">
                    <div className="flex items-baseline gap-1">
                      <span className="font-sans text-lg font-bold">{stat.pct}%</span>
                      {d !== 0 && (
                        <span className="font-sans text-xs font-bold" style={{ color: d > 0 ? "#1B4332" : "#D4AF37" }}>
                          {d > 0 ? "↑" : "↓"}{Math.abs(d)}
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-xs text-muted">{stat.completed}m / {stat.required}m</p>
                  </div>
                </div>
                <div className="relative h-1.5 bg-border rounded-full overflow-hidden">
                  {last && last.pct > 0 && (
                    <div className="absolute h-full rounded-full opacity-20"
                      style={{ width: `${last.pct}%`, backgroundColor: LANE_COLORS[stat.lane] }} />
                  )}
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${stat.pct}%`, backgroundColor: LANE_COLORS[stat.lane] ?? "#5A5A5A" }} />
                </div>
                <p className="font-sans text-xs text-muted mt-2">{stat.sessionsCompleted} sessions completed</p>
              </div>
            );
          })}
        </div>

        {/* Reflection box */}
        <div className="mt-6">
          <label className="font-sans text-xs uppercase tracking-widest text-muted font-semibold block mb-2">
            Weekly Reflection
          </label>
          <textarea
            value={reflections}
            onChange={e => setReflections(e.target.value)}
            onBlur={() => {
              if (reflections.trim()) {
                startTransition(async () => {
                  await submitDailyReviewAction(reflections);
                });
              }
            }}
            rows={4}
            placeholder="What moved? What stalled? What will be different next week?"
            className="w-full bg-surface border border-border rounded p-4 font-sans text-sm text-foreground placeholder-muted resize-none focus:outline-none focus:border-primary"
          />
        </div>
      </section>

      {/* === SECTION 2: NEXT WEEK PREVIEW === */}
      <section>
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <p className="font-sans text-xs uppercase tracking-widest text-muted font-semibold mb-1">Planning · {nextWeekLabel}</p>
            <h3 className="font-serif text-2xl font-semibold">Next Week's Schedule</h3>
          </div>
        </div>

        {/* Week grid preview */}
        <div className="grid grid-cols-7 gap-2 mb-8">
          {nextWeekPreview.map(({ day, date, blocks }) => (
            <div key={date} className="space-y-1.5">
              <div className="text-center mb-2">
                <p className="font-sans text-xs text-muted uppercase tracking-widest">{day}</p>
                <p className="font-sans text-sm font-bold mt-0.5">{date}</p>
              </div>
              {blocks.length === 0 ? (
                <div className="h-12 border border-dashed border-border rounded opacity-30" />
              ) : (
                blocks.map((b, i) => (
                  <div key={i} className="border border-border rounded p-1.5 text-xs font-sans"
                    style={{ borderLeft: "2px solid #1B4332" }}>
                    <p className="font-semibold text-foreground truncate">{b.label}</p>
                    {b.tasks > 0 && <p className="text-muted">{b.tasks} tasks</p>}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>

        {/* Generate button */}
        {result ? (
          <div className="border border-border rounded p-6 text-center" style={{ backgroundColor: "rgba(27,67,50,0.04)" }}>
            <p className="font-sans text-sm font-semibold mb-1" style={{ color: "#1B4332" }}>
              Next week scheduled ✓
            </p>
            <p className="font-sans text-xs text-muted">
              {result.totalBlocksCreated} blocks created across {result.daysPlanned} days · {result.totalTasksScheduled} tasks placed
            </p>
          </div>
        ) : (
          <div className="border border-dashed border-border rounded p-8 text-center">
            <p className="font-sans text-sm text-muted mb-4">
              Generate next week's blocks from your templates and schedule your backlog tasks automatically.
            </p>
            <button
              onClick={handleGenerate}
              disabled={pending}
              className="font-sans text-sm font-semibold bg-primary text-primary-foreground px-8 py-3 rounded disabled:opacity-40 transition-opacity"
            >
              {pending ? "Generating schedule..." : "Generate Next Week →"}
            </button>
          </div>
        )}
      </section>

    </div>
  );
}
