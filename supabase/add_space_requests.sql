-- =====================================================================
-- Space Requests feature — run in Supabase SQL Editor.
-- =====================================================================

-- space_requests: guests post what they need; hosts browse and respond.
create table public.space_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references auth.users(id) on delete cascade,
  requester_name text,
  title text not null,
  description text,
  category text,
  city text,
  date date,
  start_time text,
  end_time text,
  guests_count integer,
  budget_per_hour numeric,
  status text not null default 'open'
    check (status in ('open', 'fulfilled', 'cancelled')),
  created_date timestamptz not null default now()
);

-- space_request_responses: a host replies to a request with a message
-- and optionally links one of their spaces.
create table public.space_request_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.space_requests(id) on delete cascade,
  responder_id uuid references auth.users(id) on delete cascade,
  responder_name text,
  space_id uuid references public.spaces(id) on delete set null,
  space_title text,
  space_image text,
  message text not null,
  created_date timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────────────

alter table public.space_requests enable row level security;
alter table public.space_request_responses enable row level security;

-- Anyone can browse open requests; the requester sees all their own.
create policy "space_requests_select" on public.space_requests
  for select using (
    status = 'open'
    or requester_id = auth.uid()
    or public.is_admin()
  );
create policy "space_requests_insert" on public.space_requests
  for insert with check (requester_id = auth.uid());
create policy "space_requests_update" on public.space_requests
  for update using (requester_id = auth.uid() or public.is_admin());
create policy "space_requests_delete" on public.space_requests
  for delete using (requester_id = auth.uid() or public.is_admin());

-- Responses: the request's author and the responder can read them;
-- any authenticated user can create one (hosts responding to requests).
create policy "space_request_responses_select" on public.space_request_responses
  for select using (
    responder_id = auth.uid()
    or exists (
      select 1 from public.space_requests
      where id = request_id and requester_id = auth.uid()
    )
    or public.is_admin()
  );
create policy "space_request_responses_insert" on public.space_request_responses
  for insert with check (responder_id = auth.uid());
create policy "space_request_responses_delete" on public.space_request_responses
  for delete using (responder_id = auth.uid() or public.is_admin());
