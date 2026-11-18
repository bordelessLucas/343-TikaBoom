-- TikaBoom: Auth profiles + social + media + realtime schema

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null default '',
  username text not null,
  photo_url text,
  bio text,
  followers integer not null default 0,
  following integer not null default 0,
  posts integer not null default 0,
  likes integer not null default 0,
  is_private boolean not null default false,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  constraint profiles_username_lower check (username = lower(username)),
  constraint profiles_username_unique unique (username)
);

create index profiles_username_idx on public.profiles (username);
create index profiles_display_name_idx on public.profiles (lower(display_name));

-- Auto-create profile from auth metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
  dname text;
begin
  uname := lower(coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1)));
  uname := regexp_replace(uname, '[^a-z0-9_]', '', 'g');
  if length(uname) < 1 then
    uname := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  -- ensure uniqueness
  while exists (select 1 from public.profiles where username = uname) loop
    uname := left(uname, 12) || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  end loop;

  dname := coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), uname);

  insert into public.profiles (id, email, display_name, username)
  values (new.id, coalesce(new.email, ''), dname, uname);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Follows
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index follows_following_idx on public.follows (following_id);

create or replace function public.tg_follow_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set following = following + 1 where id = new.follower_id;
    update public.profiles set followers = followers + 1 where id = new.following_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.profiles set following = greatest(following - 1, 0) where id = old.follower_id;
    update public.profiles set followers = greatest(followers - 1, 0) where id = old.following_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger follows_counts
  after insert or delete on public.follows
  for each row execute function public.tg_follow_counts();

-- Posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  author_username text not null,
  author_display_name text not null,
  author_photo_url text,
  media_type text not null check (media_type in ('photo', 'video')),
  media_url text not null,
  thumbnail_url text,
  title text not null default '',
  description text not null default '',
  hashtags text[] not null default '{}',
  is_private boolean not null default false,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  views integer not null default 0,
  saves integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_feed_idx on public.posts (is_private, created_at desc);
create index posts_author_idx on public.posts (author_id, created_at desc);
create index posts_hashtags_idx on public.posts using gin (hashtags);

create or replace function public.tg_post_author_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set posts = posts + 1 where id = new.author_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.profiles set posts = greatest(posts - 1, 0) where id = old.author_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger posts_author_count
  after insert or delete on public.posts
  for each row execute function public.tg_post_author_count();

-- Post likes / saves
create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.post_saves (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create or replace function public.tg_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes = likes + 1, updated_at = now() where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts set likes = greatest(likes - 1, 0), updated_at = now() where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger post_likes_count
  after insert or delete on public.post_likes
  for each row execute function public.tg_post_like_count();

create or replace function public.tg_post_save_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set saves = saves + 1, updated_at = now() where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts set saves = greatest(saves - 1, 0), updated_at = now() where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger post_saves_count
  after insert or delete on public.post_saves
  for each row execute function public.tg_post_save_count();

-- Comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  author_username text not null,
  author_photo_url text,
  text text not null,
  parent_id uuid references public.comments (id) on delete cascade,
  likes integer not null default 0,
  created_at timestamptz not null default now()
);

create index comments_post_idx on public.comments (post_id, created_at);

create table public.comment_likes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create or replace function public.tg_comment_post_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comments = comments + 1, updated_at = now() where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts set comments = greatest(comments - 1, 0), updated_at = now() where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger comments_post_count
  after insert or delete on public.comments
  for each row execute function public.tg_comment_post_count();

create or replace function public.tg_comment_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.comments set likes = likes + 1 where id = new.comment_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.comments set likes = greatest(likes - 1, 0) where id = old.comment_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger comment_likes_count
  after insert or delete on public.comment_likes
  for each row execute function public.tg_comment_like_count();

