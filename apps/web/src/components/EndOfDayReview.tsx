"use client";

import { useState, useTransition } from "react";
import { submitDailyReviewAction } from "@/app/actions";

export default function EndOfDayReview({
  allDone,
  nonNegotiables,
}: {
  allDone: boolean;
  nonNegotiables: { label: string; complete: boolean }[];
}) {
  const [open, setOpen] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open || submitted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await submitDailyReviewAction(notes);
      setSubmitted(true);
    });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border w-full max-w-md rounded shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex justify-between items-center">
          <h2 className="font-serif text-xl font-bold">Daily Review</h2>
          <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Non-negotiable status */}
          <div className="space-y-2">
            {nonNegotiables.map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.complete ? "#1B4332" : "#D4AF37" }}
                />
                <p className="font-sans text-sm" style={{ color: item.complete ? "#1B4332" : "#5A5A5A" }}>
                  {item.label}
                </p>
                <p className="font-sans text-xs ml-auto" style={{ color: item.complete ? "#1B4332" : "#D4AF37" }}>
                  {item.complete ? "Complete" : "Incomplete"}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-6">
            <label className="block font-sans text-xs font-semibold text-muted mb-2 uppercase tracking-wider">
              What interfered today? What must change tomorrow?
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary transition-colors resize-none"
              placeholder="Brief reflection..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="font-sans text-sm bg-primary text-primary-foreground px-8 py-2.5 rounded hover:bg-primary/90 transition-colors font-medium tracking-wide disabled:opacity-50"
            >
              {pending ? "Recording..." : "Close Day"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
