import { db } from "@operator-os/db";
import { getOrGenerateTodayBlocks } from "@/lib/os-engine";
import { getLaneStats } from "@/lib/lane-stats";
import TaskRow from "@/components/TaskRow";
import Sidebar from "@/components/Sidebar";
import DailyCommandPanel from "@/components/DailyCommandPanel";
import EndOfDayReviewWrapper from "@/components/EndOfDayReviewWrapper";
import NowIndicator from "@/components/NowIndicator";
import CurrentFocus from "@/components/CurrentFocus";
import QuickCapture from "@/components/QuickCapture";
import AddTaskModal from "@/components/AddTaskModal";
import BlockDetailPanel from "@/components/BlockDetailPanel";
import IbmChecklist from "@/components/IbmChecklist";
import TodayWorkLog from "@/components/TodayWorkLog";
import { MobileAccordion } from "@/components/ui/Accordion";
import Link from "next/link";

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

const BLOCK_TITLES: Record<string, string> = {
  DEEP_WORK: "Deep Work", EXECUTION: "Execution", IBM: "IBM",
  HEALTH: "Health", REVIEW: "Review", BUILDER: "Builder Block", FAMILY: "Family",
};
const BLOCK_COLORS: Record<string, string> = {
  DEEP_WORK: "#1B4332", IBM: "#5A5A5A", EXECUTION: "#D4AF37",
  HEALTH: "#1B4332", REVIEW: "#5A5A5A", BUILDER: "#1B4332", FAMILY: "#D4AF37",
};

const BLOCK_TEXT_CLASSES: Record<string, string> = {
  DEEP_WORK: "text-primary",
  EXECUTION: "text-accent",
  IBM: "text-muted",
  HEALTH: "text-primary",
  REVIEW: "text-muted",
  BUILDER: "text-primary",
  FAMILY: "text-accent",
};

const BLOCK_CURRENT_CARD_CLASSES: Record<string, string> = {
  DEEP_WORK: "bg-primary/5 border-primary/30",
  EXECUTION: "bg-accent/10 border-accent/30",
  IBM: "bg-muted/10 border-muted/30",
  HEALTH: "bg-primary/5 border-primary/30",
  REVIEW: "bg-muted/10 border-muted/30",
  BUILDER: "bg-primary/5 border-primary/30",
  FAMILY: "bg-accent/10 border-accent/30",
};

const BLOCK_CURRENT_BADGE_CLASSES: Record<string, string> = {
  DEEP_WORK: "text-primary bg-primary/10",
  EXECUTION: "text-accent bg-accent/15",
  IBM: "text-muted bg-muted/10",
  HEALTH: "text-primary bg-primary/10",
  REVIEW: "text-muted bg-muted/10",
  BUILDER: "text-primary bg-primary/10",
  FAMILY: "text-accent bg-accent/15",
};

const COMPLETION_CLASSES: Record<string, string> = {
  COMPLETED: "text-primary border-primary/30 bg-primary/10",
  PARTIAL: "text-accent border-accent/30 bg-accent/10",
  SKIPPED: "text-muted border-muted/30 bg-muted/10",
};

