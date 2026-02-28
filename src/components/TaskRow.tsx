"use client";

import { useTransition } from "react";
import { completeTaskAction, uncompleteTaskAction, bumpTaskAction, reorderTaskInBlockAction } from "@/app/actions";

interface TaskRowProps {
  task: {
    id: string;
    title: string;
    status: string;
    project: string;
    lane: string;
    impactScore: number;
    effortMins: number;
    actualMinutes?: number | null;
    notes?: string | null;
  };
  allocatedMinutes: number;
  scheduledTaskId?: string;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  alwaysShowActions?: boolean;
}

export default function TaskRow({ task, allocatedMinutes, scheduledTaskId, canMoveUp, canMoveDown, alwaysShowActions }: TaskRowProps) {
  const [isPending, startTransition] = useTransition();
  const isDone = task.status === "DONE";

  const handleToggle = () => {
    startTransition(async () => {
      if (isDone) {
        await uncompleteTaskAction(task.id);
      } else {
        await completeTaskAction(task.id);
      }
    });
  };

  const handleBump = () => {
    startTransition(async () => {
      await bumpTaskAction(task.id);
    });
  };

  const handleMove = (direction: "up" | "down") => {
    if (!scheduledTaskId) return;
    startTransition(async () => {
      await reorderTaskInBlockAction(scheduledTaskId, direction);
    });
  };

  return (
    <div className={`flex items-start justify-between group gap-4 transition-opacity duration-300 ${isDone ? "opacity-50 hover:opacity-80" : ""}`}>
      <div className="flex gap-4 min-w-0">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          aria-label={isDone ? "Mark incomplete" : "Mark complete"}
          className={`w-5 h-5 rounded border mt-0.5 flex-shrink-0 transition-all duration-200 flex items-center justify-center
            ${isDone
              ? "bg-primary/10 border-primary/40"
              : "border-border hover:border-accent cursor-pointer bg-transparent"
            }
            ${isPending ? "opacity-40" : ""}
          `}
        >
          {isDone && (
            <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="min-w-0">
          <p className={`font-sans font-medium text-sm leading-snug ${isDone ? "text-muted line-through" : "text-foreground"}`}>
            {task.title}
          </p>
          <p className="font-sans text-xs text-muted mt-0.5">
            {task.project} · {task.lane} · {allocatedMinutes}m{task.actualMinutes != null && ` · ${task.actualMinutes}m actual`}
          </p>
          {/* Notes preview */}
          {task.notes && !isDone && (
            <p className="font-sans text-xs text-muted mt-1.5 italic border-l-2 border-border pl-2 leading-relaxed truncate max-w-sm">
              {task.notes}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Reorder + Bump — visible on hover, hidden when done */}
        {!isDone && scheduledTaskId && (
          <div className={`flex items-center gap-0.5 transition-opacity ${alwaysShowActions ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
            <button
              onClick={() => handleMove("up")}
              disabled={isPending || !canMoveUp}
              className="text-muted hover:text-foreground disabled:opacity-20 text-xs px-1 py-0.5 transition-colors"
              aria-label="Move up"
            >
              ▲
            </button>
            <button
              onClick={() => handleMove("down")}
              disabled={isPending || !canMoveDown}
              className="text-muted hover:text-foreground disabled:opacity-20 text-xs px-1 py-0.5 transition-colors"
              aria-label="Move down"
            >
              ▼
            </button>
            <button
              onClick={handleBump}
              disabled={isPending}
              className="text-muted hover:text-foreground text-xs px-1.5 py-0.5 border border-transparent hover:border-border rounded transition-colors ml-1"
              aria-label="Bump to later"
              title="Bump to backlog"
            >
              →
            </button>
          </div>
        )}

        <div className="font-sans text-xs font-semibold text-primary px-2 py-1 bg-primary/5 rounded whitespace-nowrap">
          Impact {task.impactScore}
        </div>
      </div>
    </div>
  );
}
