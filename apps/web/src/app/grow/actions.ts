"use server";

import { db, SavedContentType } from "@operator-os/db";
import { generateDailyContent, regenerateSingleCard, type CardType, type UsedContent } from "@/lib/daily-growth";
import { revalidatePath } from "next/cache";

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getUsedValues(): Promise<UsedContent> {
  const rows = await db.growthUsedValue.findMany({ select: { field: true, value: true } });
  const byField: Record<string, string[]> = {};
  for (const row of rows) {
    if (!byField[row.field]) byField[row.field] = [];
    byField[row.field].push(row.value);
  }
  return {
    words: byField["word"] ?? [],
    quoteAuthors: byField["quoteAuthor"] ?? [],
    mentalModels: byField["mentalModel"] ?? [],
    poemTitles: byField["poemTitle"] ?? [],
    storageConceptTitles: byField["storageConceptTitle"] ?? [],
  };
}

async function logUsedValues(values: Record<string, string | undefined | null>) {
  const rows = Object.entries(values)
    .filter(([, v]) => v)
    .map(([field, value]) => ({ field, value: value! }));

  if (rows.length === 0) return;

  await db.growthUsedValue.createMany({
    data: rows,
    skipDuplicates: true,
  });
}

export async function generateDailyContentAction(): Promise<void> {
  const today = todayMidnight();
  const existing = await db.dailyContent.findUnique({ where: { date: today } });
  if (existing) return;

  const used = await getUsedValues();
  const data = await generateDailyContent(used);
  await db.dailyContent.create({ data: { date: today, ...data } });

  await logUsedValues({
    word: data.word,
    quoteAuthor: data.quoteAuthor,
    mentalModel: data.mentalModel,
    poemTitle: data.poemTitle,
    storageConceptTitle: data.storageConceptTitle,
  });
}

export async function regenerateCardAction(cardType: CardType) {
  const today = todayMidnight();
  const used = await getUsedValues();

  const usedMap: Record<CardType, string[]> = {
    WORD: used.words ?? [],
    QUOTE: used.quoteAuthors ?? [],
    MENTAL_MODEL: used.mentalModels ?? [],
    POEM: used.poemTitles ?? [],
    STORAGE: used.storageConceptTitles ?? [],
    TECH: [],
  };

  const partial = await regenerateSingleCard(cardType, usedMap[cardType]);
  await db.dailyContent.update({ where: { date: today }, data: partial });

  // Log whichever field this card type owns
  const fieldMap: Partial<Record<CardType, string>> = {
    WORD: "word",
    QUOTE: "quoteAuthor",
    MENTAL_MODEL: "mentalModel",
    POEM: "poemTitle",
    STORAGE: "storageConceptTitle",
  };
  const field = fieldMap[cardType];
  if (field) {
    const value = (partial as Record<string, string | undefined>)[field];
    if (value) await logUsedValues({ [field]: value });
  }

  return partial;
}

export async function getTodayContent() {
  const today = todayMidnight();
  return db.dailyContent.findUnique({ where: { date: today } });
}

export async function getContentHistory() {
  return db.dailyContent.findMany({
    orderBy: { date: "desc" },
  });
}

export async function getGrowthStreak(): Promise<number> {
  const records = await db.dailyContent.findMany({
    select: { date: true },
    orderBy: { date: "desc" },
  });
  if (records.length === 0) return 0;

  const today = todayMidnight();
  let streak = 0;
  for (let i = 0; i < records.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const recordDate = new Date(records[i].date);
    recordDate.setHours(0, 0, 0, 0);
    if (recordDate.getTime() === expected.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export async function saveContentAction(input: {
  workspaceId: string;
  type: SavedContentType;
  title: string;
  body: string;
}): Promise<void> {
  await db.savedContent.create({ data: input });
  revalidatePath("/grow");
  revalidatePath("/grow/saved");
}

export async function unsaveContentAction(id: string): Promise<void> {
  await db.savedContent.delete({ where: { id } });
  revalidatePath("/grow");
  revalidatePath("/grow/saved");
}

export async function getSavedContent(workspaceId: string) {
  return db.savedContent.findMany({
    where: { workspaceId },
    orderBy: { savedAt: "desc" },
  });
}
