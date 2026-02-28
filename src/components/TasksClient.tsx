"use client";

import { useState, useTransition } from "react";
import { createTaskAction, editTaskAction, deleteTaskAction, completeTaskAction, uncompleteTaskAction } from "@/app/actions";

const LANE_OPTIONS = ["REVENUE", "ASSET", "LEVERAGE", "HEALTH"];
const WORK_TYPE_OPTIONS = ["DEEP", "EXECUTION", "ADMIN", "SOCIAL", "RECOVERY"];
const STATUS_LABELS: Record<string, string> = {
  BACKLOG: "Backlog",
  SCHEDULED: "Scheduled",
  DONE: "Done",
  BUMPED: "Bumped",
  ARCHIVED: "Archived",
};
const LANE_COLORS: Record<string, string> = {
  REVENUE: "#D4AF37",
  ASSET: "#1B4332",
  LEVERAGE: "#5A5A5A",
  HEALTH: "#1B4332",
};

function TaskForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: any;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [lane, setLane] = useState(initial?.lane ?? "REVENUE");
  const [workType, setWorkType] = useState(initial?.workType ?? "EXECUTION");
  const [project, setProject] = useState(initial?.project ?? "");
  const [impactScore, setImpactScore] = useState(initial?.impactScore ?? 5);
  const [effortMins, setEffortMins] = useState(initial?.effortMins ?? 60);
  const [deadline, setDeadline] = useState(initial?.deadline ? new Date(initial.deadline).toISOString().split("T")[0] : "");
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await onSave({ title, lane, workType, project, impactScore, effortMins, deadline: deadline || undefined });
    });
  };

  const inputClass = "w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary transition-colors";
  const labelClass = "block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider";

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Title</label>
          <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="Task title" />
        </div>
        <div>
          <label className={labelClass}>Project / Client</label>
          <input required type="text" value={project} onChange={e => setProject(e.target.value)} className={inputClass} placeholder="Citaspace, Vinimora..." />
        </div>
        <div>
          <label className={labelClass}>Lane</label>
          <select value={lane} onChange={e => setLane(e.target.value)} className={inputClass}>
            {LANE_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Work Type</label>
          <select value={workType} onChange={e => setWorkType(e.target.value)} className={inputClass}>
            {WORK_TYPE_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Effort (mins)</label>
          <input type="number" min="5" step="5" value={effortMins} onChange={e => setEffortMins(+e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Impact (1-10)</label>
          <input type="number" min="1" max="10" value={impactScore} onChange={e => setImpactScore(+e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Deadline (optional)</label>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={pending}
          className="font-sans text-sm bg-primary text-primary-foreground px-6 py-2.5 rounded hover:bg-primary/90 transition-colors font-medium disabled:opacity-50">
          {pending ? "Saving..." : initial ? "Save Changes" : "Add Task"}
        </button>
        <button type="button" onClick={onCancel}
          className="font-sans text-sm border border-border px-6 py-2.5 rounded hover:bg-surface transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

function TaskRow({ task }: { task: any }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Delete this task?")) return;
    startTransition(async () => { await deleteTaskAction(task.id); });
  };

  const handleToggle = () => {
    startTransition(async () => {
      if (task.status === "DONE") await uncompleteTaskAction(task.id);
      else await completeTaskAction(task.id);
    });
  };

  if (editing) {
    return (
      <TaskForm
        initial={task}
        onSave={async (data) => { await editTaskAction(task.id, data); setEditing(false); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const isDone = task.status === "DONE";

  return (
    <div className={`border border-border rounded p-4 flex items-start gap-4 group transition-opacity ${isDone ? "opacity-60" : ""}`}>
      <button onClick={handleToggle} disabled={pending}
        className={`w-5 h-5 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-colors
          ${isDone ? "bg-primary/10 border-primary/30" : "border-primary/30 hover:border-accent cursor-pointer"}`}>
        {isDone && (
          <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-sans text-sm font-medium ${isDone ? "line-through text-muted" : "text-foreground"}`}>
          {task.title}
        </p>
        <div className="flex gap-3 mt-1.5 flex-wrap">
          <span className="font-sans text-xs text-muted">{task.project}</span>
          <span className="font-sans text-xs font-semibold" style={{ color: LANE_COLORS[task.lane] ?? "#5A5A5A" }}>{task.lane}</span>
          <span className="font-sans text-xs text-muted">{task.workType}</span>
          <span className="font-sans text-xs text-muted">{task.effortMins}m</span>
          {task.deadline && (
            <span className="font-sans text-xs" style={{ color: "#D4AF37" }}>
              Due {new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className={`font-sans text-xs px-2 py-1 rounded border border-border bg-background`}>
          {STATUS_LABELS[task.status]}
        </span>
        <span className="font-sans text-xs font-semibold text-primary px-2 py-1 bg-primary/5 rounded">
          Impact {task.impactScore}
        </span>
        <button onClick={() => setEditing(true)}
          className="font-sans text-xs text-muted hover:text-foreground transition-colors px-2 py-1">
          Edit
        </button>
        <button onClick={handleDelete} disabled={pending}
          className="font-sans text-xs text-muted hover:text-red-600 transition-colors px-2 py-1">
          Delete
        </button>
      </div>
    </div>
  );
}

export default function TasksClient({ tasks }: { tasks: any[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");

  const lanes = ["ALL", "REVENUE", "ASSET", "LEVERAGE", "HEALTH"];
  const filtered = filter === "ALL" ? tasks : tasks.filter(t => t.lane === filter);

  const backlog = filtered.filter(t => t.status !== "DONE");
  const done = filtered.filter(t => t.status === "DONE");

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {lanes.map(l => (
            <button key={l} onClick={() => setFilter(l)}
              className={`font-sans text-xs px-4 py-2 rounded border transition-colors
                ${filter === l ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted hover:text-foreground"}`}>
              {l === "ALL" ? "All Lanes" : l.charAt(0) + l.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          className="font-sans text-sm bg-primary text-primary-foreground px-6 py-2.5 rounded hover:bg-primary/90 transition-colors font-medium">
          {showAdd ? "Cancel" : "+ Add Task"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <TaskForm
          onSave={async (data) => { await createTaskAction(data); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Active / Backlog */}
      <div>
        <p className="font-sans text-xs uppercase tracking-widest text-muted mb-4 font-semibold">
          Active ({backlog.length})
        </p>
        <div className="space-y-3">
          {backlog.length === 0 ? (
            <p className="font-sans text-sm text-muted">No tasks in pipeline.</p>
          ) : (
            backlog.map(t => <TaskRow key={t.id} task={t} />)
          )}
        </div>
      </div>

      {/* Done */}
      {done.length > 0 && (
        <div>
          <p className="font-sans text-xs uppercase tracking-widest text-muted mb-4 font-semibold">
            Completed ({done.length})
          </p>
          <div className="space-y-3">
            {done.map(t => <TaskRow key={t.id} task={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}
