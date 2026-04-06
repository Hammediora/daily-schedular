"use client";

import { useEffect, useState } from "react";

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export default function Accordion({ title, children, defaultOpen = true, className = "" }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-2 text-left"
      >
        <span className="font-sans text-xs uppercase tracking-widest text-muted font-semibold">
          {title}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? "2000px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="pt-2">
          {children}
        </div>
      </div>
    </div>
  );
}

interface MobileAccordionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function MobileAccordion({ title, children, className = "" }: MobileAccordionProps) {
  // isMounted starts false — server and first client render are identical (open, no toggle visible)
  const [isMounted, setIsMounted] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    const mobile = window.innerWidth < 640;
    if (mobile) setOpen(false);
    const check = () => {
      const m = window.innerWidth < 640;
      if (!m) setOpen(true);
    };
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // After mount, detect desktop to hide the toggle button
  const isDesktop = isMounted && window.innerWidth >= 640;

  return (
    <div className={className}>
      {/* Toggle button — hidden on desktop after mount, always hidden on server */}
      {!isDesktop && (
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between py-2 text-left"
        >
          <span className="font-sans text-xs uppercase tracking-widest text-muted font-semibold">
            {title}
          </span>
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      {/* Content — always open on desktop, animated on mobile */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={isDesktop ? {} : { maxHeight: open ? "2000px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className={isDesktop ? "" : "pt-2"}>
          {children}
        </div>
      </div>
    </div>
  );
}
