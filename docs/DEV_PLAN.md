# Habit Tracker Development Plan

## Objective
Build the application to match the provided design direction across onboarding, dashboard, habits, add habit, progress, statistics, calendar, streaks, reminders, and dark mode while keeping the app stable, maintainable, and local-first.

## Reference Inputs
1. Primary implementation plan: this document.
2. Product and design reference: docs/overview.md.
3. Expo version constraint: AGENTS.md (Expo SDK 57).

## Scope Mapping from overview.md
1. In scope now (mobile local-first): screen system, design system alignment, reminders, streaks, statistics, calendar, dark mode, architecture cleanup.
2. Deferred to later phases: authentication, backend/API/database, CI/CD deployment pipeline, social/AI features.
3. Principle alignment to preserve during implementation:
4. Calm and motivational tone in copy.
5. Consistent spacing, typography, and card rhythm.
6. Fast interaction loops with minimal taps.

## Current Status
The app includes major screens, core local-first data flow, reminder scheduling, and theme controls with migration support. Dashboard, Habits, and Add Habit tab UI blocks are extracted into reusable components under src/components. The immediate focus is closing current typecheck blockers, then continuing progress/settings extraction, edit-form feedback polish, and design-fidelity improvements.

## On-the-Go Status Log
1. Date: 2026-07-11
Status: Architecture extraction is in progress and stable for core flows.
Details: Shared modules are active under src/types, src/constants, src/logic, src/storage, src/notifications, and App.tsx is acting as orchestrator.

2. Date: 2026-07-11
Status: Notification scheduling integration is implemented.
Details: Reminder sync includes permission request, stale schedule cancellation, and re-scheduling for active habits.

3. Date: 2026-07-11
Status: Current blocker identified from verification.
Details: npx tsc --noEmit currently fails due to missing @expo/vector-icons dependency and one StyleSheet.absoluteFillObject usage that should be updated for the current type definitions.

4. Date: 2026-07-11
Status: Next immediate execution order.
Details: Fix typecheck blockers first, then continue Milestone 3 design-fidelity pass against docs/design.png.

5. Date: 2026-07-11
Status: Blocker remediation in progress.
Details: Installed @expo/vector-icons via Expo install to resolve Metro import failure; updated StyleSheet.absoluteFillObject usage to StyleSheet.absoluteFill and re-ran verification.

6. Date: 2026-07-11
Status: Android Play Store build completed successfully.
Details: EAS build e36ce221 finished and produced an AAB artifact for production profile (SDK 57.0.0, app version 1.0.0 (1)); logs show all build phases completed.

7. Date: 2026-07-11
Status: Habit sorting behavior finalized.
Details: Drag reorder is enabled for Active habits only; reordered active list persists and is reflected in Home because App state is the single source of truth.

8. Date: 2026-07-11
Status: Local data and reminder flow validated.
Details: App hydrates persisted state from AsyncStorage at launch, UI reads data via App props, and reminder schedules are synced via expo-notifications for active habits.

## Decision Register
All major product and technical decisions are tracked here.

1. Date: 2026-07-11
Decision: Planning and implementation source of truth is docs/DEV_PLAN.md.
Reason: Keep roadmap, implementation intent, and status in one file.

2. Date: 2026-07-11
Decision: Priority order is architecture-first before visual polish.
Reason: Reduces refactor risk and enables faster feature iteration.

3. Date: 2026-07-11
Decision: docs/overview.md is a design and product reference, not a strict implementation contract.
Reason: Allows local-first mobile scope while preserving core UX principles.

4. Date: 2026-07-11
Decision: Keep MVP local-first (AsyncStorage) and defer auth/backend features.
Reason: Matches current project scope and delivery speed.

5. Date: 2026-07-11
Decision: Milestone 1 includes real reminder scheduling with expo-notifications.
Reason: Reminder behavior is a core habit retention requirement.

6. Date: 2026-07-11
Decision: Reminder scheduling uses centralized sync (cancel stale IDs, re-create active schedules).
Reason: Prevent duplicate or orphaned notifications.

