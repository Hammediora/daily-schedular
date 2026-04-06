"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

function pad(n: number) { return n.toString().padStart(2, "0"); }

interface Task {
  id: string;
  title: string;
  project: string;
  lane: string;
  effortMins: number;
  notes?: string | null;
}

interface Props {
  blockId: string;
  blockType: string;
  blockLabel: string;
  blockStartMinute: number;
  blockEndMinute: number;
  minutesRemaining: number;
  isProtected: boolean;
  nextTask: Task | null;
}

export default function CurrentFocusClient({
  blockId, blockType, blockLabel, blockStartMinute, blockEndMinute,
  minutesRemaining, isProtected, nextTask,
}: Props) {
  // Block countdown — ticks every second
  const [countdown, setCountdown] = useState(minutesRemaining * 60);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [focusRunning, setFocusRunning] = useState(false);
  const focusRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const i = setInterval(() => setCountdown(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (focusRunning) {
      focusRef.current = setInterval(() => setFocusSeconds(s => s + 1), 1000);
    } else {
      if (focusRef.current) clearInterval(focusRef.current);
    }
    return () => { if (focusRef.current) clearInterval(focusRef.current); };
  }, [focusRunning]);

  const countdownDisplay = `${pad(Math.floor(countdown / 3600))}:${pad(Math.floor((countdown % 3600) / 60))}:${pad(countdown % 60)}`;
  const focusDisplay = `${pad(Math.floor(focusSeconds / 3600))}:${pad(Math.floor((focusSeconds % 3600) / 60))}:${pad(focusSeconds % 60)}`;

  function formatMinutes(minutes: number) {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  return (
    <div
      className="mb-10 rounded border p-5"
      style={{
        borderColor: "#D4AF3730",
        backgroundColor: "rgba(212,175,55,0.04)",
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Pulsing indicator */}
          <div className="relative mt-1 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#D4AF37" }} />
            <span className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: "#D4AF37", opacity: 0.35 }} />
          </div>

          <div>
            <p className="font-sans text-xs uppercase tracking-widest text-muted mb-1 font-semibold">
              Current Block · {blockLabel}
            </p>

            {isProtected ? (
              <p className="font-serif text-xl font-semibold">
                {blockType === "FAMILY" ? "Protect this time. Be present." : "Execute your health block."}
              </p>
            ) : nextTask ? (
              <>
                <p className="font-serif text-xl font-semibold leading-snug">
                  {nextTask.title}
                </p>
                <p className="font-sans text-sm text-muted mt-1">
                  {nextTask.project} · {nextTask.lane} · {nextTask.effortMins}m estimated
                </p>
                {nextTask.notes && (
                  <p className="font-sans text-sm text-muted mt-2 italic border-l-2 border-border pl-3">
                    {nextTask.notes}
                  </p>
                )}
              </>
            ) : (
              <p className="font-serif text-xl font-semibold text-muted">
                Block is open. No task assigned.
              </p>
            )}
          </div>
        </div>

        <div className="flex sm:flex-col sm:text-right sm:shrink-0 sm:space-y-2 items-center gap-4 sm:gap-0 flex-wrap">
          <p className="font-sans text-xs text-muted">
            {formatMinutes(blockStartMinute)} – {formatMinutes(blockEndMinute)}
          </p>

          {/* Live countdown */}
          <p className="font-mono text-lg font-semibold" style={{ color: countdown < 300 ? "#D4AF37" : "#1B4332" }}>
            {countdownDisplay}
          </p>

          {/* Focus timer */}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setFocusRunning(r => !r)}
              className="font-sans text-xs border border-border rounded px-2 py-0.5 hover:bg-surface transition-colors"
            >
              {focusRunning ? "⏸" : "▶"}
            </button>
            <span className="font-mono text-xs text-muted">{focusDisplay}</span>
          </div>

          {nextTask && (
            <Link
              href={`/now?blockId=${blockId}`}
              className="font-sans text-xs font-semibold text-muted hover:text-foreground transition-colors block"
            >
              Now Mode →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
