"use client";

import { useState } from "react";
import { createTaskAction } from "@/app/actions";
import Dropdown from "@/components/ui/Dropdown";
import Slider from "@/components/ui/Slider";

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
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close new task modal"
            title="Close"
            className="text-muted hover:text-foreground"
          >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="task-title" className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Title</label>
              <input
                id="task-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                placeholder="E.g., Finalize API caching layer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="task-project" className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Project / Client</label>
                <input
                  id="task-project"
                  type="text"
                  required
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                  placeholder="E.g., Citaspace"
                />
              </div>

              <div>
                <label htmlFor="task-lane" className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Lane</label>
                <Dropdown
                  id="task-lane"
                  label="Lane"
                  value={lane}
                  onChange={setLane}
                  options={[
                    { value: "REVENUE", label: "Revenue" },
                    { value: "ASSET", label: "Asset Building" },
                    { value: "LEVERAGE", label: "Leverage" },
                    { value: "HEALTH", label: "Health" },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="task-work-type" className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Work Type</label>
                <Dropdown
                  id="task-work-type"
                  label="Work Type"
                  value={workType}
                  onChange={setWorkType}
                  options={[
                    { value: "DEEP", label: "Deep Work" },
                    { value: "EXECUTION", label: "Execution" },
                    { value: "ADMIN", label: "Admin" },
                    { value: "SOCIAL", label: "Social" },
                    { value: "RECOVERY", label: "Recovery" },
                  ]}
                />
              </div>

              <div>
                <label htmlFor="task-effort" className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Effort (mins)</label>
                <Slider
                  id="task-effort"
                  label="Effort in minutes"
                  value={effortMins}
                  onChange={setEffortMins}
                  min={5}
                  max={240}
                  step={5}
                  formatLabel={(v) => `${v} min`}
                />
              </div>

              <div>
                <label htmlFor="task-impact" className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Impact (1-10)</label>
                <Slider
                  id="task-impact"
                  label="Impact score"
                  value={impactScore}
                  onChange={setImpactScore}
                  min={1}
                  max={10}
                  step={1}
                  formatLabel={(v) => `${v} / 10`}
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
