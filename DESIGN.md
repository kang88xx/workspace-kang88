# Design

## Source of truth
Status: Draft. Date: 2026-10-09. Surface: Orbit personal-work dashboard.
Evidence: user-supplied warehouse dashboard screenshot and Korean brief. The repository had no application files. Reference principles: isometric space, visible working entities, spatial selection and immediate status feedback. Warehouse semantics are explicitly excluded.

## Brand
Orbit: a calm, optimistic personal work studio. Crisp navy, white, electric lime and restrained blue. Real state and clear demo labels establish trust. Avoid warehouse motifs, marketing heroes and pretend AI integrations.

## Product goals
See personal work, AI work and todos together; add a task; inspect it; change its status and see all views update immediately. Success: one shared state drives workspace, counts, task board and activity. Non-goals: actual AI execution, authentication and shared cloud task storage in this first draft.

## Personas and jobs
One Korean-speaking knowledge worker balancing personal projects, delegated AI work and everyday todos. Desktop-first monitoring, mobile task actions.

## Information architecture
One workspace with category navigation, overview metrics, interactive spatial work map, today's tasks, focus timer, activity and task board. Task detail and creation use native dialogs.

## Design principles
Space communicates category; motion communicates active work. The same tasks appear in both spatial and textual views. All actions must produce visible feedback. Seed data is marked as example data; local storage is explicitly device-local.

## Visual language
Navy #202a37, lime #d7f779, blue #5a86ed, muted green #4b8e75. Cool off-white surfaces and fine gray borders. System Korean sans-serif. 8px spacing scale, 12–18px card radii. Functional SVG isometric data visualization, minimal line icons. Animation is restrained and pausable.

## Components
Shared CSS variables own tokens. App shell, metrics, category pills, task station, task row, detail dialog, creation dialog, live activity, countdown and toast. Statuses: todo, doing, review, done. Categories: personal, ai, todo.

## Accessibility
Semantic buttons and form labels; visible keyboard focus; native modal focus behavior; status never conveyed by color alone; spatial objects accessible by keyboard. Respect prefers-reduced-motion and a user animation pause control. No automatic AI demo progression without explicit activation.

## Responsive behavior
Desktop: slim navigation rail, main workspace, right daily panel. Below 1150px the right panel moves below the workspace. Below 700px the navigation becomes a compact row, metrics use two columns, and the spatial map remains bounded with zoom controls. No horizontal page overflow.

## Interaction states
Empty category and search states provide useful text and creation actions. Save failures surface a warning. Add/edit/delete update all views. Deletion supports undo. Activity reports actual local mutations. AI demo simulates progress only while running and is labeled. Focus timer uses timestamps to avoid drift.

Weekly AI usage policy: execution, AI-assisted checking, and AI-assisted monitoring may use only the connected service's weekly included allowance. Warn strictly below 5%; at 0%, abort in-flight work and block new work. Requests for extra usage remain pending until informed approval; do not automatically enable credits or pay-as-you-go. Unknown/stale usage blocks work. A reset timestamp alone does not replenish usage, and refresh never restarts stopped jobs automatically. Before a real service is connected, display an unknown amount and keep approval unavailable. Provide a clearly isolated, no-network policy preview that cannot write production usage or task records.

## Content voice
Plain Korean. Brief labels and useful verbs. English brand and small section labels only. No claims of connected AI or server synchronization.

## Implementation constraints
Dependency-free HTML/CSS/ES modules. Static deployment in studio/dist. Browser-local task persistence with validated schema. Test core state transitions and exercise browser interactions, keyboard, responsive behavior and reload persistence. No external fonts or image dependencies.

## Open questions
- [ ] Which real AI provider and execution backend should later power AI work? Owner: user; impact: integration phase.
- [ ] Should future task state sync across devices? Owner: user; impact: storage/auth phase.
