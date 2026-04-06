# Responsive Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four UI primitives (Dropdown, Slider, Accordion, SwipeRow) and apply them across every page for a fully responsive experience from 320px to desktop.

**Architecture:** Three headless primitives in `src/components/ui/` replace native selects and number inputs. Accordion wraps existing section markup with mobile-collapse behavior. Swipe gestures are added directly to `TaskRow` using pointer events.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, no new dependencies

---

## File Map

**Created:**
- `src/components/ui/Dropdown.tsx` — custom styled select replacement
- `src/components/ui/Slider.tsx` — range input with live value label
- `src/components/ui/Accordion.tsx` — collapsible section wrapper

**Modified:**
- `src/components/AddTaskModal.tsx` — Dropdown (Lane, WorkType) + Slider (effort, impact)
- `src/components/QuickCapture.tsx` — Slider (effort only; lane/workType stay as button toggles)
- `src/components/BlockCompletionModal.tsx` — Dropdown (energy rating)
- `src/components/TaskRow.tsx` — swipe gestures
- `src/components/DailyCommandPanel.tsx` — Accordion mobile wrappers
- `src/components/TodayWorkLog.tsx` — Accordion mobile wrapper
- `src/components/IbmChecklist.tsx` — Accordion mobile wrapper
- `src/components/WeeklyReport.tsx` — Accordion mobile wrappers
- `src/app/plan/PlanClient.tsx` — Accordion mobile wrappers
- `src/app/scorecard/page.tsx` — Accordion mobile wrappers
- `src/app/settings/SettingsClient.tsx` — Dropdown + Slider + Accordion
- `src/app/settings/templates/TemplatesClient.tsx` — Dropdown

---

## Task 1: Create Dropdown primitive

**Files:**
- Create: `src/components/ui/Dropdown.tsx`

- [ ] **Step 1: Create the ui directory and Dropdown component**

```tsx
// src/components/ui/Dropdown.tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  label?: string;
  className?: string;
}

export default function Dropdown({ value, onChange, options, className = "" }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) { onChange(options[focusedIndex].value); setOpen(false); }
      else setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setFocusedIndex(i => Math.min(i + 1, options.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex(i => Math.max(i - 1, 0));
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center justify-between bg-background border border-border rounded px-3 py-2 text-sm font-sans text-foreground focus:outline-none focus:border-primary transition-colors"
      >
        <span>{selected?.label ?? value}</span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-4 h-4 text-muted shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-surface border border-border rounded shadow-sm overflow-hidden"
        >
          {options.map((opt, i) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => handleSelect(opt.value)}
              onMouseEnter={() => setFocusedIndex(i)}
              className={`px-3 min-h-[44px] sm:min-h-[36px] flex items-center text-sm font-sans cursor-pointer transition-colors
                ${opt.value === value ? "bg-primary/5 text-foreground font-medium" : "text-foreground"}
                ${focusedIndex === i ? "bg-primary/5" : "hover:bg-primary/5"}
              `}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify file exists**

Run: `ls apps/web/src/components/ui/`
Expected: `Dropdown.tsx`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/Dropdown.tsx
git commit -m "feat: add Dropdown UI primitive"
```

---

## Task 2: Create Slider primitive

**Files:**
- Create: `src/components/ui/Slider.tsx`

- [ ] **Step 1: Create the Slider component**

```tsx
// src/components/ui/Slider.tsx
"use client";

import { useState } from "react";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  formatLabel: (value: number) => string;
  className?: string;
}

export default function Slider({ value, onChange, min, max, step, formatLabel, className = "" }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="font-mono text-xs text-muted">{formatLabel(value)}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="slider-input w-full appearance-none bg-transparent cursor-pointer"
          style={{
            // Track fill via linear-gradient on the input background
            background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${pct}%, var(--color-border) ${pct}%, var(--color-border) 100%)`,
            height: "2px",
            borderRadius: "1px",
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add slider thumb CSS to globals.css**

Open `src/app/globals.css` and append at the bottom:

