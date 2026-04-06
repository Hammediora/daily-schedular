"use client";

import { useRef, useState, useTransition } from "react";
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

const SWIPE_THRESHOLD = 72;

export default function TaskRow({ task, allocatedMinutes, scheduledTaskId, canMoveUp, canMoveDown, alwaysShowActions }: TaskRowProps) {
  const [isPending, startTransition] = useTransition();
  const isDone = task.status === "DONE";

  const [swipeDx, setSwipeDx] = useState(0);
  const startXRef = useRef<number | null>(null);
  const isSwiping = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    startXRef.current = e.clientX;
    isSwiping.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startXRef.current === null || e.pointerType === "mouse") return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 8) isSwiping.current = true;
    if (isSwiping.current) {
      e.preventDefault();
      setSwipeDx(Math.max(-120, Math.min(120, dx)));
    }
  };

  const handlePointerUp = () => {
    if (startXRef.current === null) return;
    const dx = swipeDx;
    startXRef.current = null;

    if (dx <= -SWIPE_THRESHOLD) {
      setSwipeDx(0);
      startTransition(async () => { await bumpTaskAction(task.id); });
    } else if (dx >= SWIPE_THRESHOLD) {
      setSwipeDx(0);
      startTransition(async () => {
        if (isDone) await uncompleteTaskAction(task.id);
        else await completeTaskAction(task.id);
      });
    } else {
      setSwipeDx(0);
    }
    isSwiping.current = false;
  };

  const handleToggle = () => {
    startTransition(async () => {
      if (isDone) await uncompleteTaskAction(task.id);
      else await completeTaskAction(task.id);
    });
  };

  const handleBump = () => {
    startTransition(async () => { await bumpTaskAction(task.id); });
  };

  const handleMove = (direction: "up" | "down") => {
    if (!scheduledTaskId) return;
    startTransition(async () => { await reorderTaskInBlockAction(scheduledTaskId, direction); });
  };

  const isSwipingLeft = swipeDx < -8;
  const isSwipingRight = swipeDx > 8;

  return (
    <div className="relative overflow-hidden rounded">
      {/* Swipe reveal backgrounds — mobile only */}
      <div className="sm:hidden absolute inset-0 flex">
        <div
          className="absolute inset-0 flex items-center justify-end pr-4"
          style={{
            background: "#FEE2E2",
            opacity: isSwipingLeft ? Math.min(1, Math.abs(swipeDx) / SWIPE_THRESHOLD) : 0,
          }}
        >
          <span className="text-xs font-sans font-medium text-red-700">Bump →</span>
        </div>
        <div
          className="absolute inset-0 flex items-center pl-4"
          style={{
            background: "rgba(27,67,50,0.1)",
            opacity: isSwipingRight ? Math.min(1, swipeDx / SWIPE_THRESHOLD) : 0,
          }}
        >
          <span className="text-xs font-sans font-medium text-primary">Done ✓</span>
        </div>
      </div>

      {/* Row content */}
      <div
        className={`flex items-start justify-between group gap-4 transition-opacity duration-300 bg-transparent relative ${isDone ? "opacity-50 hover:opacity-80" : ""}`}
        style={{ transform: `translateX(${swipeDx}px)`, transition: swipeDx === 0 ? "transform 0.2s ease" : "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="flex gap-4 min-w-0">
          <button
            onClick={handleToggle}
            disabled={isPending}
            aria-label={isDone ? "Mark incomplete" : "Mark complete"}
            className={`w-5 h-5 rounded border mt-0.5 flex-shrink-0 transition-all duration-200 flex items-center justify-center
              ${isDone ? "bg-primary/10 border-primary/40" : "border-border hover:border-accent cursor-pointer bg-transparent"}
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
            {task.notes && !isDone && (
              <p className="font-sans text-xs text-muted mt-1.5 italic border-l-2 border-border pl-2 leading-relaxed truncate max-w-sm">
                {task.notes}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isDone && scheduledTaskId && (
            <div className={`hidden sm:flex items-center gap-0.5 transition-opacity ${alwaysShowActions ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
              <button
                onClick={() => handleMove("up")}
                disabled={isPending || !canMoveUp}
                className="text-muted hover:text-foreground disabled:opacity-20 text-xs px-1 py-0.5 transition-colors"
                aria-label="Move up"
              >▲</button>
              <button
                onClick={() => handleMove("down")}
                disabled={isPending || !canMoveDown}
                className="text-muted hover:text-foreground disabled:opacity-20 text-xs px-1 py-0.5 transition-colors"
                aria-label="Move down"
              >▼</button>
              <button
                onClick={handleBump}
                disabled={isPending}
                className="text-muted hover:text-foreground text-xs px-1.5 py-0.5 border border-transparent hover:border-border rounded transition-colors ml-1"
                aria-label="Bump to later"
                title="Bump to backlog"
              >→</button>
            </div>
          )}

          <div className="font-sans text-xs font-semibold text-primary px-2 py-1 bg-primary/5 rounded whitespace-nowrap">
            Impact {task.impactScore}
          </div>
        </div>
      </div>
    </div>
  );
}