7. Date: 2026-07-11
Decision: Persisted state schema supports migration-safe parsing.
Reason: Prevent app crashes or data loss from shape changes.

8. Date: 2026-07-11
Decision: Theme is persisted as themeMode = system | light | dark (replacing darkMode boolean).
Reason: Supports system theme adoption and explicit user control.

9. Date: 2026-07-11
Decision: Legacy darkMode values are migrated to themeMode during hydration.
Reason: Preserve existing user preferences after schema evolution.

10. Date: 2026-07-11
Decision: App.tsx remains orchestrator while logic is extracted to src modules incrementally.
Reason: Minimize regression while refactoring a live feature surface.

## Design Feature Matrix
| Feature | Current | Target | Action |
| --- | --- | --- | --- |
| Welcome | Implemented | Visual parity | Tune spacing, typography, artwork hierarchy |
| Dashboard | Implemented | Visual + interaction parity | Refine cards, status chips, list rhythm |
| Habits List | Implemented | Full management parity | Add edit, archive/filter, icon affordances |
| Add Habit | Implemented | Form parity | Improve field grouping, feedback, validation UX |
| Progress | Implemented | Insight parity | Improve chart readability and section hierarchy |
| Statistics | Partial | Full parity | Add trend context and category insights |
| Calendar | Partial | Full parity | Habit-specific drill-down and stronger day states |
| Streaks | Partial | Full parity | Add dedicated streak view and longest streak storytelling |
| Reminders | Implemented | Real notifications | Validate scheduling behavior on device and polish UX copy |
| Dark Mode | Implemented | Design parity | Normalize token usage and contrast tuning |

## Milestones

### Milestone 1: Architecture Foundation + Real Notifications
1. Extract shared types, constants, and progress logic from App.tsx.
2. Add persistence helpers and migrate App.tsx to use shared modules.
3. Integrate expo-notifications (permissions, schedule, cancel, resync).
4. Keep behavior stable with no regression in existing screens.

### Milestone 2: Core Feature Completion
1. Add habit edit flow.
2. Add category filtering and archived habits.
3. Expand reminder controls and validation.

### Milestone 3: Design Fidelity and Polish
1. Align visual system (spacing, iconography, typography hierarchy).
2. Add meaningful motion (tab transitions, reveals, completion feedback).
3. Add accessibility labels/roles and touch-target validation.
4. Apply overview.md token targets where practical: stronger primary purple usage, larger card radii, softer elevation, and consistent caption/body/title scales.

## Technical Plan
1. Introduce modular structure under src/: types, constants, logic, storage, notifications.
2. Keep App.tsx as orchestrator while extracting feature-specific components incrementally.
3. Establish notification ID mapping for reliable update/cancel flows.
4. Add safe parse and migration patterns for persisted local state.

## Verification Checklist
1. Type check: npx tsc --noEmit
2. Runtime check: npm start
3. Persistence check: create/edit/delete/restart app
4. Notification check: permission flow, schedule on save, cancel on disable/delete
5. Design walkthrough against provided mock across all target screens
6. Accessibility sanity check in both light and dark themes
7. Overview alignment review: confirm implemented screens/flows follow docs/overview.md sections for feature intent and UX principles.

## Risks and Mitigations
1. Risk: Notification duplication after edits.
Mitigation: central resync routine that cancels stale schedules before re-creating.

2. Risk: Refactor regression from monolith split.
Mitigation: incremental extraction with compile checks after each step.

3. Risk: Data migration breakage.
Mitigation: versioned persisted payload and non-throwing fallback behavior.

## Immediate Next Tasks
1. Extract Progress and Settings blocks into dedicated components.
2. Add inline validation/error feedback for habit edit mode.
3. Continue design fidelity pass against overview guidance and docs/design.png (spacing, hierarchy, motion).
4. Run runtime walkthrough checks for reminders and visual parity after the next refactor slice.


design as in docs/design.png