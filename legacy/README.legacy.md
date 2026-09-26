# Legacy single-app (reference only)

This folder contains the original single Next.js 14 app, kept **only as a reference**
for requirements while the project moved to the monorepo in `apps/` + `packages/`.

- It is not part of the pnpm workspace and is not built, linted or deployed.
- Its data format (`public/data/family-data.json`) can still be imported through
  **Admin → Data & backups → Import** — it is migrated and cleaned automatically.
- Safe to delete once the new apps are accepted; it also remains in git history
  (last commit before the rewrite: `9ee216c`).