export default async function Home() {
  const workspace = await db.workspace.findFirst();
  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold mb-2">No Workspace Found</h1>
          <p className="text-muted">Please run the seed script to initialize Founder data.</p>
        </div>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [blocks, laneStats, todayIntent] = await Promise.all([
    getOrGenerateTodayBlocks(workspace.id, workspace.timezone),
    getLaneStats(workspace.id),
    db.dailyIntent.findUnique({
      where: { workspaceId_date: { workspaceId: workspace.id, date: today } }
    }),
  ]);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const todayStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const classifiedBlocks = blocks.map(block => {
    const blockEnd = block.startMinute + block.durationMinutes;
    const isCurrent = nowMinutes >= block.startMinute && nowMinutes < blockEnd;
    const isPast = nowMinutes >= blockEnd;
    return { ...block, isCurrent, isPast };
  });

  const lastPastIdx = classifiedBlocks.reduce((acc, b, i) => b.isPast ? i : acc, -1);
  const nowInjectionIdx = lastPastIdx + 1;

  // IBM checklist state from DailyIntent
  const ibmState = {
    ibmFollowUpDone: todayIntent?.ibmFollowUpDone ?? false,
    ibmOutreachDone: todayIntent?.ibmOutreachDone ?? false,
    ibmDeepDiveDone: todayIntent?.ibmDeepDiveDone ?? false,
    ibmRelationshipDone: todayIntent?.ibmRelationshipDone ?? false,
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar workspaceName={workspace.name} workspaceId={workspace.id} laneStats={laneStats} />

      {/* Global Quick Capture — ⌘K */}
      <QuickCapture />

      <main className="flex-1 px-4 sm:px-16 py-6 sm:py-12 max-w-5xl">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 sm:mb-10 gap-4">
          <div>
            <p className="font-sans text-sm text-muted mb-2 tracking-wide uppercase">{todayStr}</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">Today's Execution</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline font-sans text-xs text-muted border border-border px-3 py-1.5 rounded">
              ⌘K to capture
            </span>
            <AddTaskModal />
          </div>
        </header>

        {/* Current Focus — what to do right now */}
        <CurrentFocus workspaceId={workspace.id} />

        {/* Daily Command Panel */}
        <MobileAccordion title="Command Panel">
          <DailyCommandPanel workspaceId={workspace.id} />
        </MobileAccordion>

        {/* End of Day Review */}
        <EndOfDayReviewWrapper workspaceId={workspace.id} />

        {/* Timeline */}
        <div className="relative border-l border-border ml-2 sm:ml-4 space-y-10 pb-16">
          {blocks.length === 0 && (
            <p className="pl-12 font-sans text-muted">No blocks scheduled for today.</p>
          )}

          {classifiedBlocks.map((block, idx) => {
            const isPast = block.isPast;
            const isCurrent = block.isCurrent;
            const blockType = block.type;
            const blockLabel = BLOCK_TITLES[blockType] ?? blockType;
            const minutesRemaining = (block.startMinute + block.durationMinutes) - nowMinutes;
            const textClass = BLOCK_TEXT_CLASSES[blockType] ?? "text-muted";
            const currentCardClass = BLOCK_CURRENT_CARD_CLASSES[blockType] ?? "bg-muted/10 border-muted/30";
            const currentBadgeClass = BLOCK_CURRENT_BADGE_CLASSES[blockType] ?? "text-muted bg-muted/10";
            const dotClass = isCurrent
              ? `bg-current ${textClass}`
              : isPast
                ? `bg-current ${textClass} opacity-30`
                : `bg-transparent border-2 border-current ${textClass} opacity-[0.55]`;

            // Build nowTask for BlockDetailPanel
            const nowTaskRaw = block.scheduledTasks.find(
              (st) => st.task.status !== "DONE"
            )?.task;
            const nowTask = nowTaskRaw ? {
              id: nowTaskRaw.id,
              title: nowTaskRaw.title,
              notes: nowTaskRaw.notes ?? null,
              effortMins: nowTaskRaw.effortMins,
              lane: nowTaskRaw.lane,
              project: nowTaskRaw.project,
              steps: [],
            } : null;

            return (
              <div key={block.id}>
                {idx === nowInjectionIdx && (
                  <div className="mb-10">
                    <NowIndicator nowMinutes={nowMinutes} />
                  </div>
                )}

                <div className={`relative pl-4 sm:pl-12 transition-opacity duration-300 ${isPast ? "opacity-40" : "opacity-100"}`}>
                  <div className={`absolute w-3 h-3 rounded-full -left-[6.5px] top-1.5 ring-4 ring-background ${dotClass}`} />

                  {isCurrent && (
                    <div className={`absolute -left-px top-0 bottom-0 w-0.5 opacity-[0.45] bg-current ${textClass}`} />
                  )}

                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <h3 className={`font-serif text-xl font-semibold ${isCurrent ? textClass : ""}`}>
                      {blockLabel}
                    </h3>
                    <span className="font-sans text-xs text-muted bg-surface px-2 py-1 rounded font-medium border border-border">
                      {formatMinutes(block.startMinute)} – {formatMinutes(block.startMinute + block.durationMinutes)}
                    </span>
                    {isCurrent && (
                      <span className={`font-sans text-xs font-bold tracking-widest uppercase px-2 py-0.5 rounded flex items-center gap-1.5 ${currentBadgeClass}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse bg-current ${textClass}`} />
                        Active
                      </span>
                    )}
                    {isPast && block.completionState && block.completionState !== "OPEN" ? (
                      <span className={`font-sans text-xs px-2 py-0.5 rounded border ${COMPLETION_CLASSES[block.completionState] ?? "text-muted border-muted/30 bg-muted/10"}`}>
                        {block.completionState === "COMPLETED" ? "Completed" : block.completionState === "PARTIAL" ? "Partial" : "Skipped"}
                      </span>
                    ) : isPast && (
                      <span className="font-sans text-xs text-muted px-2 py-0.5 rounded border border-border">Complete</span>
                    )}
                    {block.isLocked && (
                      <span className="font-sans text-xs text-muted border border-border px-2 py-1 rounded flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z" />
                        </svg>
                        Locked
                      </span>
                    )}
                    {/* Start Block / Enter Now Mode button on all non-past blocks */}
                    {!isPast && (
                      <Link href={`/now?blockId=${block.id}`}
                        className="font-sans text-xs font-semibold border border-border px-3 py-1 rounded hover:bg-surface transition-colors sm:ml-auto">
                        {isCurrent ? "Enter Now Mode" : "Start Block"} →
                      </Link>
                    )}
                  </div>

                  {/* Tasks */}
                  {block.scheduledTasks.length > 0 ? (
                    <div className={`rounded border p-3 sm:p-5 space-y-4 shadow-sm ${isCurrent ? currentCardClass : "bg-surface border-border"}`}>
                      {block.scheduledTasks.map((st, stIdx) => (
                        <TaskRow
                          key={st.id}
                          task={st.task}
                          allocatedMinutes={st.allocatedMinutes || st.task.effortMins}
                          scheduledTaskId={st.id}
                          canMoveUp={stIdx > 0}
                          canMoveDown={stIdx < block.scheduledTasks.length - 1}
                        />
                      ))}
                    </div>
                  ) : blockType === "IBM" ? (
                    /* IBM Checklist instead of empty */
                    <div className="rounded border p-5 shadow-sm bg-surface border-border">
                      <MobileAccordion title="IBM Checklist">
                        <IbmChecklist initial={ibmState} />
                      </MobileAccordion>
                    </div>
                  ) : (
                    <div className="bg-background border border-dashed border-border rounded p-6 text-center">
                      <p className="font-sans text-sm text-muted">
                        {isCurrent ? "No tasks scheduled — block is open." : "Block empty."}
                      </p>
                    </div>
                  )}

                  {/* Block Detail Panel — for non-past blocks only */}
                  {!isPast && (
                    <BlockDetailPanel
                      blockId={block.id}
                      workspaceId={workspace.id}
                      blockType={blockType}
                      blockLabel={blockLabel}
                      minutesRemaining={Math.max(0, minutesRemaining)}
                      objective={block.objective ?? null}
                      parkingLotNotes={block.parkingLotNotes ?? null}
                      nowTask={nowTask}
                      isActive={isCurrent}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {nowInjectionIdx >= classifiedBlocks.length && blocks.length > 0 && (
            <div className="mt-4"><NowIndicator nowMinutes={nowMinutes} /></div>
          )}
        </div>

        {/* Today Work Log */}
        <MobileAccordion title="Work Log">
          <TodayWorkLog workspaceId={workspace.id} />
        </MobileAccordion>

      </main>
    </div>
  );
}
