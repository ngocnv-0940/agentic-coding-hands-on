-- Sun* Kudos live board (F006): the 9 tables, their indexes, RLS and table grants.
-- Reads: every signed-in user (role authenticated) may SELECT every row; anon sees nothing.
-- Writes: no client write path at all. Rows come from migrations/seed; likes only through
-- public.toggle_kudo_like (SECURITY DEFINER, next migration).

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null
);

create table public.sunners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  full_name text not null,
  avatar_url text,
  department_id uuid references public.departments (id),
  hero_title text check (hero_title in ('new_hero', 'rising_hero', 'super_hero', 'legend_hero'))
);

create table public.hashtags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null
);

-- created_at keeps millisecond precision: the feed cursor travels through JS Date / ISO strings,
-- which carry milliseconds only, so a finer stored value (cursor truncated below it) would make the
-- next page skip rows. The check rejects any insert that is not a whole millisecond.
create table public.kudos (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.sunners (id),
  receiver_id uuid not null references public.sunners (id),
  title text,
  content text not null check (btrim(content) <> ''),
  created_at timestamptz not null default date_trunc('milliseconds', now())
    check (created_at = date_trunc('milliseconds', created_at)),
  check (sender_id <> receiver_id)
);

create table public.kudo_hashtags (
  kudo_id uuid not null references public.kudos (id) on delete cascade,
  hashtag_id uuid not null references public.hashtags (id) on delete cascade,
  primary key (kudo_id, hashtag_id)
);

create table public.kudo_images (
  id uuid primary key default gen_random_uuid(),
  kudo_id uuid not null references public.kudos (id) on delete cascade,
  url text not null,
  position smallint not null,
  unique (kudo_id, position)
);

-- One like per sunner per kudo (BR-002). hearts_awarded is the value credited to the sender at
-- like time (BR-004: 2 on a special day, else 1); deleting the row revokes exactly it (BR-005).
create table public.kudo_likes (
  kudo_id uuid not null references public.kudos (id) on delete cascade,
  sunner_id uuid not null references public.sunners (id) on delete cascade,
  hearts_awarded smallint not null check (hearts_awarded in (1, 2)),
  created_at timestamptz not null default now(),
  primary key (kudo_id, sunner_id)
);

-- A day (Asia/Ho_Chi_Minh calendar) on which a like is worth 2 hearts.
create table public.special_days (
  day date primary key
);

create table public.secret_boxes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.sunners (id) on delete cascade,
  opened_at timestamptz,
  prize_description text
);

create index kudos_created_at_id_idx on public.kudos (created_at desc, id desc);
create index kudos_receiver_id_idx on public.kudos (receiver_id);
create index kudos_sender_id_idx on public.kudos (sender_id);
create index kudo_hashtags_hashtag_id_idx on public.kudo_hashtags (hashtag_id);
create index kudo_likes_sunner_id_idx on public.kudo_likes (sunner_id);
create index secret_boxes_owner_id_idx on public.secret_boxes (owner_id);
create index secret_boxes_opened_at_idx on public.secret_boxes (opened_at desc) where opened_at is not null;
create index sunners_department_id_idx on public.sunners (department_id);

-- RLS: one read policy per table for authenticated; no insert/update/delete policy anywhere.
-- Kudos are company-wide content, so reads are not filtered by owner (permissions.md, Lớp 3).
alter table public.departments enable row level security;
alter table public.sunners enable row level security;
alter table public.hashtags enable row level security;
alter table public.kudos enable row level security;
alter table public.kudo_hashtags enable row level security;
alter table public.kudo_images enable row level security;
alter table public.kudo_likes enable row level security;
alter table public.special_days enable row level security;
alter table public.secret_boxes enable row level security;

create policy "authenticated can read departments" on public.departments for select to authenticated using (true);
create policy "authenticated can read sunners" on public.sunners for select to authenticated using (true);
create policy "authenticated can read hashtags" on public.hashtags for select to authenticated using (true);
create policy "authenticated can read kudos" on public.kudos for select to authenticated using (true);
create policy "authenticated can read kudo_hashtags" on public.kudo_hashtags for select to authenticated using (true);
create policy "authenticated can read kudo_images" on public.kudo_images for select to authenticated using (true);
create policy "authenticated can read kudo_likes" on public.kudo_likes for select to authenticated using (true);
create policy "authenticated can read special_days" on public.special_days for select to authenticated using (true);
create policy "authenticated can read secret_boxes" on public.secret_boxes for select to authenticated using (true);

-- Supabase's default privileges grant every table privilege to anon and authenticated; take the
-- write ones back so a missing policy is not the only thing standing between a client and a write.
revoke insert, update, delete, truncate, references, trigger
  on public.departments, public.sunners, public.hashtags, public.kudos, public.kudo_hashtags,
     public.kudo_images, public.kudo_likes, public.special_days, public.secret_boxes
  from anon, authenticated;
