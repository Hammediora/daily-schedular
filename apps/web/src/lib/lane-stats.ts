import { db } from "@operator-os/db";

const LANE_META = {
    REVENUE: { label: "Revenue", color: "#D4AF37" },
    ASSET: { label: "Asset", color: "#1B4332" },
    LEVERAGE: { label: "Leverage", color: "#5A5A5A" },
    HEALTH: { label: "Health", color: "#8B4513" },
} as const;

export type LaneStat = { lane: string; label: string; pct: number; color: string };

export async function getLaneStats(workspaceId: string): Promise<LaneStat[]> {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const [constraints, doneTasks] = await Promise.all([
        db.weeklyConstraint.findMany({ where: { workspaceId } }),
        db.task.findMany({
            where: { workspaceId, status: "DONE", completedAt: { gte: weekStart, lt: weekEnd } },
            select: { lane: true, effortMins: true },
        }),
    ]);

    return (["REVENUE", "ASSET", "LEVERAGE", "HEALTH"] as const).map(lane => {
        const constraint = constraints.find(c => c.lane === lane);
        const required = constraint?.minimumMinutes ?? 300;
        const completed = doneTasks.filter(t => t.lane === lane).reduce((s, t) => s + t.effortMins, 0);
        const pct = Math.min(100, Math.round((completed / required) * 100));
        return { lane, pct, ...LANE_META[lane] };
    });
}
