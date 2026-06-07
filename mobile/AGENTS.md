# Expo app

- Use `npm` here; the repo has `package-lock.json` and no `yarn`/`pnpm` workspace config.
- The router entrypoint is `src/app` with `expo-router` as `main`; `README.md` still mentions `app/`, but the current code and reset script use `src/app`.
- Key screens are `src/app/index.tsx` and `src/app/explore.tsx`; `src/app/_layout.tsx` wires the tab/theme shell.
- Alias resolution is `@/* -> src/*` and `@/assets/* -> assets/*` from `tsconfig.json`.
- Expo config in `app.json` enables `typedRoutes` and `reactCompiler`; keep route paths and component usage compatible with those settings.
- `npm run lint` is the only repo verification script; there is no test script in `package.json`.
- `npm run reset-project` is destructive: it moves or deletes `src` and `scripts`, then recreates `src/app/index.tsx` and `src/app/_layout.tsx`.
- Keep `global.css` at the repo root for web-only NativeWind styling; `src/app/_layout.tsx` imports it globally.
- If Expo behavior matters, verify against the versioned Expo 56 docs before changing app code.
