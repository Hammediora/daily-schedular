"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  toggleTaskStepAction,
  createTaskStepAction,
  completeTaskAction,
  updateBlockParkingLotAction,
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
  blockLabel: string;
  blockType: string;
  minutesRemaining: number;
  objective: string | null;
  parkingLotNotes: string | null;
  nowTask: NowTask | null;
}

function pad(n: number) { return n.toString().padStart(2, "0"); }

const LANE_COLORS: Record<string, string> = {
  REVENUE: "#D4AF37", ASSET: "#1B4332", LEVERAGE: "#5A5A5A", HEALTH: "#8B4513",
};

export default function NowModeClient({
  blockId, workspaceId, blockLabel, blockType, minutesRemaining,
  objective, parkingLotNotes: initialParking, nowTask,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [parking, setParking] = useState(initialParking ?? "");
  const [newStep, setNewStep] = useState("");
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [rescheduleMsg, setRescheduleMsg] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Block countdown
  const [blockCountdown, setBlockCountdown] = useState(minutesRemaining * 60);
  useEffect(() => {
    const i = setInterval(() => setBlockCountdown(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(i);
  }, []);

  // Focus timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  const focusDisplay = `${pad(Math.floor(timerSeconds / 3600))}:${pad(Math.floor((timerSeconds % 3600) / 60))}:${pad(timerSeconds % 60)}`;
  const blockDisplay = `${pad(Math.floor(blockCountdown / 3600))}:${pad(Math.floor((blockCountdown % 3600) / 60))}:${pad(blockCountdown % 60)}`;

  const toggleStep = (stepId: string, cur: boolean) => {
    startTransition(async () => {
      await toggleTaskStepAction(stepId, !cur);
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

  const markTaskDone = () => {
    if (!nowTask) return;
    const actual = timerSeconds > 0 ? Math.round(timerSeconds / 60) : undefined;
    startTransition(async () => {
      await completeTaskAction(nowTask.id, actual);
      setTimerSeconds(0);
      setTimerRunning(false);
    });
  };

  const handleBlockComplete = (msg?: string) => {
    setShowCompletionModal(false);
    // Save parking lot before leaving
    startTransition(async () => {
      await updateBlockParkingLotAction(blockId, parking);
      if (msg) setRescheduleMsg(msg);
      // Brief delay so user can see reschedule message
      setTimeout(() => router.push("/"), msg ? 1500 : 0);
    });
  };

  const saveParking = () => {
    startTransition(async () => {
      await updateBlockParkingLotAction(blockId, parking);
    });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0F0F0F", color: "#F1EAE4" }}>

      {/* Exit bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: "#1C1C1C" }}>
        <button
          onClick={() => router.push("/")}
          className="font-sans text-xs text-muted hover:text-foreground transition-colors"
          style={{ color: "#666" }}
        >
          ← Exit Now Mode
        </button>
        <p className="font-mono text-xs" style={{ color: "#666" }}>
          Block ends in {blockDisplay}
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 max-w-2xl mx-auto w-full py-12 space-y-10">

        {/* Block label */}
        <div className="text-center">
          <p className="font-sans text-xs uppercase tracking-widest mb-2" style={{ color: "#666" }}>{blockLabel}</p>
          {objective && (
            <p className="font-sans text-base" style={{ color: "#A0A0A0" }}>{objective}</p>
          )}
        </div>

        {/* Now Task */}
        {nowTask ? (
          <div className="w-full">
            <p className="font-sans text-xs uppercase tracking-widest mb-3" style={{ color: "#666" }}>Now Task</p>
            <div className="rounded p-5 border" style={{
              borderColor: "#1C1C1C",
              borderLeftColor: LANE_COLORS[nowTask.lane] ?? "#5A5A5A",
              borderLeftWidth: "3px",
              backgroundColor: "#161616",
            }}>
              <p className="font-serif text-2xl font-semibold mb-1">{nowTask.title}</p>
              <p className="font-sans text-xs mb-3" style={{ color: "#666" }}>
                {nowTask.project} · {nowTask.lane} · {nowTask.effortMins}m
              </p>
              {nowTask.notes && (
                <p className="font-sans text-sm italic border-t pt-3 mb-3" style={{ color: "#888", borderColor: "#1C1C1C" }}>
                  {nowTask.notes}
                </p>
              )}

              {/* Steps */}
              {nowTask.steps.length > 0 && (
                <div className="space-y-2.5 border-t pt-3 mb-4" style={{ borderColor: "#1C1C1C" }}>
                  {nowTask.steps.map(step => (
                    <button key={step.id} onClick={() => toggleStep(step.id, step.isComplete)}
                      className="flex items-center gap-3 w-full text-left group">
                      <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                        step.isComplete ? "bg-green-800 border-green-700" : "border-gray-600 group-hover:border-gray-400"
                      }`}>
                        {step.isComplete && (
                          <svg viewBox="0 0 10 8" className="w-2.5 h-2.5">
                            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          </svg>
                        )}
                      </div>
                      <span className={`font-sans text-sm ${step.isComplete ? "line-through" : ""}`}
                        style={{ color: step.isComplete ? "#555" : "#D0D0D0" }}>
                        {step.description}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Add step */}
              <div className="flex gap-2">
                <input
                  value={newStep}
                  onChange={e => setNewStep(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addStep()}
                  placeholder="Add step… (Enter)"
                  className="flex-1 text-xs rounded px-2.5 py-1.5 bg-transparent border focus:outline-none placeholder-neutral-600"
                  style={{ borderColor: "#1C1C1C", color: "#CCC" }}
                />
              </div>

              {/* Mark task done */}
              <button onClick={markTaskDone} disabled={pending}
                className="mt-4 w-full font-sans text-sm font-semibold py-2.5 rounded transition-opacity disabled:opacity-40"
                style={{ backgroundColor: "#1B4332", color: "#F1EAE4" }}>
                Task Complete ✓
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="font-sans text-base" style={{ color: "#666" }}>All tasks in this block are done.</p>
          </div>
        )}

        {/* Focus Timer */}
        <div className="text-center">
          <p className="font-mono text-5xl font-light mb-4" style={{ color: timerRunning ? "#F1EAE4" : "#444" }}>
            {focusDisplay}
          </p>
          <button
            onClick={() => setTimerRunning(r => !r)}
            className="font-sans text-sm border rounded px-6 py-2.5 transition-colors"
            style={{ borderColor: "#333", color: timerRunning ? "#F1EAE4" : "#666" }}
          >
            {timerRunning ? "⏸ Pause" : "▶ Start Focus Timer"}
          </button>
        </div>

        {/* Parking lot */}
        <div className="w-full">
          <label className="font-sans text-xs uppercase tracking-widest block mb-2" style={{ color: "#666" }}>
            Parking Lot
          </label>
          <textarea
            rows={3}
            value={parking}
            onChange={e => setParking(e.target.value)}
            onBlur={saveParking}
            placeholder="Capture distractions here. Don't act on them."
            className="w-full rounded p-3 text-sm focus:outline-none resize-none"
            style={{ backgroundColor: "#161616", borderColor: "#1C1C1C", color: "#CCC", border: "1px solid #1C1C1C" }}
          />
        </div>

        {/* Mark block complete */}
        <button
          onClick={() => setShowCompletionModal(true)}
          disabled={pending}
          className="font-sans text-sm border rounded px-8 py-3 transition-colors disabled:opacity-40"
          style={{ borderColor: "#333", color: "#888" }}
        >
          Complete Block →
        </button>

        {/* Reschedule message */}
        {rescheduleMsg && (
          <p className="font-sans text-sm font-semibold animate-pulse" style={{ color: "#D4AF37" }}>
            {rescheduleMsg}
          </p>
        )}
      </div>

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
