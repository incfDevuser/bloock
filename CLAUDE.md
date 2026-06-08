# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a monorepo for **Block** ("Tu día, en bloques"), a personal time-blocking app — not a task manager or calendar, but an organizer of time blocks that each contain their own tasks. It contains two independent projects plus brand/data references at the root:

- `mobile/` — the Expo/React Native app (the actual product, in active development)
- `frontend/` — a Vite + React landing page (currently scaffolded with empty stub components, in progress on `feature/block-landing`)
- `BrandBrief.md` — brand voice, tone, and design-system reference (Spanish copy; informal "tú" voice, short questions instead of forms/instructions — consult this before writing any user-facing strings)
- `Tablas.sql` — the Supabase Postgres schema (source of truth for the data model: `users`, `day_configs`, `blocks`, `block_exceptions`, `tasks`, `notifications`)

Each subproject has its own dependencies and tooling — always `cd` into the relevant directory before running install/build/lint commands.

## mobile/ — Expo app

### Commands
- Install: `npm install` (repo uses `package-lock.json`; no yarn/pnpm)
- Run: `npm run start` (or `npm run ios` / `npm run android` / `npm run web`)
- Lint: `npm run lint` (the only verification script — there is no test script)
- Reset to blank starter: `npm run reset-project` — **destructive**, moves/deletes `src` and `scripts`

### Architecture
- Routing is file-based via `expo-router`, entry at `src/app` (the root `README.md` mentions `app/`, but actual code/scripts use `src/app`). `src/app/_layout.tsx` loads fonts and wraps everything in `OnboardingProvider`.
- Auth/onboarding gating: `src/app/(app)/_layout.tsx` redirects to `/` (onboarding) unless `useOnboarding()` reports `completed`. Tab screens (`home`, `week`, `tasks`, `settings`) live under `src/app/(app)/`.
- `OnboardingProvider` (`src/providers/onboarding-provider.tsx`) persists an `OnboardingDraft` and `completed` flag to `AsyncStorage`, and derives `GeneratedBlock[]` from the draft via `buildGeneratedBlocks` in `src/lib/onboarding.ts`.
- Backend is Supabase: client is created in `mobile/utils/supabase.ts` (uses `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` env vars, persists sessions to `AsyncStorage`). Data-access helpers live in `src/lib/*-service.ts` (e.g. `task-service.ts`), following the schema in root `Tablas.sql`.
- Styling is NativeWind/Tailwind (`tailwind.config.js`, `global.css` at the mobile root — keep it there, `_layout.tsx` imports it globally for web). Demo/design tokens (colors per block type, etc.) are centralized in `src/lib/block-demo.ts` as `TOKENS`.
- Path aliases (from `tsconfig.json`): `@/*` → `src/*`, `@/assets/*` → `assets/*`.
- `app.json` enables `typedRoutes` and `reactCompiler` — keep route paths and component patterns compatible with both (e.g. avoid patterns the React Compiler can't statically analyze).
- See `mobile/AGENTS.md` for additional environment notes (also linked from `mobile/CLAUDE.md`).

## frontend/ — landing page

### Commands
- Install: `npm install`
- Dev server: `npm run dev` (Vite)
- Build: `npm run build` (runs `tsc -b` then `vite build`)
- Lint: `npm run lint`
- Preview production build: `npm run preview`

### Architecture
- Standard Vite + React 19 + TypeScript template (no router, no state library, no styling framework wired in yet).
- `src/App.tsx` composes page sections from `src/components/`: `Navbar`, `Hero`, `Examples`, `CTA`, `Footer` — all currently empty stubs to be filled in.
- When building out this landing page, pull copy/voice/visual direction from `BrandBrief.md` rather than inventing new tone or palette.