```css
/* Slider thumb styles */
.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-foreground);
  cursor: pointer;
  margin-top: -8px;
}
.slider-input::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-foreground);
  cursor: pointer;
  border: none;
}
@media (max-width: 639px) {
  .slider-input::-webkit-slider-thumb {
    width: 28px;
    height: 28px;
    margin-top: -13px;
  }
  .slider-input::-moz-range-thumb {
    width: 28px;
    height: 28px;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/Slider.tsx apps/web/src/app/globals.css
git commit -m "feat: add Slider UI primitive with responsive thumb sizing"
```

---

## Task 3: Create Accordion primitive

**Files:**
- Create: `src/components/ui/Accordion.tsx`

- [ ] **Step 1: Create the Accordion component**

```tsx
// src/components/ui/Accordion.tsx
"use client";

import { useEffect, useRef, useState } from "react";
// NOTE: "use client" is required — both Accordion and MobileAccordion use hooks

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export default function Accordion({ title, children, defaultOpen = true, className = "" }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyRef = useRef<HTMLDivElement>(null);

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
          className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? "2000px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div ref={bodyRef} className="pt-2">
          {children}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create MobileAccordion wrapper (Accordion collapsed by default on mobile, expanded on desktop)**

Append to `src/components/ui/Accordion.tsx`:

```tsx
// Append after the default export above

