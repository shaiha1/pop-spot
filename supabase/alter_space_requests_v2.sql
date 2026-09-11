-- Add contact info and free-text "other" category to space_requests
alter table public.space_requests
  add column if not exists contact_phone text,
  add column if not exists contact_email text,
  add column if not exists other_category text;
