# Tillegal Frontend

Frontend app built with React, TypeScript, Vite, Tailwind CSS v4, and shadcn/ui.

## Development

```sh
npm ci
npm run dev
```

## Quality checks

Run the same checks used by GitHub Actions:

```sh
npm run check
```

The check includes formatting, linting, TypeScript, unit tests, and a production
build. You can also run each step separately with `npm run format:check`,
`npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

## shadcn/ui

The project is initialized with the Radix-based shadcn/ui preset and includes
40 components covering forms, tables, navigation, calendars, charts, menus,
dialogs, and feedback. Components live in `src/components/ui`; add more with:

```sh
npx shadcn@latest add <component>
```

The GitHub Actions workflow runs formatting, lint, type, unit-test, and build
checks on pushes and pull requests, then uploads `dist/` as a short-lived
artifact.

For continuous deployment, import this GitHub repository into Vercel. Vercel's
Git integration creates preview deployments for pull requests and deploys
production pushes to `main`. Use `npm run build` as the build command and `dist`
as the output directory. No deployment token is needed in GitHub Actions.

To ensure production only deploys after CI passes, protect `main` in GitHub and
require the `CI / verify` status check before merging.
