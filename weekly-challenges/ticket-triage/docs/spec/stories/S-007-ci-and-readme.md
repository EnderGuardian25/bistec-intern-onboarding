# S-007 — GitHub Actions CI Pipeline and README

**Status:** Ready  
**Linked task:** T7 in speckit.yaml  
**Acceptance criteria from:** NFR-4, NFR-5

## Story

As a **developer**,  
I want a CI pipeline that automatically validates every PR,  
So that broken code can never be merged to main.

## Acceptance Criteria

**Given** a pull request is opened against `main`,  
**When** CI runs,  
**Then** the following checks execute in order: install → migrate → lint → typecheck → test → build.

**Given** the CI pipeline,  
**When** it completes successfully,  
**Then** the total run time is under 3 minutes (NFR-5).

**Given** the CI workflow,  
**When** it installs dependencies,  
**Then** it uses `pnpm install --frozen-lockfile` and caches the pnpm store and `.next/cache`.

**Given** the README,  
**When** a new developer reads it,  
**Then** they can get the project running locally in under 10 minutes using only the commands listed.

**Given** the README,  
**When** a developer wants to regenerate the scaffold,  
**Then** it includes the exact Claude Code command to do so.

## Notes

- CI must use `pnpm/action-setup@v4` and `actions/setup-node@v4` with Node 20
- `DATABASE_URL` must be set as an env var in CI steps that need it (`file:./ci.db`)
- The `postinstall` script in `package.json` handles `prisma generate` automatically
- README must document all scripts in a table
