# Performance report

## Reproduction

1. Run `npm.cmd run build` and `npm.cmd run preview`.
2. Open Chromium DevTools Performance at 1000x620 logical game size.
3. Set Options to 180 seconds and spawn time to 1 second.
4. Record one three-minute game and note FPS, p95 frame interval, and the maximum visible entity count.
5. Repeat five start/play/abandon cycles while watching the Memory panel and take a heap snapshot after each cycle.

The Playwright visual baseline command is `npm.cmd run test:e2e -- --update-snapshots`; committed baselines cover the menu in Chromium desktop and Pixel 5 mobile profiles. The E2E report is generated in `playwright-report/`, with traces and screenshots retained for failures.

## Engineering targets

The simulation uses elapsed seconds rather than frame counts, caps frame delta at 50ms, removes expired entities, and keeps React out of the per-frame render path. Pixi uses one application and pooled logical containers per match. The acceptance target is 60 FPS, p95 frame interval below 20ms, and no monotonic heap growth after teardown. Hardware/browser measurements are environment-specific and should be recorded by the deployment evaluator.
