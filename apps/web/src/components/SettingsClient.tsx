"use client";

import { useState, useTransition } from "react";
import { updateWeeklyConstraintAction, updateDailyIntentAction } from "@/app/actions";
import Link from "next/link";
import Dropdown from "@/components/ui/Dropdown";
import Slider from "@/components/ui/Slider";
import { MobileAccordion } from "@/components/ui/Accordion";

const LANES = ["REVENUE", "ASSET", "LEVERAGE", "HEALTH"] as const;
const LANE_LABELS: Record<string, string> = {
  REVENUE: "Revenue",
  ASSET: "Asset Building",
  LEVERAGE: "Leverage",
  HEALTH: "Health",
};

export default function SettingsClient({
  workspace,
  constraints,
  intent,
}: {
  workspace: any;
  constraints: any[];
  intent: any;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  // Weekly Constraints state
  const [constraintValues, setConstraintValues] = useState<Record<string, { minimumMinutes: number; minimumSessions: number }>>(
    Object.fromEntries(
      LANES.map(lane => {
        const existing = constraints.find((c: any) => c.lane === lane);
        return [lane, { minimumMinutes: existing?.minimumMinutes ?? 300, minimumSessions: existing?.minimumSessions ?? 3 }];
      })
    )
  );

  // Daily Intent state
  const [intentValues, setIntentValues] = useState({
    mustAdvanceRevenue: intent?.mustAdvanceRevenue ?? true,
    mustExecuteDeepWork: intent?.mustExecuteDeepWork ?? true,
    mustTrain: intent?.mustTrain ?? true,
    mustProtectFamily: intent?.mustProtectFamily ?? true,
  });

  const handleSaveConstraints = () => {
    startTransition(async () => {
      for (const lane of LANES) {
        await updateWeeklyConstraintAction({
          lane,
          ...constraintValues[lane],
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleSaveIntent = () => {
    startTransition(async () => {
      await updateDailyIntentAction(intentValues);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const inputClass = "bg-background border border-border rounded px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary transition-colors w-28 text-center";
  const labelClass = "block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider";

  return (
    <div className="space-y-12">

      {/* Today's Non-Negotiables */}
      <section>
        <h3 className="font-serif text-xl font-semibold mb-1">Today's Non-Negotiables</h3>
        <p className="font-sans text-sm text-muted mb-6">Control what counts as a required outcome today.</p>
        <div className="space-y-4">
          {[
            { key: "mustAdvanceRevenue", label: "Advance Revenue" },
            { key: "mustExecuteDeepWork", label: "Execute Deep Work" },
            { key: "mustTrain", label: "Complete Health Block" },
            { key: "mustProtectFamily", label: "Protect Family Time" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-4 cursor-pointer group">
              <div
                onClick={() => setIntentValues(v => ({ ...v, [key]: !v[key as keyof typeof v] }))}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${intentValues[key as keyof typeof intentValues] ? "bg-primary" : "bg-border"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${intentValues[key as keyof typeof intentValues] ? "translate-x-5" : "translate-x-0"}`} />
              </div>
              <span className="font-sans text-sm text-foreground group-hover:text-primary transition-colors">{label}</span>
            </label>
          ))}
        </div>
        <button onClick={handleSaveIntent} disabled={pending}
          className="mt-6 font-sans text-sm bg-primary text-primary-foreground px-6 py-2.5 rounded hover:bg-primary/90 transition-colors font-medium disabled:opacity-50">
          {saved ? "Saved ✓" : pending ? "Saving..." : "Save Today's Intent"}
        </button>
      </section>

      <div className="border-t border-border" />

      {/* Weekly Targets */}
      <section>
        <h3 className="font-serif text-xl font-semibold mb-1">Weekly Enforcement Targets</h3>
        <p className="font-sans text-sm text-muted mb-6">Minimum time and sessions required per lane each week. The engine uses these to detect drift.</p>
        <div className="space-y-6">
          {LANES.map(lane => (
            <MobileAccordion key={lane} title={LANE_LABELS[lane]}>
              <div className="flex flex-col gap-6 pt-2">
                <div>
                  <label htmlFor={`constraint-minutes-${lane}`} className={labelClass}>Min Minutes / Week</label>
                  <Slider
                    id={`constraint-minutes-${lane}`}
                    label={`${LANE_LABELS[lane]} minimum minutes per week`}
                    value={constraintValues[lane].minimumMinutes}
                    onChange={(val) => setConstraintValues(v => ({ ...v, [lane]: { ...v[lane], minimumMinutes: val } }))}
                    min={0}
                    max={480}
                    step={15}
                    formatLabel={(v) => {
                      const h = Math.floor(v / 60);
                      const m = v % 60;
                      return h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`;
                    }}
                  />
                </div>
                <div>
                  <label htmlFor={`constraint-sessions-${lane}`} className={labelClass}>Min Sessions / Week</label>
                  <input
                    id={`constraint-sessions-${lane}`}
                    type="number" min="0"
                    value={constraintValues[lane].minimumSessions}
                    onChange={e => setConstraintValues(v => ({ ...v, [lane]: { ...v[lane], minimumSessions: +e.target.value } }))}
                    className={inputClass}
                  />
                </div>
              </div>
            </MobileAccordion>
          ))}
        </div>
        <button onClick={handleSaveConstraints} disabled={pending}
          className="mt-6 font-sans text-sm bg-primary text-primary-foreground px-6 py-2.5 rounded hover:bg-primary/90 transition-colors font-medium disabled:opacity-50">
          {saved ? "Saved ✓" : pending ? "Saving..." : "Save Weekly Targets"}
        </button>
      </section>

      <div className="border-t border-border" />

      {/* Block Templates */}
      <section>
        <h3 className="font-serif text-xl font-semibold mb-1">Block Templates</h3>
        <p className="font-sans text-sm text-muted mb-4">Define the recurring structure of your week.</p>
        <Link href="/settings/templates"
          className="font-sans text-sm border border-border px-6 py-2.5 rounded hover:bg-surface transition-colors inline-block">
          Manage Block Templates →
        </Link>
      </section>

    </div>
  );
}
