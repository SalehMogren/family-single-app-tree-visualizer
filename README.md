# شجرة العائلة · Family Tree

An Arabic-first (RTL) family tree platform, split into a **public site** for the family and an
**admin app** for editors. Built as a pnpm + Turborepo monorepo with Next.js 16, React 19,
Tailwind CSS v4 and shadcn/ui.

```
apps/
  web/      Public site: home, interactive tree, member directory & profiles, timeline   → :3000
  admin/    Admin app: tree editor, members table, content, settings, import/backups    → :3001
packages/
  core/     Pure domain logic: types (zod), relationships, validation, layout, search,
            data-health checks, privacy filter, legacy migration, GEDCOM export (+ tests)
  data/     Server-only JSON file repository: revisions, backups, activity log (+ tests)
  tree/     <FamilyTreeView/>: SVG renderer with d3-zoom, culling, LOD, minimap, export
  ui/       shadcn/ui components (new-york, Tailwind v4 tokens, RTL-aware), theme
  i18n/     Typed Arabic/English dictionaries and formatting helpers
e2e/        Playwright tests that run both apps against a throwaway data directory
legacy/     The original single app, kept for reference only (not built)
```

## Quick start

```bash
corepack enable            # provides the pinned pnpm version
pnpm install
cp .env.example .env       # optional in development
pnpm dev                   # web on http://localhost:3000, admin on http://localhost:3001
```

In development the admin password is `admin` when `ADMIN_PASSWORD` is not set. In production
both `ADMIN_PASSWORD` and `ADMIN_SECRET` (≥16 chars) are required; the admin app refuses to
run without them.

| Command          | What it does                                  |
| ---------------- | --------------------------------------------- |
| `pnpm dev`       | Run both apps (`dev:web` / `dev:admin` for one) |
| `pnpm build`     | Production build of both apps                  |
| `pnpm lint`      | ESLint (Next.js + React hooks rules)           |
| `pnpm typecheck` | TypeScript across the workspace                |
| `pnpm test`      | Vitest unit tests (core + data)                |
| `pnpm e2e`       | Playwright end-to-end tests (build first)      |

## Data

Both apps read the same JSON store in `DATA_DIR` (default `<repo>/data`, git-ignored). On first
run it is seeded from `packages/data/seed/` with a sample 5-generation family.

- `family.json` – members + relationships (`parent`, `spouse`; siblings are derived).
- `site.json` – family story (ar/en), timeline, feature toggles, tree display, privacy.
- `backups/` – automatic snapshot before every save (last 30), restorable from the admin app.
- `activity.jsonl` – audit log of every change.

Saves use optimistic concurrency (`revision`): if two editors save at once, the second one
gets a conflict prompt instead of silently overwriting. The repository lives behind a small
interface in `packages/data`, so swapping to a database (e.g. Postgres/Supabase) only touches
that package. Note that serverless hosts with a read-only filesystem need such a swap, or a
persistent volume for `DATA_DIR`.

## Features

**Public site (`apps/web`)**
- Interactive tree: pan/zoom (mouse, touch, keyboard), expand/collapse branches, top-down or
  bottom-up ("roots") layout, spouses and multiple marriages, cousin marriages, minimap.
- Search palette (`/` or `Ctrl+K`) with Arabic-normalised matching over names *and* lineage
  ("محمد بن عبدالله"), deep links (`/tree?focus=<id>`), lineage highlighting.
- Member directory with filters, profile pages with full نسب, relatives and related events.
- Timeline, family story, statistics; export PNG / SVG / JSON / GEDCOM (toggleable).
- Arabic/English with full RTL/LTR, light/dark theme, accessible (skip link, roles, focus).
- Privacy settings are enforced on the server: hidden details never reach the browser.

**Admin app (`apps/admin`)**
- Password login (signed, http-only session cookie, rate-limited), every action re-checks auth.
- Tree editor: select a person, edit details, add parent/child/spouse/sibling (new or existing
  person) with live validation, unlink relationships, set tree root, delete with impact preview
  and optional cascade. Undo/redo (50 levels), autosave, `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+S`.
- Members table with search, filters, sorting and pagination.
- Data-health dashboard: disconnected people, impossible ages, duplicate suspects, missing
  parents — with one-click fixes where safe.
- Content editor (bilingual story + timeline), site settings, import (incl. legacy format),
  export, backups/restore, activity log.

**Validation rules** (in `packages/core/src/validation.ts`): max two parents (one of each
gender), no cycles, parent older than child (warning under 13 years), no marrying lineal
relatives or siblings, overlapping lifespans, duplicate detection.

## Performance notes

- Layout is a pure function (`layoutFamilyTree`) memoised per data/options change.
- Pan/zoom updates the SVG transform directly; React re-renders only when the (quantised)
  visible viewport or level of detail changes. Off-screen cards are culled.
- All links are drawn as three `<path>` elements regardless of tree size.
- Cards are plain SVG (no `foreignObject`) for iOS correctness and faithful exports.
- Adjacency indexes are cached per immutable dataset.
