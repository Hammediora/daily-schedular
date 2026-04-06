"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import TaskRow from "@/components/TaskRow";
import {
  updateBlockObjectiveAction,
  updateBlockParkingLotAction,
} from "@/app/actions";

const BLOCK_LABELS: Record<string, { label: string; color: string }> = {
  DEEP_WORK: { label: "Deep Work", color: "#1B4332" },
  IBM:       { label: "IBM",       color: "#5A5A5A" },
  EXECUTION: { label: "Execution", color: "#D4AF37" },
  HEALTH:    { label: "Health",    color: "#1B4332" },
  REVIEW:    { label: "Review",    color: "#5A5A5A" },
  BUILDER:   { label: "Builder",   color: "#1B4332" },
  FAMILY:    { label: "Family",    color: "#D4AF37" },
};

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export interface SerializedBlock {
  id: string;
  date: string;
  startMinute: number;
  durationMinutes: number;
  type: string;
  isLocked: boolean;
  completionState?: string | null;
  objective: string | null;
  parkingLotNotes: string | null;
  scheduledTasks: Array<{
    id: string;
    orderIndex: number;
    allocatedMinutes: number | null;
    task: {
      id: string;
      title: string;
      status: string;
      project: string;
      lane: string;
      workType: string;
      impactScore: number;
      effortMins: number;
      notes: string | null;
    };
  }>;
}

interface BlockDrawerProps {
  block: SerializedBlock;
  onClose: () => void;
}

export default function BlockDrawer({ block, onClose }: BlockDrawerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [, startTransition] = useTransition();
  const [objective, setObjective] = useState(block.objective ?? "");
  const [parking, setParking] = useState(block.parkingLotNotes ?? "");

  // Sync when block changes
  useEffect(() => {
    setObjective(block.objective ?? "");
    setParking(block.parkingLotNotes ?? "");
  }, [block.id, block.objective, block.parkingLotNotes]);

  const saveObjective = () => {
    startTransition(async () => {
      await updateBlockObjectiveAction(block.id, objective);
    });
  };
  const saveParking = () => {
    startTransition(async () => {
      await updateBlockParkingLotAction(block.id, parking);
    });
  };

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleClose]);

  const meta = BLOCK_LABELS[block.type] ?? { label: block.type, color: "#5A5A5A" };
  const taskCount = block.scheduledTasks.length;
  const doneTasks = block.scheduledTasks.filter(st => st.task.status === "DONE").length;
  const sortedTasks = [...block.scheduledTasks].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity duration-200"
        style={{ opacity: isVisible ? 1 : 0 }}
        onClick={handleClose}
      />

      {/* Drawer panel */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border rounded-t-lg
                   max-h-[85vh] overflow-y-auto transition-transform duration-200 ease-out"
        style={{ transform: isVisible ? "translateY(0)" : "translateY(100%)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="px-5 sm:px-8 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-xs uppercase tracking-widest font-semibold" style={{ color: meta.color }}>
                {meta.label}
              </p>
              <p className="font-serif text-xl font-bold mt-1">
                {formatMinutes(block.startMinute)} &ndash; {formatMinutes(block.startMinute + block.durationMinutes)}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-muted hover:text-foreground p-2 -mr-2 transition-colors"
              aria-label="Close drawer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="font-sans text-xs text-muted bg-background px-2 py-1 rounded border border-border">
              {block.durationMinutes}m
            </span>
            {block.isLocked && (
              <span className="font-sans text-xs text-muted bg-background px-2 py-1 rounded border border-border">
                Locked
              </span>
            )}
            {taskCount > 0 && (
              <span className="font-sans text-xs text-muted bg-background px-2 py-1 rounded border border-border">
                {doneTasks}/{taskCount} done
              </span>
            )}
          </div>
        </div>

        {/* Objective */}
        <div className="px-5 sm:px-8 py-4 border-b border-border">
          <label className="font-sans text-xs uppercase tracking-widest text-muted font-semibold block mb-1.5">
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

        {/* Task list */}
        <div className="px-5 sm:px-8 py-5 space-y-4">
          <p className="font-sans text-xs uppercase tracking-widest text-muted font-semibold">
            Tasks ({taskCount})
          </p>
          {sortedTasks.length > 0 ? (
            sortedTasks.map((st, idx) => (
              <TaskRow
                key={st.id}
                task={st.task}
                allocatedMinutes={st.allocatedMinutes ?? st.task.effortMins}
                scheduledTaskId={st.id}
                canMoveUp={idx > 0}
                canMoveDown={idx < sortedTasks.length - 1}
                alwaysShowActions
              />
            ))
          ) : (
            <p className="font-sans text-sm text-muted italic">No tasks scheduled in this block.</p>
          )}
        </div>

        {/* Parking Lot */}
        <div className="px-5 sm:px-8 py-4 border-t border-border">
          <label className="font-sans text-xs uppercase tracking-widest text-muted font-semibold block mb-1.5">
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

        {/* Bottom safe area */}
        <div className="h-6" />
      </div>
    </div>
  );
}
