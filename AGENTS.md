<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Component styling convention

Every component in `src/components/` is self-contained: it must not import a
`.module.scss` file that lives outside `src/components/` (e.g. don't reach
into `src/app/page.module.scss`). Instead, give the component its own
`ComponentName.module.scss` colocated next to `ComponentName.tsx` and put only
the styles that component needs there.

This holds even when the result duplicates a rule that also exists in an
`src/app/*.module.scss` file (for example, both `page.module.scss`'s
`.addRoll` and a component's own button style can describe the same look).
Prefer that duplication over a cross-directory import — it keeps each
component in `src/components/` movable and reviewable on its own, without a
hidden dependency on `src/app`'s stylesheets.

`src/app/*.tsx` files (page-level components) are not held to this rule; they
may keep using their colocated `page.module.scss`-style files as before.

# Checks

ensure that code typechecks, lints, and is properly formatted before committing.
