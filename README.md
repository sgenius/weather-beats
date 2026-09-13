# Weather Beats

An accessible web app that shows live weather for a location on a map and
turns it into a short, replayable soundscape you can listen to and identify
by ear. See [`PLAN.md`](./PLAN.md) for the product plan and staged roadmap,
and [`coding-standards.md`](./coding-standards.md) for how we work.

> Status: Stage 0 (foundation) - scaffold, lint/format tooling and CI are in
> place. Design tokens, the core data contracts, tests and the weather
> display land in follow-up Stage 0/1 PRs.

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
