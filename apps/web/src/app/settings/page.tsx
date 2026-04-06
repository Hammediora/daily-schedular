import { db } from "@operator-os/db";
import Sidebar from "@/components/Sidebar";
import SettingsClient from "@/components/SettingsClient";
import { getLaneStats } from "@/lib/lane-stats";

export default async function SettingsPage() {
  const workspace = await db.workspace.findFirst();
  if (!workspace) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [constraints, intent, laneStats] = await Promise.all([
    db.weeklyConstraint.findMany({ where: { workspaceId: workspace.id } }),
    db.dailyIntent.findUnique({ where: { workspaceId_date: { workspaceId: workspace.id, date: today } } }),
    getLaneStats(workspace.id),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar workspaceName={workspace.name} workspaceId={workspace.id} laneStats={laneStats} />
      <main className="flex-1 px-4 sm:px-16 py-6 sm:py-12 max-w-3xl">
        <header className="mb-12">
          <p className="font-sans text-sm text-muted mb-2 tracking-wide uppercase">Configuration</p>
          <h2 className="font-serif text-4xl font-bold">Settings</h2>
        </header>
        <SettingsClient
          workspace={workspace}
          constraints={constraints}
          intent={intent}
        />
      </main>
    </div>
  );
}
