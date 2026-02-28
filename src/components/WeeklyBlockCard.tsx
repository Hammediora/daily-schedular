"use client";

const BLOCK_LABELS: Record<string, { label: string; color: string }> = {
  DEEP_WORK: { label: "Deep Work", color: "#1B4332" },
  IBM:       { label: "IBM",       color: "#5A5A5A" },
  EXECUTION: { label: "Execution", color: "#D4AF37" },
  HEALTH:    { label: "Health",    color: "#1B4332" },
  REVIEW:    { label: "Review",    color: "#5A5A5A" },
  BUILDER:   { label: "Builder",   color: "#1B4332" },
  FAMILY:    { label: "Family",    color: "#D4AF37" },
};

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

interface SerializedBlock {
  id: string;
  type: string;
  startMinute: number;
  durationMinutes: number;
  isLocked: boolean;
  completionState?: string | null;
  scheduledTasks: Array<{
    task: { status: string };
  }>;
}

interface WeeklyBlockCardProps {
  block: SerializedBlock;
  onClick: () => void;
}

export default function WeeklyBlockCard({ block, onClick }: WeeklyBlockCardProps) {
  const meta = BLOCK_LABELS[block.type] ?? { label: block.type, color: "#5A5A5A" };
  const taskCount = block.scheduledTasks.length;
  const doneTasks = block.scheduledTasks.filter(st => st.task.status === "DONE").length;

  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-border rounded p-2 text-xs font-sans space-y-0.5
                 cursor-pointer hover:shadow-sm active:shadow-none transition-shadow min-h-[44px]"
      style={{
        backgroundColor: block.type === "FAMILY" ? "rgba(212,175,55,0.06)" : "rgba(241,236,228,0.8)",
        borderLeft: `2px solid ${meta.color}`,
      }}
    >
      <p className="font-semibold truncate" style={{ color: meta.color }}>{meta.label}</p>
      <p className="text-muted">{formatMinutes(block.startMinute)}</p>
      {taskCount > 0 && (
        <p className="text-muted">{doneTasks}/{taskCount} done</p>
      )}
      {block.isLocked && (
        <p className="text-muted opacity-60">Locked</p>
      )}
      {block.completionState && block.completionState !== "OPEN" && (
        <p className="font-semibold" style={{
          color: block.completionState === "COMPLETED" ? "#1B4332" : block.completionState === "PARTIAL" ? "#D4AF37" : "#5A5A5A",
        }}>
          {block.completionState === "COMPLETED" ? "Done" : block.completionState === "PARTIAL" ? "Partial" : "Skipped"}
        </p>
      )}
    </button>
  );
}
