# Weather Beats — Project Plan

An accessible web app that shows live weather for a location on a map and turns
five weather values into a short, replayable **12-second soundscape** you can
*listen to* and identify by ear.

> Status: planning. This document is the agreed scope and roadmap coming out of
> the requirements interrogation and the first review. It is the source of truth
> for staging; details inside a stage will be refined as we build.
>
> **Rev 2 (review):** finite 12s + 1s fade instead of an endless loop; full
> transport controls; the 12 seconds map to the next 12 hours of forecast when
> available (1s = 1h); polyphony/chords allowed; an explicit set of sound
> "levers"; a minimum 3-track arrangement; and per-weather-state colour
> palettes. "Spectral brightness" is redefined as the **muffling** lever.

---

## 1. Product vision

Three tightly-coupled experiences on one screen:

1. **A weather map** centred on the user's location (or a sensible fallback when
   location permission is denied).
2. **A data display** for the selected location: temperature, local time,
   humidity, today's temperature and humidity min/max, cloud cover,
   precipitation, and (a later stage) locally applicable weather warnings.
3. **A generative soundscape** — a finite, replayable 12-second piece synthesised
   from five values (local time, temperature, humidity, cloud cover,
   precipitation) such that a trained listener can identify all five *from the
   audio alone*. When a 12-hour forecast is available, the piece plays that
   forecast as a timeline: **1 second of sound = 1 hour ahead.**

The whole product must meet **WCAG 2.1 AA**. Because the signature feature is
audio, accessibility is not a bolt-on: the sound has a fully equivalent visual
representation, playback never auto-starts, and every control is keyboard- and
screen-reader-operable.

---

## 2. Decisions locked in

| Area | Decision |
|------|----------|
| Platform | Web app, installable **PWA** |
| Frontend stack | **React + TypeScript + Vite** |
| Map | **Leaflet + OpenStreetMap** (no key, no billing) |
| Weather data | **Open-Meteo** (no key; current + hourly + daily) |
| Audio engine | **Tone.js** over the Web Audio API |
| **Sound length** | **12 s** of sound **+ 1 s fade-out**; finite and replayable — **not** endless |
| **Forecast timeline** | If a 12 h hourly forecast is available, the 12 s **are** the next 12 h (**1 s = 1 h**); otherwise the current snapshot is held for 12 s |
| **Playback controls** | **(Re)start, pause, stop, master volume** (+ per-track volume in the sandbox) |
| **Polyphony** | **Chords allowed** — polyphonic tracks widen the information bandwidth |
| **Arrangement** | **≥ 3 tracks**: percussion · background (long/opaque notes) · foreground (short/sharp notes) |
| **Global rhythm** | Tempo/rhythm is **shared by all tracks** so musicality never breaks |
| Sonification model | Data → **sound levers**; configurable *N params : N levers*, **starting 1:1** |
| Starting mapping | Proposed psychoacoustic default (below); tuned in a sandbox |
| **Colour** | **Per-weather-state palettes** (fair, cloudy, rainy, snowy, too cold, too hot), each with **light + dark** schemes |
| Persistence | **Local only** — `localStorage`, no accounts, no backend for user data |
| Units | **Locale-based, user-toggleable** (metric/imperial) |
| Default location | Recognisable fallback city when geolocation is denied/unavailable |
| Audio-for-deaf equivalence | **Live "what you're hearing" panel**, time-aware across the 12 s |
| Autoplay | **Never auto-starts**; user presses play (WCAG 1.4.2) |
| Quality bar | **Pragmatic**: core tests + lint + a11y checks now; E2E, deeper security, coverage gates in a hardening stage |
| Warnings | **Deferred** to a later stage (Open-Meteo has none) |
| Deployment | **Vercel or Netlify** with per-PR preview deploys |
| **MVP shape** | **Display + audio first, map later**, plus a **sandbox** to author test weather and explore the soundscape |

---

## 3. Architecture overview

