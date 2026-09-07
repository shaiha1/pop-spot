# POP-SPOT (PopSpot)

"Airbnb by the hour" — a marketplace for renting spaces (pools, event spaces,
training studios, villas, photography rooms, meeting rooms, and more) by the
hour. Hebrew UI, RTL layout.

The app talks to a real [Supabase](https://supabase.com) backend (Postgres +
Auth + Storage) — see `supabase/schema.sql` for the schema, Row Level
Security policies, and storage bucket setup. There is no separate server to
run; the React app calls Supabase directly from the browser.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL Vite prints (typically `http://localhost:5173`).

## Backend setup (one-time)

1. Create a Supabase project.
2. Open the SQL Editor in the Supabase dashboard, paste the contents of
   `supabase/schema.sql`, and run it. This creates all tables, Row Level
   Security policies, and the `space-images` storage bucket.
3. The app's Supabase project URL and `anon`/publishable key live in
   `src/api/base44Client.js` (safe to commit — protected by RLS, not a
   secret). Point them at your own project if you fork this.

The first account to ever register becomes an admin automatically (see the
`handle_new_user` trigger in the schema).

## Auth flows

- Email/password sign-up sends a real confirmation email (Supabase Auth
  default) — no demo shortcuts.
- "Continue with Google" requires configuring the Google provider in the
  Supabase dashboard (Authentication → Providers) with your own OAuth
  client; until then it will show an error.
- Password reset sends a real email with a recovery link back to
  `/reset-password`.

## Notes

- Space photo uploads go to the `space-images` Supabase Storage bucket.
- `src/api/base44Client.js` is named for how this app started (a Base44
  export) but now wraps Supabase — kept as the historical name for the
  auth/entities/integrations interface every page imports.
