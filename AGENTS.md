# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js demo app (App Router) and routes.
- `components/` + `lib/`: shared UI and utilities used across the app and agents.
- `agents/`: Tester, Triage, Fixer, Verifier, and Orchestrator implementations.
- `tests/`: `unit/` (Vitest) and `e2e/` (Stagehand runner).
- `dashboard/`: Marimo analytics app.
- `docs/`, `prompts/`, `scripts/`: design docs, workflow prompts, and helper scripts.

## Build, Test, and Development Commands
- `pnpm dev`: run the Next.js demo app locally.
- `pnpm run agent`: start the PatchPilot orchestrator workflow.
- `pnpm test`: run unit tests with Vitest.
- `pnpm run test:e2e`: execute E2E flows via `tests/e2e/runner.ts`.
- `pnpm lint`: run Next.js lint + TypeScript type-check.
- `pnpm format`: format the repo with Prettier.
- `pnpm build` / `pnpm start`: production build and server.
- `pnpm dashboard`: launch the Marimo dashboard.

## Coding Style & Naming Conventions
- Prettier is the source of truth (`tabWidth: 2`, `singleQuote: true`, semicolons).
- Keep TypeScript strictness intact; avoid `any` unless justified.
- Test files use `*.test.ts` (see `tests/unit/`).

## Testing Guidelines
- Unit tests live in `tests/unit/` and run with `pnpm test`.
- E2E specs live in `tests/e2e/` and run with `pnpm run test:e2e`.
- Add tests when changing agent logic or core workflows.

## Commit & Pull Request Guidelines
- Commit history favors Conventional Commit prefixes (e.g., `feat:`, `chore:`), plus milestone-style `Phase N: ...` updates.
- Keep commits focused; include the “why” when behavior changes.
- PRs should include a brief summary, test results, and screenshots for UI changes.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local` and never commit secrets.
- Confirm required keys for Browserbase, Redis, Vercel, and Weave before running agents.

## Agent Notes
- Read `CLAUDE.md` before starting work and check `TASKS.md` for the current phase.
- Follow `prompts/ralph-loop.md` for the Ralph Loop workflow.