```
┌──────────────────────────────────────────────────────────────┐
│  React + TypeScript (Vite) PWA                                 │
│                                                                │
│  ┌─────────────┐   ┌──────────────┐   ┌────────────────────┐  │
│  │ Location     │   │ Weather      │   │ Sonification        │  │
│  │ service      │──▶│ service      │──▶│ engine (Tone.js)    │  │
│  │ (geo + fall- │   │ (Open-Meteo: │   │  - levers + mapping │  │
│  │  back)       │   │  now + 12 h  │   │  - 3+ tracks        │  │
│  │              │   │  hourly)     │   │  - 12 s transport   │  │
│  └─────────────┘   └──────┬───────┘   └─────────┬──────────┘  │
│                           │                     │             │
│      normalised WeatherTimeline (t0..t+12h)     │             │
│                           │                     │             │
│         ┌─────────────────┼─────────────────────┼──────────┐  │
│         ▼                 ▼                     ▼          │  │
│   ┌──────────┐     ┌─────────────┐      ┌──────────────┐   │  │
│   │ Map view │     │ Data display │      │ "What you're │   │  │
│   │ (Leaflet)│     │  panel       │      │  hearing"    │   │  │
│   └──────────┘     └─────────────┘      │  (timeline)  │   │  │
│                                          └──────────────┘   │  │
│         Sandbox: inject synthetic WeatherTimeline ──────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Key design points

- **`WeatherTimeline` is the one contract.** A normalised, unit-agnostic series
  of up to 13 samples (now → +12 h) for temperature, humidity, cloud cover,
  precipitation, plus the local time at t0. A single-sample timeline is the
  fallback when no forecast is available. Everything downstream — display,
  sonification, the "what you're hearing" panel — consumes only this. It is also
  what the sandbox produces synthetically.
- **Sonification is a pure, testable core.** `WeatherTimeline + MappingConfig →
  ScorePlan` is deterministic and unit-tested independently of Tone.js. The
  `ScorePlan` describes, per track, the notes/chords, lever values, and their
  automation across the 12-second timeline. Tone.js is the *renderer* of the
  `ScorePlan`, behind a thin adapter so the mapping logic never touches audio
  hardware in tests.
- **No backend for user data.** Preferences, saved locations, unit choice, and
  mapping config live in `localStorage`. Any future keyed API (warnings) goes
  through a serverless proxy — never a client-side key.
- **Offline-friendly PWA.** Service worker caches the app shell and last-known
  timeline so the display/soundscape degrade gracefully offline.

---

## 4. Sonification design (the heart of the product)

### 4.1 Requirement (updated at review)

- A **finite 12 s** piece **+ 1 s fade-out**, replayable — not an endless loop.
- If a **12-hour hourly forecast** is available, the 12 seconds **are** the next
  12 hours: **1 s = 1 h**. The listener hears the *trajectory* — rising temp, an
  approaching rain band, clearing skies. Without a forecast, the current
  snapshot is held constant for 12 s.
- **Identifiability now covers both the starting values and their trend** over
  the next 12 hours.
- **Polyphony is allowed** — chords widen the information bandwidth.
- **At least three tracks** (see 4.4), all sharing one **global rhythm/tempo** so
  musicality never breaks.

### 4.2 The sound levers (dimensions we can assign data to)

The mapping assigns weather values to these levers. This is the vocabulary; the
`MappingConfig` decides which value drives which lever(s).

| Lever | Implementation | Perceptual effect |
|-------|----------------|-------------------|
| **Pitch / register** | Oscillator frequency / MIDI note number | Low ↔ high tone |
| **Chord / polyphony** | Multiple simultaneous notes; chord quality (maj/min/…) & voicing | Harmonic colour, "wider" info |
| **Muffling** *(= former "spectral brightness")* | Low-pass filter cutoff sweep + morphing the waveform toward a sine (rounding sharp edges removes high harmonics) | Bright/open ↔ dark/muffled |
| **Instrument / timbre** | Waveform shape (sine / triangle / square / sawtooth) or a MIDI/soundfont instrument where available | Character of the voice |
| **Volume** | Per-track gain and a master gain | Louder ↔ softer |
| **Reverb wetness** | Wet/dry mix + decay time (spatial "damp") | Dry/tight ↔ wet/spacious |
| **Rhythmic density** | Count/rate of events (especially percussion) | Sparse ↔ busy |
| **Global rhythm / tempo** | Shared BPM & subdivision for **all** tracks | Slow ↔ fast; the song's pulse |

### 4.3 Answering "what is spectral brightness?"

It was underspecified and overlapped your new *muffled* lever, so the two are
**merged into the Muffling lever** above. Definition: the amount of
high-frequency (overtone) energy in the sound. Implementation: a low-pass filter
whose cutoff we sweep (and/or morphing the waveform toward a sine, since a sine
has no overtones while a sawtooth has many with sharp edges — "smoothing the
sharp edges" *is* low-pass filtering). Expected output: as cloud cover goes
0 → 100 %, cutoff sweeps ~10 kHz → ~700 Hz on a log scale; upper harmonics roll
off and the timbre audibly dulls. Clear sky = open/shimmery, overcast =
closed/muffled.

### 4.4 The arrangement (minimum three tracks)

| Track | Character | Carries (default) |
|-------|-----------|-------------------|
| **Percussion** | Rhythmic hits on the global grid | Precipitation |
| **Background** | Pad; long, opaque, more-muffled notes; polyphonic (chords) | Harmony/mode + temperature (chord root) |
| **Foreground** | Lead; shorter, sharper notes | Temperature melody (the salient trajectory) |

All three lock to the same global rhythm; only event *density* and *note choice*
vary per track.

### 4.5 Proposed default mapping (1:1 start, tunable in sandbox)

Applied continuously across the 12-second / 12-hour timeline:

| # | Weather value | Lever(s) | Track(s) | Direction / feel |
|---|---------------|----------|----------|------------------|
| 1 | **Temperature** | Pitch / register (+ chord root) | Foreground + Background | cold → low, hot → high |
| 2 | **Precipitation** | Rhythmic density + volume | Percussion | none → silent, heavy → dense & loud |
| 3 | **Cloud cover** | **Muffling** (low-pass cutoff) | Background + Foreground | clear → bright, overcast → muffled |
| 4 | **Humidity** | Reverb wetness | Master/bus | dry → tight, humid → long wet tail |
| 5 | **Local time of day** | Key/mode + global tempo | All (harmony & pulse) | night → minor/slow, day → major/brighter; the mode shifts as the 12 h window crosses dawn/dusk |

Five orthogonal perceptual channels — **rhythm, pitch, muffling, spatial
reverb, harmony/tempo** — so no two values compete. Polyphony is available now
(the background plays chords), so a later N:N step can, e.g., ride a second value
on chord *quality* without adding a track.

### 4.6 Playback & controls (updated at review)

- **12 s of sound + 1 s fade-out**; plays once, then stops (replayable).
- Controls: **(Re)start · Pause · Stop · Master volume**; per-track volume and
  instrument/lever overrides live in the sandbox.
- **Never auto-starts** — requires a user gesture (also satisfies WCAG 1.4.2 and
  browser autoplay policies). All controls keyboard-operable and labelled.
- A **timeline scrubber** shows the 12 s / 12 h progress with hour ticks; it is
  the temporal spine of the "what you're hearing" panel.

### 4.7 Validating identifiability

- **Sandbox listening tests:** author known timelines ("cold clearing to warm,
  rain arriving at hour 8, dusk at hour 3") and confirm listeners can read them
  back — both start values *and* trend.
- **Automated bounds tests:** the `ScorePlan` is monotonic and in-range across
  each parameter's domain; adjacent tiers stay perceptually separated (e.g. two
  precip levels never collapse to the same density).
- **Timeline tests:** hour *n* of forecast lands at second *n* of the score.

---

## 5. Visual identity: per-weather-state palettes

Six weather **states** (more may be defined later), each with a **light** and a
**dark** scheme. The active state re-themes the whole UI so the look reinforces
the data. Every pairing is chosen for **WCAG AA** text contrast; state is never
conveyed by colour alone (icons + text labels accompany it).

| State | Feel | Light (bg / accent) | Dark (bg / accent) |
|-------|------|---------------------|--------------------|
| **Fair** | sunny, mild | `#eef4fb` / `#e0a52a` (sun gold) | `#0f1a2a` / `#f0b840` |
| **Cloudy** | muted, diffuse | `#eef0f3` / `#6b7c8f` (slate) | `#161a1f` / `#9aa9b8` |
| **Rainy** | cool, wet | `#e6eef1` / `#1f7a8c` (teal) | `#0c161c` / `#3fa7bd` |
| **Snowy** | pale, soft | `#eef1f6` / `#7c8db5` (cold lavender) | `#141821` / `#aeb9e0` |
| **Too cold** | stark, icy | `#e9f2f6` / `#0d7fa6` (deep cyan) | `#0a1319` / `#35c0e6` (bright ice) |
| **Too hot** | intense, warm | `#fbefe6` / `#cc5423` (hot orange-red) | `#1c1109` / `#f47a3e` |

