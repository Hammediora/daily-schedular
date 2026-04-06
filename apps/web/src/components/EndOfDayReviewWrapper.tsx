import { db } from "@operator-os/db";
import EndOfDayReview from "./EndOfDayReview";

export default async function EndOfDayReviewWrapper({ workspaceId }: { workspaceId: string }) {
  const now = new Date();
  const hourNow = now.getHours() + now.getMinutes() / 60;

  // Only show after 21:30
  if (hourNow < 21.5) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const intent = await db.dailyIntent.findUnique({
    where: { workspaceId_date: { workspaceId, date: today } }
  });

  // If reflection notes already submitted today, skip
  if (intent?.reflectionNotes) return null;

  // Check today's completed tasks
  const todayDoneTasks = await db.task.findMany({
    where: { workspaceId, status: "DONE", completedAt: { gte: today } }
  });

  const todayInstances = await db.timeBlockInstance.findMany({
    where: { workspaceId, date: today },
    include: { scheduledTasks: { include: { task: true } } }
  });

  type BlockTypeString = "DEEP_WORK" | "HEALTH" | "FAMILY" | string;

  const deepWorkDone = todayInstances.some(b =>
    (b.type as BlockTypeString) === "DEEP_WORK" && b.scheduledTasks.some(st => st.task.status === "DONE")
  );
  const healthDone = todayInstances.some(b => (b.type as BlockTypeString) === "HEALTH");
  const revenueDone = todayDoneTasks.some(t => t.lane === "REVENUE");
  const familyDone = todayInstances.some(b => (b.type as BlockTypeString) === "FAMILY");

  const nonNegotiables = [
    { label: "Deep Work Session", complete: deepWorkDone },
    { label: "Revenue Advanced", complete: revenueDone },
    { label: "Health Block", complete: healthDone },
    { label: "Family Time Protected", complete: familyDone },
  ].filter((n, i) => {
    const flags = [
      intent?.mustExecuteDeepWork ?? true,
      intent?.mustAdvanceRevenue ?? true,
      intent?.mustTrain ?? true,
      intent?.mustProtectFamily ?? true,
    ];
    return flags[i];
  });

  const allDone = nonNegotiables.every(n => n.complete);

  return <EndOfDayReview allDone={allDone} nonNegotiables={nonNegotiables} />;
}
