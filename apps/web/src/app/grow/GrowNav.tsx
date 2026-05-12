"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/grow", label: "Today", exact: true },
  { href: "/grow/history", label: "History", exact: false },
  { href: "/grow/saved", label: "Saved", exact: false },
];

export default function GrowNav({ savedCount, streak }: { savedCount: number; streak: number }) {
  const path = usePathname();

  return (
    <div className="flex items-center justify-between mb-8">
      <nav className="flex gap-1.5">
        {LINKS.map((l) => {
          const active = l.exact ? path === l.href : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`font-sans text-xs px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {l.href === "/grow/saved" && savedCount > 0 ? `Saved (${savedCount})` : l.label}
            </Link>
          );
        })}
      </nav>
      {streak > 0 && (
        <span className="font-sans text-xs text-muted/60 flex items-center gap-1.5">
          <span className="text-orange-400">▲</span>
          {streak} day streak
        </span>
      )}
    </div>
  );
}
