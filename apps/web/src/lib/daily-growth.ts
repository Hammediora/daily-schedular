import Anthropic from "@anthropic-ai/sdk";

export type UsedContent = {
  words?: string[];
  quoteAuthors?: string[];
  mentalModels?: string[];
  poemTitles?: string[];
  storageConceptTitles?: string[];
  techTips?: string[];
};

function avoidClause(label: string, items: string[] | undefined): string {
  if (!items || items.length === 0) return "";
  return `\nDo NOT reuse any of these previously used ${label}: ${items.map((s) => `"${s}"`).join(", ")}.`;
}

function buildPrompt(used: UsedContent): string {
  const avoid =
    avoidClause("words", used.words) +
    avoidClause("quote authors", used.quoteAuthors) +
    avoidClause("mental models", used.mentalModels) +
    avoidClause("poem titles", used.poemTitles) +
    avoidClause("storage concept titles", used.storageConceptTitles);

  return `Generate today's personal growth brief as a JSON object. Return ONLY valid JSON — no markdown fences, no explanation, no extra text before or after.
${avoid}
{
  "word": "a sophisticated but natural English word that improves conversational vocabulary — avoid overly academic words, pick ones that elevate speech without sounding pretentious",
  "wordDefinition": "clear, simple one-line definition",
  "wordPronunciation": "phonetic pronunciation guide using simple English syllables, e.g. 'SAN-gwinn' or 'per-SPI-kay-shus'",
  "wordCasual": "example in a casual/social conversation",
  "wordBusiness": "example in a professional/business conversation",
  "wordTechnical": "example in a technical or engineering conversation",
  "techTip": "a practical, specific tip relevant to software engineering, AI/ML, or founder/operator work",
  "quote": "an impactful quote from philosophy, stoicism, strategy, or leadership — no generic motivational content",
  "quoteAuthor": "full author name",
  "mentalModel": "name of a well-known mental model (e.g. First Principles, Inversion, Second-Order Thinking, Occam's Razor, Hanlon's Razor, Circle of Competence)",
  "mentalModelExplanation": "2-3 sentences: what it is and one concrete way to apply it today",
  "poem": "a complete short poem — draw from Greek mythology tradition, Rumi, Hafiz, Shakespeare, Keats, Wordsworth, Dylan Thomas, or other classic poets",
  "poemTitle": "title of the poem",
  "poemAuthor": "poet's full name",
  "storageConceptTitle": "a specific enterprise storage technology concept — rotate through: NVMe, NVMe-oF, NVMe/TCP, RAID levels, erasure coding, deduplication, compression, thin provisioning, storage tiering, SAN vs NAS vs object storage, IBM FlashSystem, IBM Spectrum Scale (GPFS), IBM DS8000, fibre channel, iSCSI, SCSI command set, LUN masking/zoning, multipathing (MPIO), snapshots vs clones, copy-on-write, redirect-on-write, replication (sync/async), RPO/RTO, storage QoS, cache algorithms (LRU/ARC), DRAM vs NAND vs SCM, Optane/PMem, block vs file vs object semantics, S3 protocol internals, data placement algorithms, consistent hashing, CRUSH map, Ceph, vSAN, pure storage, NetApp ONTAP, data reduction ratios, write amplification, endurance, wear leveling",
  "storageConceptExplanation": "3-4 sentences: what it is technically, how it works under the hood, why it matters in enterprise environments, and one real-world scenario where this concept is critical — written for a senior IBM storage specialist who wants deep technical knowledge"
}`;
}

function buildSingleCardPrompt(cardType: string, usedValues: string[]): string {
  const avoid = usedValues.length > 0 ? `\nDo NOT reuse any of these previously used values: ${usedValues.map((s) => `"${s}"`).join(", ")}.` : "";

  const templates: Record<string, string> = {
    WORD: `Return ONLY valid JSON, no markdown fences:${avoid}
{"word":"a sophisticated but natural English word that improves conversational vocabulary","wordDefinition":"clear simple definition","wordPronunciation":"phonetic guide e.g. SAN-gwinn","wordCasual":"casual conversation example","wordBusiness":"business conversation example","wordTechnical":"technical conversation example"}`,
    TECH: `Return ONLY valid JSON, no markdown fences:${avoid}
{"techTip":"a practical specific tip relevant to software engineering, AI/ML, or founder/operator work"}`,
    QUOTE: `Return ONLY valid JSON, no markdown fences:${avoid}
{"quote":"an impactful quote from philosophy, stoicism, strategy, or leadership — no generic motivational content","quoteAuthor":"full author name"}`,
    MENTAL_MODEL: `Return ONLY valid JSON, no markdown fences:${avoid}
{"mentalModel":"name of a well-known mental model","mentalModelExplanation":"2-3 sentences: what it is and one concrete way to apply it today"}`,
    POEM: `Return ONLY valid JSON, no markdown fences:${avoid}
{"poem":"a complete short poem from Greek mythology tradition, Rumi, Hafiz, Shakespeare, Keats, Wordsworth, Dylan Thomas or other classic poets","poemTitle":"title","poemAuthor":"poet full name"}`,
    STORAGE: `Return ONLY valid JSON, no markdown fences:${avoid}
{"storageConceptTitle":"a specific enterprise storage technology concept (NVMe, NVMe-oF, RAID, erasure coding, deduplication, IBM FlashSystem, fibre channel, iSCSI, multipathing, snapshots, replication, RPO/RTO, cache algorithms, DRAM vs NAND, object storage, S3 internals, etc)","storageConceptExplanation":"3-4 sentences: what it is technically, how it works under the hood, why it matters in enterprise, one real-world scenario — written for a senior IBM storage specialist"}`,
  };

  const prompt = templates[cardType];
  if (!prompt) throw new Error(`Unknown card type: ${cardType}`);
  return prompt;
}

export type DailyContentData = {
  word: string;
  wordDefinition: string;
  wordPronunciation: string;
  wordCasual: string;
  wordBusiness: string;
  wordTechnical: string;
  techTip: string;
  quote: string;
  quoteAuthor: string;
  mentalModel: string;
  mentalModelExplanation: string;
  poem: string;
  poemTitle: string;
  poemAuthor: string;
  storageConceptTitle: string;
  storageConceptExplanation: string;
};

export type CardType = "WORD" | "TECH" | "QUOTE" | "MENTAL_MODEL" | "POEM" | "STORAGE";

export async function regenerateSingleCard(cardType: CardType, usedValues: string[] = []): Promise<Partial<DailyContentData>> {
  const prompt = buildSingleCardPrompt(cardType, usedValues);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });
  const block = message.content[0];
  if (block.type !== "text") throw new Error(`Unexpected response type: ${block.type}`);
  const cleaned = block.text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned) as Partial<DailyContentData>;
}

export async function generateDailyContent(used: UsedContent = {}): Promise<DailyContentData> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [{ role: "user", content: buildPrompt(used) }],
  });
  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error(`Unexpected response type from Claude: ${block.type}`);
  }
  const cleaned = block.text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned) as DailyContentData;
}
