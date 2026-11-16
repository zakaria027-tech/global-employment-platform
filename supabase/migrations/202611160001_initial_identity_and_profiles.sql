-- Global Employment Platform
-- Phase 2 / Migration 001: identity, candidate profiles, and organizations.
-- Apply through the Supabase SQL Editor or Supabase CLI after creating a project.

create extension if not exists pgcrypto;

create type public.account_role as enum ('candidate', 'employer');
create type public.organization_status as enum ('pending', 'verified', 'rejected', 'suspended');
create type public.organization_member_role as enum ('owner', 'admin', 'recruiter');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.account_role not null default 'candidate',
  display_name text not null default '',
  country_code char(2),
  preferred_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_country_code_format
    check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  constraint profiles_preferred_language_format
    check (preferred_language ~ '^[a-z]{2,3}([_-][A-Za-z0-9]{2,8})*$')
);

create table public.candidate_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  headline text not null default '',
  summary text not null default '',
  city text,
  skills text[] not null default '{}',
  experience_years numeric(4,1) check (experience_years is null or experience_years between 0 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 180),
  website_url text,
  contact_email text not null,
  country_code char(2),
  city text,
  address text,
  description text not null default '',
  status public.organization_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_country_code_format
    check (country_code is null or country_code ~ '^[A-Z]{2}$')
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.organization_member_role not null default 'recruiter',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.employer_verifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  status public.organization_status not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_notes text
);

create index organizations_status_country_idx
  on public.organizations(status, country_code);
create index organization_members_user_idx
  on public.organization_members(user_id);

-- Keep updated_at consistent.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger candidate_profiles_set_updated_at
before update on public.candidate_profiles
for each row execute function public.set_updated_at();

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

-- Role is selected at sign-up but cannot be changed by editing a profile later.
create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'Account role cannot be changed after registration';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
before update of role on public.profiles
for each row execute function public.prevent_profile_role_change();

-- Create a private profile automatically for every new Auth user.
-- Only candidate/employer roles are accepted; admin is never self-assignable.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  safe_role public.account_role;
  safe_name text;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'candidate');
  safe_role := case
    when requested_role = 'employer' then 'employer'::public.account_role
    else 'candidate'::public.account_role
  end;
  safe_name := left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 120);

  insert into public.profiles (id, role, display_name)
  values (new.id, safe_role, safe_name);

  if safe_role = 'candidate' then
    insert into public.candidate_profiles (user_id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- New organizations automatically receive an owner membership.
create or replace function public.add_organization_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.owner_user_id, 'owner');
  return new;
end;
$$;

create trigger organizations_add_owner
after insert on public.organizations
for each row execute procedure public.add_organization_owner();

-- Enable Row Level Security on every user-facing table.
alter table public.profiles enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.employer_verifications enable row level security;

-- Profiles are private in the initial release.
create policy "Users can read their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Candidates can read their own candidate profile"
on public.candidate_profiles for select to authenticated
using (user_id = (select auth.uid()));

create policy "Candidates can insert their own candidate profile"
on public.candidate_profiles for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'candidate'
  )
);

create policy "Candidates can update their own candidate profile"
on public.candidate_profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'candidate'
  )
);

create policy "Users can create organizations for themselves"
on public.organizations for insert to authenticated
with check (
  owner_user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'employer'
  )
);

create policy "Organization members can read their organizations"
on public.organizations for select to authenticated
using (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = id and m.user_id = (select auth.uid())
  )
  or status = 'verified'
);

create policy "Organization owners and admins can update their organizations"
on public.organizations for update to authenticated
using (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin')
  )
);

create policy "Members can view their organization membership"
on public.organization_members for select to authenticated
using (user_id = (select auth.uid()));

-- Membership changes are intentionally not exposed to clients in this migration.
-- Invitations and role management will be added through trusted server actions.
create policy "Members can read their verification status"
on public.employer_verifications for select to authenticated
using (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = organization_id and m.user_id = (select auth.uid())
  )
);

-- Explicit table grants; RLS remains the row-level boundary.
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.candidate_profiles to authenticated;
grant select, insert, update on public.organizations to authenticated;
grant select on public.organization_members to authenticated;
grant select on public.employer_verifications to authenticated;

comment on table public.profiles is 'Private account profile; role is immutable after registration.';
comment on table public.candidate_profiles is 'Private candidate profile information.';
comment on table public.organizations is 'Employer organization records; new organizations require review.';
comment on table public.organization_members is 'Organization membership; writes are reserved for trusted workflows.';
