"use client";

import { useState, useTransition } from "react";
import { saveContentAction, unsaveContentAction } from "./actions";

type DailyContent = {
  id: string;
  word: string;
  wordDefinition: string;
  wordPronunciation?: string;
  wordCasual?: string;
  wordBusiness?: string;
  wordTechnical?: string;
  wordExample?: string; // legacy fallback
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

const TABS: { key: ContentType; label: string }[] = [
  { key: "WORD", label: "Words" },
  { key: "STORAGE", label: "Storage" },
  { key: "TECH", label: "Tech" },
  { key: "QUOTE", label: "Quotes" },
  { key: "MENTAL_MODEL", label: "Models" },
  { key: "POEM", label: "Poems" },
];

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
  const [activeTab, setActiveTab] = useState<ContentType>("WORD");
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
      startTransition(() => saveContentAction({ workspaceId, type: type as any, title, body }));
    }
  }

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

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="font-sans text-sm text-muted">Generating today&apos;s brief…</p>
        <p className="font-sans text-xs text-muted/40">Refresh in a moment</p>
      </div>
    );
  }

  const filteredSaved = savedItems.filter((s) => s.type === activeTab);

  return (
    <div className="space-y-3">

      {/* ── Word of the Day ── */}
      <section className="rounded-xl border border-border bg-gradient-to-br from-card/40 to-card/10 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="font-sans text-[10px] uppercase tracking-widest text-accent font-semibold">Word of the Day</span>
            <h3 className="font-serif text-3xl font-bold mt-1">{content.word}</h3>
            {content.wordPronunciation && (
              <p className="font-sans text-xs text-accent/70 mt-0.5 tracking-wide">/{content.wordPronunciation}/</p>
            )}
            <p className="font-sans text-sm text-muted mt-1">{content.wordDefinition}</p>
          </div>
          <SaveBtn type="WORD" title={content.word} body={`${content.wordDefinition}\n\nCasual: ${content.wordCasual}\nBusiness: ${content.wordBusiness}\nTechnical: ${content.wordTechnical}`} />
        </div>
        <div className="space-y-2 mt-4 border-t border-border/50 pt-4">
          {content.wordCasual && (
            <div className="flex gap-3">
              <span className="font-sans text-[10px] uppercase tracking-wider text-muted/60 w-20 shrink-0 pt-0.5">Casual</span>
              <p className="font-sans text-sm italic text-foreground/75">&ldquo;{content.wordCasual}&rdquo;</p>
            </div>
          )}
          {content.wordBusiness && (
            <div className="flex gap-3">
              <span className="font-sans text-[10px] uppercase tracking-wider text-muted/60 w-20 shrink-0 pt-0.5">Business</span>
              <p className="font-sans text-sm italic text-foreground/75">&ldquo;{content.wordBusiness}&rdquo;</p>
            </div>
          )}
          {content.wordTechnical && (
            <div className="flex gap-3">
              <span className="font-sans text-[10px] uppercase tracking-wider text-muted/60 w-20 shrink-0 pt-0.5">Technical</span>
              <p className="font-sans text-sm italic text-foreground/75">&ldquo;{content.wordTechnical}&rdquo;</p>
            </div>
          )}
          {/* legacy fallback */}
          {!content.wordCasual && content.wordExample && (
            <p className="font-sans text-sm italic text-foreground/75">&ldquo;{content.wordExample}&rdquo;</p>
          )}
        </div>
      </section>

      {/* ── Storage Deep Dive ── */}
      {content.storageConceptTitle && (
        <section className="rounded-xl border border-accent/20 bg-accent/5 p-6">
          <div className="flex justify-between items-start mb-3">
            <span className="font-sans text-[10px] uppercase tracking-widest text-accent font-semibold">Storage Deep Dive</span>
            <SaveBtn
              type="STORAGE"
              title={content.storageConceptTitle}
              body={`${content.storageConceptTitle}\n\n${content.storageConceptExplanation}`}
            />
          </div>
          <h3 className="font-serif text-xl font-bold mb-3">{content.storageConceptTitle}</h3>
          <p className="font-sans text-sm leading-relaxed text-foreground/85">{content.storageConceptExplanation}</p>
        </section>
      )}

      {/* ── Tech Tip ── */}
      <section className="rounded-xl border border-border bg-card/20 p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="font-sans text-[10px] uppercase tracking-widest text-muted font-semibold">Tech Tip</span>
          <SaveBtn type="TECH" title="Tech Tip" body={content.techTip} />
        </div>
        <p className="font-sans text-sm leading-relaxed text-foreground/85">{content.techTip}</p>
      </section>

      {/* ── Quote ── */}
      <section className="rounded-xl border border-border bg-card/20 p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="font-sans text-[10px] uppercase tracking-widest text-muted font-semibold">Quote</span>
          <SaveBtn type="QUOTE" title={content.quoteAuthor} body={`"${content.quote}" — ${content.quoteAuthor}`} />
        </div>
        <div className="border-l-2 border-accent/60 pl-5">
          <p className="font-serif text-xl italic leading-relaxed mb-3">&ldquo;{content.quote}&rdquo;</p>
          <p className="font-sans text-xs text-muted tracking-wide">— {content.quoteAuthor}</p>
        </div>
      </section>

      {/* ── Mental Model ── */}
      <section className="rounded-xl border border-border bg-card/20 p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="font-sans text-[10px] uppercase tracking-widest text-muted font-semibold">Mental Model</span>
          <SaveBtn type="MENTAL_MODEL" title={content.mentalModel} body={`${content.mentalModel}\n\n${content.mentalModelExplanation}`} />
        </div>
        <h3 className="font-serif text-xl font-bold mb-2">{content.mentalModel}</h3>
        <p className="font-sans text-sm leading-relaxed text-foreground/80">{content.mentalModelExplanation}</p>
      </section>

      {/* ── Poem ── */}
      <section className="rounded-xl border border-border bg-card/20 p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="font-sans text-[10px] uppercase tracking-widest text-muted font-semibold">Poem</span>
          <SaveBtn type="POEM" title={content.poemTitle} body={`${content.poemTitle} — ${content.poemAuthor}\n\n${content.poem}`} />
        </div>
        <h3 className="font-serif text-lg font-bold">{content.poemTitle}</h3>
        <p className="font-sans text-xs text-muted mb-5">— {content.poemAuthor}</p>
        <pre className="font-serif text-sm leading-8 whitespace-pre-wrap text-foreground/80">{content.poem}</pre>
      </section>

      {/* ── Saved Library ── */}
      <section className="mt-10 border-t border-border pt-8">
        <h3 className="font-serif text-xl font-bold mb-5">Saved</h3>
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`font-sans text-xs px-3 py-1.5 rounded-full border transition-colors ${
                activeTab === tab.key
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {filteredSaved.length === 0 ? (
          <p className="font-sans text-sm text-muted/60">Nothing saved yet.</p>
        ) : (
          <div className="space-y-2">
            {filteredSaved.map((item) => (
              <div key={item.id} className="rounded-lg border border-border p-4 flex justify-between gap-4 hover:bg-card/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-medium mb-1">{item.title}</p>
                  <p className="font-sans text-xs text-muted line-clamp-2 whitespace-pre-line">{item.body}</p>
                </div>
                <button
                  onClick={() => {
                    setSavedItems((prev) => prev.filter((s) => s.id !== item.id));
                    startTransition(() => unsaveContentAction(item.id));
                  }}
                  className="text-muted/40 hover:text-muted text-lg shrink-0 leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
