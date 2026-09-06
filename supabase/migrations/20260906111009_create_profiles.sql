create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
    constraint profiles_display_name_normalized_check
      check (display_name = btrim(display_name))
    constraint profiles_display_name_length_check
      check (char_length(display_name) between 1 and 50)
    constraint profiles_display_name_control_check
      check (display_name !~ '[[:cntrl:]]'),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp()
);

comment on table public.profiles is
  'D-023 operational profile: one canonical display name per Auth user.';

create function public.set_profile_timestamps()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := statement_timestamp();
  else
    new.created_at := old.created_at;
  end if;

  new.updated_at := statement_timestamp();
  return new;
end;
$$;

alter function public.set_profile_timestamps() owner to postgres;
revoke all on function public.set_profile_timestamps() from public, anon, authenticated;

create trigger set_profile_timestamps
before insert or update on public.profiles
for each row execute function public.set_profile_timestamps();

create function public.strip_profile_bootstrap_metadata()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'display_name';
  return new;
end;
$$;

alter function public.strip_profile_bootstrap_metadata() owner to postgres;
revoke all on function public.strip_profile_bootstrap_metadata() from public, anon, authenticated, service_role;

create trigger strip_profile_bootstrap_metadata_on_auth_update
before update on auth.users
for each row execute function public.strip_profile_bootstrap_metadata();

create function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_display_name text := new.raw_user_meta_data ->> 'display_name';
begin
  insert into public.profiles (id, display_name)
  values (new.id, requested_display_name);

  -- display_name is only bootstrap input for this trigger. Remove the duplicate
  -- from Auth metadata in the same transaction; public.profiles stays canonical.
  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'display_name'
  where id = new.id;

  return new;
end;
$$;

alter function public.handle_new_auth_user_profile() owner to postgres;
revoke all on function public.handle_new_auth_user_profile() from public, anon, authenticated, service_role;

create trigger create_profile_after_auth_user
after insert on auth.users
for each row execute function public.handle_new_auth_user_profile();

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

revoke all on table public.profiles from public, anon, authenticated;
grant select (id, display_name, created_at, updated_at) on public.profiles to authenticated;
grant insert (id, display_name) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
