"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveContentAction, unsaveContentAction, regenerateCardAction } from "./actions";
import type { SavedContentType } from "@operator-os/db";

type DailyContent = {
  id: string;
  word: string;
  wordDefinition: string;
  wordPronunciation?: string;
  wordCasual?: string;
  wordBusiness?: string;
  wordTechnical?: string;
  wordExample?: string;
  techTip: string;
  quote: string;
  quoteAuthor: string;
  mentalModel: string;
  mentalModelExplanation: string;
  poem: string;
  poemTitle: string;
  poemAuthor: string;
  storageConceptTitle?: string;
  storageConceptExplanation?: string;
};

type SavedItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  savedAt: Date;
};

type ContentType = "WORD" | "TECH" | "QUOTE" | "MENTAL_MODEL" | "POEM" | "STORAGE";

export default function GrowClient({
  content,
  saved,
  workspaceId,
}: {
  content: DailyContent | null;
  saved: SavedItem[];
  workspaceId: string;
}) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>(saved);
  const [localContent, setLocalContent] = useState<DailyContent | null>(content);
  const [refreshing, setRefreshing] = useState<ContentType | null>(null);
  const [, startTransition] = useTransition();

  function isSaved(type: ContentType, title: string) {
    return savedItems.some((s) => s.type === type && s.title === title);
  }

  function getSavedId(type: ContentType, title: string) {
    return savedItems.find((s) => s.type === type && s.title === title)?.id;
  }

  function toggleSave(type: ContentType, title: string, body: string) {
    if (isSaved(type, title)) {
      const id = getSavedId(type, title)!;
      setSavedItems((prev) => prev.filter((s) => s.id !== id));
      startTransition(() => unsaveContentAction(id));
    } else {
      const optimistic: SavedItem = { id: crypto.randomUUID(), type, title, body, savedAt: new Date() };
      setSavedItems((prev) => [optimistic, ...prev]);
      startTransition(() => saveContentAction({ workspaceId, type: type as SavedContentType, title, body }));
    }
  }

  async function handleRefresh(cardType: ContentType) {
    setRefreshing(cardType);
    try {
      const partial = await regenerateCardAction(cardType);
      setLocalContent((prev) => prev ? { ...prev, ...partial } : prev);
    } finally {
      setRefreshing(null);
    }
  }

  const RefreshBtn = ({ cardType }: { cardType: ContentType }) => (
    <button
      onClick={() => handleRefresh(cardType)}
      disabled={refreshing === cardType}
      className="text-muted/40 hover:text-muted transition-colors disabled:cursor-not-allowed"
      title="Regenerate"
    >
      <span className={`text-sm inline-block ${refreshing === cardType ? "animate-spin" : ""}`}>↻</span>
    </button>
  );

  const SaveBtn = ({ type, title, body }: { type: ContentType; title: string; body: string }) => {
    const active = isSaved(type, title);
    return (
      <button
        onClick={() => toggleSave(type, title, body)}
        className={`text-base transition-all duration-200 ${active ? "text-accent scale-110" : "text-muted/40 hover:text-muted"}`}
        title={active ? "Saved" : "Save"}
      >
        {active ? "★" : "☆"}
      </button>
    );
  };

  if (!localContent) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="font-sans text-sm text-muted">Generating today&apos;s brief…</p>
        <p className="font-sans text-xs text-muted/40">Refresh in a moment</p>
      </div>
    );
  }

  const c = localContent;
  const savedCount = savedItems.length;

  return (
    <div className="space-y-3">

      {/* ── Word of the Day ── */}
      <section className="rounded-xl border border-border bg-gradient-to-br from-card/40 to-card/10 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="font-sans text-[10px] uppercase tracking-widest text-accent font-semibold">Word of the Day</span>
            <h3 className="font-serif text-3xl font-bold mt-1">{c.word}</h3>
            {c.wordPronunciation && (
              <p className="font-sans text-xs text-accent/70 mt-0.5 tracking-wide">/{c.wordPronunciation}/</p>
            )}
            <p className="font-sans text-sm text-muted mt-1">{c.wordDefinition}</p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshBtn cardType="WORD" />
            <SaveBtn type="WORD" title={c.word} body={`${c.wordDefinition}\n\nCasual: ${c.wordCasual}\nBusiness: ${c.wordBusiness}\nTechnical: ${c.wordTechnical}`} />
          </div>
        </div>
        <div className="space-y-2 mt-4 border-t border-border/50 pt-4">
          {c.wordCasual && (
            <div className="flex gap-3">
              <span className="font-sans text-[10px] uppercase tracking-wider text-muted/60 w-20 shrink-0 pt-0.5">Casual</span>
              <p className="font-sans text-sm italic text-foreground/75">&ldquo;{c.wordCasual}&rdquo;</p>
            </div>
          )}
          {c.wordBusiness && (
            <div className="flex gap-3">
              <span className="font-sans text-[10px] uppercase tracking-wider text-muted/60 w-20 shrink-0 pt-0.5">Business</span>
              <p className="font-sans text-sm italic text-foreground/75">&ldquo;{c.wordBusiness}&rdquo;</p>
            </div>
          )}
          {c.wordTechnical && (
            <div className="flex gap-3">
              <span className="font-sans text-[10px] uppercase tracking-wider text-muted/60 w-20 shrink-0 pt-0.5">Technical</span>
              <p className="font-sans text-sm italic text-foreground/75">&ldquo;{c.wordTechnical}&rdquo;</p>
            </div>
          )}
          {!c.wordCasual && c.wordExample && (
            <p className="font-sans text-sm italic text-foreground/75">&ldquo;{c.wordExample}&rdquo;</p>
          )}
        </div>
      </section>

      {/* ── Storage Deep Dive ── */}
      {c.storageConceptTitle && (
        <section className="rounded-xl border border-accent/20 bg-accent/5 p-6">
          <div className="flex justify-between items-start mb-3">
            <span className="font-sans text-[10px] uppercase tracking-widest text-accent font-semibold">Storage Deep Dive</span>
            <div className="flex items-center gap-2">
              <RefreshBtn cardType="STORAGE" />
              <SaveBtn type="STORAGE" title={c.storageConceptTitle} body={`${c.storageConceptTitle}\n\n${c.storageConceptExplanation}`} />
            </div>
          </div>
          <h3 className="font-serif text-xl font-bold mb-3">{c.storageConceptTitle}</h3>
          <p className="font-sans text-sm leading-relaxed text-foreground/85">{c.storageConceptExplanation}</p>
        </section>
      )}

      {/* ── Tech Tip ── */}
      <section className="rounded-xl border border-border bg-card/20 p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="font-sans text-[10px] uppercase tracking-widest text-muted font-semibold">Tech Tip</span>
          <div className="flex items-center gap-2">
            <RefreshBtn cardType="TECH" />
            <SaveBtn type="TECH" title="Tech Tip" body={c.techTip} />
          </div>
        </div>
        <p className="font-sans text-sm leading-relaxed text-foreground/85">{c.techTip}</p>
      </section>

      {/* ── Quote ── */}
      <section className="rounded-xl border border-border bg-card/20 p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="font-sans text-[10px] uppercase tracking-widest text-muted font-semibold">Quote</span>
          <div className="flex items-center gap-2">
            <RefreshBtn cardType="QUOTE" />
            <SaveBtn type="QUOTE" title={c.quoteAuthor} body={`"${c.quote}" — ${c.quoteAuthor}`} />
          </div>
        </div>
        <div className="border-l-2 border-accent/60 pl-5">
          <p className="font-serif text-xl italic leading-relaxed mb-3">&ldquo;{c.quote}&rdquo;</p>
          <p className="font-sans text-xs text-muted tracking-wide">— {c.quoteAuthor}</p>
        </div>
      </section>

      {/* ── Mental Model ── */}
      <section className="rounded-xl border border-border bg-card/20 p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="font-sans text-[10px] uppercase tracking-widest text-muted font-semibold">Mental Model</span>
          <div className="flex items-center gap-2">
            <RefreshBtn cardType="MENTAL_MODEL" />
            <SaveBtn type="MENTAL_MODEL" title={c.mentalModel} body={`${c.mentalModel}\n\n${c.mentalModelExplanation}`} />
          </div>
        </div>
        <h3 className="font-serif text-xl font-bold mb-2">{c.mentalModel}</h3>
        <p className="font-sans text-sm leading-relaxed text-foreground/80">{c.mentalModelExplanation}</p>
      </section>

      {/* ── Poem ── */}
      <section className="rounded-xl border border-border bg-card/20 p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="font-sans text-[10px] uppercase tracking-widest text-muted font-semibold">Poem</span>
          <div className="flex items-center gap-2">
            <RefreshBtn cardType="POEM" />
            <SaveBtn type="POEM" title={c.poemTitle} body={`${c.poemTitle} — ${c.poemAuthor}\n\n${c.poem}`} />
          </div>
        </div>
        <h3 className="font-serif text-lg font-bold">{c.poemTitle}</h3>
        <p className="font-sans text-xs text-muted mb-5">— {c.poemAuthor}</p>
        <pre className="font-serif text-sm leading-8 whitespace-pre-wrap text-foreground/80">{c.poem}</pre>
      </section>

      {/* ── Footer link to saved library ── */}
      {savedCount > 0 && (
        <div className="pt-4 text-center">
          <Link
            href="/grow/saved"
            className="font-sans text-xs text-muted/60 hover:text-accent transition-colors"
          >
            View your {savedCount} saved item{savedCount !== 1 ? "s" : ""} →
          </Link>
        </div>
      )}
    </div>
  );
}
