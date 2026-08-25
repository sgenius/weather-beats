# Weather Beats — Project Plan

An accessible web app that shows live weather for a location on a map and turns
five of those weather values into a looping soundscape you can *listen to* and
identify by ear.

> Status: planning. This document is the agreed scope and roadmap coming out of
> the requirements interrogation. It is the source of truth for staging; details
> inside a stage will be refined as we build.

---

## 1. Product vision

Three tightly-coupled experiences on one screen:

1. **A weather map** centred on the user's location (or a sensible fallback when
   location permission is denied).
2. **A data display** for the selected location: temperature, local time,
   humidity, today's temperature and humidity min/max, cloud cover,
   precipitation, and (a later stage) locally applicable weather warnings.
3. **A generative soundscape** — a seamless loop synthesised from five live
   values (local time, temperature, humidity, cloud cover, precipitation) such
   that a trained listener can identify all five *from the audio alone*.

The whole product must meet **WCAG 2.1 AA**. Because the signature feature is
audio, accessibility is not a bolt-on: the sound has a fully equivalent visual
representation, and every control is keyboard- and screen-reader-operable.

---

## 2. Decisions locked in (from requirements interrogation)

| Area | Decision |
|------|----------|
| Platform | Web app, installable as a **PWA** |
| Frontend stack | **React + TypeScript + Vite** |
| Map | **Leaflet + OpenStreetMap** (no key, no billing) |
| Weather data | **Open-Meteo** (no key; current + hourly + daily) |
| Audio engine | **Tone.js** over the Web Audio API |
| Sonification model | **Distinct layer per parameter**, configurable *N params : N layers*, **starting 1:1**; identifiability first, musicality a close second |
| Starting mapping | I propose a psychoacoustic default (below); tuned in a sandbox |
| Weather warnings | **Deferred** to a later stage (Open-Meteo has none) |
| Persistence | **Local only** — `localStorage`, no accounts, no backend for user data |
| Units | **Locale-based, user-toggleable** (metric/imperial) |
| Default location | Recognisable fallback city when geolocation is denied/unavailable |
| Audio-for-deaf equivalence | **Live "what you're hearing" visual panel** synced to the layers |
| Autoplay | **Start muted**; user presses play (WCAG 1.4.2) |
| Quality bar | **Pragmatic**: core tests + lint + a11y checks now; E2E, deeper security & coverage gates in a hardening stage |
| Deployment | **Vercel or Netlify** with per-PR preview deploys |
| **MVP shape** | **Display + audio first, map later**, plus a **sandbox** to author test weather configurations and explore the soundscape |

---

## 3. Architecture overview