Each scheme is a full token set (background, surface, ink, muted ink, line,
accent, secondary). Full hex values live in the design tokens (Stage 0);
the table above is the anchor. The state→palette mapping is data, so adding a
new state is a config change.

---

## 6. Accessibility strategy (WCAG 2.1 AA)

Accessibility is a per-stage acceptance criterion, not a final stage.

- **Audio has a full non-audio equivalent** (1.1.1, 1.2.x): the time-aware "what
  you're hearing" panel shows every track/lever and its value across the 12 s,
  and all five values are in the main display.
- **No uncontrolled autoplay** (1.4.2): never auto-starts; prominent, reachable
  restart/pause/stop and volume; audio only plays on user action.
- **Keyboard-operable everything** (2.1.1): map, transport controls, sandbox,
  unit toggle — no keyboard traps (2.1.2).
- **Colour & contrast** (1.4.3, 1.4.11): AA contrast for text and UI in **every**
  state palette, light and dark; never colour alone for weather state.
- **Reduced motion / reduced sound** honoured (`prefers-reduced-motion`,
  mute-first posture).
- **Semantics & live regions** (4.1.2, 4.1.3): ARIA roles, labelled controls,
  polite announcements on weather/location/state change.
- **Responsive & zoomable** (1.4.4, 1.4.10): usable at 400 % zoom / 320 px.
- **Focus visible** (2.4.7) and logical focus order (2.4.3).

