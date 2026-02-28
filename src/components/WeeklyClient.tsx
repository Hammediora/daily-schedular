"use client";

import { useState, useEffect } from "react";
import WeeklyBlockCard from "@/components/WeeklyBlockCard";
import BlockDrawer, { type SerializedBlock } from "@/components/BlockDrawer";

interface DayInfo {
  date: string;
  dayLabel: string;
  dayNumber: number;
  isToday: boolean;
}

interface WeeklyClientProps {
  days: DayInfo[];
  blocksByDay: SerializedBlock[][];
}

export default function WeeklyClient({ days, blocksByDay }: WeeklyClientProps) {
  const [selectedBlock, setSelectedBlock] = useState<SerializedBlock | null>(null);

  // Sync selectedBlock with fresh prop data after server actions fire
  useEffect(() => {
    if (selectedBlock) {
      const allBlocks = blocksByDay.flat();
      const updated = allBlocks.find(b => b.id === selectedBlock.id);
      if (updated) {
        setSelectedBlock(updated);
      } else {
        setSelectedBlock(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocksByDay]);

  return (
    <>
      {/* Desktop: 7-column grid */}
      <div className="hidden sm:grid grid-cols-7 gap-3">
        {days.map((day, idx) => (
          <div key={day.date} className="space-y-2">
            {/* Day header */}
            <div className="text-center mb-3">
              <p className="font-sans text-xs text-muted uppercase tracking-widest">{day.dayLabel}</p>
              <p
                className="font-sans text-lg font-bold mt-0.5"
                style={{ color: day.isToday ? "#1B4332" : "#1C1C1C" }}
              >
                {day.dayNumber}
              </p>
              {day.isToday && (
                <div className="w-1 h-1 rounded-full bg-accent mx-auto mt-1" />
              )}
            </div>

            {/* Blocks */}
            {blocksByDay[idx].length === 0 ? (
              <div className="h-20 border border-dashed border-border rounded opacity-40" />
            ) : (
              blocksByDay[idx].map(block => (
                <WeeklyBlockCard
                  key={block.id}
                  block={block}
                  onClick={() => setSelectedBlock(block)}
                />
              ))
            )}
          </div>
        ))}
      </div>

      {/* Mobile: stacked days */}
      <div className="sm:hidden space-y-6">
        {days.map((day, idx) => (
          <section key={day.date}>
            {/* Day header */}
            <div className="flex items-center gap-3 mb-3 sticky top-0 bg-background z-10 py-2">
              <span className={`font-sans text-sm font-bold ${day.isToday ? "text-primary" : "text-foreground"}`}>
                {day.dayLabel}
              </span>
              <span className={`font-sans text-sm ${day.isToday ? "text-primary font-bold" : "text-muted"}`}>
                {day.dayNumber}
              </span>
              {day.isToday && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Blocks */}
            {blocksByDay[idx].length === 0 ? (
              <div className="h-12 border border-dashed border-border rounded opacity-40" />
            ) : (
              <div className="space-y-2">
                {blocksByDay[idx].map(block => (
                  <WeeklyBlockCard
                    key={block.id}
                    block={block}
                    onClick={() => setSelectedBlock(block)}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Drawer */}
      {selectedBlock && (
        <BlockDrawer
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </>
  );
}
