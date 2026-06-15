-- ============================================================
-- MY DREAM VIDEO STUDIO — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- 2. FUNZIONE updated_at AUTOMATICO
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 3. FUNZIONE auto-crea profiles da auth.users
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    coalesce(new.raw_user_meta_data->>'avatar_url', null),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- trigger su auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 4. TABELLA: profiles
-- ============================================================

create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text,
  avatar_url      text,
  role            text not null default 'user'
                  check (role in ('user', 'admin')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles(email);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- 5. TABELLA: projects
-- ============================================================

create table if not exists public.projects (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  description     text,
  thumbnail_url   text,
  status          text not null default 'draft'
                  check (status in ('draft', 'in_progress', 'completed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_projects_user_id   on public.projects(user_id);
create index if not exists idx_projects_status    on public.projects(status);
create index if not exists idx_projects_created   on public.projects(created_at desc);

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- 6. TABELLA: media_files
-- ============================================================

create table if not exists public.media_files (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  project_id      uuid references public.projects(id) on delete set null,
  name            text not null,
  type            text not null
                  check (type in ('image', 'video', 'audio', 'logo')),
  url             text not null,
  storage_path    text not null,
  size            bigint not null default 0,
  mime_type       text not null,
  duration        numeric,
  width           integer,
  height          integer,
  created_at      timestamptz not null default now()
);

create index if not exists idx_media_files_user_id    on public.media_files(user_id);
create index if not exists idx_media_files_project_id on public.media_files(project_id);
create index if not exists idx_media_files_type       on public.media_files(type);
create index if not exists idx_media_files_created    on public.media_files(created_at desc);

-- ============================================================
-- 7. TABELLA: project_media (relazione N:N)
-- ============================================================

create table if not exists public.project_media (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  media_id        uuid not null references public.media_files(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique(project_id, media_id)
);

create index if not exists idx_project_media_project on public.project_media(project_id);
create index if not exists idx_project_media_media   on public.project_media(media_id);

-- ============================================================
-- 8. TABELLA: storyboard_scenes
-- ============================================================

create table if not exists public.storyboard_scenes (
  id               uuid primary key default uuid_generate_v4(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  title            text not null,
  description      text,
  media_id         uuid references public.media_files(id) on delete set null,
  overlay_text     text,
  overlay_position text not null default 'bottom-center'
                   check (overlay_position in (
                     'top-left','top-center','top-right',
                     'center',
                     'bottom-left','bottom-center','bottom-right'
                   )),
  duration         integer not null default 5
                   check (duration >= 1 and duration <= 300),
  order_index      integer not null default 0,
  transition       text not null default 'fade'
                   check (transition in ('none','fade','slide','zoom')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_storyboard_project on public.storyboard_scenes(project_id);
create index if not exists idx_storyboard_user    on public.storyboard_scenes(user_id);
create index if not exists idx_storyboard_order   on public.storyboard_scenes(project_id, order_index);

drop trigger if exists storyboard_scenes_updated_at on public.storyboard_scenes;
create trigger storyboard_scenes_updated_at
  before update on public.storyboard_scenes
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- 9. TABELLA: generations
-- ============================================================

create table if not exists public.generations (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  provider        text not null
                  check (provider in ('google_veo','kling','higgsfield','runway','pika')),
  prompt          text not null,
  status          text not null default 'pending'
                  check (status in ('pending','processing','completed','failed')),
  progress        integer not null default 0
                  check (progress >= 0 and progress <= 100),
  video_url       text,
  thumbnail_url   text,
  error_message   text,
  settings        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_generations_project  on public.generations(project_id);
create index if not exists idx_generations_user     on public.generations(user_id);
create index if not exists idx_generations_status   on public.generations(status);
create index if not exists idx_generations_provider on public.generations(provider);
create index if not exists idx_generations_created  on public.generations(created_at desc);

drop trigger if exists generations_updated_at on public.generations;
create trigger generations_updated_at
  before update on public.generations
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- 10. TABELLA: exports
-- ============================================================

create table if not exists public.exports (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  generation_id   uuid references public.generations(id) on delete set null,
  format          text not null default 'mp4'
                  check (format in ('mp4','mov','webm')),
  resolution      text not null default '1080p'
                  check (resolution in ('720p','1080p','4k')),
  status          text not null default 'pending'
                  check (status in ('pending','processing','completed','failed')),
  download_url    text,
  file_size       bigint,
  created_at      timestamptz not null default now()
);

create index if not exists idx_exports_project   on public.exports(project_id);
create index if not exists idx_exports_user      on public.exports(user_id);
create index if not exists idx_exports_status    on public.exports(status);
create index if not exists idx_exports_created   on public.exports(created_at desc);

-- ============================================================
-- 11. TABELLA: brand_kits
-- ============================================================

create table if not exists public.brand_kits (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  name                text not null default 'Il mio Brand Kit',
  logo_url            text,
  primary_color       text not null default '#5b63f8',
  secondary_color     text not null default '#1c1c4e',
  accent_color        text not null default '#7488fc',
  font_primary        text not null default 'Inter',
  font_secondary      text not null default 'Poppins',
  watermark_url       text,
  watermark_position  text not null default 'bottom-right'
                      check (watermark_position in ('top-left','top-right','bottom-left','bottom-right')),
  watermark_opacity   integer not null default 80
                      check (watermark_opacity >= 0 and watermark_opacity <= 100),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_brand_kits_user on public.brand_kits(user_id);

drop trigger if exists brand_kits_updated_at on public.brand_kits;
create trigger brand_kits_updated_at
  before update on public.brand_kits
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- 12. ROW LEVEL SECURITY — ABILITA
-- ============================================================

alter table public.profiles           enable row level security;
alter table public.projects           enable row level security;
alter table public.media_files        enable row level security;
alter table public.project_media      enable row level security;
alter table public.storyboard_scenes  enable row level security;
alter table public.generations        enable row level security;
alter table public.exports            enable row level security;
alter table public.brand_kits         enable row level security;

-- ============================================================
-- 13. RLS POLICIES — profiles
-- ============================================================

drop policy if exists "profiles: select own"  on public.profiles;
drop policy if exists "profiles: insert own"  on public.profiles;
drop policy if exists "profiles: update own"  on public.profiles;

create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- 14. RLS POLICIES — projects
-- ============================================================

drop policy if exists "projects: select own"  on public.projects;
drop policy if exists "projects: insert own"  on public.projects;
drop policy if exists "projects: update own"  on public.projects;
drop policy if exists "projects: delete own"  on public.projects;

create policy "projects: select own"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "projects: insert own"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "projects: update own"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "projects: delete own"
  on public.projects for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 15. RLS POLICIES — media_files
-- ============================================================

drop policy if exists "media_files: select own"  on public.media_files;
drop policy if exists "media_files: insert own"  on public.media_files;
drop policy if exists "media_files: update own"  on public.media_files;
drop policy if exists "media_files: delete own"  on public.media_files;

create policy "media_files: select own"
  on public.media_files for select
  using (auth.uid() = user_id);

create policy "media_files: insert own"
  on public.media_files for insert
  with check (auth.uid() = user_id);

create policy "media_files: update own"
  on public.media_files for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "media_files: delete own"
  on public.media_files for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 16. RLS POLICIES — project_media
-- ============================================================

drop policy if exists "project_media: select own"  on public.project_media;
drop policy if exists "project_media: insert own"  on public.project_media;
drop policy if exists "project_media: delete own"  on public.project_media;

create policy "project_media: select own"
  on public.project_media for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "project_media: insert own"
  on public.project_media for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "project_media: delete own"
  on public.project_media for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

-- ============================================================
-- 17. RLS POLICIES — storyboard_scenes
-- ============================================================

drop policy if exists "storyboard_scenes: select own"  on public.storyboard_scenes;
drop policy if exists "storyboard_scenes: insert own"  on public.storyboard_scenes;
drop policy if exists "storyboard_scenes: update own"  on public.storyboard_scenes;
drop policy if exists "storyboard_scenes: delete own"  on public.storyboard_scenes;

create policy "storyboard_scenes: select own"
  on public.storyboard_scenes for select
  using (auth.uid() = user_id);

create policy "storyboard_scenes: insert own"
  on public.storyboard_scenes for insert
  with check (auth.uid() = user_id);

create policy "storyboard_scenes: update own"
  on public.storyboard_scenes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "storyboard_scenes: delete own"
  on public.storyboard_scenes for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 18. RLS POLICIES — generations
-- ============================================================

drop policy if exists "generations: select own"  on public.generations;
drop policy if exists "generations: insert own"  on public.generations;
drop policy if exists "generations: update own"  on public.generations;
drop policy if exists "generations: delete own"  on public.generations;

create policy "generations: select own"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "generations: insert own"
  on public.generations for insert
  with check (auth.uid() = user_id);

create policy "generations: update own"
  on public.generations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "generations: delete own"
  on public.generations for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 19. RLS POLICIES — exports
-- ============================================================

drop policy if exists "exports: select own"  on public.exports;
drop policy if exists "exports: insert own"  on public.exports;
drop policy if exists "exports: update own"  on public.exports;
drop policy if exists "exports: delete own"  on public.exports;

create policy "exports: select own"
  on public.exports for select
  using (auth.uid() = user_id);

create policy "exports: insert own"
  on public.exports for insert
  with check (auth.uid() = user_id);

create policy "exports: update own"
  on public.exports for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "exports: delete own"
  on public.exports for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 20. RLS POLICIES — brand_kits
-- ============================================================

drop policy if exists "brand_kits: select own"  on public.brand_kits;
drop policy if exists "brand_kits: insert own"  on public.brand_kits;
drop policy if exists "brand_kits: update own"  on public.brand_kits;
drop policy if exists "brand_kits: delete own"  on public.brand_kits;

create policy "brand_kits: select own"
  on public.brand_kits for select
  using (auth.uid() = user_id);

create policy "brand_kits: insert own"
  on public.brand_kits for insert
  with check (auth.uid() = user_id);

create policy "brand_kits: update own"
  on public.brand_kits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "brand_kits: delete own"
  on public.brand_kits for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 21. STORAGE — BUCKET: media
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  false,
  524288000,  -- 500 MB
  array[
    'image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml',
    'video/mp4','video/mov','video/quicktime','video/webm','video/avi',
    'audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/aac',
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  file_size_limit   = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================
-- 22. STORAGE — BUCKET: exports
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exports',
  'exports',
  false,
  2147483648,  -- 2 GB
  array[
    'video/mp4','video/mov','video/quicktime','video/webm',
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================
-- 23. STORAGE POLICIES — bucket: media
-- ============================================================

drop policy if exists "media: select own"  on storage.objects;
drop policy if exists "media: insert own"  on storage.objects;
drop policy if exists "media: update own"  on storage.objects;
drop policy if exists "media: delete own"  on storage.objects;
drop policy if exists "exports: select own storage"  on storage.objects;
drop policy if exists "exports: insert own storage"  on storage.objects;
drop policy if exists "exports: delete own storage"  on storage.objects;

create policy "media: select own"
  on storage.objects for select
  using (
    bucket_id = 'media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "media: insert own"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "media: update own"
  on storage.objects for update
  using (
    bucket_id = 'media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "media: delete own"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- 24. STORAGE POLICIES — bucket: exports
-- ============================================================

create policy "exports: select own storage"
  on storage.objects for select
  using (
    bucket_id = 'exports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "exports: insert own storage"
  on storage.objects for insert
  with check (
    bucket_id = 'exports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "exports: delete own storage"
  on storage.objects for delete
  using (
    bucket_id = 'exports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- FINE MIGRATION 001
-- ============================================================
