"use server";

import { db, SavedContentType } from "@operator-os/db";
import { generateDailyContent, regenerateSingleCard, type CardType } from "@/lib/daily-growth";
import { revalidatePath } from "next/cache";

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function generateDailyContentAction(): Promise<void> {
  const today = todayMidnight();
  const existing = await db.dailyContent.findUnique({ where: { date: today } });
  if (existing) return;

  const data = await generateDailyContent();
  await db.dailyContent.create({ data: { date: today, ...data } });
}

export async function regenerateCardAction(cardType: CardType) {
  const today = todayMidnight();
  const partial = await regenerateSingleCard(cardType);
  await db.dailyContent.update({ where: { date: today }, data: partial });
  return partial;
}

export async function getTodayContent() {
  const today = todayMidnight();
  return db.dailyContent.findUnique({ where: { date: today } });
}

export async function saveContentAction(input: {
  workspaceId: string;
  type: SavedContentType;
  title: string;
  body: string;
}): Promise<void> {
  await db.savedContent.create({ data: input });
  revalidatePath("/grow");
}

export async function unsaveContentAction(id: string): Promise<void> {
  await db.savedContent.delete({ where: { id } });
  revalidatePath("/grow");
}

export async function getSavedContent(workspaceId: string) {
  return db.savedContent.findMany({
    where: { workspaceId },
    orderBy: { savedAt: "desc" },
  });
}
