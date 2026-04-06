"use client";

import { useTransition, useState } from "react";
import { updateIbmChecklistAction } from "@/app/actions";

interface IbmState {
  ibmFollowUpDone: boolean;
  ibmOutreachDone: boolean;
  ibmDeepDiveDone: boolean;
  ibmRelationshipDone: boolean;
}

const BEHAVIORS = [
  {
    field: "ibmFollowUpDone" as const,
    label: "Follow-up",
    detail: "1 outstanding follow-up sent or actioned",
  },
  {
    field: "ibmOutreachDone" as const,
    label: "Proactive Outreach",
    detail: "1 targeted outreach message sent",
  },
  {
    field: "ibmDeepDiveDone" as const,
    label: "Technical Deep Dive",
    detail: "1 issue investigated or sprint ticket advanced",
  },
  {
    field: "ibmRelationshipDone" as const,
    label: "Relationship Touch",
    detail: "1 meaningful check-in with teammate or stakeholder",
  },
];

export default function IbmChecklist({ initial }: { initial: IbmState }) {
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();

  const toggle = (field: keyof IbmState) => {
    const next = !state[field];
    setState(prev => ({ ...prev, [field]: next }));
    startTransition(async () => {
      await updateIbmChecklistAction(field, next);
    });
  };

  const done = Object.values(state).filter(Boolean).length;

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <p className="font-sans text-xs uppercase tracking-widest text-muted font-semibold">IBM Daily Behaviors</p>
        <span className={`font-sans text-xs font-bold ${done === 4 ? "text-primary" : "text-muted"}`}>
          {done}/4
        </span>
      </div>
      <div className="space-y-2">
        {BEHAVIORS.map(({ field, label, detail }) => {
          const checked = state[field];
          return (
            <button
              key={field}
              onClick={() => toggle(field)}
              disabled={pending}
              className="w-full flex items-start gap-3 text-left group"
            >
              <div className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                checked ? "border-primary bg-primary" : "border-border group-hover:border-foreground/40"
              }`}>
                {checked && (
                  <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-white">
                    <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <div>
                <p className={`font-sans text-sm transition-colors ${checked ? "text-muted line-through" : "text-foreground"}`}>
                  {label}
                </p>
                <p className="font-sans text-xs text-muted">{detail}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
