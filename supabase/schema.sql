-- =========================================================
-- SCHEMA DISTRICT SCOUT - à coller dans Supabase > SQL Editor
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------- PROFILS (1 par compte connecté) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'chef' check (role in ('admin','chef')),
  troupe text,
  created_at timestamptz default now()
);

-- ---------- ORGANIGRAMME (annuaire / mini-organigramme) ----------
create table if not exists org_chart (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role text not null,            -- ex: "Chef de district", "Chef de troupe", "Adjoint"
  troupe text,                   -- null si niveau district
  level int not null default 1,  -- 0 = district, 1 = troupe
  email text,
  phone text,
  photo_url text,
  order_index int default 0,
  created_at timestamptz default now()
);

-- ---------- AGENDA ----------
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  date date not null,
  time text,                     -- "14:30" optionnel
  location text,
  troupe text,                   -- null = toutes les troupes
  reminder_days_before int default 3,
  reminder_sent boolean default false,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ---------- DOCUMENTS ----------
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  category text not null default 'Autre',
  link text,
  description text,
  created_at timestamptz default now()
);

-- ---------- SUPPORT CHEF (fiches) ----------
create table if not exists support_sections (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  order_index int default 0,
  created_at timestamptz default now()
);

-- ---------- PHOTOS D'ILLUSTRATION PAR PAGE ----------
create table if not exists page_images (
  id uuid primary key default uuid_generate_v4(),
  page_key text not null,        -- 'home' | 'agenda' | 'documents' | 'support' | 'contacts'
  url text not null,
  caption text,
  created_at timestamptz default now()
);

-- ---------- PARAMETRES (AGSE url, etc.) ----------
create table if not exists settings (
  key text primary key,
  value text
);
insert into settings (key, value) values ('agse_url', 'https://www.scouts-europe.org')
  on conflict (key) do nothing;

-- ---------- ABONNEMENTS PUSH ----------
create table if not exists push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz default now()
);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table profiles enable row level security;
alter table org_chart enable row level security;
alter table events enable row level security;
alter table documents enable row level security;
alter table support_sections enable row level security;
alter table page_images enable row level security;
alter table settings enable row level security;
alter table push_subscriptions enable row level security;

-- Tout utilisateur connecté (chef ou admin) peut LIRE
drop policy if exists "lecture connectes" on profiles;
create policy "lecture connectes" on profiles for select using (auth.uid() is not null);
drop policy if exists "lecture connectes" on org_chart;
create policy "lecture connectes" on org_chart for select using (auth.uid() is not null);
drop policy if exists "lecture connectes" on events;
create policy "lecture connectes" on events for select using (auth.uid() is not null);
drop policy if exists "lecture connectes" on documents;
create policy "lecture connectes" on documents for select using (auth.uid() is not null);
drop policy if exists "lecture connectes" on support_sections;
create policy "lecture connectes" on support_sections for select using (auth.uid() is not null);
drop policy if exists "lecture connectes" on page_images;
create policy "lecture connectes" on page_images for select using (auth.uid() is not null);
drop policy if exists "lecture connectes" on settings;
create policy "lecture connectes" on settings for select using (auth.uid() is not null);

-- Un utilisateur peut gérer son propre profil + ses abonnements push
drop policy if exists "maj son profil" on profiles;
create policy "maj son profil" on profiles for update using (auth.uid() = id);
drop policy if exists "ses abonnements" on push_subscriptions;
create policy "ses abonnements" on push_subscriptions for all using (auth.uid() = user_id);

-- Fonction utilitaire : est-ce que l'utilisateur connecté est admin ?
create or replace function is_admin() returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer;

-- Seuls les admins peuvent écrire sur le contenu partagé
drop policy if exists "admin ecrit org_chart" on org_chart;
create policy "admin ecrit org_chart" on org_chart for all using (is_admin()) with check (is_admin());
drop policy if exists "admin ecrit events" on events;
create policy "admin ecrit events" on events for all using (is_admin()) with check (is_admin());
drop policy if exists "admin ecrit documents" on documents;
create policy "admin ecrit documents" on documents for all using (is_admin()) with check (is_admin());
drop policy if exists "admin ecrit support" on support_sections;
create policy "admin ecrit support" on support_sections for all using (is_admin()) with check (is_admin());
drop policy if exists "admin ecrit images" on page_images;
create policy "admin ecrit images" on page_images for all using (is_admin()) with check (is_admin());
drop policy if exists "admin ecrit settings" on settings;
create policy "admin ecrit settings" on settings for all using (is_admin()) with check (is_admin());

-- =========================================================
-- Création automatique du profil à l'inscription
-- =========================================================
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email, 'chef');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =========================================================
-- IMPORTANT : passer ton premier compte en admin après inscription
-- update profiles set role = 'admin' where email = 'tonemail@example.com';
-- =========================================================

-- =========================================================
-- STORAGE : bucket pour les photos (à créer aussi via l'interface)
-- =========================================================
insert into storage.buckets (id, name, public) values ('images', 'images', true)
  on conflict (id) do nothing;

drop policy if exists "lecture publique images" on storage.objects;
create policy "lecture publique images" on storage.objects for select using (bucket_id = 'images');
drop policy if exists "admin upload images" on storage.objects;
create policy "admin upload images" on storage.objects for insert with check (bucket_id = 'images' and is_admin());
drop policy if exists "admin delete images" on storage.objects;
create policy "admin delete images" on storage.objects for delete using (bucket_id = 'images' and is_admin());
