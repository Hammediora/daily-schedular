"use client";

import { useState, useTransition } from "react";
import { generateWeekScheduleAction } from "./actions";
import { submitDailyReviewAction } from "@/app/actions";
import { MobileAccordion } from "@/components/ui/Accordion";

const LANE_PROGRESS_CLASSES: Record<string, string> = {
  REVENUE: "text-accent",
  ASSET: "text-primary",
  LEVERAGE: "text-muted",
  HEALTH: "text-primary",
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
              <span className={`font-serif text-4xl font-bold ${thisWeekScore >= 70 ? "text-primary" : "text-accent"}`}>
                {thisWeekScore}
              </span>
              {delta !== 0 && (
                <span className={`font-sans text-sm font-bold ${delta > 0 ? "text-primary" : "text-accent"}`}>
                  {delta > 0 ? "↑" : "↓"}{Math.abs(delta)}
                </span>
              )}
            </div>
          </div>
        </div>

        <MobileAccordion title="This Week">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          <span className={`font-sans text-xs font-bold ${d > 0 ? "text-primary" : "text-accent"}`}>
                            {d > 0 ? "↑" : "↓"}{Math.abs(d)}
                          </span>
                        )}
                      </div>
                      <p className="font-sans text-xs text-muted">{stat.completed}m / {stat.required}m</p>
                    </div>
                  </div>
                  <progress
                    className={`w-full h-1.5 rounded-full overflow-hidden ${LANE_PROGRESS_CLASSES[stat.lane] ?? "text-muted"}`}
                    max={100}
                    value={stat.pct}
                  />
                  <p className="font-sans text-xs text-muted mt-2">{stat.sessionsCompleted} sessions completed</p>
                </div>
              );
            })}
          </div>
        </MobileAccordion>

        {/* Reflection box */}
        <MobileAccordion title="Reflection">
          <div className="mt-2">
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
        </MobileAccordion>
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
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-8">
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
                  <div key={i} className="border border-border border-l-2 border-l-primary rounded p-1.5 text-xs font-sans">
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
          <div className="border border-border rounded p-6 text-center bg-primary/5">
            <p className="font-sans text-sm font-semibold mb-1 text-primary">
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
