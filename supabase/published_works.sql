create table if not exists public.published_works (
  slug text primary key,
  html text not null,
  created_at timestamptz not null default now()
);

alter table public.published_works enable row level security;

drop policy if exists "public can read published works" on public.published_works;

create policy "public can read published works"
on public.published_works
for select
to anon
using (true);

drop policy if exists "public can publish works" on public.published_works;

create policy "public can publish works"
on public.published_works
for insert
to anon
with check (char_length(slug) > 0 and char_length(html) > 0);
