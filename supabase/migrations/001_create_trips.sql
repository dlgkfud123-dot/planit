create table if not exists public.trips (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  schema_version integer not null default 2 check (schema_version = 2),
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trips_user_updated_idx on public.trips (user_id, updated_at desc);
alter table public.trips enable row level security;

create policy "Users can read their own trips" on public.trips for select using (auth.uid() = user_id);
create policy "Users can insert their own trips" on public.trips for insert with check (auth.uid() = user_id);
create policy "Users can update their own trips" on public.trips for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own trips" on public.trips for delete using (auth.uid() = user_id);