interface MobileAccordionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function MobileAccordion({ title, children, className = "" }: MobileAccordionProps) {
  // Collapsed by default on mobile, expanded on desktop
  // We detect mobile by checking window width on mount
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      setOpen(!mobile);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!isMobile) {
    // Desktop: render children directly, no wrapper
    return <div className={className}>{children}</div>;
  }

  return (
    <Accordion title={title} defaultOpen={open} className={className}>
      {children}
    </Accordion>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/Accordion.tsx
git commit -m "feat: add Accordion and MobileAccordion UI primitives"
```

---

## Task 4: Apply Dropdown to AddTaskModal (Lane + WorkType)

**Files:**
- Modify: `src/components/AddTaskModal.tsx`

- [ ] **Step 1: Replace Lane and WorkType selects with Dropdown**

Read the current file, then replace the two `<select>` elements.

Find this block (the Lane select):
```tsx
              <div>
                <label className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Lane</label>
                <select
                  value={lane}
                  onChange={(e) => setLane(e.target.value)}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="REVENUE">Revenue</option>
                  <option value="ASSET">Asset Building</option>
                  <option value="LEVERAGE">Leverage</option>
                  <option value="HEALTH">Health</option>
                </select>
              </div>
```

Replace with:
```tsx
              <div>
                <label className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Lane</label>
                <Dropdown
                  value={lane}
                  onChange={setLane}
                  options={[
                    { value: "REVENUE", label: "Revenue" },
                    { value: "ASSET", label: "Asset Building" },
                    { value: "LEVERAGE", label: "Leverage" },
                    { value: "HEALTH", label: "Health" },
                  ]}
                />
              </div>
```

Find this block (the WorkType select):
```tsx
              <div>
                <label className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Work Type</label>
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="DEEP">Deep Work</option>
                  <option value="EXECUTION">Execution</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SOCIAL">Social</option>
                  <option value="RECOVERY">Recovery</option>
                </select>
              </div>
```

Replace with:
```tsx
              <div>
                <label className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Work Type</label>
                <Dropdown
                  value={workType}
                  onChange={setWorkType}
                  options={[
                    { value: "DEEP", label: "Deep Work" },
                    { value: "EXECUTION", label: "Execution" },
                    { value: "ADMIN", label: "Admin" },
                    { value: "SOCIAL", label: "Social" },
                    { value: "RECOVERY", label: "Recovery" },
                  ]}
                />
              </div>
```

- [ ] **Step 2: Add import at top of file**

Add after `import { useState } from "react";`:
```tsx
import Dropdown from "@/components/ui/Dropdown";
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/AddTaskModal.tsx
git commit -m "feat: replace native selects with Dropdown in AddTaskModal"
```

---

## Task 5: Apply Slider to AddTaskModal (effort + impact)

**Files:**
- Modify: `src/components/AddTaskModal.tsx`

- [ ] **Step 1: Replace Effort and Impact number inputs with Slider**

Find this block (Effort input):
```tsx
              <div>
                <label className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Effort (mins)</label>
                <input
                  type="number"
                  min="5" step="5"
                  value={effortMins}
                  onChange={(e) => setEffortMins(parseInt(e.target.value))}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                />
              </div>
```

Replace with:
```tsx
              <div>
                <label className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Effort (mins)</label>
                <Slider
                  value={effortMins}
                  onChange={setEffortMins}
                  min={5}
                  max={240}
                  step={5}
                  formatLabel={(v) => `${v} min`}
                />
              </div>
```

Find this block (Impact input):
```tsx
              <div>
                <label className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Impact (1-10)</label>
                <input
                  type="number"
                  min="1" max="10"
                  value={impactScore}
                  onChange={(e) => setImpactScore(parseInt(e.target.value))}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                />
              </div>
```

Replace with:
```tsx
              <div>
                <label className="block font-sans text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Impact (1-10)</label>
                <Slider
                  value={impactScore}
                  onChange={setImpactScore}
                  min={1}
                  max={10}
                  step={1}
                  formatLabel={(v) => `${v} / 10`}
                />
              </div>
```

- [ ] **Step 2: Add Slider import**

The import line already has `Dropdown`. Update it to also include `Slider`:
```tsx
import Dropdown from "@/components/ui/Dropdown";
import Slider from "@/components/ui/Slider";
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/AddTaskModal.tsx
git commit -m "feat: replace effort and impact number inputs with Slider in AddTaskModal"
```

---

## Task 6: Apply Slider to QuickCapture

**Files:**
- Modify: `src/components/QuickCapture.tsx`

Note: QuickCapture already uses custom button toggles for Lane and WorkType — those stay as-is. We only add an effortMins slider.

- [ ] **Step 1: Add effortMins state**

Find:
```tsx
  const [workType, setWorkType] = useState("EXECUTION");
  const [pending, startTransition] = useTransition();
```

Replace with:
```tsx
  const [workType, setWorkType] = useState("EXECUTION");
  const [effortMins, setEffortMins] = useState(60);
  const [pending, startTransition] = useTransition();
```

- [ ] **Step 2: Pass effortMins to createTaskAction**

Find:
```tsx
      await createTaskAction({
        title: title.trim(),
        lane,
        workType,
        project: "Inbox",
        impactScore: 5,
        effortMins: 60,
      });
```

Replace with:
```tsx
      await createTaskAction({
        title: title.trim(),
        lane,
        workType,
        project: "Inbox",
        impactScore: 5,
        effortMins,
      });
```

- [ ] **Step 3: Add the effort slider to the quick options bar**

Find:
```tsx
        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex justify-between items-center">
```

Insert before it:
```tsx
        {/* Effort slider */}
        <div className="px-5 py-3 border-t border-border">
          <Slider
            value={effortMins}
            onChange={setEffortMins}
            min={5}
            max={240}
            step={5}
            formatLabel={(v) => `Effort: ${v} min`}
          />
        </div>
```

- [ ] **Step 4: Add Slider import**

Find:
```tsx
import { useEffect, useState, useTransition, useRef } from "react";
import { createTaskAction } from "@/app/actions";
```

Replace with:
```tsx
import { useEffect, useState, useTransition, useRef } from "react";
import { createTaskAction } from "@/app/actions";
import Slider from "@/components/ui/Slider";
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/QuickCapture.tsx
git commit -m "feat: add effort slider to QuickCapture"
```

---

## Task 7: Apply Dropdown to BlockCompletionModal (energy rating)

**Files:**
- Modify: `src/components/BlockCompletionModal.tsx`

- [ ] **Step 1: Replace the energy rating button group with Dropdown**

Find the entire energy rating section:
```tsx
          {/* Energy rating */}
          <div>
            <label className="font-sans text-xs uppercase tracking-widest text-muted font-semibold block mb-2">
              Energy Level
            </label>
            <div className="flex gap-2">
              {ENERGY_LABELS.map(e => (
                <button
                  key={e.value}
                  onClick={() => setEnergy(e.value)}
                  className={`flex-1 py-2 rounded border text-sm font-sans font-semibold transition-colors ${
                    energy === e.value
                      ? "border-primary text-primary bg-primary/5"
                      : "border-border text-muted hover:border-foreground/30"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
```

Replace with:
```tsx
          {/* Energy rating */}
          <div>
            <label className="font-sans text-xs uppercase tracking-widest text-muted font-semibold block mb-2">
              Energy Level
            </label>
            <Dropdown
              value={energy != null ? String(energy) : ""}
              onChange={(v) => setEnergy(Number(v))}
              options={[
                { value: "1", label: "Low" },
                { value: "2", label: "Med" },
                { value: "3", label: "High" },
              ]}
            />
          </div>
```

- [ ] **Step 2: Add Dropdown import**

Find:
```tsx
import { useState, useTransition } from "react";
```

Replace with:
```tsx
import { useState, useTransition } from "react";
import Dropdown from "@/components/ui/Dropdown";
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/BlockCompletionModal.tsx
git commit -m "feat: replace energy rating buttons with Dropdown in BlockCompletionModal"
```

---

## Task 8: Apply Accordion to Home page (DailyCommandPanel, TodayWorkLog, IbmChecklist)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Read the current home page to find where DailyCommandPanel, TodayWorkLog, and IbmChecklist are rendered**

Run: `grep -n "DailyCommandPanel\|TodayWorkLog\|IbmChecklist" apps/web/src/app/page.tsx`

- [ ] **Step 2: Wrap each component in MobileAccordion**

Find each component usage and wrap it. For example, if DailyCommandPanel renders as:
```tsx
<DailyCommandPanel workspaceId={workspace.id} />
```

Replace with:
```tsx
<MobileAccordion title="Command Panel">
  <DailyCommandPanel workspaceId={workspace.id} />
</MobileAccordion>
```

Apply the same pattern for TodayWorkLog:
```tsx
<MobileAccordion title="Work Log">
  <TodayWorkLog {/* existing props */} />
</MobileAccordion>
```

And IbmChecklist:
```tsx
<MobileAccordion title="IBM Checklist">
  <IbmChecklist {/* existing props */} />
</MobileAccordion>
```

- [ ] **Step 3: Add MobileAccordion import**

Add to imports at top of `page.tsx`:
```tsx
import { MobileAccordion } from "@/components/ui/Accordion";
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat: wrap home page sections in MobileAccordion"
```

---

## Task 9: Apply Accordion to PlanClient

**Files:**
- Modify: `src/app/plan/PlanClient.tsx`

- [ ] **Step 1: Read the current PlanClient to identify section boundaries**

Run: `cat apps/web/src/app/plan/PlanClient.tsx`

- [ ] **Step 2: Wrap each section in MobileAccordion**

Add import at top:
```tsx
import { MobileAccordion } from "@/components/ui/Accordion";
```

Wrap the four sections: This Week Stats, Reflections, Week Outcomes, Backlog Lock. Each section will have its own heading text already — use those as the `title` prop. Pattern:
```tsx
<MobileAccordion title="This Week">
  {/* existing this-week stats content */}
</MobileAccordion>

<MobileAccordion title="Reflection">
  {/* existing reflections textarea */}
</MobileAccordion>

<MobileAccordion title="Outcomes">
  {/* existing WeekOutcomesForm */}
</MobileAccordion>

<MobileAccordion title="Backlog Lock">
  {/* existing BacklogLockPanel */}
</MobileAccordion>
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/plan/PlanClient.tsx
git commit -m "feat: wrap plan page sections in MobileAccordion"
```

---

## Task 10: Apply Accordion to WeeklyReport

**Files:**
- Modify: `src/components/WeeklyReport.tsx`

- [ ] **Step 1: Read the current WeeklyReport**

Run: `cat apps/web/src/components/WeeklyReport.tsx`

- [ ] **Step 2: Wrap Wins, Misses, and Block Utilization sections**

Add import:
```tsx
import { MobileAccordion } from "@/components/ui/Accordion";
```

Wrap each named section:
```tsx
<MobileAccordion title="Wins">
  {/* existing wins content */}
</MobileAccordion>

<MobileAccordion title="Misses">
  {/* existing misses content */}
</MobileAccordion>

<MobileAccordion title="Block Utilization">
  {/* existing block utilization grid */}
</MobileAccordion>
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/WeeklyReport.tsx
git commit -m "feat: wrap report sections in MobileAccordion"
```

---

## Task 11: Apply Accordion to Scorecard

**Files:**
- Modify: `src/app/scorecard/page.tsx`

- [ ] **Step 1: Read the current scorecard page**

Run: `cat apps/web/src/app/scorecard/page.tsx`

- [ ] **Step 2: Wrap each lane section in MobileAccordion**

Add import:
```tsx
import { MobileAccordion } from "@/components/ui/Accordion";
```

Each lane (Revenue, Asset, Leverage, Health) should be wrapped:
```tsx
<MobileAccordion title="Revenue">
  {/* existing revenue stats content */}
</MobileAccordion>
```

Repeat for each lane section found in the file.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/scorecard/page.tsx
git commit -m "feat: wrap scorecard lane sections in MobileAccordion"
```

---

## Task 12: Apply Dropdown + Slider + Accordion to SettingsClient

**Files:**
- Modify: `src/app/settings/SettingsClient.tsx` (or wherever it lives — check `src/components/SettingsClient.tsx`)

- [ ] **Step 1: Read SettingsClient**

Run: `find apps/web/src -name "SettingsClient.tsx" | xargs cat`

- [ ] **Step 2: Replace any native `<select>` elements with Dropdown**

For each `<select>` found, apply the same pattern as Task 4. Use the option values/labels present in the existing selects.

- [ ] **Step 3: Replace weekly constraint minute `<input type="number">` with Slider**

For each constraint minutes field:
```tsx
<Slider
  value={constraintValue}
  onChange={setConstraintValue}
  min={0}
  max={480}
  step={15}
  formatLabel={(v) => {
    const h = Math.floor(v / 60);
    const m = v % 60;
    return h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`;
  }}
/>
```

- [ ] **Step 4: Wrap each constraint group in MobileAccordion**

Add imports:
```tsx
import Dropdown from "@/components/ui/Dropdown";
import Slider from "@/components/ui/Slider";
import { MobileAccordion } from "@/components/ui/Accordion";
```

Wrap each constraint group section:
```tsx
<MobileAccordion title="Revenue Constraints">
  {/* existing revenue constraint fields */}
</MobileAccordion>
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/SettingsClient.tsx apps/web/src/app/settings/SettingsClient.tsx 2>/dev/null || git add apps/web/src/components/SettingsClient.tsx
git commit -m "feat: apply Dropdown, Slider, Accordion to SettingsClient"
```

---

## Task 13: Apply Dropdown to TemplatesClient

**Files:**
- Modify: `src/app/settings/templates/TemplatesClient.tsx` (or `src/components/TemplatesClient.tsx`)

- [ ] **Step 1: Read TemplatesClient**

Run: `find apps/web/src -name "TemplatesClient.tsx" | xargs cat`

- [ ] **Step 2: Replace any BlockType `<select>` elements with Dropdown**

Add import:
```tsx
import Dropdown from "@/components/ui/Dropdown";
```

Replace each `<select>` for block type with:
```tsx
<Dropdown
  value={blockType}
  onChange={setBlockType}
  options={[
    { value: "DEEP_WORK", label: "Deep Work" },
    { value: "EXECUTION", label: "Execution" },
    { value: "IBM", label: "IBM" },
    { value: "HEALTH", label: "Health" },
    { value: "REVIEW", label: "Review" },
    { value: "BUILDER", label: "Builder Block" },
    { value: "FAMILY", label: "Family" },
  ]}
/>
```

Adjust option values/labels to match whatever the existing select had.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/settings/templates/TemplatesClient.tsx apps/web/src/components/TemplatesClient.tsx 2>/dev/null || true
git commit -m "feat: replace BlockType select with Dropdown in TemplatesClient"
```

---

## Task 14: Add swipe gestures to TaskRow

**Files:**
- Modify: `src/components/TaskRow.tsx`

- [ ] **Step 1: Add swipe state and pointer event handlers**

Replace the entire `TaskRow.tsx` file with this updated version (which adds swipe on mobile while preserving all existing behavior on desktop):

```tsx
"use client";

import { useRef, useState, useTransition } from "react";
import { completeTaskAction, uncompleteTaskAction, bumpTaskAction, reorderTaskInBlockAction } from "@/app/actions";

interface TaskRowProps {
  task: {
    id: string;
    title: string;
    status: string;
    project: string;
    lane: string;
    impactScore: number;
    effortMins: number;
    actualMinutes?: number | null;
    notes?: string | null;
  };
  allocatedMinutes: number;
  scheduledTaskId?: string;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  alwaysShowActions?: boolean;
}

const SWIPE_THRESHOLD = 72;

export default function TaskRow({ task, allocatedMinutes, scheduledTaskId, canMoveUp, canMoveDown, alwaysShowActions }: TaskRowProps) {
  const [isPending, startTransition] = useTransition();
  const isDone = task.status === "DONE";

  // Swipe state
  const [swipeDx, setSwipeDx] = useState(0);
  const startXRef = useRef<number | null>(null);
  const isSwiping = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only enable on touch/pen, not mouse
    if (e.pointerType === "mouse") return;
    startXRef.current = e.clientX;
    isSwiping.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startXRef.current === null || e.pointerType === "mouse") return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 8) isSwiping.current = true;
    if (isSwiping.current) {
      e.preventDefault();
      setSwipeDx(Math.max(-120, Math.min(120, dx)));
    }
  };

  const handlePointerUp = () => {
    if (startXRef.current === null) return;
    const dx = swipeDx;
    startXRef.current = null;

    if (dx <= -SWIPE_THRESHOLD) {
      // Swipe left = bump
      setSwipeDx(0);
      startTransition(async () => { await bumpTaskAction(task.id); });
    } else if (dx >= SWIPE_THRESHOLD) {
      // Swipe right = complete
      setSwipeDx(0);
      startTransition(async () => {
        if (isDone) await uncompleteTaskAction(task.id);
        else await completeTaskAction(task.id);
      });
    } else {
      setSwipeDx(0);
    }
    isSwiping.current = false;
  };

  const handleToggle = () => {
    startTransition(async () => {
      if (isDone) await uncompleteTaskAction(task.id);
      else await completeTaskAction(task.id);
    });
  };

  const handleBump = () => {
    startTransition(async () => { await bumpTaskAction(task.id); });
  };

  const handleMove = (direction: "up" | "down") => {
    if (!scheduledTaskId) return;
    startTransition(async () => { await reorderTaskInBlockAction(scheduledTaskId, direction); });
  };

  const isSwipingLeft = swipeDx < -8;
  const isSwipingRight = swipeDx > 8;

  return (
    <div className="relative overflow-hidden rounded">
      {/* Swipe reveal backgrounds (mobile only) */}
      <div className="sm:hidden absolute inset-0 flex">
        <div
          className="absolute inset-0 flex items-center justify-end pr-4 transition-opacity"
          style={{
            background: "#FEE2E2",
            opacity: isSwipingLeft ? Math.min(1, Math.abs(swipeDx) / SWIPE_THRESHOLD) : 0,
          }}
        >
          <span className="text-xs font-sans font-medium text-red-700">Bump →</span>
        </div>
        <div
          className="absolute inset-0 flex items-center pl-4 transition-opacity"
          style={{
            background: "rgba(27,67,50,0.1)",
            opacity: isSwipingRight ? Math.min(1, swipeDx / SWIPE_THRESHOLD) : 0,
          }}
        >
          <span className="text-xs font-sans font-medium text-primary">Done ✓</span>
        </div>
      </div>

      {/* Row content */}
      <div
        className={`flex items-start justify-between group gap-4 transition-opacity duration-300 bg-transparent relative
          ${isDone ? "opacity-50 hover:opacity-80" : ""}
        `}
        style={{ transform: `translateX(${swipeDx}px)`, transition: swipeDx === 0 ? "transform 0.2s ease" : "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="flex gap-4 min-w-0">
          {/* Checkbox */}
          <button
            onClick={handleToggle}
            disabled={isPending}
            aria-label={isDone ? "Mark incomplete" : "Mark complete"}
            className={`w-5 h-5 rounded border mt-0.5 flex-shrink-0 transition-all duration-200 flex items-center justify-center
              ${isDone ? "bg-primary/10 border-primary/40" : "border-border hover:border-accent cursor-pointer bg-transparent"}
              ${isPending ? "opacity-40" : ""}
            `}
          >
            {isDone && (
              <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="min-w-0">
            <p className={`font-sans font-medium text-sm leading-snug ${isDone ? "text-muted line-through" : "text-foreground"}`}>
              {task.title}
            </p>
            <p className="font-sans text-xs text-muted mt-0.5">
              {task.project} · {task.lane} · {allocatedMinutes}m{task.actualMinutes != null && ` · ${task.actualMinutes}m actual`}
            </p>
            {task.notes && !isDone && (
              <p className="font-sans text-xs text-muted mt-1.5 italic border-l-2 border-border pl-2 leading-relaxed truncate max-w-sm">
                {task.notes}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Reorder + Bump — desktop hover actions only */}
          {!isDone && scheduledTaskId && (
            <div className={`hidden sm:flex items-center gap-0.5 transition-opacity ${alwaysShowActions ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
              <button
                onClick={() => handleMove("up")}
                disabled={isPending || !canMoveUp}
                className="text-muted hover:text-foreground disabled:opacity-20 text-xs px-1 py-0.5 transition-colors"
                aria-label="Move up"
              >▲</button>
              <button
                onClick={() => handleMove("down")}
                disabled={isPending || !canMoveDown}
                className="text-muted hover:text-foreground disabled:opacity-20 text-xs px-1 py-0.5 transition-colors"
                aria-label="Move down"
              >▼</button>
              <button
                onClick={handleBump}
                disabled={isPending}
                className="text-muted hover:text-foreground text-xs px-1.5 py-0.5 border border-transparent hover:border-border rounded transition-colors ml-1"
                aria-label="Bump to later"
                title="Bump to backlog"
              >→</button>
            </div>
          )}

          <div className="font-sans text-xs font-semibold text-primary px-2 py-1 bg-primary/5 rounded whitespace-nowrap">
            Impact {task.impactScore}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/TaskRow.tsx
git commit -m "feat: add swipe gestures to TaskRow (mobile only, pointer events)"
```

---

## Task 15: Final verification

- [ ] **Step 1: Start the dev server**

```bash
cd apps/web && npm run dev
```

- [ ] **Step 2: Verify each primitive at 320px**

Open browser devtools, set viewport to 320px width. Check:
- [ ] AddTaskModal: Lane and WorkType show custom dropdown (not native select), effort and impact show sliders
- [ ] QuickCapture (⌘K): effort slider visible
- [ ] BlockCompletionModal: Energy shows dropdown with Low/Med/High
- [ ] Home page: DailyCommandPanel, TodayWorkLog, IbmChecklist are collapsed with toggle arrows
- [ ] TaskRow: swipe left reveals red "Bump →", swipe right reveals green "Done ✓"

- [ ] **Step 3: Verify desktop unchanged**

Set viewport back to 1280px. Check:
- [ ] Dropdowns still work (open/close, keyboard nav)
- [ ] Sliders still work
- [ ] Home sections are expanded (no accordion toggle visible)
- [ ] TaskRow hover actions (▲ ▼ →) visible on hover, swipe not triggered by mouse

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: responsive upgrade complete — Dropdown, Slider, Accordion, SwipeRow"
```
