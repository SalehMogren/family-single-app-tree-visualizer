# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Commands

- `pnpm install` — install (pnpm workspace; use `corepack enable` for the pinned version)
- `pnpm dev` — web (:3000) + admin (:3001); `pnpm dev:web` / `pnpm dev:admin` for one
- `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` — run via Turborepo
- `pnpm e2e` — Playwright (needs `pnpm build` first)
- Run a single package: `pnpm --filter @family/core test`

## Architecture

pnpm + Turborepo monorepo. Packages are consumed as TypeScript source
(`transpilePackages` in each app's `next.config.ts`).

- `packages/core` — **all domain logic, pure and framework-free**: zod schemas/types,
  graph queries (`getParentIds`, `getLineage`, …), validation, immutable mutations
  (`addRelative`, `linkParent`, `removeMember` …), tree layout (`layoutFamilyTree`, d3-hierarchy),
  search (Arabic normalisation), stats, health checks, privacy filter, legacy import, GEDCOM.
  Add behaviour here first and cover it with Vitest (`packages/core/test`).
- `packages/data` — server-only file store (`DATA_DIR`), revisions, backups, activity log.
- `packages/tree` — client React tree renderer + `useTreeState`, search palette, controls.
- `packages/ui` — shadcn/ui components (new-york v4, `radix-ui` package). They are **generated**
  by `pnpm --filter @family/ui sync:shadcn` from the official shadcn/ui GitHub source (pinned ref),
  with an automatic RTL transform (left→start, pl→ps, …) and small local patches defined in
  `packages/ui/scripts/sync-shadcn.mjs`. Don't hand-edit synced files: add a patch there, add the
  component name to `COMPONENTS` to pull a new one, or bump `SHADCN_REF` to upgrade.
  `check:shadcn` (run in CI) fails if files drift. App-specific components (theme/locale toggles,
  empty state) are hand-written alongside them.
- `packages/i18n` — `ar` is the source dictionary; `en` must satisfy the same `Dictionary` type.
- `apps/web` — public, mostly Server Components; reads data via `getPublicFamily()` which
  applies privacy rules server-side.
- `apps/admin` — auth via `src/proxy.ts` (Next 16 "proxy", formerly middleware) + `requireSession()`
  in every server action. Family edits go through the zustand store in
  `src/lib/family-store.tsx` (`apply` → history → debounced `saveFamilyAction`). Use the
  `useMutate()` hook so validation errors become translated toasts.
- `legacy/` — the old single app, reference only; not part of the workspace.

## Data model

- `members: Record<id, Member>` — one record per person; `name` is the given name, the full
  name (نسب) is derived from the father chain via `getLineage` / `formatLineage`.
- `relationships: { type: "parent" | "spouse", fromId, toId }[]` — for `parent`, `fromId` is the
  parent. Siblings are derived from shared parents, never stored.
- Datasets are immutable; the adjacency index is cached per object in a `WeakMap`, so always
  return new objects from mutations.

## Conventions

- Tailwind classes only; use logical properties (`ms-`, `pe-`, `start-`, `end-`) for RTL.
- UI strings come from `@family/i18n` — never hard-code text in components.
- Const arrow functions, early returns, `handle*` event handler names, accessible markup.
- Next 16: `params`/`searchParams`/`cookies()` are async.
