-- Extensions
create extension if not exists pgcrypto;

-- Tenants: each row is one showroom/dealership
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Showroom',
  owner_name text,
  phone text,
  address text,
  logo_url text,
  plan_type text not null default 'Standard',
  showroom_type text,
  status text not null default 'Active' check (status in ('Active', 'Suspended', 'Trial')),
  max_users int not null default 5,
  max_vehicles int not null default 500,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tenants is 'One row per showroom (tenant) using the platform.';

-- Profiles: links auth.users to a tenant with a role
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  full_name text,
  email text not null,
  role text not null default 'tenant-owner' check (role in ('tenant-owner', 'manager', 'staff')),
  permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Maps an authenticated user to a tenant and role.';

create index profiles_tenant_id_idx on public.profiles (tenant_id);

-- updated_at trigger helper, reused by every table below
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_set_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Returns the tenant_id of the currently authenticated user.
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

-- Returns the role of the currently authenticated user.
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Bootstraps a tenant + owner profile for a brand-new authenticated user
-- who has no profile yet. Called once from the app after first login.
create or replace function public.bootstrap_tenant_and_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  result public.profiles;
  caller_email text;
begin
  select id into result.id from public.profiles where id = auth.uid();

  if result.id is not null then
    select * into result from public.profiles where id = auth.uid();
    return result;
  end if;

  select email into caller_email from auth.users where id = auth.uid();

  insert into public.tenants (name)
  values (coalesce(split_part(caller_email, '@', 1), 'My Showroom'))
  returning id into new_tenant_id;

  insert into public.profiles (id, tenant_id, email, role)
  values (auth.uid(), new_tenant_id, coalesce(caller_email, ''), 'tenant-owner')
  returning * into result;

  return result;
end;
$$;
