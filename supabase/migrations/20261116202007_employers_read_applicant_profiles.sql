-- Allow employers to review the basic profile information of candidates
-- who have explicitly applied to one of their organization's vacancies.
drop policy if exists "Employers can view profiles of applicants to their jobs" on public.profiles;
create policy "Employers can view profiles of applicants to their jobs"
on public.profiles
for select to authenticated
using (
  exists (
    select 1
    from public.job_applications ja
    join public.jobs j on j.id = ja.job_id
    join public.organization_members m on m.organization_id = j.organization_id
    where ja.candidate_user_id = profiles.id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'recruiter')
  )
);

drop policy if exists "Employers can view candidate profiles for applicants" on public.candidate_profiles;
create policy "Employers can view candidate profiles for applicants"
on public.candidate_profiles
for select to authenticated
using (
  exists (
    select 1
    from public.job_applications ja
    join public.jobs j on j.id = ja.job_id
    join public.organization_members m on m.organization_id = j.organization_id
    where ja.candidate_user_id = candidate_profiles.user_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'recruiter')
  )
);
