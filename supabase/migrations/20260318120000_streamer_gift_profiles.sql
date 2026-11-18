-- Presente Real: dados de entrega/medidas do STREAMER (quem recebe)
-- Comprador NÃO lê esta tabela via client (RLS só dono).

create table if not exists public.streamer_gift_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  full_name text not null,
  phone text not null,
  cep text not null,
  street text not null,
  number text not null,
  complement text,
  neighborhood text not null,
  city text not null,
  state text not null,
  shoe_size text not null,
  height_cm numeric(5,1),
  weight_kg numeric(5,1),
  clothing_size text check (clothing_size is null or clothing_size in ('P', 'M', 'G', 'GG', 'XG')),
  bust_cm numeric(5,1),
  waist_cm numeric(5,1),
  hip_cm numeric(5,1),
  foot_length_cm numeric(5,1),
  confirm_data boolean not null default false,
  accept_privacy boolean not null default false,
  receiving_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint streamer_gift_confirm check (confirm_data = true),
  constraint streamer_gift_privacy check (accept_privacy = true)
);

create index if not exists streamer_gift_profiles_receiving_idx
  on public.streamer_gift_profiles (receiving_enabled)
  where receiving_enabled = true;

create or replace function public.touch_streamer_gift_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists streamer_gift_profiles_updated_at on public.streamer_gift_profiles;
create trigger streamer_gift_profiles_updated_at
  before update on public.streamer_gift_profiles
  for each row execute function public.touch_streamer_gift_profiles_updated_at();

alter table public.streamer_gift_profiles enable row level security;

drop policy if exists streamer_gift_select_own on public.streamer_gift_profiles;
create policy streamer_gift_select_own
  on public.streamer_gift_profiles
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists streamer_gift_insert_own on public.streamer_gift_profiles;
create policy streamer_gift_insert_own
  on public.streamer_gift_profiles
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists streamer_gift_update_own on public.streamer_gift_profiles;
create policy streamer_gift_update_own
  on public.streamer_gift_profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists streamer_gift_delete_own on public.streamer_gift_profiles;
create policy streamer_gift_delete_own
  on public.streamer_gift_profiles
  for delete to authenticated
  using (user_id = auth.uid());

-- Status público mínimo: comprador só sabe se o streamer ACEITA presentes (sem endereço/medidas)
create or replace function public.streamer_accepts_real_gifts(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.streamer_gift_profiles
    where user_id = p_user_id
      and receiving_enabled = true
  );
$$;

revoke all on function public.streamer_accepts_real_gifts(uuid) from public;
grant execute on function public.streamer_accepts_real_gifts(uuid) to authenticated;
