"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const primary = [
  {
    label: "Today",
    href: "/",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M10 2a1 1 0 01.894.553l2.382 4.764 5.28.768a1 1 0 01.554 1.706l-3.82 3.72.902 5.253a1 1 0 01-1.451 1.054L10 17.347l-4.741 2.491a1 1 0 01-1.451-1.054l.902-5.253-3.82-3.72a1 1 0 01.554-1.706l5.28-.768L9.106 2.553A1 1 0 0110 2z" />
      </svg>
    ),
  },
  {
    label: "Weekly",
    href: "/weekly",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Focus",
    href: "/now",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
      </svg>
    ),
  },
];

const more = [
  { label: "Scorecard", href: "/scorecard" },
  { label: "History", href: "/history" },
  { label: "Weekly Report", href: "/report" },
  { label: "Plan Next Week", href: "/plan" },
  { label: "Settings", href: "/settings" },
  { label: "Block Templates", href: "/settings/templates" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isMoreActive = more.some((l) => l.href === pathname);

  return (
    <>
      {/* Bottom nav bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="flex items-stretch h-14">
          {primary.map(({ label, href, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-sans transition-colors ${
                  active ? "text-foreground" : "text-muted"
                }`}
              >
                {icon}
                {label}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-sans transition-colors ${
              isMoreActive ? "text-foreground" : "text-muted"
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            More
          </button>
        </div>

        {/* iOS safe area spacer */}
        <div className="h-safe-area-inset-bottom bg-background" />
      </nav>

      {/* More sheet backdrop */}
      {open && (
        <div
          className="sm:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setOpen(false)}
        >
          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-background border-t border-border rounded-t-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-4" />
            <p className="text-xs uppercase tracking-widest text-muted font-sans font-semibold px-6 mb-3">
              More
            </p>
            <ul className="pb-8">
              {more.map(({ label, href }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`block px-6 py-3 font-sans text-sm transition-colors ${
                        active
                          ? "text-foreground font-medium"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