-- Chats
create table public.chats (
  id text primary key,
  last_message text,
  last_message_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chat_participants (
  chat_id text not null references public.chats (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  unread_count integer not null default 0,
  primary key (chat_id, user_id)
);

create index chat_participants_user_idx on public.chat_participants (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id text not null references public.chats (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  sender_username text not null,
  sender_photo_url text,
  text text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index messages_chat_idx on public.messages (chat_id, created_at desc);

-- Groups
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  interests text[] not null default '{}',
  last_message text,
  last_message_time timestamptz,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id);
create index groups_interests_idx on public.groups using gin (interests);

create table public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  sender_username text not null,
  sender_photo_url text,
  text text not null,
  created_at timestamptz not null default now()
);

create index group_messages_group_idx on public.group_messages (group_id, created_at desc);

-- Lives
create table public.lives (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  host_username text not null,
  host_display_name text not null,
  host_photo_url text,
  title text not null default 'LIVE',
  status text not null default 'live' check (status in ('live', 'ended')),
  room_name text not null,
  room_url text,
  viewer_count integer not null default 0,
  provider text not null default 'daily' check (provider in ('daily', 'livekit', 'local')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index lives_active_idx on public.lives (status, started_at desc);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('follow', 'like', 'comment')),
  actor_id uuid not null references public.profiles (id) on delete cascade,
  actor_username text not null,
  actor_photo_url text,
  post_id uuid references public.posts (id) on delete set null,
  post_title text,
  comment_text text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- Helper: is chat participant
create or replace function public.is_chat_participant(p_chat_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_participants
    where chat_id = p_chat_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_saves enable row level security;
alter table public.comments enable row level security;
alter table public.comment_likes enable row level security;
alter table public.chats enable row level security;
alter table public.chat_participants enable row level security;
alter table public.messages enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;
alter table public.lives enable row level security;
alter table public.notifications enable row level security;

-- Profiles policies
create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());

-- Follows
create policy follows_select on public.follows for select to authenticated using (true);
create policy follows_insert on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy follows_delete on public.follows for delete to authenticated using (follower_id = auth.uid());

-- Posts
create policy posts_select on public.posts for select to authenticated
  using (is_private = false or author_id = auth.uid());
create policy posts_insert on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy posts_update on public.posts for update to authenticated using (author_id = auth.uid() or true) with check (true);
create policy posts_delete on public.posts for delete to authenticated using (author_id = auth.uid());

-- Allow counters update by anyone authenticated (likes/views/shares via client + triggers)
-- Narrower: views/shares updates can be any authenticated
drop policy if exists posts_update on public.posts;
create policy posts_update_own on public.posts for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());
create policy posts_update_metrics on public.posts for update to authenticated
  using (true)
  with check (true);

-- Likes / saves
create policy post_likes_select on public.post_likes for select to authenticated using (true);
create policy post_likes_insert on public.post_likes for insert to authenticated with check (user_id = auth.uid());
create policy post_likes_delete on public.post_likes for delete to authenticated using (user_id = auth.uid());

create policy post_saves_select on public.post_saves for select to authenticated using (true);
create policy post_saves_insert on public.post_saves for insert to authenticated with check (user_id = auth.uid());
create policy post_saves_delete on public.post_saves for delete to authenticated using (user_id = auth.uid());

-- Comments
create policy comments_select on public.comments for select to authenticated using (true);
create policy comments_insert on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy comments_delete on public.comments for delete to authenticated using (author_id = auth.uid());

create policy comment_likes_select on public.comment_likes for select to authenticated using (true);
create policy comment_likes_insert on public.comment_likes for insert to authenticated with check (user_id = auth.uid());
create policy comment_likes_delete on public.comment_likes for delete to authenticated using (user_id = auth.uid());

-- Chats
create policy chats_select on public.chats for select to authenticated
  using (public.is_chat_participant(id));
create policy chats_insert on public.chats for insert to authenticated with check (true);
create policy chats_update on public.chats for update to authenticated
  using (public.is_chat_participant(id));

create policy chat_participants_select on public.chat_participants for select to authenticated
  using (user_id = auth.uid() or public.is_chat_participant(chat_id));
create policy chat_participants_insert on public.chat_participants for insert to authenticated with check (true);
create policy chat_participants_update on public.chat_participants for update to authenticated
  using (public.is_chat_participant(chat_id));

create policy messages_select on public.messages for select to authenticated
  using (public.is_chat_participant(chat_id));
create policy messages_insert on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_chat_participant(chat_id));
create policy messages_update on public.messages for update to authenticated
  using (public.is_chat_participant(chat_id));

-- Groups
create policy groups_select on public.groups for select to authenticated using (true);
create policy groups_insert on public.groups for insert to authenticated with check (owner_id = auth.uid());
create policy groups_update on public.groups for update to authenticated
  using (owner_id = auth.uid() or public.is_group_member(id));

create policy group_members_select on public.group_members for select to authenticated using (true);
create policy group_members_insert on public.group_members for insert to authenticated with check (user_id = auth.uid() or true);
create policy group_members_delete on public.group_members for delete to authenticated using (user_id = auth.uid());

create policy group_messages_select on public.group_messages for select to authenticated
  using (public.is_group_member(group_id));
create policy group_messages_insert on public.group_messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_group_member(group_id));

-- Lives
create policy lives_select on public.lives for select to authenticated using (true);
create policy lives_insert on public.lives for insert to authenticated with check (host_id = auth.uid());
create policy lives_update on public.lives for update to authenticated using (true) with check (true);

-- Notifications
create policy notifications_select on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_insert on public.notifications for insert to authenticated with check (actor_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated using (user_id = auth.uid());

-- Realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.chats;
alter publication supabase_realtime add table public.chat_participants;
alter publication supabase_realtime add table public.lives;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.group_messages;

-- Storage buckets
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('media', 'media', true)
on conflict (id) do nothing;

create policy avatars_public_read on storage.objects for select using (bucket_id = 'avatars');
create policy avatars_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy media_public_read on storage.objects for select using (bucket_id = 'media');
create policy media_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
