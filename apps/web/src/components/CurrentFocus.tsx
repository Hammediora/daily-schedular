import { db } from "@operator-os/db";
import CurrentFocusClient from "./CurrentFocusClient";

const BLOCK_LABELS: Record<string, string> = {
  DEEP_WORK: "Deep Work", EXECUTION: "Execution", IBM: "IBM",
  HEALTH: "Health", REVIEW: "Review", BUILDER: "Builder", FAMILY: "Family",
};

export default async function CurrentFocus({ workspaceId }: { workspaceId: string }) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get currently active block
  const currentBlock = await db.timeBlockInstance.findFirst({
    where: {
      workspaceId,
      date: today,
      startMinute: { lte: nowMinutes },
    },
    include: {
      scheduledTasks: {
        include: { task: true },
        orderBy: { orderIndex: "asc" },
      }
    },
    orderBy: { startMinute: "desc" },
  });

  if (!currentBlock) return null;

  const blockEnd = currentBlock.startMinute + currentBlock.durationMinutes;
  const isActive = nowMinutes < blockEnd;
  if (!isActive) return null;

  const nextTask = currentBlock.scheduledTasks.find(st => st.task.status !== "DONE")?.task;
  const minutesLeft = blockEnd - nowMinutes;
  const isProtected = currentBlock.type === "FAMILY" || currentBlock.type === "HEALTH";

  return (
    <CurrentFocusClient
      blockId={currentBlock.id}
      blockType={currentBlock.type}
      blockLabel={BLOCK_LABELS[currentBlock.type] ?? currentBlock.type}
      blockStartMinute={currentBlock.startMinute}
      blockEndMinute={blockEnd}
      minutesRemaining={minutesLeft}
      isProtected={isProtected}
      nextTask={nextTask ? {
        id: nextTask.id,
        title: nextTask.title,
        project: nextTask.project,
        lane: nextTask.lane,
        effortMins: nextTask.effortMins,
        notes: nextTask.notes,
      } : null}
    />
  );
}
