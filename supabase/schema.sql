-- =====================================================================
-- PopSpot — Supabase schema, RLS policies, and storage setup.
--
-- Run this once in the Supabase dashboard: SQL Editor -> New query ->
-- paste this whole file -> Run. Safe to re-run (uses IF NOT EXISTS /
-- CREATE OR REPLACE where possible), but it will error on a second run
-- for the CREATE TABLE statements if they already exist — that's fine,
-- it means it already ran.
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles — extends auth.users with app-specific fields.
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_date timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up. The first person
-- to ever sign up becomes admin (mirrors the old local-demo behavior);
-- everyone after that is a plain user.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first boolean;
begin
  select not exists(select 1 from public.profiles) into is_first;
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    case when is_first then 'admin' else 'user' end
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper used by RLS policies below.
create or replace function public.is_admin()
returns boolean as $$
  select exists(
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable set search_path = public;

-- ---------------------------------------------------------------------
-- spaces
-- ---------------------------------------------------------------------
create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text,
  description text,
  category text,
  space_type text,
  address text,
  city text not null,
  area text,
  latitude double precision,
  longitude double precision,
  max_guests integer,
  status text not null default 'draft'
    check (status in ('draft','pending_review','active','rejected','suspended')),
  instant_booking boolean not null default false,
  images text[] not null default '{}',
  amenities text[] not null default '{}',
  activities text[] not null default '{}',
  activity_pricing jsonb not null default '[]',
  availability_rules jsonb not null default '[]',
  blocked_dates text[] not null default '{}',
  rules text,
  cancellation_policy text not null default 'moderate',
  min_booking_hours numeric not null default 2,
  host_id uuid references auth.users(id),
  host_name text,
  avg_rating numeric not null default 0,
  review_count integer not null default 0,
  starting_price numeric,
  created_date timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references public.spaces(id) on delete cascade,
  space_title text,
  space_image text,
  host_id uuid references auth.users(id),
  guest_id uuid references auth.users(id),
  guest_name text,
  guest_email text,
  activity text,
  date date,
  start_time text,
  end_time text,
  hours numeric,
  guests_count integer,
  hourly_price numeric,
  subtotal numeric,
  guest_fee numeric,
  host_fee numeric,
  total numeric,
  host_payout numeric,
  platform_revenue numeric,
  status text not null default 'pending'
    check (status in ('pending','accepted','rejected','cancelled','completed')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','paid','refunded')),
  created_date timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  space_id uuid references public.spaces(id) on delete cascade,
  created_date timestamptz not null default now(),
  unique(user_id, space_id)
);

-- ---------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references public.spaces(id) on delete cascade,
  booking_id uuid references public.bookings(id),
  reviewer_id uuid references auth.users(id),
  reviewer_name text,
  host_id uuid references auth.users(id),
  rating numeric not null,
  text text,
  created_date timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  sender_id uuid references auth.users(id),
  sender_name text,
  recipient_id uuid references auth.users(id),
  text text not null,
  read boolean not null default false,
  created_date timestamptz not null default now()
);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.bookings enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;
alter table public.messages enable row level security;

-- profiles: everyone can read (needed for admin's user list + showing
-- host_name/reviewer_name); only the owner can update their own row.
create policy "profiles_select_all" on public.profiles
  for select using (true);
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- spaces: public can see active listings; hosts see their own at any
-- status; admins see everything.
create policy "spaces_select" on public.spaces
  for select using (status = 'active' or host_id = auth.uid() or public.is_admin());
create policy "spaces_insert_own" on public.spaces
  for insert with check (host_id = auth.uid());
create policy "spaces_update" on public.spaces
  for update using (host_id = auth.uid() or public.is_admin());
create policy "spaces_delete_own" on public.spaces
  for delete using (host_id = auth.uid() or public.is_admin());

-- bookings: visible to the guest, the host, or an admin.
create policy "bookings_select" on public.bookings
  for select using (guest_id = auth.uid() or host_id = auth.uid() or public.is_admin());
create policy "bookings_insert_own" on public.bookings
  for insert with check (guest_id = auth.uid());
create policy "bookings_update" on public.bookings
  for update using (guest_id = auth.uid() or host_id = auth.uid() or public.is_admin());

-- favorites: private to the user.
create policy "favorites_select_own" on public.favorites
  for select using (user_id = auth.uid());
create policy "favorites_insert_own" on public.favorites
  for insert with check (user_id = auth.uid());
create policy "favorites_delete_own" on public.favorites
  for delete using (user_id = auth.uid());

-- reviews: public read (shown on space pages to signed-out visitors too);
-- only the reviewer can create their own.
create policy "reviews_select_all" on public.reviews
  for select using (true);
create policy "reviews_insert_own" on public.reviews
  for insert with check (reviewer_id = auth.uid());

-- messages: visible to sender or recipient only.
create policy "messages_select" on public.messages
  for select using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_admin());
create policy "messages_insert_own" on public.messages
  for insert with check (sender_id = auth.uid());

-- =====================================================================
-- Storage — space photo uploads
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('space-images', 'space-images', true)
on conflict (id) do nothing;

create policy "space_images_public_read" on storage.objects
  for select using (bucket_id = 'space-images');
create policy "space_images_authenticated_upload" on storage.objects
  for insert with check (bucket_id = 'space-images' and auth.role() = 'authenticated');
