"use client";

import { useState, useTransition } from "react";
import { updateWeekOutcomesAction } from "@/app/actions";

interface Props {
  initial: { outcome1: string; outcome2: string; outcome3: string };
}

export default function WeekOutcomesForm({ initial }: Props) {
  const [pending, startTransition] = useTransition();
  const [o1, setO1] = useState(initial.outcome1);
  const [o2, setO2] = useState(initial.outcome2);
  const [o3, setO3] = useState(initial.outcome3);
  const [saved, setSaved] = useState(false);

  const save = () => {
    startTransition(async () => {
      await updateWeekOutcomesAction(o1 || "", o2 || "", o3 || "");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div>
      <p className="font-sans text-xs uppercase tracking-widest text-muted font-semibold mb-3">
        Top 3 Weekly Outcomes
      </p>
      <div className="space-y-2">
        {[
          { value: o1, set: setO1, num: 1 },
          { value: o2, set: setO2, num: 2 },
          { value: o3, set: setO3, num: 3 },
        ].map(({ value, set, num }) => (
          <div key={num} className="flex items-center gap-3">
            <span className="font-serif text-lg font-bold text-muted w-6 text-right">{num}</span>
            <input
              value={value}
              onChange={e => set(e.target.value)}
              onBlur={save}
              placeholder={`Outcome ${num}...`}
              className="flex-1 bg-surface border border-border rounded px-3 py-2 font-sans text-sm text-foreground placeholder-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        ))}
      </div>
      {saved && (
        <p className="font-sans text-xs text-muted mt-2 animate-pulse">Saved</p>
      )}
    </div>
  );
}
