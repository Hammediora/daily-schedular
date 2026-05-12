import { db } from "@operator-os/db";
import { getLaneStats } from "@/lib/lane-stats";
import Sidebar from "@/components/Sidebar";
import {
  getTodayContent,
  getSavedContent,
  generateDailyContentAction,
  getGrowthStreak,
} from "./actions";
import GrowClient from "./GrowClient";
import GrowNav from "./GrowNav";

export const dynamic = "force-dynamic";

export default async function GrowPage() {
  const workspace = await db.workspace.findFirst();
  if (!workspace) return null;

  let content = await getTodayContent();
  if (!content) {
    await generateDailyContentAction().catch((err) => console.error("[GrowPage] Generation failed:", err));
    content = await getTodayContent();
  }

  const [saved, laneStats, streak] = await Promise.all([
    getSavedContent(workspace.id),
    getLaneStats(workspace.id),
    getGrowthStreak(),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar
        workspaceName={workspace.name}
        workspaceId={workspace.id}
        laneStats={laneStats}
      />
      <main className="flex-1 px-4 sm:px-16 py-6 sm:py-12 max-w-3xl">
        <header className="mb-8">
          <p className="font-sans text-sm text-muted mb-2 tracking-wide uppercase">
            Personal Growth
          </p>
          <h2 className="font-serif text-4xl font-bold">Daily Brief</h2>
          <p className="font-sans text-sm text-muted mt-2">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </header>
        <GrowNav savedCount={saved.length} streak={streak} />
        <GrowClient
          content={content}
          saved={saved}
          workspaceId={workspace.id}
        />
      </main>
    </div>
  );
}
