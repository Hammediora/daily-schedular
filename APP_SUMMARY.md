# Operator OS - App Summary

## What It Is

A personal "operator cockpit" built as a schedule-first, task-driven daily execution platform. It's designed for a founder/operator managing multiple life domains and aims to answer: **what to do, when, how, and whether you're winning.**

**Tech Stack:** Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + Prisma + PostgreSQL + Clerk (auth) + Turbo monorepo

**Monorepo Structure:**
- `apps/web/` - Next.js frontend + server actions
- `packages/db/` - Prisma schema + seed data
- `packages/core/` - Business logic (Scheduler, Balancer)
- `packages/types/` - Shared TypeScript types
- `packages/ui/` - Tailwind utilities

---

## Core Concepts

| Concept | Purpose |
|---------|---------|
| **4 Lanes** | Revenue, Asset, Leverage, Health - everything maps to a lane |
| **Time Block Templates** | Recurring weekly schedule (Deep Work, IBM, Health, Execution, Family) |
| **Time Block Instances** | Daily realized blocks auto-generated from templates |
| **Task Backlog** | Work items scored by impact/effort, assigned to lanes |
| **Scheduler** | Auto-fills blocks with backlog tasks based on type compatibility |
| **Daily Intent** | Non-negotiables for the day + IBM behavioral checklist |
| **Weekly Constraints** | Minimum minutes/sessions per lane per week |
| **Scorecard** | Weekly discipline tracking and lane performance trends |

**Routes:**
- `/` - Today's execution (main cockpit)
- `/now` - Full-screen focus mode with timer + parking lot
- `/tasks` - Task backlog management
- `/scorecard` - Weekly performance
- `/plan` - Sunday planning + next-week generation
- `/weekly` - 7-day calendar view
- `/history` - Last 14 days execution record
- `/settings` - Workspace config + templates

---

## What Works Well

### Strong Core Design
- The 4-lane model is elegant and maps real-world operator balance perfectly
- Non-negotiables system provides daily clarity
- The plan -> schedule -> execute -> review loop is sound
- "Now Mode" with distraction parking lot is the right UX for in-the-moment focus

### Smart Scheduling Engine
- `Scheduler.computeSchedule()` has clean separation of concerns
- Task ranking by deadline then impact score
- WorkType-to-BlockType compatibility mapping (DEEP work only in DEEP_WORK blocks)
- Protected blocks (FAMILY, HEALTH, IBM) never receive task assignments
- Greedy fill respects block capacity, handles task splitting across blocks

### Solid Architecture
- Server Actions pattern is well-implemented
- Proper Server Component data fetching / Client Component interactivity split
- `getOrGenerateTodayBlocks()` and `getOrGenerateWeekBlocks()` are intelligent auto-generators
- Transaction-based DB updates protect data consistency

### Beautiful, Intentional UI
- Cohesive color palette (warm gold accent, deep forest green, muted slate)
- Clear typography hierarchy (Playfair Display serif + Inter sans)
- Good information density per view
- Visual states clear (past/current/future blocks, done/pending)
- Global Cmd+K quick-capture modal for task input
- Real-time lane progress bars in sidebar

---

## What Needs Improvement

### Critical Issues

**1. Auth Is Configured But Not Enforced**
- Clerk is integrated but never actually used in routes or server actions
- All queries assume a single workspace (`db.workspace.findFirst()`)
- No row-level security - anyone with DB access sees everything
- Blocks multi-tenant use and real deployment

**2. Raw SQL Everywhere (15+ instances)**
- `db.$executeRawUnsafe()` and `db.$queryRawUnsafe()` scattered through `actions.ts`
- Bypasses Prisma's type safety and makes code fragile
- Should use Prisma's `update()` / `create()` API consistently

**3. TypeScript Undermined by `as any`**
- Pervasive `(block as any).scheduledTasks`, `(st.task as any).notes`, etc.
- Suggests schema/type mismatch issues that need proper fixing
- Defeats the entire purpose of having TypeScript

**4. Zero Tests**
- No `.test.ts` or `.spec.ts` files found anywhere
- Scheduler logic especially needs unit tests
- No error boundaries in React components

### Functional Gaps

**5. Scheduler Is Too Simplistic for the Vision**
- No task dependencies or priority within a lane
- Doesn't flag when deadlines can't be met with available blocks
- Weekly constraints aren't enforced in scheduling (only displayed)
- No automatic rescheduling when tasks are marked incomplete

**6. No Actual vs. Estimated Tracking**
- Tasks only track `completedAt` (binary done/not done)
- No visibility into how long tasks actually took vs. estimated
- No lane effort actual vs. target
- The Balancer only counts completed minutes, not real execution data

**7. Plan Page Is Read-Only**
- `/plan` shows next week preview but can't edit the plan
- Can't add/remove blocks or adjust task allocation for future weeks
- No way to quickly reprioritize tasks within a block during execution

**8. No Error Handling**
- Server actions don't catch or surface errors
- No user feedback on failures (network, validation)
- No error boundary components

### Data & Quality Issues

**9. No Input Validation**
- `effortMins` and `impactScore` accept any value (negatives?)
- Deadlines can be in the past
- Block durations can exceed 24 hours

**10. Stale Schema Artifacts**
- Both `LaneTarget` (old) and `WeeklyConstraint` (new) exist in schema
- Creates confusion about source of truth

**11. Timezone Handling Missing**
- Workspace has timezone field but all date math assumes UTC
- Will break for any non-UTC user

**12. No Database Indexes**
- Missing indexes on `(workspaceId, date)`, `(workspaceId, status)`, `(workspaceId, lane)`
- Will degrade as data grows

---

## Gap Analysis: Current State vs. "Operator Cockpit" Vision

The goal: *an operator cockpit that tells you exactly what to do, when, how, and whether you're winning.*

| Capability | Status | What's Missing |
|-----------|--------|----------------|
| **What to do** | Partial | Task backlog + scheduling works, but no reprioritization during execution, no "this is the #1 thing right now" signal |
| **When** | Good | Time blocks + auto-scheduling handles this well |
| **How** | Partial | Task steps exist but objectives/parking lot only in Now Mode, no playbooks or SOPs |
| **Whether you're winning** | Weak | Scorecard exists but no predictive alerts ("you won't hit this lane target at current pace"), no actual-vs-estimated, no trend intelligence |

### Missing Features for the Vision

| Feature | Impact |
|---------|--------|
| **Predictive alerts** | "You're behind on Revenue this week - need 90 more mins" |
| **Block countdown on home page** | Currently only in Now Mode |
| **Task reprioritization** | Quick reorder within a block during execution |
| **Auto-rescheduling** | Incomplete tasks re-inserted into future blocks |
| **Actual vs. estimated tracking** | Are your estimates accurate? Are you improving? |
| **Quick block swaps** | Move a task to a different block without delete/recreate |
| **Weekly handoff report** | End-of-week summary for plan refinement |
| **Calendar conflict detection** | Warn on double-booking or over-allocation |

---

## Overall Assessment

**Current state: ~60% MVP.** Strong fundamentals, beautiful design, sound architecture. The core loop (plan -> schedule -> execute) works. It's usable as a personal tool today.

**To reach "operator cockpit" status, priorities are:**

1. **Fix the foundation** - Replace raw SQL with Prisma, fix `any` types, add validation and error handling
2. **Close the intelligence gap** - Predictive alerts, actual-vs-estimated tracking, constraint enforcement in scheduler
3. **Complete the execution loop** - Task reprioritization, auto-rescheduling, editable plan page
4. **Ship-readiness** - Auth enforcement, tests for scheduler logic, timezone support, DB indexes
