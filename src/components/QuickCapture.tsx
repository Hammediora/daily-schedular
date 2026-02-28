"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { createTaskAction } from "@/app/actions";

const LANE_OPTIONS = ["REVENUE", "ASSET", "LEVERAGE", "HEALTH"];
const WORK_TYPE_OPTIONS = ["DEEP", "EXECUTION", "ADMIN", "SOCIAL", "RECOVERY"];

export default function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [lane, setLane] = useState("REVENUE");
  const [workType, setWorkType] = useState("EXECUTION");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      await createTaskAction({
        title: title.trim(),
        lane,
        workType,
        project: "Inbox",
        impactScore: 5,
        effortMins: 60,
      });
      setTitle("");
      setOpen(false);
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-32"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      style={{ backgroundColor: "rgba(28,28,28,0.5)", backdropFilter: "blur(4px)" }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-surface border border-border rounded shadow-2xl overflow-hidden"
      >
        {/* Main input */}
        <div className="flex items-center px-5 py-4 gap-3 border-b border-border">
          <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Capture a task..."
            className="flex-1 bg-transparent font-sans text-base text-foreground placeholder-muted focus:outline-none"
          />
          {pending && (
            <span className="font-sans text-xs text-muted">Saving...</span>
          )}
        </div>

        {/* Quick options */}
        <div className="flex items-center gap-4 px-5 py-3">
          <div className="flex gap-1">
            {LANE_OPTIONS.map(l => (
              <button
                key={l}
                type="button"
                onClick={() => setLane(l)}
                className="font-sans text-xs px-2.5 py-1 rounded border transition-colors"
                style={{
                  backgroundColor: lane === l ? "var(--color-primary)" : "transparent",
                  color: lane === l ? "#fff" : "var(--color-muted)",
                  borderColor: lane === l ? "var(--color-primary)" : "var(--color-border)",
                }}
              >
                {l.charAt(0) + l.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex gap-1">
            {WORK_TYPE_OPTIONS.map(w => (
              <button
                key={w}
                type="button"
                onClick={() => setWorkType(w)}
                className="font-sans text-xs px-2.5 py-1 rounded border transition-colors"
                style={{
                  backgroundColor: workType === w ? "var(--color-primary)" : "transparent",
                  color: workType === w ? "#fff" : "var(--color-muted)",
                  borderColor: workType === w ? "var(--color-primary)" : "var(--color-border)",
                }}
              >
                {w.charAt(0) + w.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex justify-between items-center">
          <p className="font-sans text-xs text-muted">
            Enter to save · Esc to dismiss · Edit details in Task Backlog
          </p>
          <button
            type="submit"
            disabled={!title.trim() || pending}
            className="font-sans text-xs font-semibold bg-primary text-primary-foreground px-5 py-2 rounded disabled:opacity-40 transition-opacity"
          >
            Capture
          </button>
        </div>
      </form>
    </div>
  );
}
