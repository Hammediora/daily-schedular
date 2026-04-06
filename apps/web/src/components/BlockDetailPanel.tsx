"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import {
  updateBlockObjectiveAction,
  updateBlockParkingLotAction,
  createTaskStepAction,
  toggleTaskStepAction,
  deleteTaskStepAction,
} from "@/app/actions";
import BlockCompletionModal from "@/components/BlockCompletionModal";

interface Step {
  id: string;
  description: string;
  isComplete: boolean;
  orderIndex: number;
}

interface NowTask {
  id: string;
  title: string;
  notes?: string | null;
  effortMins: number;
  lane: string;
  project: string;
  steps: Step[];
}

interface Props {
  blockId: string;
  workspaceId: string;
  blockType: string;
  blockLabel: string;
  minutesRemaining: number;
  objective: string | null;
  parkingLotNotes: string | null;
  nowTask: NowTask | null;
  isActive: boolean;
}

function pad(n: number) { return n.toString().padStart(2, "0"); }

export default function BlockDetailPanel({
  blockId, workspaceId, blockType, blockLabel, minutesRemaining,
  objective: initialObjective,
  parkingLotNotes: initialParking,
  nowTask,
  isActive,
}: Props) {
  const [open, setOpen] = useState(isActive); // auto-open for current block
  const [pending, startTransition] = useTransition();
  const [objective, setObjective] = useState(initialObjective ?? "");
  const [parking, setParking] = useState(initialParking ?? "");
  const [newStep, setNewStep] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [rescheduleMsg, setRescheduleMsg] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  const timerDisplay = `${pad(Math.floor(timerSeconds / 3600))}:${pad(Math.floor((timerSeconds % 3600) / 60))}:${pad(timerSeconds % 60)}`;

  const saveObjective = () => {
    startTransition(async () => {
      await updateBlockObjectiveAction(blockId, objective);
    });
  };

  const saveParking = () => {
    startTransition(async () => {
      await updateBlockParkingLotAction(blockId, parking);
    });
  };

  const addStep = () => {
    if (!newStep.trim() || !nowTask) return;
    const desc = newStep.trim();
    setNewStep("");
    startTransition(async () => {
      await createTaskStepAction(nowTask.id, desc);
    });
  };

  const toggleStep = (stepId: string, cur: boolean) => {
    startTransition(async () => {
      await toggleTaskStepAction(stepId, !cur);
    });
  };

  const deleteStep = (stepId: string) => {
    startTransition(async () => {
      await deleteTaskStepAction(stepId);
    });
  };

  const handleBlockComplete = (msg?: string) => {
    setShowCompletionModal(false);
    if (msg) setRescheduleMsg(msg);
    setTimeout(() => setRescheduleMsg(null), 4000);
  };

  const LANE_COLORS: Record<string, string> = {
    REVENUE: "#D4AF37", ASSET: "#1B4332", LEVERAGE: "#5A5A5A", HEALTH: "#8B4513",
  };

  return (
    <div className="mt-1">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 font-sans text-xs text-muted hover:text-foreground transition-colors py-1"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▸</span>
        Operator Detail
      </button>

      {open && (
        <div className="mt-3 border border-border rounded p-5 space-y-5 font-sans text-sm"
          style={{ backgroundColor: "rgba(241,236,228,0.3)" }}>

          {/* Header row — active timer */}
          {isActive && (
            <div className="flex flex-col gap-3 pb-3 border-b border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setTimerRunning(r => !r)}
                    className="font-sans text-xs font-semibold border border-border rounded px-3 py-1 hover:bg-surface transition-colors"
                  >
                    {timerRunning ? "⏸ Pause" : "▶ Start"}
                  </button>
                  <span className="font-mono text-sm text-foreground">{timerDisplay}</span>
                </div>
                <span className="text-muted text-xs">{minutesRemaining}m remaining</span>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/now?blockId=${blockId}`}
                  className="font-sans text-xs font-semibold border border-border rounded px-3 py-1 hover:bg-surface transition-colors flex-1 text-center sm:flex-none sm:text-left">
                  Now Mode →
                </Link>
                <button
                  onClick={() => setShowCompletionModal(true)}
                  disabled={pending}
                  className="font-sans text-xs font-semibold text-white rounded px-3 py-1 disabled:opacity-40 flex-1 sm:flex-none"
                  style={{ backgroundColor: "#1B4332" }}
                >
                  Complete Block →
                </button>
              </div>
            </div>
          )}

          {/* Objective */}
          <div>
            <label className="text-xs uppercase tracking-widest text-muted font-semibold block mb-1.5">
              Primary Objective
            </label>
            <textarea
              rows={2}
              value={objective}
              onChange={e => setObjective(e.target.value)}
              onBlur={saveObjective}
              placeholder="What must be true at the end of this block?"
              className="w-full bg-transparent border border-border rounded p-2.5 text-sm text-foreground placeholder-muted resize-none focus:outline-none focus:border-foreground/40 transition-colors"
            />
          </div>

          {/* Now Task */}
          {nowTask ? (
            <div>
              <label className="text-xs uppercase tracking-widest text-muted font-semibold block mb-1.5">
                Now Task
              </label>
              <div className="border border-border rounded p-3" style={{ borderLeft: `3px solid ${LANE_COLORS[nowTask.lane] ?? "#5A5A5A"}` }}>
                <p className="font-semibold text-foreground">{nowTask.title}</p>
                <p className="text-xs text-muted mt-0.5">{nowTask.project} · {nowTask.effortMins}m</p>
                {nowTask.notes && (
                  <p className="text-xs text-muted mt-1 italic border-t border-border pt-1">{nowTask.notes}</p>
                )}
              </div>

              {/* Steps */}
              <div className="mt-3">
                <label className="text-xs uppercase tracking-widest text-muted font-semibold block mb-2">
                  Steps {nowTask.steps.length > 0 && `· ${nowTask.steps.filter(s => s.isComplete).length}/${nowTask.steps.length}`}
                </label>
                {nowTask.steps.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {nowTask.steps.map(step => (
                      <div key={step.id} className="flex items-center gap-2 group">
                        <button onClick={() => toggleStep(step.id, step.isComplete)} disabled={pending}
                          className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all
                            ${step.isComplete ? "border-primary bg-primary" : "border-border hover:border-foreground/40"}`}>
                          {step.isComplete && (
                            <svg viewBox="0 0 10 8" className="w-2.5 h-2.5">
                              <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                            </svg>
                          )}
                        </button>
                        <span className={`flex-1 text-sm ${step.isComplete ? "text-muted line-through" : "text-foreground"}`}>
                          {step.description}
                        </span>
                        <button onClick={() => deleteStep(step.id)} disabled={pending}
                          className="opacity-0 group-hover:opacity-100 text-muted hover:text-foreground text-xs transition-opacity">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={newStep}
                    onChange={e => setNewStep(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addStep()}
                    placeholder="Add step… (Enter)"
                    className="flex-1 bg-transparent border border-border rounded px-2.5 py-1.5 text-xs text-foreground placeholder-muted focus:outline-none focus:border-foreground/40"
                  />
                  <button onClick={addStep} disabled={!newStep.trim() || pending}
                    className="font-sans text-xs border border-border rounded px-3 py-1.5 hover:bg-surface disabled:opacity-30 transition-colors">
                    + Add
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs uppercase tracking-widest text-muted font-semibold block mb-1.5">Now Task</label>
              <p className="text-sm text-muted italic">All tasks complete in this block.</p>
            </div>
          )}

          {/* Parking Lot */}
          <div>
            <label className="text-xs uppercase tracking-widest text-muted font-semibold block mb-1.5">
              Parking Lot
            </label>
            <textarea
              rows={2}
              value={parking}
              onChange={e => setParking(e.target.value)}
              onBlur={saveParking}
              placeholder="Capture distractions here. Return to them later."
              className="w-full bg-transparent border border-border rounded p-2.5 text-xs text-foreground placeholder-muted resize-none focus:outline-none focus:border-foreground/40 transition-colors"
            />
          </div>

          {/* Reschedule message */}
          {rescheduleMsg && (
            <p className="text-xs font-semibold text-center animate-pulse" style={{ color: "#D4AF37" }}>
              {rescheduleMsg}
            </p>
          )}
        </div>
      )}

      {/* Block Completion Modal */}
      {showCompletionModal && (
        <BlockCompletionModal
          blockId={blockId}
          workspaceId={workspaceId}
          blockLabel={blockLabel}
          onDone={handleBlockComplete}
          onCancel={() => setShowCompletionModal(false)}
        />
      )}
    </div>
  );
}
