import { db } from "@operator-os/db";
import Sidebar from "@/components/Sidebar";
import TemplatesClient from "@/components/TemplatesClient";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function TemplatesPage() {
  const workspace = await db.workspace.findFirst();
  if (!workspace) return null;

  const templates = await db.timeBlockTemplate.findMany({
    where: { workspaceId: workspace.id },
    orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar workspaceName={workspace.name} workspaceId={workspace.id} />
      <main className="flex-1 px-16 py-12 max-w-4xl">
        <header className="flex justify-between items-end mb-12">
          <div>
            <p className="font-sans text-sm text-muted mb-2 tracking-wide uppercase">Schedule Structure</p>
            <h2 className="font-serif text-4xl font-bold">Block Templates</h2>
          </div>
        </header>
        <TemplatesClient templates={templates} dayNames={DAY_NAMES} />
      </main>
    </div>
  );
}
