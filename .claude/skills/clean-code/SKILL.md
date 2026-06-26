---
name: clean-code
description: Conventions for writing readable, maintainable code in this Expo/React Native app. Load BEFORE writing or editing any .ts/.tsx file — components, hooks, screens, lib utilities, stores, or API code — and when reviewing a diff for quality. Encodes this project's naming, file layout, import order, typing, styling, and data-fetching patterns so new code matches what's already here.
---

# Clean Code — xcellar-app

Write code that reads like the code already in `src/`. When unsure, open a sibling file and match it. Consistency beats personal preference.

## The one rule

**Optimize for the reader, not the writer.** Someone (often you, in three months) will read this far more times than you write it. If a reviewer has to pause to understand a line, rewrite the line.

## File & folder layout

- Source lives under `src/`. The layers already in use, keep using:
  - `src/app/` — Expo Router screens & layouts (file-based routing).
  - `src/components/` — reusable UI.
  - `src/hooks/` — reusable hooks.
  - `src/lib/` — non-UI logic: `api`, `storage`, `query-client`, `env`, and future stores/services.
  - `src/constants/` — static config (`theme.ts`).
- **Filenames are kebab-case**: `themed-text.tsx`, `use-theme.ts`, `query-client.ts`. Never `ThemedText.tsx` or `useTheme.ts`.
- One primary thing per file. A component file exports that component (plus its `Props` type and local `styles`).

## Naming

- **Components**: PascalCase (`ThemedText`). **Hooks**: `useThing` camelCase. **Functions/variables**: camelCase. **Constant objects / enums-as-objects**: PascalCase with `as const` (`Colors`, `StorageKeys`, `Spacing`).
- Names say what a thing *is* or *does*, not how it's built. `accessToken` not `tok`; `getItem` not `gi`. Booleans read as questions: `isLoading`, `hasToken`.
- No abbreviations beyond well-known ones (`id`, `url`, `api`). No single letters except trivial loop/map indices.

## Exports

- **Named exports everywhere** (`export function`, `export const`). Match the existing `api`, `useTheme`, `ThemedText` style.
- **Only exception**: Expo Router screens/layouts in `src/app/` are `export default` — the router requires it. Nowhere else.

## Imports

Group in this order, separated by blank lines, exactly as existing files do:

```ts
import { QueryClientProvider } from '@tanstack/react-query';  // 1. external packages
import { Stack } from 'expo-router';

import { queryClient } from '@/lib/query-client';             // 2. internal, via @/ alias
```

- **Always use the `@/` alias** for internal imports (`@/lib/...`, `@/hooks/...`, `@/constants/...`). Avoid `../../`. `@/assets/*` is also aliased.
- Import types with `import { type Foo }` or `import type` when it's type-only.

## TypeScript

- `strict` is on — keep it green. **No `any`.** If a type is unknown, use `unknown` and narrow, or define the shape.
- Prefer `type` aliases for props and data shapes: `export type ThemedTextProps = TextProps & { ... }`.
- Use `as const` for fixed lookup objects so keys become literal types (see `Colors`, `StorageKeys`).
- Derive types from data rather than restating them: `keyof typeof Colors.light`, not a hand-maintained union.
- Use numeric separators for big numbers: `30_000`, not `30000`.

## Functions & readability

- **Small and single-purpose.** If a function does two things, split it. If it needs a comment to explain a *section*, that section probably wants to be its own named function.
- **Early returns over nested `if`/`else`.** Flatten the happy path.
- No clever one-liners that need decoding. Clear and slightly longer wins.
- Don't leave dead code, commented-out blocks, or stray `console.log`. Delete it — git remembers.
- No magic numbers/strings. Name them (`Spacing.three`, `StorageKeys.accessToken`, `MaxContentWidth`).

## React Native / Expo patterns

- **Function components only**, with hooks. No classes.
- **Data fetching → React Query** via the shared `queryClient`. Don't fetch in `useEffect` + `useState`. Co-locate query keys and keep them stable.
- **HTTP → the shared `api` axios instance** in `src/lib/api.ts`. Don't create new axios instances or call `fetch` directly; the interceptor handles auth tokens.
- **Sensitive values → `storage.ts`** (`getItem`/`setItem`/`removeItem` over SecureStore). Never store tokens in plain AsyncStorage or module variables.
- **Client/UI state → Zustand** (already a dependency) in a `src/lib/*-store.ts`. Keep stores small and sliced; don't dump everything into one global store.
- **Env/config → `src/lib/env.ts`**. Read `process.env.EXPO_PUBLIC_*` only there, never scattered through the app.

## Styling

- This app uses **both** NativeWind (Tailwind classes via `className`) and `StyleSheet`. Match the file you're editing:
  - Reusable themed primitives (`themed-text`, `themed-view`) use `StyleSheet.create` + the `useTheme()` colors.
  - New screen/feature UI: prefer NativeWind `className` for layout, fall back to `StyleSheet` for dynamic/computed styles.
- **Pull colors, spacing, and fonts from `@/constants/theme`** (`Colors`, `Spacing`, `Fonts`). Don't hardcode hex values or pixel paddings inline — the one inline `#3c87f7` in `themed-text` is debt, not a pattern to copy.
- Respect light/dark mode through `useTheme()`; don't hardcode `#fff`/`#000`.

## Comments

- Comment the **why**, never the **what**. Good: explaining that JWT refresh is coming in a later phase. Bad: `// create the client`.
- Use JSDoc `/** ... */` on exported modules/functions that need context, matching `api.ts`, `storage.ts`, `env.ts`.
- A comment that restates the code is noise — delete it and let the names carry the meaning.

## Before you finish a change

1. Filenames kebab-case, components PascalCase, exports named (except `src/app` screens)?
2. Imports grouped & using `@/` alias?
3. No `any`, no `console.log`, no commented-out/dead code, no magic numbers?
4. Colors/spacing/fonts from `@/constants/theme`, dark mode respected?
5. Data via React Query + the shared `api`; tokens via `storage`?
6. Would a teammate understand each function from its name and shape alone? If not, rename or split.
7. Run `npm run lint` — it must pass clean.
