"use client";

import { useState, useTransition } from "react";
import { completeBlockAction, setBlockEnergyRatingAction, autoRescheduleAction } from "@/app/actions";
import Dropdown from "@/components/ui/Dropdown";

interface Props {
  blockId: string;
  workspaceId: string;
  blockLabel: string;
  onDone: (rescheduleMsg?: string) => void;
  onCancel: () => void;
}

export default function BlockCompletionModal({ blockId, workspaceId, blockLabel, onDone, onCancel }: Props) {
  const [state, setState] = useState<"COMPLETED" | "PARTIAL" | "SKIPPED">("COMPLETED");
  const [reason, setReason] = useState("");
  const [energy, setEnergy] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      await completeBlockAction(blockId, state, reason || undefined);
      if (energy != null) {
        await setBlockEnergyRatingAction(blockId, energy);
      }
      const result = await autoRescheduleAction(workspaceId);
      const msg = result.success && result.rescheduledCount && result.rescheduledCount > 0
        ? `${result.rescheduledCount} task${result.rescheduledCount > 1 ? "s" : ""} rescheduled`
        : undefined;
      onDone(msg);
    });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border w-full max-w-md rounded shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-serif text-xl font-bold">Complete Block</h2>
          <p className="font-sans text-xs text-muted mt-1">{blockLabel}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Completion state */}
          <div>
            <label className="font-sans text-xs uppercase tracking-widest text-muted font-semibold block mb-3">
              How did it go?
            </label>
            <div className="space-y-2">
              {([
                { value: "COMPLETED" as const, label: "Completed", desc: "All tasks done or intentionally closed" },
                { value: "PARTIAL" as const, label: "Partial", desc: "Some tasks done, rest go back to backlog" },
                { value: "SKIPPED" as const, label: "Skipped", desc: "Block not executed, all tasks return to backlog" },
              ]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setState(opt.value)}
                  className={`w-full text-left border rounded p-3 transition-colors ${
                    state === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"
                  }`}
                >
                  <p className="font-sans text-sm font-semibold">{opt.label}</p>
                  <p className="font-sans text-xs text-muted mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Reason (for Partial/Skipped) */}
          {(state === "PARTIAL" || state === "SKIPPED") && (
            <div>
              <label className="font-sans text-xs uppercase tracking-widest text-muted font-semibold block mb-1.5">
                What happened?
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Optional: why was this block partial/skipped?"
                className="w-full bg-background border border-border rounded p-2.5 text-sm text-foreground placeholder-muted resize-none focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          )}

          {/* Energy rating */}
          <div>
            <label className="font-sans text-xs uppercase tracking-widest text-muted font-semibold block mb-2">
              Energy Level
            </label>
            <Dropdown
              value={energy != null ? String(energy) : ""}
              onChange={(v) => setEnergy(Number(v))}
              options={[
                { value: "1", label: "Low" },
                { value: "2", label: "Med" },
                { value: "3", label: "High" },
              ]}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="font-sans text-sm text-muted border border-border px-4 py-2 rounded hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={pending}
            className="font-sans text-sm font-semibold bg-primary text-primary-foreground px-6 py-2 rounded disabled:opacity-40 transition-opacity"
          >
            {pending ? "Completing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
