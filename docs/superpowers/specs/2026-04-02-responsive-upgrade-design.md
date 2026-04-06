# Responsive Upgrade — Design Spec
**Date:** 2026-04-02
**Scope:** All pages and breakpoints (320px → desktop)
**Approach:** Option A — Progressive Enhancement (in-place, no new monorepo packages)

---

## Overview

Four new UI primitives built in `src/components/ui/` and applied across every page. The aesthetic stays minimal and matches the existing editorial palette (warm off-white, forest green, gold, Playfair Display + Inter). No third-party libraries introduced.

---

## 1. Custom Dropdown (`src/components/ui/Dropdown.tsx`)

### Behavior
- Trigger button shows current selected label
- Floating list opens below trigger, closes on: outside click, Escape, selection
- Keyboard navigable: arrow keys move focus, Enter selects
- Mobile: full-width list, 44px min touch targets
- Desktop: width matches trigger

### Styling
- Trigger: `border border-border bg-background` with current value + chevron icon
- List: `bg-surface border border-border shadow-sm` — no heavy shadows
- Active item: `bg-primary/5 text-foreground`
- Matches `text-sm font-sans` body style throughout

### Replaces
| Component | Field |
|---|---|
| `AddTaskModal` | Lane, WorkType |
| `QuickCapture` | Lane, WorkType |
| `SettingsClient` | Constraint lane selects |
| `TemplatesClient` | BlockType select |
| `BlockCompletionModal` | Energy rating (currently button group → dropdown) |

---

## 2. Range Slider (`src/components/ui/Slider.tsx`)

### Behavior
- Native `<input type="range">` with CSS-only custom styling
- Live value label floats above thumb, updates on `input` event
- No JS drag logic — leverages browser-native range behavior

### Styling
- Track: thin `bg-border` line; filled portion: `bg-primary` (forest green)
- Thumb: 18px desktop / 28px mobile, `bg-foreground` circle, minimal
- Value label: `text-xs font-mono text-muted` above thumb

### Replaces
| Component | Field | Range | Step | Label format |
|---|---|---|---|---|
| `AddTaskModal` | `effortMins` | 5–240 | 5 | "X min" |
| `AddTaskModal` | `impactScore` | 1–10 | 1 | "X / 10" |
| `QuickCapture` | `effortMins` | 5–240 | 5 | "X min" |
| `SettingsClient` | Weekly constraint mins | 0–480 | 15 | "X hr X min" |

---

## 3. Accordion / Collapse (`src/components/ui/Accordion.tsx`)

### Behavior
- Wraps any section with a toggle header + animated body
- **Mobile default: collapsed** (reduces scrolling on small screens)
- **Desktop default: expanded** (no behavioral change from current)
- Smooth `max-height` CSS transition (no JS height calculation)
- Toggle arrow rotates 180° when open

### Styling
- Header: existing `text-xs uppercase tracking-widest text-muted font-semibold` label + chevron right-aligned
- Body: no additional wrapper styling — content renders as-is
- No added borders, backgrounds, or shadows

### Applied sections

| Page | Sections |
|---|---|
| Home (`page.tsx`) | DailyCommandPanel, TodayWorkLog, IbmChecklist |
| Plan (`PlanClient`) | This Week Stats, Reflections, Week Outcomes, Backlog Lock |
| Report (`WeeklyReport`) | Wins, Misses, Block Utilization |
| Scorecard | Each lane section |
| Settings (`SettingsClient`) | Each constraint group |

---

## 4. Swipe Gestures (`TaskRow.tsx`)

### Behavior
- Pointer events only — no library, no touch-action hacks
- **Swipe left** → reveals "Bump →" (calls `bumpTaskAction`)
- **Swipe right** → reveals "Done ✓" (calls task complete action)
- Threshold: 72px drag to commit; snap-back if released before threshold
- Row slides horizontally revealing colored background underneath

### Styling
- Left reveal background: red-tinted (`bg-red-50` or similar warm red)
- Right reveal background: green-tinted (`bg-primary/10`)
- Action label: `text-xs font-sans font-medium` centered in revealed area
- Row uses `transition-transform` for smooth snap-back

### Breakpoint behavior
- **Mobile only** (`sm` and below): swipe enabled, hover actions hidden
- **Desktop**: swipe disabled, existing hover actions (▲ ▼ →) remain

### Wired to existing actions
- Bump: `bumpTaskAction(taskId)` — already implemented
- Complete: existing task complete server action — already implemented

---

## Breakpoint Summary

| Breakpoint | Dropdown | Slider | Accordion | Swipe |
|---|---|---|---|---|
| 320px–639px (mobile) | Full-width list, 44px targets | 28px thumb | Collapsed by default | Enabled |
| 640px–1023px (tablet) | Standard width | 18px thumb | Expanded by default | Disabled |
| 1024px+ (desktop) | Standard width | 18px thumb | Expanded by default | Disabled |

---

## Files Created
- `src/components/ui/Dropdown.tsx`
- `src/components/ui/Slider.tsx`
- `src/components/ui/Accordion.tsx`

## Files Modified
- `src/components/TaskRow.tsx` — swipe gesture logic
- `src/components/AddTaskModal.tsx` — Dropdown + Slider
- `src/components/QuickCapture.tsx` — Dropdown + Slider
- `src/components/BlockCompletionModal.tsx` — Dropdown
- `src/components/DailyCommandPanel.tsx` — Accordion wrapper (mobile)
- `src/components/TodayWorkLog.tsx` — Accordion wrapper (mobile)
- `src/components/IbmChecklist.tsx` — Accordion wrapper (mobile)
- `src/components/WeeklyReport.tsx` — Accordion wrapper (mobile)
- `src/app/plan/PlanClient.tsx` — Accordion wrapper (mobile)
- `src/app/scorecard/page.tsx` — Accordion wrapper (mobile)
- `src/app/settings/SettingsClient.tsx` — Dropdown + Slider + Accordion
- `src/app/settings/templates/TemplatesClient.tsx` — Dropdown
