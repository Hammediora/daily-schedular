"use client";

import { useState, useTransition } from "react";
import { lockTaskToBlockAction, unlockTaskFromBlockAction } from "@/app/actions";

interface BacklogTask {
  id: string;
  title: string;
  lane: string;
  workType: string;
  effortMins: number;
}

interface AvailableBlock {
  id: string;
  dayLabel: string;
  blockLabel: string;
  startMinute: number;
}

interface LockedPlacement {
  scheduledTaskId: string;
  taskId: string;
  taskTitle: string;
  blockId: string;
  blockLabel: string;
  dayLabel: string;
}

interface Props {
  backlogTasks: BacklogTask[];
  availableBlocks: AvailableBlock[];
  lockedPlacements: LockedPlacement[];
}

const LANE_COLORS: Record<string, string> = {
  REVENUE: "#D4AF37", ASSET: "#1B4332", LEVERAGE: "#5A5A5A", HEALTH: "#8B4513",
};

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export default function BacklogLockPanel({ backlogTasks, availableBlocks, lockedPlacements }: Props) {
  const [pending, startTransition] = useTransition();
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [selectedBlock, setSelectedBlock] = useState<string>("");

  const handleLock = () => {
    if (!selectedTask || !selectedBlock) return;
    startTransition(async () => {
      await lockTaskToBlockAction(selectedTask, selectedBlock);
      setSelectedTask("");
      setSelectedBlock("");
    });
  };

  const handleUnlock = (scheduledTaskId: string) => {
    startTransition(async () => {
      await unlockTaskFromBlockAction(scheduledTaskId);
    });
  };

  return (
    <div>
      <p className="font-sans text-xs uppercase tracking-widest text-muted font-semibold mb-3">
        Lock Tasks to Blocks
      </p>

      {/* Existing locked placements */}
      {lockedPlacements.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {lockedPlacements.map(lp => (
            <div key={lp.scheduledTaskId} className="flex items-center justify-between border border-border rounded p-2.5 bg-surface">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-3 h-3 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z" />
                </svg>
                <span className="font-sans text-sm text-foreground truncate">{lp.taskTitle}</span>
                <span className="font-sans text-xs text-muted shrink-0">→ {lp.dayLabel} · {lp.blockLabel}</span>
              </div>
              <button
                onClick={() => handleUnlock(lp.scheduledTaskId)}
                disabled={pending}
                className="font-sans text-xs text-muted hover:text-foreground transition-colors px-2 py-1 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lock new task */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={selectedTask}
          onChange={e => setSelectedTask(e.target.value)}
          className="flex-1 min-w-[200px] bg-surface border border-border rounded px-3 py-2 font-sans text-sm text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">Select task...</option>
          {backlogTasks.map(t => (
            <option key={t.id} value={t.id}>
              {t.title} ({t.lane} · {t.effortMins}m)
            </option>
          ))}
        </select>

        <select
          value={selectedBlock}
          onChange={e => setSelectedBlock(e.target.value)}
          className="flex-1 min-w-[200px] bg-surface border border-border rounded px-3 py-2 font-sans text-sm text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">Select block...</option>
          {availableBlocks.map(b => (
            <option key={b.id} value={b.id}>
              {b.dayLabel} · {b.blockLabel} ({formatMinutes(b.startMinute)})
            </option>
          ))}
        </select>

        <button
          onClick={handleLock}
          disabled={pending || !selectedTask || !selectedBlock}
          className="font-sans text-sm font-semibold border border-border rounded px-4 py-2 hover:bg-surface transition-colors disabled:opacity-30"
        >
          {pending ? "Locking..." : "Lock →"}
        </button>
      </div>
    </div>
  );
}