**Verification:** automated `axe-core` in component and E2E tests from Stage 1,
plus manual screen-reader + keyboard passes (NVDA/VoiceOver) as release gates.

---

## 7. Staged roadmap

Each stage ends shippable, with its own tests, a11y check, and a preview deploy.

### Stage 0 — Foundation
- Vite + React + TS scaffold, ESLint + Prettier, strict `tsconfig`.
- Vitest + Testing Library, `axe-core` in tests, Playwright skeleton.
- GitHub Actions CI (typecheck, lint, unit, build) + Vercel/Netlify previews.
- Design tokens + the **six state palettes** (light + dark), theming, PWA manifest.
- Define core contracts: **`WeatherTimeline`**, **`MappingConfig`**, `ScorePlan`.

### Stage 1 — MVP: Display + Audio + Sandbox  *(the agreed MVP)*
- **Weather service**: Open-Meteo → normalised `WeatherTimeline` (current +
  12 h hourly for temp, humidity, cloud, precip; today's min/max), caching,
  units.
- **Location**: geolocation + permission handling; fallback city; locale unit
  default + toggle; **no map yet** — a location picker.
- **Data display panel**: all required values, accessible, responsive,
  state-themed.
- **Sonification engine v1**: 3 tracks (percussion/background/foreground),
  global rhythm, the 1:1 default mapping, **12 s + 1 s fade**, forecast-timeline
  playback (1 s = 1 h) with snapshot fallback, polyphonic background.
- **Transport controls**: restart / pause / stop / volume, never auto-start.
- **"What you're hearing" panel**: time-aware visual equivalent + timeline
  scrubber.
- **Sandbox**: author synthetic `WeatherTimeline`s, save/load presets, tweak
  mapping and per-track levers/volume — the experimentation surface.
- Unit tests for normalisation and the pure `ScorePlan` core; a11y checks.
- **Exit:** pick/simulate a location, read all five values, press play, and
  identify the five values (and their 12 h trend) by ear; sandbox enables tuning.

### Stage 2 — The map
- Leaflet + OpenStreetMap centred on location; click/keyboard-select updates
  display + soundscape; accessible interactions + text-list alternative;
  optional cloud/precip overlay tiles if they don't hurt a11y/perf.

### Stage 3 — Weather warnings
- Region-appropriate official alert feeds (e.g. US NWS, EU MeteoAlarm) via a
  serverless proxy where needed; accessible, prioritised display with live
  regions. (Deferred from MVP.)

### Stage 4 — Sonification depth
- Generalise to configurable **N params : N levers** (blends; e.g. a value on
  chord quality).
- **Instrument selection**: default waveform shapes and, where available,
  **MIDI/soundfont** instruments.
- Mapping presets, richer arrangements, more musicality within the
  identifiability constraint; formalised listening-test suite.

### Stage 5 — Hardening & polish
- E2E coverage (Playwright), coverage gates, deeper security scanning (§9).
- Full manual a11y audit (screen reader + keyboard) and fixes.
- Performance budget, PWA offline polish, permission/empty/error states.
- Saved locations & preferences UX; soundscape onboarding/ear-training.

---

## 8. Testing strategy

- **Unit (Vitest):** weather normalisation, unit conversion, the pure
  `WeatherTimeline + MappingConfig → ScorePlan` core, perceptual-separation,
  monotonicity, and hour-*n*→second-*n* timeline assertions.
- **Component (Testing Library + axe-core):** display panel, transport controls,
  "what you're hearing" panel, sandbox, each state palette; a11y per component.
- **E2E (Playwright, from Stage 5; skeleton earlier):** permission-denied path,
  restart/pause/stop/volume, location selection, keyboard-only walkthrough, axe
  scans.
- **Audio testing:** assert the `ScorePlan` (not raw sound) in unit tests;
  smoke-test Tone.js wiring behind a mockable adapter; sandbox for human
  listening validation of identifiability.
- **Accessibility testing:** automated axe in CI + manual NVDA/VoiceOver +
  keyboard-only release gates; contrast check on every state palette × theme.
- **CI gating:** typecheck + lint + unit + build required on every PR from
  Stage 0; E2E and coverage thresholds added in Stage 5.

---

## 9. Security plan

Small threat surface (static SPA, no accounts, public APIs); focus on supply
chain, secrets, and safe client behaviour.

- **No secrets in the client.** Open-Meteo needs no key; any future keyed API
  goes through a serverless proxy with host-side env vars.
- **Dependency & supply-chain:** `npm audit` + Dependabot/Renovate; pinned locks;
  review new deps (Tone.js, Leaflet, any soundfont/MIDI lib).
- **Secret scanning:** GitHub secret scanning / gitleaks in CI.
- **Static analysis:** CodeQL (or equivalent).
- **Runtime hardening:** strict CSP, `Referrer-Policy`, `X-Content-Type-Options`,
  HTTPS-only; treat all weather API text as untrusted (escape on render).
- **Privacy:** geolocation is client-side only, explained on request, degrades
  gracefully on denial; no tracking.
- **Rate-limit resilience:** cache Open-Meteo responses, back off on errors.
- Heavier scanning (SAST/DAST, full dependency review) lands in Stage 5.

---

## 10. Deployment & CI/CD

- **Host:** Vercel or Netlify, Git-connected.
- **Preview deploys** per PR (also the a11y/listening review surface).
- **Production** on merge to `main`.
- **Pipeline:** PR → typecheck, lint, unit, axe, build → preview → review →
  merge → production. Serverless functions (if later needed) deploy alongside.
- PWA over HTTPS with the security headers above.

---

## 11. Risks & open questions

- **Identifiability vs musicality** remains the central risk — now with a *trend*
  to read too. Mitigation: orthogonal levers, the sandbox, listening tests;
  tuned early in Stage 1.
- **Timeline legibility:** can a listener distinguish "warm now, cooling" from
  "cool now, warming" in 12 s? Validate early; a subtle metronomic hour-tick may
  help anchor the timeline.
- **Browser autoplay/audio-context policies:** handled by never-auto-start +
  user-gesture (also the a11y-correct choice).
- **Accessible maps are hard** (Stage 2): budget for keyboard/SR support and a
  text-list alternative.
- **Warnings coverage is fragmented** (Stage 3): start with one or two feeds.
- **Open questions to revisit:**
  - Exact fallback city and default unit rule.
  - **How the six states are *classified*** from the data (thresholds for "too
    cold/hot", precedence when several apply) — deferred, defined before Stage 1
    ships palettes end-to-end.
  - Whether the hour-tick metronome is always on, or a toggle.
  - Default instrument set and whether MIDI/soundfonts land in Stage 1 or 4.

---

## 12. Suggested next step

Start **Stage 0** (scaffold + CI + the three contracts + the six palettes) and
immediately spike the **Stage 1 sonification core + sandbox** — the mapping and
the 12 s/12 h timeline are the highest-risk, highest-value parts, and everything
downstream consumes the `WeatherTimeline` contract.
