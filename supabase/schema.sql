-- Run once in the Supabase SQL Editor for a new project.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.worship_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  time_text text not null default '',
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  image_url text not null default '',
  published_at timestamptz not null default now(),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.worship_services enable row level security;
alter table public.news_posts enable row level security;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;

grant select on public.site_settings, public.worship_services, public.news_posts to anon, authenticated;
grant insert, update, delete on public.site_settings, public.worship_services, public.news_posts to authenticated;
grant select on public.admin_users to authenticated;
revoke all on public.admin_users from anon;
revoke insert, update, delete on public.admin_users from authenticated;

drop policy if exists "Users can verify their own admin status" on public.admin_users;
create policy "Users can verify their own admin status" on public.admin_users
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings
  for select to anon, authenticated using (true);
drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings" on public.site_settings
  for all to authenticated
  using ((select public.is_site_admin())) with check ((select public.is_site_admin()));

drop policy if exists "Public can read visible worship services" on public.worship_services;
create policy "Public can read visible worship services" on public.worship_services
  for select to anon, authenticated using (is_visible = true);
drop policy if exists "Admins can manage worship services" on public.worship_services;
create policy "Admins can manage worship services" on public.worship_services
  for all to authenticated
  using ((select public.is_site_admin())) with check ((select public.is_site_admin()));

drop policy if exists "Public can read published news" on public.news_posts;
create policy "Public can read published news" on public.news_posts
  for select to anon, authenticated using (is_published = true);
drop policy if exists "Admins can manage news" on public.news_posts;
create policy "Admins can manage news" on public.news_posts
  for all to authenticated
  using ((select public.is_site_admin())) with check ((select public.is_site_admin()));

insert into public.site_settings (key, value) values
  ('church_name', '강북안디옥교회'),
  ('hero_message', '하나님의 뜻에 따라\n세계 선교와 민족지도자를\n양육하는 교회 (마 7:21)'),
  ('intro_title', '비전, 교단 내용이 담긴 간략한 소개'),
  ('intro_body', '강북안디옥교회를 소개합니다.'),
  ('phone', '02-3143-0191'),
  ('address', '서울 마포구 월드컵북로8길 32'),
  ('map_latitude', '37.5598636'),
  ('map_longitude', '126.9187769'),
  ('map_zoom', '16')
on conflict (key) do nothing;

insert into public.worship_services (name, time_text, sort_order, is_visible) values
  ('주일 예배', '11:00 ~', 1, true),
  ('수요 예배', '19:30 ~', 2, true),
  ('금요 예배', '시간 안내', 3, true),
  ('여리고기도회', '시간 안내', 4, true)
on conflict do nothing;
