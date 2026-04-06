"use client";

import { useState, useTransition } from "react";
import { autoRebalanceAction } from "@/app/actions";

interface Props {
  hasShortfall: boolean;
}

export default function FixPlanButton({ hasShortfall }: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  if (!hasShortfall) return null;

  const handleFix = () => {
    startTransition(async () => {
      const res = await autoRebalanceAction();
      if (res.success && res.tasksScheduled && res.tasksScheduled > 0) {
        setResult(`${res.tasksScheduled} task${res.tasksScheduled > 1 ? "s" : ""} scheduled to fill gaps`);
      } else if (res.success) {
        setResult("No tasks available to fill gaps");
      } else {
        setResult("error" in res ? res.error : "Failed to rebalance");
      }
      setTimeout(() => setResult(null), 4000);
    });
  };

  return (
    <div className="flex items-center gap-3 mt-3">
      <button
        onClick={handleFix}
        disabled={pending}
        className="font-sans text-xs font-semibold border border-border rounded px-4 py-2 hover:bg-surface transition-colors disabled:opacity-40"
        style={{ borderColor: "#D4AF3740", color: "#D4AF37" }}
      >
        {pending ? "Rebalancing..." : "Fix Plan →"}
      </button>
      {result && (
        <span className="font-sans text-xs font-semibold animate-pulse" style={{ color: "#D4AF37" }}>
          {result}
        </span>
      )}
    </div>
  );
}
