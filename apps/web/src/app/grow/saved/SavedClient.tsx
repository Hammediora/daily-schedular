"use client";

import { useState, useTransition } from "react";

type SavedItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  savedAt: Date;
};

const TYPE_LABELS: Record<string, string> = {
  WORD: "Words",
  STORAGE: "Storage",
  TECH: "Tech",
  QUOTE: "Quotes",
  MENTAL_MODEL: "Models",
  POEM: "Poems",
};

const ALL_TYPES = Object.keys(TYPE_LABELS);

export default function SavedClient({
  saved,
  unsaveAction,
}: {
  saved: SavedItem[];
  unsaveAction: (id: string) => Promise<void>;
}) {
  const [items, setItems] = useState<SavedItem[]>(saved);
  const [activeType, setActiveType] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  function remove(id: string) {
    setItems((prev) => prev.filter((s) => s.id !== id));
    startTransition(() => unsaveAction(id));
  }

  const filtered = items.filter((item) => {
    const matchType = activeType === "ALL" || item.type === activeType;
    const matchQuery =
      query.trim() === "" ||
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.body.toLowerCase().includes(query.toLowerCase());
    return matchType && matchQuery;
  });

  const countFor = (type: string) =>
    type === "ALL" ? items.length : items.filter((s) => s.type === type).length;

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search saved items…"
          className="w-full font-sans text-sm bg-card/20 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-colors"
        />
      </div>

      {/* Type tabs */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        <button
          onClick={() => setActiveType("ALL")}
          className={`font-sans text-xs px-3 py-1.5 rounded-full border transition-colors ${
            activeType === "ALL"
              ? "border-accent text-accent bg-accent/10"
              : "border-border text-muted hover:text-foreground"
          }`}
        >
          All ({countFor("ALL")})
        </button>
        {ALL_TYPES.map((type) => {
          const count = countFor(type);
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`font-sans text-xs px-3 py-1.5 rounded-full border transition-colors ${
                activeType === type
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {TYPE_LABELS[type]} ({count})
            </button>
          );
        })}
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-sans text-sm text-muted/60">
            {query ? "No items match your search." : "Nothing saved yet. Star items on the Daily Brief to save them."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border p-4 flex justify-between gap-4 hover:bg-card/20 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-sans text-[10px] uppercase tracking-wider text-accent/70 font-medium">
                    {TYPE_LABELS[item.type] ?? item.type}
                  </span>
                  <span className="font-sans text-[10px] text-muted/40">
                    {new Date(item.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <p className="font-sans text-sm font-medium mb-1">{item.title}</p>
                <p className="font-sans text-xs text-muted line-clamp-2 whitespace-pre-line">{item.body}</p>
              </div>
              <button
                onClick={() => remove(item.id)}
                className="text-muted/30 hover:text-muted text-lg shrink-0 leading-none transition-colors"
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
