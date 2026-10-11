# Weather Beats

An accessible web app that shows live weather for a location on a map and
turns it into a short, replayable soundscape you can listen to and identify
by ear. See [`PLAN.md`](./PLAN.md) for the product plan and staged roadmap,
and [`coding-standards.md`](./coding-standards.md) for how we work.

> Status: Stage 1 (MVP) in progress - steps 1-7 of 10 are merged: data
> display, location + units, live weather, the sonification core (both
> playback modes), the Tone.js audio renderer, and full transport controls
> (mode toggle, restart/pause/stop/volume). Press Play in the running app to
> hear it. Remaining: the "what you're hearing" panel, the full sandbox, and
> polish/exit-criteria. See the [tracking issue](https://github.com/sgenius/weather-beats/issues/14)
> for the current PR-by-PR checklist.

## Getting started

```sh
npm install
npm run dev
```

## Scripts

| Script                | Purpose                           |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start the Vite dev server          |
| `npm run build`        | Typecheck and build for production |
| `npm run preview`      | Preview the production build locally |
| `npm run typecheck`    | Typecheck without emitting         |
| `npm run lint`         | ESLint                             |
| `npm run format`       | Prettier - write                   |
| `npm run format:check` | Prettier - check                   |

## Deployment

Intended for Vercel or Netlify with per-PR preview deploys (PLAN.md §10);
connect the repository in the chosen host's dashboard to enable that -
nothing in this repo needs to change to add it.
