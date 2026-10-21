create table if not exists public.app_records (
  entity text not null,
  id text not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  primary key (entity, id)
);

create index if not exists app_records_entity_updated_idx
  on public.app_records (entity, updated_date desc);

alter table public.app_records enable row level security;

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('public-assets', 'public-assets', true, 26214400),
  ('athlete-documents', 'athlete-documents', false, 26214400)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;
