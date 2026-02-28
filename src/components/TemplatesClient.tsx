"use client";

import { useState, useTransition } from "react";
import { createBlockTemplateAction, deleteBlockTemplateAction } from "@/app/actions";

const BLOCK_TYPES = ["DEEP_WORK", "EXECUTION", "IBM", "HEALTH", "REVIEW", "BUILDER", "FAMILY"];
const BLOCK_LABELS: Record<string, string> = {
  DEEP_WORK: "Deep Work", EXECUTION: "Execution", IBM: "IBM", HEALTH: "Health",
  REVIEW: "Review", BUILDER: "Builder", FAMILY: "Family",
};
const BLOCK_COLORS: Record<string, string> = {
  DEEP_WORK: "#1B4332", EXECUTION: "#D4AF37", IBM: "#5A5A5A", HEALTH: "#1B4332",
  REVIEW: "#5A5A5A", BUILDER: "#1B4332", FAMILY: "#D4AF37",
};

function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = (minutes % 60).toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export default function TemplatesClient({ templates, dayNames }: { templates: any[]; dayNames: string[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [pending, startTransition] = useTransition();

  // Form state
  const [title, setTitle] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("06:00");
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [type, setType] = useState("DEEP_WORK");
  const [isLocked, setIsLocked] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await createBlockTemplateAction({
        title, dayOfWeek, startMinute: timeToMinutes(startTime), durationMinutes, type, isLocked,
      });
      setShowAdd(false);
      setTitle("");
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}" template?`)) return;
    startTransition(async () => { await deleteBlockTemplateAction(id); });
  };

  const inputClass = "w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary transition-colors";
  const labelClass = "block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider";

  // Group by day
  const byDay = dayNames.map((name, idx) => ({
    name,
    dayIndex: idx,
    templates: templates.filter(t => t.dayOfWeek === idx),
  }));

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(v => !v)}
          className="font-sans text-sm bg-primary text-primary-foreground px-6 py-2.5 rounded hover:bg-primary/90 transition-colors font-medium">
          {showAdd ? "Cancel" : "+ New Block Template"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleCreate} className="bg-surface border border-border rounded p-6 space-y-5">
          <p className="font-serif text-base font-semibold">New Block Template</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Block Title</label>
              <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Deep Work" />
            </div>
            <div>
              <label className={labelClass}>Day of Week</label>
              <select value={dayOfWeek} onChange={e => setDayOfWeek(+e.target.value)} className={inputClass}>
                {dayNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Block Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className={inputClass}>
                {BLOCK_TYPES.map(t => <option key={t} value={t}>{BLOCK_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Start Time</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Duration (mins)</label>
              <input type="number" min="15" step="15" value={durationMinutes} onChange={e => setDurationMinutes(+e.target.value)} className={inputClass} />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isLocked} onChange={e => setIsLocked(e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="font-sans text-sm">Locked (cannot be bumped or overridden)</span>
          </label>
          <button type="submit" disabled={pending}
            className="font-sans text-sm bg-primary text-primary-foreground px-6 py-2.5 rounded hover:bg-primary/90 transition-colors font-medium disabled:opacity-50">
            {pending ? "Creating..." : "Create Template"}
          </button>
        </form>
      )}

      {/* Templates by day */}
      <div className="space-y-8">
        {byDay.filter(d => d.templates.length > 0).map(({ name, dayIndex, templates: dayTemplates }) => (
          <div key={dayIndex}>
            <p className="font-sans text-xs uppercase tracking-widest text-muted mb-3 font-semibold">{name}</p>
            <div className="space-y-2">
              {dayTemplates.map((t: any) => (
                <div key={t.id} className="border border-border rounded p-4 flex items-center justify-between group"
                  style={{ borderLeft: `2px solid ${BLOCK_COLORS[t.type] ?? "#5A5A5A"}` }}>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-sans text-sm font-medium">{t.title}</p>
                      <p className="font-sans text-xs text-muted mt-0.5">
                        {minutesToTime(t.startMinute)} · {t.durationMinutes}m · {BLOCK_LABELS[t.type]}
                        {t.isLocked && <span className="ml-2 text-muted">· Locked</span>}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(t.id, t.title)} disabled={pending}
                    className="font-sans text-xs text-muted hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 px-2 py-1">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <p className="font-sans text-sm text-muted">No block templates yet. Add one above.</p>
      )}
    </div>
  );
}
