# AGENTS.md

## Project Context

PopSpot ("POP-SPOT") is a React/Vite app for renting spaces by the hour
(pools, event spaces, studios, villas, photography rooms, etc.), in
Hebrew/RTL. It started as a Base44-exported app and was rebuilt as a
standalone app backed by Supabase (Postgres + Auth + Storage) — no Base44
dependency.

## Key Files

- `src/`: frontend application source (pages, components, UI kit).
- `src/api/base44Client.js`: the Supabase-backed client — auth, entity CRUD
  (Space/Booking/Favorite/Review/Message/User via `supabase-js`), and file
  uploads to Supabase Storage. Named for the app's Base44 origin; every page
  imports `base44.auth.*` / `base44.entities.*` / `base44.integrations.*`
  from here.
- `src/lib/AuthContext.jsx`: session state, backed by the Supabase client.
- `supabase/schema.sql`: full schema, RLS policies, and storage bucket setup
  — run once in the Supabase SQL Editor for a new project.
- `src/App.jsx`: routes, including the auth pages (`/login`, `/register`,
  `/forgot-password`, `/reset-password`) which a hosted Base44 app would have
  served outside the SPA router.
- `vite.config.js`: plain Vite + React config with a manual `@` → `src`
  alias (no Base44 vite plugin).
- `vercel.json`: SPA rewrite (`/(.*) -> /index.html`) — required for
  client-side routes to survive a full-page navigation (e.g. the login
  redirect) on Vercel's static hosting.

## Working Notes

- Run locally with `npm install` then `npm run dev`.
- Auth, data, and file storage are all real (Supabase), shared across every
  visitor and device — unlike an earlier iteration of this app that used
  `localStorage` as a per-browser demo backend.
- Run the relevant checks from `package.json` before finishing code changes.
