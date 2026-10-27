# TTRPG Dice Roll Probabilities

A dice roll probability calculator and visualizer. Build a roll or sequence
of rolls (checks, attacks, damage, saves, and combinators like advantage/
disadvantage), see the resulting outcome distribution as a chart, and
compare the odds of several rolls side by side.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

## Scripts

- `npm run dev` – start the Next.js dev server
- `npm run build` – production build
- `npm run typecheck` – `tsc --noEmit`
- `npm run lint` – ESLint
- `npm run format` / `npm run format:check` – Prettier

## Stack

Next.js (App Router) + React + TypeScript, [react-aria-components](https://react-spectrum.adobe.com/react-aria/)
for accessible UI primitives, and [Recharts](https://recharts.org/) for the
distribution charts.

## Project structure

- `src/app` – pages and top-level app wiring
- `src/components` – UI components (`core/` for generic primitives,
  `icons/` for icon components, `dataVis/` for chart components)
- `src/lib` – roll/outcome domain logic (dice, roll types, combining
  outcome distributions)