```
┌──────────────────────────────────────────────────────────────┐
│  React + TypeScript (Vite) PWA                                 │
│                                                                │
│  ┌─────────────┐   ┌──────────────┐   ┌────────────────────┐  │
│  │ Location     │   │ Weather      │   │ Sonification        │  │
│  │ service      │──▶│ service      │──▶│ engine (Tone.js)    │  │
│  │ (geo + fall- │   │ (Open-Meteo, │   │  - mapping config   │  │
│  │  back + IP?) │   │  cache, SWR) │   │  - 5 layers         │  │
│  └─────────────┘   └──────┬───────┘   │  - transport/loop   │  │
│                           │           └─────────┬──────────┘  │
│         normalised WeatherSnapshot              │             │
│                           │                     │             │
│         ┌─────────────────┼─────────────────────┼──────────┐  │
│         ▼                 ▼                     ▼          │  │
│   ┌──────────┐     ┌─────────────┐      ┌──────────────┐   │  │
│   │ Map view │     │ Data display │      │ "What you're │   │  │
│   │ (Leaflet)│     │  panel       │      │  hearing"    │   │  │
│   └──────────┘     └─────────────┘      │  visual panel │   │  │
│                                          └──────────────┘   │  │
│         Sandbox mode: inject synthetic WeatherSnapshot ─────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Key design points

- **`WeatherSnapshot` is the one contract.** A normalised, unit-agnostic object
  produced by the weather service (or by the sandbox). Everything downstream —
  display, sonification, visual "hearing" panel — consumes only this. This is
  what lets the sandbox feed synthetic weather to the exact same audio path.
- **Sonification is a pure, testable core.** `WeatherSnapshot + MappingConfig →
  SoundscapeState` is deterministic and unit-tested independently of Tone.js.
  Tone.js is the *renderer* of `SoundscapeState`, kept behind a thin adapter so
  the mapping logic never touches audio hardware in tests.
- **No backend for user data.** Preferences, saved locations, unit choice, and
  the active mapping config live in `localStorage`. If a keyed API is ever
  introduced (e.g. warnings), a serverless proxy (Vercel/Netlify functions)
  hides the key — never the client.
- **Offline-friendly PWA.** Service worker caches the app shell and last-known
  snapshot so the display/soundscape degrade gracefully offline.

---

## 4. Sonification design (the heart of the product)

### 4.1 Requirement restated

A listener, hearing only the loop, must be able to identify: **local time,
temperature, humidity, cloud cover, precipitation.** So each must map to a
*perceptually separable* dimension of sound. Identifiability is the hard
constraint; musicality is optimised within it.

### 4.2 Proposed default 1:1 mapping (starting point, tunable in sandbox)

Five orthogonal perceptual channels so no two values fight for the same cue:

| # | Weather value | Sonic dimension | Direction / feel | Why it's identifiable |
|---|---------------|-----------------|------------------|------------------------|
| 1 | **Temperature** | **Pitch / register** of the pad drone | cold → low, hot → high | Pitch is the most legible scalar cue humans have |
| 2 | **Humidity** | **Reverb wetness / decay** (spatial "damp") | dry → tight/dry, humid → long wet tail | "Wet" reverb is a natural metaphor for damp air; spatial, not spectral |
| 3 | **Cloud cover** | **Spectral brightness** (low-pass cutoff / harmonics) | clear → bright & shimmering, overcast → dark & dull | Brightness is a distinct axis from reverb; "the sun going behind clouds" |
| 4 | **Precipitation** | **Rhythmic droplet density** (discrete events) | none → silent, heavy → fast dense droplets | Rhythm/event-rate is orthogonal to all the sustained/timbral cues |
| 5 | **Local time of day** | **Musical key/mode + tempo** | night → minor/slow, day → major/brighter, dawn/dusk → transitional | Harmony + tempo frames the whole loop; a slow "clock" pulse can anchor it |

Channels chosen so the five live on independent axes: **pitch, rhythm,
spectral timbre, spatial timbre, harmony/tempo.** That orthogonality is what
makes simultaneous identification possible.

### 4.3 Mapping mechanics

- **`MappingConfig`** is data: for each weather parameter, the target sonic
  dimension, the input range (e.g. −20…45 °C), the output range, and a scaling
  curve (linear / log / stepped). This is what makes the mapping *configurable*
  and later *N:N* (one value driving several layers, or several values blended
  into one) without code changes.
- **Calibration matters more than prettiness.** Ranges are clamped and quantised
  so that, e.g., temperature maps to a discernible musical interval set rather
  than continuous microtonal drift — humans identify *steps* far better than
  absolute continuous values. Precip density snaps to a few clear tiers.
- **Seamless loop.** Fixed loop length on Tone.Transport; all layers are
  loop-synchronised so there is no seam.
- **Legend / ear-training.** An on-screen legend explains each mapping, plus an
  optional "solo a layer" control so users can learn each cue in isolation —
  this doubles as the accessibility equivalent and as the identifiability
  self-test.

### 4.4 Validating identifiability (this is a real test, not a vibe)

- **Sandbox-driven listening tests:** author known configurations (e.g. "hot,
  dry, clear, no rain, midnight") and confirm listeners can read them back.
- **Automated bounds tests:** assert the mapping produces monotonic, in-range,
  well-separated `SoundscapeState` values across each parameter's domain.
- **Discrimination heuristic:** unit tests assert minimum perceptual separation
  between adjacent tiers (e.g. two precip levels never collapse to the same
  event rate).

---

## 5. Accessibility strategy (WCAG 2.1 AA)

Accessibility is a per-stage acceptance criterion, not a final stage.

- **Audio has a full non-audio equivalent** (WCAG 1.1.1, 1.2.x): the live "what
  you're hearing" panel shows every layer and its current value in text +
  visuals, and all five values are already in the main display.
- **No uncontrolled autoplay** (1.4.2): start muted; prominent, reachable
  play/pause and volume; audio never exceeds 3s without a user action.
- **Keyboard-operable everything** (2.1.1): map pan/zoom/marker selection, all
  audio controls, unit toggle, sandbox — no keyboard traps (2.1.2).
- **Colour & contrast** (1.4.3, 1.4.11): AA contrast for text and UI
  components; never rely on colour alone to convey weather state.
- **Reduced motion / reduced sound** honoured (`prefers-reduced-motion`; an
  explicit reduce-motion and mute-first posture).
- **Semantics & live regions** (4.1.2, 4.1.3): ARIA roles, labelled controls,
  polite live-region announcements for weather/location changes.
- **Responsive & zoomable** (1.4.4, 1.4.10): usable at 400% zoom / 320px.
- **Focus visible** (2.4.7) and logical focus order (2.4.3).

**Verification:** automated `axe-core` in component and E2E tests from Stage 1,
plus a manual screen-reader + keyboard pass (NVDA/VoiceOver) as release gates.

---

## 6. Staged roadmap

Each stage ends shippable, with its own tests, a11y check, and a preview deploy.

### Stage 0 — Foundation (scaffold & guardrails)
- Vite + React + TS project, ESLint + Prettier, strict `tsconfig`.
- Vitest + Testing Library, `axe-core` wired into tests, Playwright skeleton.
- GitHub Actions CI: typecheck, lint, unit tests, build on every PR.
- Vercel/Netlify connected with per-PR preview deploys.
- Design tokens, theming (light/dark, high-contrast), base layout, PWA manifest.
- Define the `WeatherSnapshot` and `MappingConfig` types (the core contracts).

### Stage 1 — MVP: Display + Audio + Sandbox  *(the agreed MVP)*
- **Weather service**: Open-Meteo integration → normalised `WeatherSnapshot`
  (current temp, local time, humidity, cloud cover, precipitation, today's
  temp & humidity min/max), with caching and unit conversion.
- **Location**: geolocation with permission handling; recognisable fallback
  city; locale-based unit default + manual toggle; **no map yet** — a
  location picker (search / preset list).
- **Data display panel**: all required values, accessible, responsive.
- **Sonification engine v1**: the 5-layer, 1:1 default mapping over Tone.js,
  seamless loop, start-muted play/pause/volume, "solo a layer", legend.
- **"What you're hearing" panel**: live visual equivalent of the audio.
- **Sandbox mode**: author synthetic weather configurations, save/load presets,
  drive the exact same audio + panels — the experimentation surface for tuning
  the mapping.
- Unit tests for weather normalisation and the pure sonification core; a11y
  checks on all new UI.
- **Exit criteria:** a person can pick/simulate a location, read all five values,
  press play, and identify the five values by ear; sandbox lets us iterate on
  the mapping.

### Stage 2 — The map
- Leaflet + OpenStreetMap, centred on current/fallback location.
- Click / keyboard-select a location on the map → updates display + soundscape.
- Accessible map interactions (keyboard pan/zoom, marker focus, text alternative
  list of selectable points).
- Optional weather overlay tiles (cloud/precip) if they don't hurt a11y or perf.

### Stage 3 — Weather warnings
- Regionally-appropriate official alert sources (e.g. US NWS, EU MeteoAlarm)
  selected by the location's region; serverless proxy for any that need it.
- Accessible, prioritised warning display with live-region announcements.
- (Deliberately deferred from MVP.)

### Stage 4 — Sonification depth (N:N & musicality)
- Generalise mapping to configurable **N params : N layers** (blends, one value
  driving multiple layers).
- Mapping presets, richer instruments, refined musicality within the
  identifiability constraint; formalised listening-test suite.

### Stage 5 — Hardening & polish
- E2E coverage (Playwright), coverage gates, deeper security scanning (see §8).
- Full manual a11y audit (screen reader + keyboard) and fixes.
- Performance budget, PWA offline polish, error/empty/permission-denied states.
- Saved locations & preferences UX; onboarding/ear-training for the soundscape.

---

## 7. Testing strategy

- **Unit (Vitest):** weather normalisation, unit conversion, the pure
  sonification mapping (`WeatherSnapshot + MappingConfig → SoundscapeState`),
  perceptual-separation and monotonicity assertions.
- **Component (Testing Library + axe-core):** display panel, audio controls,
  "what you're hearing" panel, sandbox; a11y assertions per component.
- **E2E (Playwright, from Stage 5, skeleton earlier):** permission-denied path,
  play/mute, location selection, keyboard-only walkthrough, axe scans on pages.
- **Audio testing:** assert `SoundscapeState` (not raw sound) in unit tests;
  smoke-test Tone.js wiring behind a mockable adapter; sandbox for human
  listening validation of identifiability.
- **Accessibility testing:** automated axe in CI + manual NVDA/VoiceOver +
  keyboard-only release gates.
- **CI gating:** typecheck + lint + unit + build required on every PR from
  Stage 0; E2E and coverage thresholds added in Stage 5.

---

## 8. Security plan

Threat surface is small (static SPA, no accounts, public weather APIs), so the
focus is supply chain, secrets, and safe client behaviour.

- **No secrets in the client.** Open-Meteo needs no key. Any future keyed API
  (warnings) goes through a serverless proxy; secrets live in host env vars.
- **Dependency & supply-chain:** `npm audit` + Dependabot/Renovate; pin/lock
  deps; review new deps (Tone.js, Leaflet, map/weather libs).
- **Secret scanning:** GitHub secret scanning / gitleaks in CI.
- **Static analysis:** CodeQL (or equivalent) on the repo.
- **Runtime hardening:** strict Content-Security-Policy, `Referrer-Policy`,
  `X-Content-Type-Options`, HTTPS-only; sanitise/escape any weather text
  rendered (treat API strings as untrusted).
- **Privacy:** geolocation used only client-side; explain why it's requested;
  degrade gracefully on denial; no tracking; document data handling.
- **Rate-limit resilience:** cache Open-Meteo responses, back off on errors.
- Heavier scanning (SAST/DAST, full dependency review) lands in Stage 5 per the
  "harden later" quality bar.

---

## 9. Deployment & CI/CD

- **Host:** Vercel or Netlify, Git-connected.
- **Preview deploys** for every PR (also the surface for a11y/listening review).
- **Production** on merge to `main`.
- **Pipeline:** PR → typecheck, lint, unit tests, axe, build → preview deploy →
  review → merge → production deploy. Serverless functions (if needed later)
  deployed alongside.
- PWA served over HTTPS with the security headers above.

---

## 10. Risks & open questions

- **Identifiability vs musicality** is the central risk. Mitigation: the sandbox
  + listening tests + orthogonal channel design; we tune early in Stage 1.
- **Browser autoplay/audio-context policies:** handled by start-muted +
  user-gesture-to-start (also the a11y-correct choice).
- **Accessible maps are hard** (Stage 2): budget time for keyboard/SR support
  and a text-list alternative to map interaction.
- **Warnings coverage is fragmented** across regions (Stage 3): start with one
  or two authoritative feeds, expand.
- **Open questions to revisit:** exact fallback city & default unit rule;
  loop length and whether time-of-day also drives an audible "clock"; whether to
  add approximate IP-based location when geolocation is denied.

---

## 11. Suggested next step

Start **Stage 0** (scaffold + CI + contracts) and immediately spike the
**Stage 1 sonification core + sandbox**, since the mapping is the highest-risk,
highest-value part and everything else consumes its `WeatherSnapshot` contract.
