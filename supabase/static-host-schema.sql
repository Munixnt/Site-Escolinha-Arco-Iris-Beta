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

create unique index if not exists app_records_registration_settings_slug_uidx
  on public.app_records ((data ->> 'slug'))
  where entity = 'RegistrationSettings';

alter table public.app_records enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.app_records to anon, authenticated;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false);
$$;

create or replace function public.is_valid_public_athlete(payload jsonb)
returns boolean
language plpgsql
stable
set search_path = pg_catalog, public
as $$
declare
  birth_date date;
  athlete_age integer;
  expected_category text;
begin
  if payload is null
    or coalesce(payload ->> 'status', '') <> 'pendente'
    or coalesce(payload ->> 'consentimentoLGPD', '') <> 'true'
    or nullif(trim(payload ->> 'nome'), '') is null
    or nullif(trim(payload ->> 'tipoSanguineo'), '') is null
    or coalesce(payload ->> 'tipoSanguineo', '') not in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    or nullif(trim(payload ->> 'alergiasRestricoes'), '') is null
    or nullif(trim(payload ->> 'nomeResponsavel'), '') is null
    or nullif(trim(payload ->> 'telefoneResponsavel'), '') is null
    or nullif(trim(payload ->> 'rua'), '') is null
    or nullif(trim(payload ->> 'numero'), '') is null
    or nullif(trim(payload ->> 'bairro'), '') is null
    or nullif(trim(payload ->> 'cidade'), '') is null
    or nullif(trim(payload ->> 'estado'), '') is null
    or nullif(trim(payload ->> 'cep'), '') is null
    or coalesce(payload ->> 'statusAtestado', '') not in ('anexado', 'entrega_posterior', 'nao_possui')
    or coalesce(payload ->> 'numeroMatricula', '') !~ '^AI-[0-9]{4}-(SUB[0-9]+|ADULTO)-[0-9]{3,}$'
    or coalesce(payload ->> 'fotoUrl', '') !~ '^private-upload:[0-9a-f-]{36}\.(jpg|jpeg|png|webp|gif)$'
    or coalesce(payload ->> 'rgUrl', '') !~ '^private-upload:[0-9a-f-]{36}\.(jpg|jpeg|png|webp|gif|pdf)$'
    or (
      nullif(payload ->> 'rgVersoUrl', '') is not null
      and payload ->> 'rgVersoUrl' !~ '^private-upload:[0-9a-f-]{36}\.(jpg|jpeg|png|webp|gif|pdf)$'
    )
    or (
      nullif(payload ->> 'atestadoUrl', '') is not null
      and payload ->> 'atestadoUrl' !~ '^private-upload:[0-9a-f-]{36}\.(jpg|jpeg|png|webp|gif|pdf)$'
    )
    or (
      payload ->> 'statusAtestado' = 'anexado'
      and nullif(payload ->> 'atestadoUrl', '') is null
    )
    or (
      payload ->> 'statusAtestado' <> 'anexado'
      and nullif(payload ->> 'atestadoUrl', '') is not null
    )
    or (payload - array[
      'nome', 'dataNascimento', 'tipoSanguineo', 'alergiasRestricoes', 'nomeResponsavel',
      'telefoneResponsavel', 'cep', 'rua', 'numero', 'bairro', 'cidade',
      'estado', 'consentimentoLGPD', 'categoria', 'numeroMatricula', 'statusAtestado',
      'fotoUrl', 'rgUrl', 'rgVersoUrl', 'atestadoUrl', 'status'
    ]) <> '{}'::jsonb then
    return false;
  end if;

  if coalesce(payload ->> 'dataNascimento', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    return false;
  end if;

  birth_date := (payload ->> 'dataNascimento')::date;
  athlete_age := extract(year from age(current_date, birth_date))::integer;
  if athlete_age < 7 or athlete_age > 17 then
    return false;
  end if;

  expected_category := case
    when athlete_age <= 7 then 'Sub-7'
    when athlete_age <= 9 then 'Sub-9'
    when athlete_age <= 11 then 'Sub-11'
    when athlete_age <= 13 then 'Sub-13'
    when athlete_age <= 15 then 'Sub-15'
    else 'Sub-17'
  end;
  return payload ->> 'categoria' is not distinct from expected_category;
exception
  when invalid_text_representation or datetime_field_overflow then
    return false;
end;
$$;

create unique index if not exists app_records_athlete_registration_number_uidx
  on public.app_records ((data ->> 'numeroMatricula'))
  where entity = 'Athlete'
    and data ->> 'numeroMatricula' ~ '^AI-[0-9]{4}-(SUB[0-9]+|ADULTO)-[0-9]{3,}$';

create or replace function public.create_public_athlete(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  registration_year text := to_char(current_date, 'YYYY');
  category_code text;
  next_sequence integer;
  registration_number text;
  athlete_data jsonb;
  record_id text := gen_random_uuid()::text;
  record_date timestamptz := now();
  inserted_record public.app_records%rowtype;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'Dados de matrícula inválidos.' using errcode = '22023';
  end if;

  if exists (
    select 1
      from public.app_records
     where entity = 'RegistrationSettings'
       and data ->> 'slug' = 'matricula'
       and data ->> 'accepting' = 'false'
  ) then
    raise exception 'Matrículas suspensas no momento. Entre em contato com a Escolinha para mais informações.'
      using errcode = 'P0001';
  end if;

  category_code := case payload ->> 'categoria'
    when 'Sub-7' then 'SUB7'
    when 'Sub-9' then 'SUB9'
    when 'Sub-11' then 'SUB11'
    when 'Sub-13' then 'SUB13'
    when 'Sub-15' then 'SUB15'
    when 'Sub-17' then 'SUB17'
    when 'Adulto' then 'ADULTO'
    else null
  end;

  if category_code is null then
    raise exception 'Categoria de atleta inválida.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(registration_year || ':' || category_code, 0));

  select coalesce(max((regexp_match(
    data ->> 'numeroMatricula',
    '^AI-' || registration_year || '-' || category_code || '-([0-9]+)$'
  ))[1]::integer), 0) + 1
    into next_sequence
    from public.app_records
   where entity = 'Athlete'
     and data ->> 'numeroMatricula' ~ (
       '^AI-' || registration_year || '-' || category_code || '-[0-9]{3,}$'
     );

  registration_number := 'AI-' || registration_year || '-' || category_code || '-' || lpad(next_sequence::text, 3, '0');
  athlete_data := (payload - 'numeroMatricula') || jsonb_build_object(
    'numeroMatricula', registration_number,
    'status', 'pendente'
  );

  if not public.is_valid_public_athlete(athlete_data) then
    raise exception 'Os dados da matrícula são inválidos ou incompletos.' using errcode = '22023';
  end if;

  insert into public.app_records (entity, id, data, created_date, updated_date)
  values ('Athlete', record_id, athlete_data, record_date, record_date)
  returning * into inserted_record;

  return jsonb_build_object(
    'id', inserted_record.id,
    'data', inserted_record.data,
    'created_date', inserted_record.created_date,
    'updated_date', inserted_record.updated_date
  );
end;
$$;

revoke all on function public.create_public_athlete(jsonb) from public;
grant execute on function public.create_public_athlete(jsonb) to anon, authenticated;

drop policy if exists "Public can read published site records" on public.app_records;
create policy "Public can read published site records"
  on public.app_records for select
  to anon, authenticated
  using (
    public.is_site_admin()
    or (
      entity in ('SitePage', 'RegistrationSettings', 'GalleryAlbum', 'GalleryItem', 'TimelineEvent')
      and (entity <> 'RegistrationSettings' or data ->> 'slug' = 'matricula')
    )
    or (entity = 'Sponsor' and data ->> 'ativo' = 'true')
    or (entity = 'TransparencyDocument' and data ->> 'ativo' = 'true')
  );

drop policy if exists "Public can submit athlete registrations" on public.app_records;
create policy "Public can submit athlete registrations"
  on public.app_records for insert
  to anon, authenticated
  with check (public.is_site_admin());

drop policy if exists "Admins can update site records" on public.app_records;
create policy "Admins can update site records"
  on public.app_records for update
  to authenticated
  using (public.is_site_admin())
  with check (public.is_site_admin());

drop policy if exists "Admins can delete site records" on public.app_records;
create policy "Admins can delete site records"
  on public.app_records for delete
  to authenticated
  using (public.is_site_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'public-assets',
    'public-assets',
    true,
    26214400,
    array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
      'video/mp4', 'video/webm', 'video/quicktime', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ]
  ),
  (
    'athlete-documents',
    'athlete-documents',
    false,
    26214400,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
  )
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

grant select, insert, update, delete on storage.objects to anon, authenticated;

drop policy if exists "Public can read public site files" on storage.objects;
create policy "Public can read public site files"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'public-assets');

drop policy if exists "Admins can read athlete documents" on storage.objects;
create policy "Admins can read athlete documents"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'athlete-documents' and public.is_site_admin());

drop policy if exists "Public can upload private registration documents" on storage.objects;
create policy "Public can upload private registration documents"
  on storage.objects for insert
  to anon
  with check (
    bucket_id = 'athlete-documents'
    and name ~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp|gif|pdf)$'
  );

drop policy if exists "Admins can manage site files" on storage.objects;
create policy "Admins can manage site files"
  on storage.objects for all
  to authenticated
  using (public.is_site_admin() and bucket_id in ('public-assets', 'athlete-documents'))
  with check (public.is_site_admin() and bucket_id in ('public-assets', 'athlete-documents'));
