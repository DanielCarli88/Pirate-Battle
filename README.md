# Pirate Battle

Pirate Battle is a 2D top-down naval shooter built with React, TypeScript, and PixiJS. The player navigates an arena, avoids islands, fights Chaser and Shooter enemies, and submits completed match results to the local mocked ranking and match-history APIs.

## Features

- PixiJS arena with water, islands, ships, projectiles, health bars, and combat feedback.
- Frame-rate-independent simulation with configurable match duration and enemy spawn interval.
- Chaser and Shooter enemy behaviors.
- Frontal cannon and three-projectile left/right broadsides.
- Manual pause and automatic pause on window blur or hidden tabs.
- Keyboard and touch/pointer controls.
- Persistent options, last result, confirmed records, and pending submissions.
- Ranking and Match History tabs with loading, empty, error, retry, caching, and pagination states.
- MSW-powered network scenarios that work in development, tests, and the published build.
- Desktop and mobile Playwright coverage with menu visual baselines.

## Technology

- React 18
- TypeScript in strict mode
- PixiJS 8
- TanStack Query
- Axios
- Mock Service Worker (MSW)
- Vite
- Playwright

## Requirements

- Node.js 20 or newer
- npm

## Installation

```bash
npm install
```

## Development

Start the Vite development server:

```bash
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Production build

Build and preview the production bundle:

```bash
npm run build
npm run preview
```

The generated static files are written to `dist/`.

## Controls

### Keyboard

- `W` or `Arrow Up`: move forward
- `A` / `D` or `Arrow Left` / `Arrow Right`: rotate
- `Space`: fire the frontal cannon
- `J`: fire the left broadside
- `K`: fire the right broadside
- `Pause`: pause or resume the simulation

### Touch and pointer

Touch controls are displayed automatically on narrow screens and coarse-pointer devices. They provide buttons for moving forward, rotating, firing, and both broadsides.

## Options and persistence

The Options screen exposes:

- Game session time: 60–180 seconds
- Enemy spawn interval: 1–20 seconds

Options are saved locally and restored after a refresh. Each match receives a snapshot of the configuration that was active when it started. Abandoning a match does not create a ranking or history record.

## Network scenarios

The main menu provides reproducible MSW scenarios:

- `Success`
- `Empty lists`
- `Slow / latency`
- `Timeout`
- `Connection failure`
- `Out-of-order responses`
- `HTTP failure`

Use **Reset mock data** to remove confirmed and pending local records. Failed submissions remain pending and can be retried without duplicating a match because the match ID is used as an idempotency key.

## Tests and quality checks

Run the available checks with:

```bash
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

The Playwright suite runs the Chromium desktop and Pixel 5 mobile projects. It covers options persistence, gameplay pause, touch controls, hidden-tab pause, network failures, pagination, and menu visual regression.

The HTML report is written to `playwright-report/`. Failed tests retain traces and screenshots. Visual baselines are stored in `tests/menu.spec.ts-snapshots/`.

To intentionally regenerate visual baselines:

```bash
npm run test:e2e -- --update-snapshots
```

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md): React/PixiJS boundaries, simulation lifecycle, collisions, persistence, caching, and network recovery.
- [PERFORMANCE.md](PERFORMANCE.md): profiling procedure, visual baseline workflow, and performance targets.
- [tests/menu.spec.ts](tests/menu.spec.ts): end-to-end and visual-regression coverage.

## Current limitations

- Performance numbers such as FPS, p95 frame time, and memory usage must be measured on the evaluator's reference hardware; the repository documents the reproducible profiling procedure.
- Visual baselines currently cover the menu in desktop Chromium and Pixel 5 mobile profiles. Arena and result-state baselines can be added when those states are stabilized for screenshot testing.
- The implementation uses selected supplied textures together with Pixi primitives for some arena elements instead of loading the complete UI atlas.
- A public deployment URL must be added after the repository is connected to a hosting account.
