"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface LaneStat {
  lane: string;
  label: string;
  pct: number;
  color: string;
}

export default function Sidebar({
  workspaceName,
  workspaceId,
  laneStats,
}: {
  workspaceName: string;
  workspaceId: string;
  laneStats?: LaneStat[];
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const navLinks = [
    { name: "Today", href: "/" },
    { name: "Weekly Calendar", href: "/weekly" },
    { name: "Scorecard", href: "/scorecard" },
    { name: "History", href: "/history" },
    { name: "Weekly Report", href: "/report" },
    { name: "Plan Next Week", href: "/plan" },
  ];

  const managementLinks = [
    { name: "Task Backlog", href: "/tasks" },
    { name: "Settings", href: "/settings" },
    { name: "Block Templates", href: "/settings/templates" },
  ];

  const NavLink = ({ name, href }: { name: string; href: string }) => {
    const isActive = pathname === href;
    return (
      <li>
        <Link
          href={href}
          className={`block transition-colors duration-200 ${
            isActive ? "font-medium text-primary" : "text-muted hover:text-foreground"
          }`}
        >
          {name}
        </Link>
      </li>
    );
  };

  return (
    <aside className="w-64 border-r border-border min-h-screen p-8 flex flex-col justify-between shrink-0">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight mb-12">Operator</h1>

        <nav className="space-y-8">
          {/* Views */}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-4 font-sans font-semibold">Views</p>
            <ul className="space-y-3 font-sans text-sm">
              {navLinks.map(link => <NavLink key={link.name} {...link} />)}
            </ul>
          </div>

          {/* Lives Lane Bars */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest text-muted font-sans font-semibold">Lanes</p>
              <Link href="/scorecard" className="font-sans text-xs text-muted hover:text-foreground transition-colors">↗</Link>
            </div>
            <div className="space-y-4">
              {(laneStats ?? [
                { lane: "REVENUE", label: "Revenue", pct: 0, color: "#D4AF37" },
                { lane: "ASSET", label: "Asset", pct: 0, color: "#1B4332" },
                { lane: "LEVERAGE", label: "Leverage", pct: 0, color: "#5A5A5A" },
                { lane: "HEALTH", label: "Health", pct: 0, color: "#1B4332" },
              ]).map(({ lane, label, pct, color }) => (
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

          {/* Manage */}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-4 font-sans font-semibold">Manage</p>
            <ul className="space-y-3 font-sans text-sm">
              {managementLinks.map(link => <NavLink key={link.name} {...link} />)}
            </ul>
          </div>
        </nav>
      </div>

      <div className="font-sans text-xs text-muted space-y-1">
        <p className="font-medium text-foreground">{workspaceName}</p>
        <p>Discipline equals freedom.</p>
        <p className="text-muted/50 pt-1">⌘K to capture</p>
      </div>
    </aside>
  );
}
