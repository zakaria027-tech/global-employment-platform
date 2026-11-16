"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function getAuthenticatedProfile() {
  const supabase = await createClient();
  const { data: { claims }, error } = await supabase.auth.getClaims();

  if (error || !claims?.sub) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", claims.sub)
    .single();

  if (profileError || !profile) redirect("/login?error=profile");

  return { supabase, userId: claims.sub, role: profile.role };
}

export async function updateCandidateProfile(formData: FormData) {
  const { supabase, userId, role } = await getAuthenticatedProfile();
  if (role !== "candidate") redirect("/account?error=role");

  const displayName = value(formData, "display_name");
  const headline = value(formData, "headline");
  const summary = value(formData, "summary");
  const city = value(formData, "city");
  const experienceRaw = value(formData, "experience_years");
  const skills = value(formData, "skills")
    .split(/[\n,]/)
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 40);

  if (displayName.length < 2 || displayName.length > 120) {
    redirect("/account?error=display-name");
  }

  const experience = experienceRaw === "" ? null : Number(experienceRaw);
  if (experience !== null && (!Number.isFinite(experience) || experience < 0 || experience > 80)) {
    redirect("/account?error=experience");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", userId);

  if (profileError) redirect("/account?error=profile-save");

  const { error: candidateError } = await supabase
    .from("candidate_profiles")
    .upsert({
      user_id: userId,
      headline,
      summary,
      city: city || null,
      skills,
      experience_years: experience,
    }, { onConflict: "user_id" });

  if (candidateError) redirect("/account?error=candidate-save");

  revalidatePath("/account");
  redirect("/account?success=candidate");
}

export async function createOrganization(formData: FormData) {
  const { supabase, userId, role } = await getAuthenticatedProfile();
  if (role !== "employer") redirect("/account?error=role");

  const name = value(formData, "name");
  const contactEmail = value(formData, "contact_email");
  const countryCode = value(formData, "country_code").toUpperCase();
  const websiteUrl = value(formData, "website_url");
  const city = value(formData, "city");
  const address = value(formData, "address");
  const description = value(formData, "description");

  if (name.length < 2 || name.length > 180 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    redirect("/account?error=organization-details");
  }
  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
    redirect("/account?error=country-code");
  }
  if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
    redirect("/account?error=website-url");
  }

  const { data: existingMembership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existingMembership) redirect("/account?error=organization-exists");

  const { error } = await supabase.from("organizations").insert({
    owner_user_id: userId,
    name,
    contact_email: contactEmail,
    country_code: countryCode || null,
    website_url: websiteUrl || null,
    city: city || null,
    address: address || null,
    description,
  });

  if (error) redirect("/account?error=organization-create");

  revalidatePath("/account");
  redirect("/account?success=organization");
}

export async function updateOrganization(formData: FormData) {
  const { supabase, userId, role } = await getAuthenticatedProfile();
  if (role !== "employer") redirect("/account?error=role");

  const organizationId = value(formData, "organization_id");
  const name = value(formData, "name");
  const contactEmail = value(formData, "contact_email");
  const countryCode = value(formData, "country_code").toUpperCase();
  const websiteUrl = value(formData, "website_url");
  const city = value(formData, "city");
  const address = value(formData, "address");
  const description = value(formData, "description");

  if (!organizationId || name.length < 2 || name.length > 180 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    redirect("/account?error=organization-details");
  }
  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
    redirect("/account?error=country-code");
  }
  if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
    redirect("/account?error=website-url");
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    redirect("/account?error=organization-access");
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      contact_email: contactEmail,
      country_code: countryCode || null,
      website_url: websiteUrl || null,
      city: city || null,
      address: address || null,
      description,
    })
    .eq("id", organizationId);

  if (error) redirect("/account?error=organization-save");

  revalidatePath("/account");
  redirect("/account?success=organization");
}
