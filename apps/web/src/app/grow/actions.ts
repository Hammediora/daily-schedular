"use server";

import { db, SavedContentType } from "@operator-os/db";
import { generateDailyContent, regenerateSingleCard, type CardType, type UsedContent } from "@/lib/daily-growth";
import { revalidatePath } from "next/cache";

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getRecentHistory(days = 60) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);
  return db.dailyContent.findMany({
    where: { date: { gte: since } },
    select: {
      word: true,
      quoteAuthor: true,
      mentalModel: true,
      poemTitle: true,
      storageConceptTitle: true,
    },
  });
}

function buildUsedContent(history: Awaited<ReturnType<typeof getRecentHistory>>): UsedContent {
  return {
    words: history.map((h) => h.word).filter(Boolean) as string[],
    quoteAuthors: history.map((h) => h.quoteAuthor).filter(Boolean) as string[],
    mentalModels: history.map((h) => h.mentalModel).filter(Boolean) as string[],
    poemTitles: history.map((h) => h.poemTitle).filter(Boolean) as string[],
    storageConceptTitles: history.map((h) => h.storageConceptTitle).filter(Boolean) as string[],
  };
}

export async function generateDailyContentAction(): Promise<void> {
  const today = todayMidnight();
  const existing = await db.dailyContent.findUnique({ where: { date: today } });
  if (existing) return;

  const history = await getRecentHistory(60);
  const used = buildUsedContent(history);
  const data = await generateDailyContent(used);
  await db.dailyContent.create({ data: { date: today, ...data } });
}

export async function regenerateCardAction(cardType: CardType) {
  const today = todayMidnight();
  const history = await getRecentHistory(60);

  const usedMap: Record<CardType, string[]> = {
    WORD: history.map((h) => h.word).filter(Boolean) as string[],
    QUOTE: history.map((h) => h.quoteAuthor).filter(Boolean) as string[],
    MENTAL_MODEL: history.map((h) => h.mentalModel).filter(Boolean) as string[],
    POEM: history.map((h) => h.poemTitle).filter(Boolean) as string[],
    STORAGE: history.map((h) => h.storageConceptTitle).filter(Boolean) as string[],
    TECH: [],
  };

  const partial = await regenerateSingleCard(cardType, usedMap[cardType]);
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
