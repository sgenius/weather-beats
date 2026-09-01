# Coding Standards

Process and style rules for weather-beats, to be read alongside `PLAN.md`
(product/architecture) and applied from the first commit of the Stage 0
scaffold onward.

---

## 1. Review process

Every PR is reviewed by hand before it merges. No auto-merge. The rules below
exist to keep PRs small and legible enough that a careful human review is
actually feasible on every change.

---

## 2. SOLID

Every non-trivial change should hold up against the five SOLID principles.
This is judged by the reviewer, not by tooling — SOLID violations are a design
call, not something a linter can reliably catch.

- **Single Responsibility** — a module/class/function has one reason to
  change. In this codebase: the Location service, Weather service, and
  Sonification engine (`PLAN.md` §3) are separate for this reason — each owns
  one concern and can change independently.
- **Open/Closed** — prefer extending behavior (new state, new lever, new
  mapping) over editing existing logic in place. The state→palette mapping and
  the `MappingConfig` are designed as data/config specifically so new states
  or mappings are additions, not rewrites.
- **Liskov Substitution** — an implementation of an interface must be
  substitutable for it without surprising callers. Any alternate renderer
  behind the audio adapter (or a mock used in tests) must honor the same
  contract Tone.js does.
- **Interface Segregation** — depend only on what you use. Prefer small,
  focused contracts (like `WeatherTimeline`) over one wide interface that
  forces consumers to know about fields they don't need.
- **Dependency Inversion** — depend on abstractions, not concretions. The
  `WeatherTimeline + MappingConfig → ScorePlan` core is deterministic and
  Tone.js-free; Tone.js sits behind a thin adapter so the sonification logic
  never touches audio hardware directly and stays unit-testable.

**Review checklist:**
- [ ] Does this change belong in the module it's in, or does it leak a second
      responsibility into an existing file?
- [ ] Could this have been added without editing unrelated existing logic?
- [ ] Do new abstractions depend on interfaces, not concrete implementations
      (especially across the pure-core/Tone.js boundary)?
- [ ] Is any interface/props object doing double duty for two unrelated
      callers?

---

## 3. File & function size

Short files and short functions are what make hand review sustainable.
Starting guidelines (not hard lint rules — tune as the codebase grows):

- Functions: aim for **~40 lines or fewer**. A longer function is usually
  doing more than one thing — split it.
- Files: aim for **~200–300 lines**. A file creeping past that is a signal to
  split by responsibility (see SOLID §2 above), not to keep appending.

These are defaults, not dogma — flag in review if a file/function is long for
a good reason (e.g. a table-driven mapping), but treat length as a smell
worth questioning by default.

---

## 4. PR size

- **Soft guideline: 250 changed lines** (added + deleted, excluding lockfiles
  and other generated files). Enforced by eye in review — if a PR is
  approaching this, consider whether it can be split.
- **Hard cap: 400 changed lines**, enforced by CI
  (`.github/workflows/pr-size.yml`). A PR over this fails the check and must
  be split before merge.
- **Coding agents** (e.g. Claude) authoring changes in this repo should treat
  the 250-line guideline as the trigger to act: if a change would exceed it,
  proactively break the work into two or more smaller, independently
  reviewable PRs rather than pushing one large PR up toward the 400-line hard
  cap.

---

## 5. TypeScript style guide

Airbnb does not publish an official TypeScript style guide — only a
JavaScript one (`airbnb/javascript`). The commonly used TS adapter,
`eslint-config-airbnb-typescript`, is a third-party bridge package (not
maintained by Airbnb) built on the older `.eslintrc` config format.

Decision: use **`typescript-eslint`'s own `recommended` + `stylistic`
configs**, paired with **Prettier** for formatting. These are maintained by
the TypeScript tooling team itself, support the modern flat-config format, and
fit a fresh 2026 Vite/TS project without depending on an unofficial bridge.

This is documented here as policy ahead of code existing; the actual
`eslint.config.js` / `.prettierrc` are wired in during the Stage 0 scaffold
(`PLAN.md` §7, Stage 0: "ESLint + Prettier, strict `tsconfig`"), with lint
required in CI on every PR (`PLAN.md` §7 Stage 0, §10).

---

## 6. Commits & PRs

- Commit messages are descriptive and explain *why*, not just *what*.
- One logical change per PR — this is what makes the 250/400-line caps
  realistic rather than arbitrary.
