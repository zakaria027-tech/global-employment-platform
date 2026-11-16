"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function authenticatedProfile() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (!profile) redirect("/login?error=profile");
  return { supabase, userId, role: profile.role };
}

export async function createJob(formData: FormData) {
  const { supabase, userId, role } = await authenticatedProfile();
  if (role !== "employer") redirect("/account?error=role");

  const title = field(formData, "title");
  const description = field(formData, "description");
  const requirements = field(formData, "requirements");
  const city = field(formData, "city");
  const countryCode = field(formData, "country_code").toUpperCase();
  const employmentType = field(formData, "employment_type");
  const workplaceType = field(formData, "workplace_type");
  const currency = field(formData, "currency").toUpperCase();
  const payPeriod = field(formData, "pay_period");
  const salaryMinRaw = field(formData, "salary_min");
  const salaryMaxRaw = field(formData, "salary_max");
  const openings = Number(field(formData, "openings") || "1");
  const expiresAtRaw = field(formData, "expires_at");

  if (title.length < 3 || title.length > 180 || description.length < 30 || description.length > 12000) redirect("/employer/jobs/new?error=details");
  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) redirect("/employer/jobs/new?error=country");
  if (!/^[A-Z]{3}$/.test(currency)) redirect("/employer/jobs/new?error=currency");
  if (!Number.isInteger(openings) || openings < 1 || openings > 10000) redirect("/employer/jobs/new?error=openings");

  const salaryMin = salaryMinRaw ? Number(salaryMinRaw) : null;
  const salaryMax = salaryMaxRaw ? Number(salaryMaxRaw) : null;
  if ((salaryMin !== null && (!Number.isFinite(salaryMin) || salaryMin < 0)) ||
      (salaryMax !== null && (!Number.isFinite(salaryMax) || salaryMax < 0)) ||
      (salaryMin !== null && salaryMax !== null && salaryMax < salaryMin)) redirect("/employer/jobs/new?error=salary");

  const { data: membership } = await supabase.from("organization_members")
    .select("organization_id, role").eq("user_id", userId).limit(1).maybeSingle();
  if (!membership || !["owner", "admin", "recruiter"].includes(membership.role)) redirect("/account?error=organization-required");

  const { data: organization } = await supabase.from("organizations")
    .select("status").eq("id", membership.organization_id).single();
  const requestedStatus = field(formData, "status") === "published" ? "published" : "draft";
  const status = organization?.status === "verified" ? requestedStatus : "draft";

  const { data: job, error } = await supabase.from("jobs").insert({
    organization_id: membership.organization_id,
    created_by: userId,
    title,
    description,
    requirements,
    city: city || null,
    country_code: countryCode || null,
    employment_type: employmentType,
    workplace_type: workplaceType,
    currency,
    pay_period: payPeriod,
    salary_min: salaryMin,
    salary_max: salaryMax,
    openings,
    expires_at: expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null,
    status,
  }).select("id").single();

  if (error || !job) redirect("/employer/jobs/new?error=save");
  revalidatePath("/jobs");
  revalidatePath("/employer/jobs");
  redirect(status === "published" ? "/employer/jobs?success=published" : "/employer/jobs?success=draft");
}

export async function applyToJob(formData: FormData) {
  const { supabase, userId, role } = await authenticatedProfile();
  if (role !== "candidate") redirect("/account?error=candidate-only");
  const jobId = field(formData, "job_id");
  const coverLetter = field(formData, "cover_letter");
  if (!jobId || coverLetter.length > 5000) redirect("/jobs?error=application");

  const { error } = await supabase.from("job_applications").insert({
    job_id: jobId,
    candidate_user_id: userId,
    cover_letter: coverLetter,
  });
  if (error) redirect(`/jobs/${jobId}?error=${encodeURIComponent(error.code === "23505" ? "already-applied" : "application-failed")}`);

  revalidatePath("/account/applications");
  revalidatePath(`/jobs/${jobId}`);
  redirect("/account/applications?success=applied");
}

export async function updateApplicationStatus(formData: FormData) {
  const { supabase, userId, role } = await authenticatedProfile();
  if (role !== "employer") redirect("/account?error=role");
  const applicationId = field(formData, "application_id");
  const status = field(formData, "status");
  if (!applicationId || !["reviewing", "shortlisted", "rejected"].includes(status)) redirect("/employer/applications?error=status");

  const { data: membership } = await supabase.from("organization_members")
    .select("organization_id, role").eq("user_id", userId).limit(1).maybeSingle();
  if (!membership || !["owner", "admin", "recruiter"].includes(membership.role)) redirect("/account?error=organization-required");

  const { data: jobs } = await supabase.from("jobs").select("id").eq("organization_id", membership.organization_id);
  const jobIds = (jobs ?? []).map((job) => job.id);
  if (!jobIds.length) redirect("/employer/applications");

  const { error } = await supabase.from("job_applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", applicationId).in("job_id", jobIds);
  if (error) redirect("/employer/applications?error=update");

  revalidatePath("/employer/applications");
  redirect("/employer/applications?success=updated");
}
