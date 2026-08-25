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
>
> **Rev 3 (review 2):** two user-selectable sound modes — a **6 s "now"** piece
> (default) and the **12 s "next 12 h"** forecast piece; concrete
> **state-classification thresholds** (≤ 10 °C too cold, ≥ 32 °C too hot, with
> precipitation states taking precedence); and a **centre crosshair** on the map
> whose position is the active location, with debounced data fetches so you can
> *explore the map by sound* (Stage 2). MIDI/soundfonts confirmed for Stage 4.

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
   audio alone*. The user chooses between a **6-second "now"** piece (default,
   the current conditions) and a **12-second "next 12 h"** piece that plays the
   forecast as a timeline — **1 second of sound = 1 hour ahead** — available when
   a 12-hour forecast exists.

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
| **Sound modes** | **Now** = **6 s** current weather (default) · **Next 12 h** = **12 s** forecast timeline (when available); both **+ 1 s fade**, finite and replayable — **not** endless |
| **Forecast timeline** | In *Next 12 h* mode the 12 s **are** the next 12 h (**1 s = 1 h**); if no forecast, only *Now* mode is offered |
| **Map interaction** | Centre **crosshair** = active location; panning updates it with a debounced refetch — "explore the map by sound" (Stage 2) |
| **Playback controls** | **(Re)start, pause, stop, master volume** (+ per-track volume in the sandbox) |
| **Polyphony** | **Chords allowed** — polyphonic tracks widen the information bandwidth |
| **Arrangement** | **≥ 3 tracks**: percussion · background (long/opaque notes) · foreground (short/sharp notes) |
| **Global rhythm** | Tempo/rhythm is **shared by all tracks** so musicality never breaks |
| Sonification model | Data → **sound levers**; configurable *N params : N levers*, **starting 1:1** |
| Starting mapping | Proposed psychoacoustic default (below); tuned in a sandbox |
| **Colour** | **Per-weather-state palettes** (fair, cloudy, rainy, snowy, too cold, too hot), each with **light + dark** schemes |
| Persistence | **Local only** — `localStorage`, no accounts, no backend for user data |
| Units | Default **°F**, toggleable to **°C**; the choice is saved to `localStorage` |
| Default location | **Oakland, California** when geolocation is denied/unavailable |
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

- Two **user-selectable, finite** pieces, each **+ 1 s fade-out** and replayable
  — never an endless loop:
  - **Now** *(default)* — a **6 s** piece expressing the **current** weather.
  - **Next 12 h** — a **12 s** piece that plays the **forecast as a timeline**,
    **1 s = 1 h**, so the listener hears the *trajectory* (rising temp, an
    approaching rain band, clearing skies). Offered only when a 12-hour hourly
    forecast is available; otherwise only *Now* is shown.
- **Identifiability** covers the current values in *Now* mode, and additionally
  their **trend** over the next 12 hours in *Next 12 h* mode.
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

- A **mode toggle** picks the piece: **Now** (6 s, default) or **Next 12 h**
  (12 s); each plays once **+ 1 s fade**, then stops (replayable).
- Controls: **(Re)start · Pause · Stop · Master volume**; per-track volume and
  instrument/lever overrides live in the sandbox.
- **Never auto-starts** — requires a user gesture (also satisfies WCAG 1.4.2 and
  browser autoplay policies). All controls keyboard-operable and labelled.
- A **progress scrubber** shows elapsed time; in *Next 12 h* mode it carries hour
  ticks and is the temporal spine of the "what you're hearing" panel.
- An **hour-tick metronome** (a soft per-second click marking each forecast hour)
  is available as a **toggle** to help anchor the *Next 12 h* timeline; off by
  default is fine, the preference is remembered.

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

### 5.1 State classification (first match wins)

Precipitation states take precedence; the temperature extremes beat only the
non-precipitation states (fair/cloudy). Evaluated against the **current**
conditions at the active location (the palette reflects "now", independent of
which sound mode is playing):

1. **Precipitation present** → **Snowy** if it's falling as snow, else **Rainy**.
   *(Snow is determined by precipitation type only — never by temperature.)*
2. Else **temperature ≤ 10 °C** → **Too cold**.
3. Else **temperature ≥ 32 °C** → **Too hot**.
4. Else **cloud cover ≥ 60 %** → **Cloudy**.  *(threshold tunable)*
5. Else → **Fair**.

Thresholds are config, so states are easy to add or retune. `≤`/`≥` boundaries
match the agreed 10 °C / 32 °C cut-offs.

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
  global rhythm, the 1:1 default mapping, both **Now (6 s)** and **Next 12 h
  (12 s, 1 s = 1 h)** modes each **+ 1 s fade**, polyphonic background.
- **Transport controls**: mode toggle + restart / pause / stop / volume, never
  auto-start.
- **State classification + palettes**: apply the §5.1 rules to theme the UI.
- **"What you're hearing" panel**: time-aware visual equivalent + timeline
  scrubber.
- **Sandbox**: author synthetic `WeatherTimeline`s, save/load presets, tweak
  mapping and per-track levers/volume — the experimentation surface.
- Unit tests for normalisation and the pure `ScorePlan` core; a11y checks.
- **Exit:** pick/simulate a location, read all five values, press play, and
  identify the five values (and their 12 h trend) by ear; sandbox enables tuning.

### Stage 2 — The map
- Leaflet + OpenStreetMap centred on location, with a fixed **centre crosshair**
  marking the active location.
- **Panning updates the active location** (the point under the crosshair); new
  weather is fetched after a **reasonable debounce** (≈ 400–600 ms after panning
  settles) — this is the "**explore the map by sound**" interaction.
- **On pan-settle the soundscape auto-plays** a short preview of the new
  location — **2.5 s + 0.5 s fade-out** — so exploration is fluid. It **respects
  a global mute** (never plays while muted) and honours reduced-sound settings;
  the full Now/Next-12 h pieces stay user-triggered.
- Debounce + response caching + back-off protect Open-Meteo from pan spam.
- Accessible: keyboard pan also moves the crosshair and refetches; the active
  location and state change are announced via live regions; a text/search
  location entry remains as a non-map alternative.
- Optional cloud/precip overlay tiles if they don't hurt a11y/perf.

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
- **Map-by-sound legibility** (Stage 2): the 2.5 s + 0.5 s pan-settle preview must
  not feel jarring during rapid panning; tune the debounce so previews chain
  smoothly rather than stutter.
- **Resolved:** too cold ≤ 10 °C; too hot ≥ 32 °C; precipitation states take
  precedence; snow is precipitation-type only (never temperature); MIDI/soundfonts
  in Stage 4; default unit **°F** (toggle to °C, saved to `localStorage`);
  fallback location **Oakland, California**; pan-settle **auto-plays a 2.5 s +
  0.5 s preview, respecting global mute**; the hour-tick metronome is a **toggle**.
- **Open questions to revisit:**
  - Cloud-cover threshold for Fair vs Cloudy (proposed ≥ 60 %).

---

## 12. Suggested next step

Start **Stage 0** (scaffold + CI + the three contracts + the six palettes) and
immediately spike the **Stage 1 sonification core + sandbox** — the mapping and
the 12 s/12 h timeline are the highest-risk, highest-value parts, and everything
downstream consumes the `WeatherTimeline` contract.
