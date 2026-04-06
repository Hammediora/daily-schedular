"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LaneStat {
  lane: string;
  pct: number;
  label: string;
  color: string;
}

export default function SidebarLaneBars({ stats }: { stats: LaneStat[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="pt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-widest text-muted font-sans font-semibold">Lanes</p>
        <Link href="/scorecard" className="font-sans text-xs text-muted hover:text-foreground transition-colors">↗</Link>
      </div>
      <div className="space-y-4">
        {stats.map(({ lane, pct, label, color }) => (
          <div key={lane}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-sans text-xs text-foreground">{label}</span>
              <span className="font-sans text-xs text-muted">{pct}%</span>
            </div>
            <div className="h-0.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: mounted ? `${pct}%` : "0%",
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
