# Project memory for Claude Code sessions

Read this first, then `PLAN.md` (product/architecture) and
`coding-standards.md` (process/style rules). The tracking issue,
[#14](https://github.com/sgenius/weather-beats/issues/14), is the
authoritative PR-by-PR checklist for Stage 1 - check it for current status
before starting new work; it's kept current after every merge.

## Where things stand

Stage 1 (MVP) steps 1-7 of 10 are merged: data display panel, location +
units, live Open-Meteo weather, the sonification core (`buildScorePlan`, both
"now" and "next12h" modes), the Tone.js audio renderer, and full transport
controls (mode toggle, restart/pause/stop/volume). The app is audible
end-to-end: press Play in the running app to hear it.

Next up: step 8, the "what you're hearing" panel (time-aware visual
equivalent synced to playback). After that: step 9 (full sandbox - multi-hour
timeline authoring, save/load presets) and step 10 (polish + exit criteria).

## Workflow conventions this project has used throughout

- **One PR per tracking-issue step**, branched directly off `main`
  (`claude/stage1-<short-name>`), never stacked on another feature branch.
  A step that would exceed the ~250-line soft cap (400 hard cap, enforced by
  the `pr-size` CI check) splits into `5a`/`5b`-style sub-steps - each still
  its own PR, reviewed and merged before the next starts.
- After opening a PR: call `subscribe_pr_activity` on it and update the
  tracking issue's checklist (check off the step, add the PR link).
- After a PR merges: sync local `main`, update the tracking issue again if
  it wasn't already current.
- Full verification before every push: `npm run typecheck && npm run lint
  && npm run format:check && npm run test && npm run build`. For audio/UI
  changes, also drive the real app with a headless-Chromium Playwright
  script (dev server or `npm run build && npm run preview`) and check for
  console errors - unit tests alone have repeatedly missed real bugs here
  (see "Audio bugs found" below).
- Inline replies to GitHub review comments on this repo's own PRs
  routinely fail ("only one pending review per PR") because the review
  account and the posting account are the same identity in this setup;
  the fallback is a top-level PR comment summarizing the fixes, plus
  `resolve_thread` on each addressed thread.

## Audio engine gotchas (learned the hard way)

- **Tone.js effects backed by `AudioWorkletNode`** (`Tone.Freeverb`,
  `Tone.JCReverb`, `Tone.BitCrusher`) leave their input disconnected from
  their output until the worklet module finishes loading asynchronously.
  Chains built lazily on first use can have their first-ever note scheduled
  through a not-yet-connected effect - audible as a glitch/dropout on the
  very first play only. Prefer `Tone.Reverb` (convolution, native
  `ConvolverNode`) and explicitly `await` its `.ready` promise before
  scheduling notes or starting the transport.
- **Tone.Param automation needs an absolute audio-context time**, not a
  Transport-relative position. Schedule it via `transport.schedule(cb, pos)`
  and use the real time the callback receives - a bare Transport-relative
  number passed directly to `setValueAtTime` is only correct the instant the
  context's own clock happens to read near that value.
- **No gain staging = clipping.** Three simultaneous tracks (one a chord)
  summed at full velocity clip hard past 0dBFS. A `Tone.Limiter` alone isn't
  enough (a compressor's attack reacts to signal level over time, not an
  instantaneous sample peak) - fixed headroom ahead of the limiter is the
  actual fix.
- `Transport.stop()` resets position to 0 natively; `Transport.pause()` does
  not (by design - that's what makes resume possible).

## Known resolved issues (don't re-introduce)

Three real audio bugs were found and fixed post-step-7, all in PR #28 (see
its description for the full investigation): master-bus clipping, a data
race where an eager first click could play stale sandbox-fallback data
before live weather resolved (fixed by disabling Play while
`liveWeather.status === 'loading'`), and the `Tone.Freeverb` worklet-startup
glitch above.
