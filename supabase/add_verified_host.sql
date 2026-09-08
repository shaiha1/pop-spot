-- =====================================================================
-- PopSpot — verified-host trust signal.
-- Run once in the Supabase SQL Editor (after schema.sql).
-- =====================================================================

alter table public.profiles
  add column if not exists is_verified_host boolean not null default false;

-- Admins can update any profile (e.g. to toggle verification); users can
-- still only update their own row via the existing "profiles_update_own"
-- policy from schema.sql.
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());
