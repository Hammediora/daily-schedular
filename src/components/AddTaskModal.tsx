"use client";

import { useState } from "react";
import { createTaskAction } from "@/app/actions";

export default function AddTaskModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const [title, setTitle] = useState("");
  const [lane, setLane] = useState("REVENUE");
  const [workType, setWorkType] = useState("EXECUTION");
  const [project, setProject] = useState("");
  const [impactScore, setImpactScore] = useState(5);
  const [effortMins, setEffortMins] = useState(60);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !project) return;

    setIsPending(true);
    await createTaskAction({
      title,
      lane,
      workType,
      project,
      impactScore,
      effortMins,
    });

    // Reset and close
    setTitle("");
    setProject("");
    setImpactScore(5);
    setEffortMins(60);
    setIsPending(false);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="font-sans text-sm bg-primary text-primary-foreground px-6 py-2.5 rounded hover:bg-primary/90 transition-colors duration-200 font-medium"
      >
        + Add Task
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border w-full max-w-lg rounded shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h2 className="font-serif text-xl font-bold">New Task</h2>
          <button onClick={() => setIsOpen(false)} className="text-muted hover:text-foreground">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                placeholder="E.g., Finalize API caching layer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Project / Client</label>
                <input
                  type="text"
                  required
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                  placeholder="E.g., Citaspace"
                />
              </div>

              <div>
                <label className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Lane</label>
                <select
                  value={lane}
                  onChange={(e) => setLane(e.target.value)}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="REVENUE">Revenue</option>
                  <option value="ASSET">Asset Building</option>
                  <option value="LEVERAGE">Leverage</option>
                  <option value="HEALTH">Health</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Work Type</label>
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="DEEP">Deep Work</option>
                  <option value="EXECUTION">Execution</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SOCIAL">Social</option>
                  <option value="RECOVERY">Recovery</option>
                </select>
              </div>

              <div>
                <label className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Effort (mins)</label>
                <input
                  type="number"
                  min="5" step="5"
                  value={effortMins}
                  onChange={(e) => setEffortMins(parseInt(e.target.value))}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Impact (1-10)</label>
                <input
                  type="number"
                  min="1" max="10"
                  value={impactScore}
                  onChange={(e) => setImpactScore(parseInt(e.target.value))}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              type="submit"
              disabled={isPending}
              className={`font-sans text-sm bg-primary text-primary-foreground px-8 py-2.5 rounded hover:bg-primary/90 transition-colors duration-200 font-medium tracking-wide ${isPending ? 'opacity-50' : ''}`}
            >
              {isPending ? 'Committing...' : 'Commit to Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
