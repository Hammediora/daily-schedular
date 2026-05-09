import { db } from "@operator-os/db";

type BlockType = "DEEP_WORK" | "EXECUTION" | "IBM" | "HEALTH" | "REVIEW" | "BUILDER" | "FAMILY";

const BLOCK_LABELS: Record<BlockType, string> = {
  DEEP_WORK: "Deep Work",
  EXECUTION: "Execution",
  IBM: "IBM",
  HEALTH: "Health",
  REVIEW: "Review",
  BUILDER: "Builder",
  FAMILY: "Family",
};

export interface EnergyInsights {
  sampleSize: number;
  strongestBlockType: string | null;
  strongestBlockAvg: number | null;
  weakestBlockType: string | null;
  weakestBlockAvg: number | null;
  bestWindowLabel: string | null;
  bestWindowAvg: number | null;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toWindowLabel(startMinute: number) {
  const hour = Math.floor(startMinute / 60);
  const endHour = (hour + 1) % 24;
  const startAmPm = hour >= 12 ? "PM" : "AM";
  const endAmPm = endHour >= 12 ? "PM" : "AM";
  const start12 = hour % 12 || 12;
  const end12 = endHour % 12 || 12;
  return `${start12}${startAmPm}-${end12}${endAmPm}`;
}

export async function getEnergyInsights(workspaceId: string): Promise<EnergyInsights> {
  const from = new Date();
  from.setDate(from.getDate() - 21);
  from.setHours(0, 0, 0, 0);

  const rows = await db.timeBlockInstance.findMany({
    where: {
      workspaceId,
      date: { gte: from },
      completionState: { in: ["COMPLETED", "PARTIAL"] },
      energyRating: { not: null },
    },
    select: {
      type: true,
      startMinute: true,
      energyRating: true,
    },
  });

  if (rows.length === 0) {
    return {
      sampleSize: 0,
      strongestBlockType: null,
      strongestBlockAvg: null,
      weakestBlockType: null,
      weakestBlockAvg: null,
      bestWindowLabel: null,
      bestWindowAvg: null,
    };
  }

  const byType = new Map<string, number[]>();
  const byHour = new Map<number, number[]>();

  for (const row of rows) {
    if (!row.energyRating) continue;
    const valuesByType = byType.get(row.type) ?? [];
    valuesByType.push(row.energyRating);
    byType.set(row.type, valuesByType);

    const hour = Math.floor(row.startMinute / 60);
    const valuesByHour = byHour.get(hour) ?? [];
    valuesByHour.push(row.energyRating);
    byHour.set(hour, valuesByHour);
  }

  const typeEntries = Array.from(byType.entries()).map(([type, values]) => ({
    type,
    avg: average(values),
    count: values.length,
  }));
  typeEntries.sort((a, b) => b.avg - a.avg);

  const strongest = typeEntries[0] ?? null;
  const weakest = typeEntries[typeEntries.length - 1] ?? null;

  const windowEntries = Array.from(byHour.entries()).map(([hour, values]) => ({
    hour,
    avg: average(values),
    count: values.length,
  }));
  windowEntries.sort((a, b) => {
    if (b.avg !== a.avg) return b.avg - a.avg;
    return b.count - a.count;
  });

  const bestWindow = windowEntries[0] ?? null;

  return {
    sampleSize: rows.length,
    strongestBlockType: strongest ? BLOCK_LABELS[strongest.type as BlockType] ?? strongest.type : null,
    strongestBlockAvg: strongest ? Number(strongest.avg.toFixed(2)) : null,
    weakestBlockType: weakest ? BLOCK_LABELS[weakest.type as BlockType] ?? weakest.type : null,
    weakestBlockAvg: weakest ? Number(weakest.avg.toFixed(2)) : null,
    bestWindowLabel: bestWindow ? toWindowLabel(bestWindow.hour * 60) : null,
    bestWindowAvg: bestWindow ? Number(bestWindow.avg.toFixed(2)) : null,
  };
}
