import { db } from "@operator-os/db";
import NowModeClient from "@/components/NowModeClient";
import Link from "next/link";

const BLOCK_LABELS: Record<string, string> = {
  DEEP_WORK: "Deep Work", EXECUTION: "Execution", IBM: "IBM",
  HEALTH: "Health", REVIEW: "Review", BUILDER: "Builder", FAMILY: "Family",
};

export default async function NowPage({
  searchParams,
}: {
  searchParams: Promise<{ blockId?: string }>;
}) {
  const workspace = await db.workspace.findFirst();
  if (!workspace) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  // Find current active block — no steps include, fetch separately
  const blocks = await db.timeBlockInstance.findMany({
    where: { workspaceId: workspace.id, date: today },
    include: {
      scheduledTasks: {
        include: { task: true },
        orderBy: { orderIndex: "asc" }
      }
    },
    orderBy: { startMinute: "asc" },
  });

  const params = await searchParams;
  const currentBlock = params.blockId
    ? blocks.find(b => b.id === params.blockId)
    : blocks.find(b => nowMinutes >= b.startMinute && nowMinutes < b.startMinute + b.durationMinutes);

  if (!currentBlock) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0F0F0F" }}>
        <div className="text-center">
          <p className="font-sans text-sm mb-4" style={{ color: "#666" }}>No active block right now.</p>
          <Link href="/" className="font-sans text-xs border rounded px-4 py-2" style={{ borderColor: "#333", color: "#888" }}>
            ← Back to Today
          </Link>
        </div>
      </div>
    );
  }

  const minutesRemaining = (currentBlock.startMinute + currentBlock.durationMinutes) - nowMinutes;

  // Find first incomplete task
  const nowTaskRaw = currentBlock.scheduledTasks.find(
    (st) => st.task.status !== "DONE"
  )?.task;

  // Fetch steps separately using any cast to avoid stale client type error
  let steps: { id: string; description: string; isComplete: boolean; orderIndex: number }[] = [];
  if (nowTaskRaw) {
    try {
      steps = await db.taskStep.findMany({
        where: { taskId: nowTaskRaw.id },
        orderBy: { orderIndex: "asc" },
      });
    } catch {
      steps = [];
    }
  }

  const nowTask = nowTaskRaw ? {
    id: nowTaskRaw.id,
    title: nowTaskRaw.title,
    notes: nowTaskRaw.notes ?? null,
    effortMins: nowTaskRaw.effortMins,
    lane: nowTaskRaw.lane as string,
    project: nowTaskRaw.project,
    steps,
  } : null;

  return (
    <NowModeClient
      blockId={currentBlock.id}
      workspaceId={workspace.id}
      blockLabel={BLOCK_LABELS[currentBlock.type] ?? currentBlock.type}
      blockType={currentBlock.type}
      minutesRemaining={minutesRemaining}
      objective={currentBlock.objective ?? null}
      parkingLotNotes={currentBlock.parkingLotNotes ?? null}
      nowTask={nowTask}
    />
  );
}
