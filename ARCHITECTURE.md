# Pirate Battle Architecture

## Runtime boundaries

- React owns menus, options, HUD shell, pause dialog, result screen, and the query cache.
- `GameSimulation` is a frame-rate-independent gameplay state machine. It owns entities, timers, cooldowns, collision checks, scoring, and end reasons. A configuration snapshot is copied into each simulation.
- `GameCanvas` owns one Pixi application and translates keyboard and touch input into the simulation. It uses a fixed logical arena of 1000x620 and Pixi's `autoDensity`/device-pixel resolution for high-DPI screens. Runtime textures are served from `public/assets/`, which Vite copies to the same `/assets/...` URLs in the production bundle.
- Axios is the only HTTP client. TanStack Query owns cache, loading/error states, retries, invalidation, and refetch-on-focus. MSW intercepts the same `/api` contracts in development and production.

## Combat and lifecycle

Ships and projectiles use circle/rectangle collision checks. A projectile is removed on its first hit, island hit, expiry, or arena exit. Chasers deal one collision hit and self-destruct; Shooters stop to fire inside their configured range. Dead entities are filtered before movement, attacks, or collision checks.

The Pixi resource is destroyed on React unmount. Keyboard listeners, visibility listeners, and ticker resources are released with the canvas. Strict Mode creates and destroys the application safely. Window blur and `visibilitychange` pause the simulation; the explicit pause button also suspends it without advancing elapsed time or cooldowns.

Pointer/touch controls dispatch the same input commands as the keyboard path, keeping gameplay rules in the simulation instead of duplicating them in the UI.

## Persistence and network recovery

Options, confirmed records, and pending submissions live in local storage. The match ID is an idempotency key: the mock POST returns the existing record for a repeated ID. A failed submission remains pending and can be retried; game access is never blocked by API availability. Ranking tie-breaks are score descending, date ascending, then ID ascending.

The scenario selector covers success, empty data, latency, timeout, connection failure, deterministic out-of-order responses, and HTTP failure. `resetMockData` clears confirmed and pending records. The MSW worker is checked into `public/`, so the published build uses the same handlers without a private service. Ranking and history expose Previous/Next controls with safe disabled states for empty or unavailable pages.

Gameplay accepts keyboard and pointer/touch input. Window blur and `visibilitychange` pause the simulation, and resuming requires an explicit action. Asset loading displays a visible status layer before the arena is ready.

## Known limitations

This version uses generated Pixi vector primitives for islands, enemies, health bars, and projectiles, together with a supplied ship texture and supplied logo. This keeps the arena readable and avoids loading the complete UI atlas. Performance profiling must be repeated on the evaluator's reference hardware; the target is 60 FPS at the logical 1000x620 arena.

Current visual regression coverage contains menu baselines for desktop Chromium and Pixel 5 mobile. Arena and result-state baselines, hardware-specific performance measurements, and a public deployment URL remain delivery tasks rather than runtime architecture responsibilities.
