# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Skils
Usas siempre /frontend-design para diseñar la interfaz de usuario

## Project state

This is still the unmodified `create-next-app` scaffold (`app/page.tsx` is the Next.js welcome page). Arcade Vault itself is not implemented yet — treat everything under `app/` as replaceable.

**Arcade Vault** = online arcade platform: play retro games in the browser and compete on score leaderboards. Spanish-language UI.

## Design source: `resources.zip`

The intended product already exists as a static React prototype inside `resources.zip` (`resources/templates/`). Unzip it and read it before building features — it is the spec for screens, copy, data shape, and visual language.

- `Arcade Vault.html` — entry point; React 18 UMD + Babel standalone in the browser, scripts loaded in dependency order
- `data.jsx` — `GAMES` mock data: `{ id, title, short, long, cat, cover, color, best, plays }`
- `app.jsx` — hash-based router + `localStorage` state (`av_user`, `av_scores`)
- Screens: `biblioteca.jsx` (library), `detalle.jsx` (game detail), `reproductor.jsx` (player), `auth.jsx`, `salon.jsx` (hall of fame)
- `nav.jsx` — shared nav
- `styles.css` — ~33KB of hand-written neon/CRT retro styling, fonts `Press Start 2P`, `Courier Prime`, `JetBrains Mono`

Routes in the prototype (`route.name`): `biblioteca` → `detalle` → `player`, plus `auth` and `salon`. Port these to App Router segments.

The prototype is plain CSS classes (`av-*`); this project uses **Tailwind v4** (CSS-first config via `@theme inline` in `app/globals.css`, no `tailwind.config.js`). Decide per-case whether to port `styles.css` as-is or translate to Tailwind — do not assume Tailwind v3 conventions.

## Stack notes

- Next.js **16.2.12**, React **19.2.4**, TypeScript strict, Tailwind v4 via `@tailwindcss/postcss`
- App Router only; import alias `@/*` → repo root
- Next 16 has breaking changes vs. training data. Before writing code, read the matching guide under `node_modules/next/dist/docs/`:
  - `01-app/01-getting-started/` — layouts-and-pages, server-and-client-components, fetching-data, mutating-data, caching, css, images, fonts, metadata, route-handlers
  - `01-app/02-guides/` — authentication, forms, server-actions, migrating-to-cache-components
  - `01-app/03-api-reference/` — per-API details

## Workflow

README specifies spec-driven development via `/spec` and `/spec-impl` skills from [Klerith/fernando-skills](https://github.com/Klerith/fernando-skills) (`npx skills@latest add Klerith/fernando-skills`). These skills are not currently installed in this repo.
