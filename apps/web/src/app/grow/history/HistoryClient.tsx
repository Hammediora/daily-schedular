"use client";

import { useState } from "react";

type DayRecord = {
  id: string;
  date: Date;
  word: string;
  wordDefinition: string;
  wordPronunciation?: string | null;
  wordCasual?: string | null;
  wordBusiness?: string | null;
  wordTechnical?: string | null;
  techTip: string;
  quote: string;
  quoteAuthor: string;
  mentalModel: string;
  mentalModelExplanation: string;
  poem: string;
  poemTitle: string;
  poemAuthor: string;
  storageConceptTitle?: string | null;
  storageConceptExplanation?: string | null;
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function isToday(date: Date): boolean {
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function DayCard({ record }: { record: DayRecord }) {
  const [expanded, setExpanded] = useState(false);
  const today = isToday(record.date);

  return (
    <div className={`rounded-xl border transition-colors ${today ? "border-accent/40 bg-accent/5" : "border-border bg-card/10"}`}>
      {/* Summary row — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-5 flex items-start justify-between gap-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-sans text-xs text-muted/60">
              {formatDate(record.date)}
            </span>
            {today && (
              <span className="font-sans text-[10px] uppercase tracking-wider text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded-full">
                Today
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span className="font-serif text-lg font-bold">{record.word}</span>
            {record.storageConceptTitle && (
              <span className="font-sans text-xs text-muted/70 self-end pb-0.5 truncate max-w-[200px]">
                {record.storageConceptTitle}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
            <span className="font-sans text-xs text-muted/60">{record.mentalModel}</span>
            <span className="font-sans text-xs text-muted/40">· {record.quoteAuthor}</span>
          </div>
        </div>
        <span className={`text-muted/40 text-sm transition-transform mt-1 shrink-0 ${expanded ? "rotate-180" : ""}`}>▾</span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-border/50 pt-4">

          {/* Word */}
          <div>
            <span className="font-sans text-[10px] uppercase tracking-widest text-accent font-semibold">Word of the Day</span>
            <p className="font-serif text-2xl font-bold mt-1">{record.word}</p>
            {record.wordPronunciation && (
              <p className="font-sans text-xs text-accent/70 mt-0.5">/{record.wordPronunciation}/</p>
            )}
            <p className="font-sans text-sm text-muted mt-1">{record.wordDefinition}</p>
            <div className="space-y-1.5 mt-3">
              {record.wordCasual && (
                <div className="flex gap-3">
                  <span className="font-sans text-[10px] uppercase tracking-wider text-muted/60 w-20 shrink-0 pt-0.5">Casual</span>
                  <p className="font-sans text-sm italic text-foreground/70">&ldquo;{record.wordCasual}&rdquo;</p>
                </div>
              )}
              {record.wordBusiness && (
                <div className="flex gap-3">
                  <span className="font-sans text-[10px] uppercase tracking-wider text-muted/60 w-20 shrink-0 pt-0.5">Business</span>
                  <p className="font-sans text-sm italic text-foreground/70">&ldquo;{record.wordBusiness}&rdquo;</p>
                </div>
              )}
              {record.wordTechnical && (
                <div className="flex gap-3">
                  <span className="font-sans text-[10px] uppercase tracking-wider text-muted/60 w-20 shrink-0 pt-0.5">Technical</span>
                  <p className="font-sans text-sm italic text-foreground/70">&ldquo;{record.wordTechnical}&rdquo;</p>
                </div>
              )}
            </div>
          </div>

          {/* Storage */}
          {record.storageConceptTitle && (
            <div>
              <span className="font-sans text-[10px] uppercase tracking-widest text-accent font-semibold">Storage Deep Dive</span>
              <p className="font-serif text-base font-bold mt-1 mb-1.5">{record.storageConceptTitle}</p>
              <p className="font-sans text-sm leading-relaxed text-foreground/80">{record.storageConceptExplanation}</p>
            </div>
          )}

          {/* Mental Model */}
          <div>
            <span className="font-sans text-[10px] uppercase tracking-widest text-muted font-semibold">Mental Model</span>
            <p className="font-serif text-base font-bold mt-1 mb-1">{record.mentalModel}</p>
            <p className="font-sans text-sm leading-relaxed text-foreground/80">{record.mentalModelExplanation}</p>
          </div>

          {/* Quote */}
          <div className="border-l-2 border-accent/40 pl-4">
            <p className="font-serif text-base italic leading-relaxed">&ldquo;{record.quote}&rdquo;</p>
            <p className="font-sans text-xs text-muted mt-2">— {record.quoteAuthor}</p>
          </div>

          {/* Tech Tip */}
          <div>
            <span className="font-sans text-[10px] uppercase tracking-widest text-muted font-semibold">Tech Tip</span>
            <p className="font-sans text-sm leading-relaxed text-foreground/80 mt-1">{record.techTip}</p>
          </div>

          {/* Poem */}
          <div>
            <span className="font-sans text-[10px] uppercase tracking-widest text-muted font-semibold">Poem</span>
            <p className="font-serif text-base font-bold mt-1">{record.poemTitle}</p>
            <p className="font-sans text-xs text-muted mb-3">— {record.poemAuthor}</p>
            <pre className="font-serif text-sm leading-7 whitespace-pre-wrap text-foreground/75">{record.poem}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryClient({ history }: { history: DayRecord[] }) {
  if (history.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-sans text-sm text-muted/60">No history yet. Come back tomorrow.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((record) => (
        <DayCard key={record.id} record={record} />
      ))}
    </div>
  );
}
