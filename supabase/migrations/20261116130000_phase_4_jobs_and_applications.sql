-- Phase 4: vacancies and candidate applications
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  title text not null check (char_length(trim(title)) between 3 and 180),
  description text not null check (char_length(trim(description)) between 30 and 12000),
  requirements text not null default '',
  employment_type text not null default 'full_time' check (employment_type in ('full_time','part_time','contract','temporary','internship','freelance')),
  workplace_type text not null default 'on_site' check (workplace_type in ('on_site','hybrid','remote')),
  country_code char(2) check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  city text,
  location_details text,
  salary_min numeric(12,2) check (salary_min is null or salary_min >= 0),
  salary_max numeric(12,2) check (salary_max is null or salary_max >= 0),
  currency char(3) not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  pay_period text not null default 'monthly' check (pay_period in ('hourly','daily','weekly','monthly','yearly')),
  openings integer not null default 1 check (openings between 1 and 10000),
  status text not null default 'draft' check (status in ('draft','published','closed')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (salary_min is null or salary_max is null or salary_max >= salary_min),
  check (expires_at is null or expires_at > created_at)
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_user_id uuid not null references public.profiles(id) on delete cascade,
  cover_letter text not null default '' check (char_length(cover_letter) <= 5000),
  resume_url text,
  status text not null default 'submitted' check (status in ('submitted','reviewing','shortlisted','rejected','withdrawn')),
  employer_note text,
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, candidate_user_id)
);

create index if not exists jobs_public_search_idx on public.jobs(status, country_code, city, created_at desc);
create index if not exists jobs_org_status_idx on public.jobs(organization_id, status, created_at desc);
create index if not exists job_applications_candidate_idx on public.job_applications(candidate_user_id, applied_at desc);
create index if not exists job_applications_job_idx on public.job_applications(job_id, applied_at desc);

alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;

drop policy if exists "Anyone can view published jobs" on public.jobs;
drop policy if exists "Employers can create jobs for their organization" on public.jobs;
drop policy if exists "Employers can update jobs for their organization" on public.jobs;
drop policy if exists "Employers can delete jobs for their organization" on public.jobs;
drop policy if exists "Candidates can view their own applications" on public.job_applications;
drop policy if exists "Candidates can apply to published jobs" on public.job_applications;
drop policy if exists "Candidates can withdraw their own applications" on public.job_applications;
drop policy if exists "Employers can view applications to their jobs" on public.job_applications;
drop policy if exists "Employers can update applications to their jobs" on public.job_applications;
drop policy if exists "Members can read their verification status" on public.employer_verifications;

create policy "Anyone can view published jobs" on public.jobs
for select to anon, authenticated
using (
  (status = 'published' and (expires_at is null or expires_at > now())
   and exists (select 1 from public.organizations o where o.id = jobs.organization_id and o.status = 'verified'))
  or exists (select 1 from public.organization_members m where m.organization_id = jobs.organization_id and m.user_id = (select auth.uid()))
);

create policy "Employers can create jobs for their organization" on public.jobs
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'employer')
  and exists (select 1 from public.organization_members m where m.organization_id = jobs.organization_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','recruiter'))
);

create policy "Employers can update jobs for their organization" on public.jobs
for update to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = jobs.organization_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','recruiter')))
with check (exists (select 1 from public.organization_members m where m.organization_id = jobs.organization_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','recruiter')));

create policy "Employers can delete jobs for their organization" on public.jobs
for delete to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = jobs.organization_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin')));

create policy "Candidates can view their own applications" on public.job_applications
for select to authenticated using (candidate_user_id = (select auth.uid()));

create policy "Candidates can apply to published jobs" on public.job_applications
for insert to authenticated
with check (
  candidate_user_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'candidate')
  and exists (select 1 from public.jobs j join public.organizations o on o.id = j.organization_id
    where j.id = job_applications.job_id and j.status = 'published'
    and (j.expires_at is null or j.expires_at > now()) and o.status = 'verified')
);

create policy "Candidates can withdraw their own applications" on public.job_applications
for update to authenticated
using (candidate_user_id = (select auth.uid()) and status in ('submitted','reviewing'))
with check (candidate_user_id = (select auth.uid()) and status = 'withdrawn');

create policy "Employers can view applications to their jobs" on public.job_applications
for select to authenticated
using (exists (select 1 from public.jobs j join public.organization_members m on m.organization_id = j.organization_id
  where j.id = job_applications.job_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','recruiter')));

create policy "Employers can update applications to their jobs" on public.job_applications
for update to authenticated
using (exists (select 1 from public.jobs j join public.organization_members m on m.organization_id = j.organization_id
  where j.id = job_applications.job_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','recruiter')))
with check (exists (select 1 from public.jobs j join public.organization_members m on m.organization_id = j.organization_id
  where j.id = job_applications.job_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','recruiter')));

-- Verification policy must bind the membership to this verification's organization.
drop policy if exists "Members can read their verification status" on public.employer_verifications;
create policy "Members can read their verification status" on public.employer_verifications
for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = employer_verifications.organization_id and m.user_id = (select auth.uid())));

-- Index the job creator foreign key and combine overlapping application policies.
create index if not exists jobs_created_by_idx on public.jobs(created_by);
drop policy if exists "Candidates can view their own applications" on public.job_applications;
drop policy if exists "Employers can view applications to their jobs" on public.job_applications;
create policy "Candidates and employers can view permitted applications" on public.job_applications
for select to authenticated
using (
 candidate_user_id = (select auth.uid())
 or exists (select 1 from public.jobs j join public.organization_members m on m.organization_id=j.organization_id
   where j.id=job_applications.job_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin','recruiter'))
);
drop policy if exists "Candidates can withdraw their own applications" on public.job_applications;
drop policy if exists "Employers can update applications to their jobs" on public.job_applications;
create policy "Candidates and employers can update permitted applications" on public.job_applications
for update to authenticated
using (
 (candidate_user_id=(select auth.uid()) and status in ('submitted','reviewing'))
 or exists (select 1 from public.jobs j join public.organization_members m on m.organization_id=j.organization_id
   where j.id=job_applications.job_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin','recruiter'))
)
with check (
 (candidate_user_id=(select auth.uid()) and status='withdrawn')
 or exists (select 1 from public.jobs j join public.organization_members m on m.organization_id=j.organization_id
   where j.id=job_applications.job_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin','recruiter'))
);
