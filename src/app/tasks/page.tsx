import { db } from "@operator-os/db";
import Sidebar from "@/components/Sidebar";
import TasksClient from "@/components/TasksClient";
import { getLaneStats } from "@/lib/lane-stats";

export default async function TasksPage() {
  const workspace = await db.workspace.findFirst();
  if (!workspace) return null;

  const [tasks, laneStats] = await Promise.all([
    db.task.findMany({
      where: { workspaceId: workspace.id },
      orderBy: [{ status: "asc" }, { impactScore: "desc" }, { createdAt: "desc" }],
    }),
    getLaneStats(workspace.id),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar workspaceName={workspace.name} workspaceId={workspace.id} laneStats={laneStats} />
      <main className="flex-1 px-16 py-12 max-w-5xl">
        <header className="flex justify-between items-end mb-12">
          <div>
            <p className="font-sans text-sm text-muted mb-2 tracking-wide uppercase">Pipeline</p>
            <h2 className="font-serif text-4xl font-bold">Task Backlog</h2>
          </div>
        </header>
        <TasksClient tasks={tasks} />
      </main>
    </div>
  );
}
