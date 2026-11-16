-- Phase 3 hardening: close direct RPC execution on trigger-only definer functions.
-- These functions are intended to run only as table triggers, never as API RPCs.
revoke execute on function public.add_organization_owner() from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

-- Cover the owner foreign key reported by Supabase performance advisors.
create index if not exists organizations_owner_user_id_idx
  on public.organizations(owner_user_id);

-- Create a verification record automatically for every newly registered organization.
create or replace function public.create_employer_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.employer_verifications (organization_id, status)
  values (new.id, 'pending');
  return new;
end;
$$;

revoke execute on function public.create_employer_verification() from public, anon, authenticated;

drop trigger if exists organizations_create_verification on public.organizations;
create trigger organizations_create_verification
after insert on public.organizations
for each row execute function public.create_employer_verification();
