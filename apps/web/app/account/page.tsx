import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createOrganization, updateCandidateProfile, updateOrganization } from "@/app/account/actions";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  if (error || !claimsData?.claims?.sub) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role, preferred_language")
    .eq("id", claimsData.claims.sub)
    .maybeSingle();
  if (!profile) redirect("/login?error=profile");

  const isCandidate = profile.role === "candidate";
  const { data: candidate } = isCandidate
    ? await supabase.from("candidate_profiles")
        .select("headline, summary, city, skills, experience_years")
        .eq("user_id", claimsData.claims.sub).maybeSingle()
    : { data: null };

  const { data: membership } = !isCandidate
    ? await supabase.from("organization_members")
        .select("organization_id, role")
        .eq("user_id", claimsData.claims.sub).limit(1).maybeSingle()
    : { data: null };

  const { data: organization } = membership
    ? await supabase.from("organizations")
        .select("id, name, contact_email, website_url, country_code, city, address, description, status")
        .eq("id", membership.organization_id).maybeSingle()
    : { data: null };

  return (
    <main className="account-page">
      <section className="account-card account-dashboard">
        <div className="account-topbar">
          <Link className="auth-brand" href="/">Global Employment</Link>
          <form action={signOut}><button className="button button-secondary" type="submit">Sign out</button></form>
        </div>
        <p className="auth-eyebrow">{isCandidate ? "Candidate workspace" : "Employer workspace"}</p>
        <h1>Welcome, {profile.display_name || "there"}</h1>
        <p className="auth-muted">{isCandidate
          ? "Complete your professional profile so employers can better understand your experience."
          : "Set up your organization profile. New organizations remain pending until reviewed."}</p>

        {isCandidate ? (
          <form className="auth-form profile-form" action={updateCandidateProfile}>
            <h2>Your professional profile</h2>
            <label htmlFor="display_name">Full name</label>
            <input id="display_name" name="display_name" required minLength={2} maxLength={120} defaultValue={profile.display_name} />
            <label htmlFor="headline">Professional headline</label>
            <input id="headline" name="headline" maxLength={160} defaultValue={candidate?.headline ?? ""} placeholder="e.g. Warehouse assistant / Front-end developer" />
            <label htmlFor="summary">About you</label>
            <textarea id="summary" name="summary" rows={5} maxLength={3000} defaultValue={candidate?.summary ?? ""} />
            <label htmlFor="city">City</label>
            <input id="city" name="city" maxLength={120} defaultValue={candidate?.city ?? ""} />
            <label htmlFor="skills">Skills</label>
            <textarea id="skills" name="skills" rows={3} defaultValue={(candidate?.skills ?? []).join(", ")} placeholder="Customer service, Excel, communication" />
            <label htmlFor="experience_years">Years of experience</label>
            <input id="experience_years" name="experience_years" type="number" min="0" max="80" step="0.5" defaultValue={candidate?.experience_years ?? ""} />
            <button className="button auth-submit" type="submit">Save profile</button>
          </form>
        ) : organization ? (
          <form className="auth-form profile-form" action={updateOrganization}>
            <h2>Organization profile</h2>
            <input type="hidden" name="organization_id" value={organization.id} />
            <div className="organization-status"><span>Verification status</span><strong>{organization.status}</strong></div>
            <label htmlFor="name">Company or project name</label>
            <input id="name" name="name" required minLength={2} maxLength={180} defaultValue={organization.name} />
            <label htmlFor="contact_email">Contact email</label>
            <input id="contact_email" name="contact_email" type="email" required defaultValue={organization.contact_email} />
            <label htmlFor="website_url">Website</label>
            <input id="website_url" name="website_url" type="url" defaultValue={organization.website_url ?? ""} placeholder="https://" />
            <label htmlFor="country_code">Country code (ISO 2 letters)</label>
            <input id="country_code" name="country_code" minLength={2} maxLength={2} defaultValue={organization.country_code ?? ""} placeholder="US, GB, MA" />
            <label htmlFor="city">City</label>
            <input id="city" name="city" defaultValue={organization.city ?? ""} />
            <label htmlFor="address">Address</label>
            <input id="address" name="address" defaultValue={organization.address ?? ""} />
            <label htmlFor="description">About the organization</label>
            <textarea id="description" name="description" rows={5} maxLength={5000} defaultValue={organization.description} />
            <button className="button auth-submit" type="submit">Save organization</button>
          </form>
        ) : (
          <form className="auth-form profile-form" action={createOrganization}>
            <h2>Create your organization profile</h2>
            <label htmlFor="name">Company or project name</label>
            <input id="name" name="name" required minLength={2} maxLength={180} />
            <label htmlFor="contact_email">Contact email</label>
            <input id="contact_email" name="contact_email" type="email" required />
            <label htmlFor="website_url">Website</label>
            <input id="website_url" name="website_url" type="url" placeholder="https://" />
            <label htmlFor="country_code">Country code (ISO 2 letters)</label>
            <input id="country_code" name="country_code" minLength={2} maxLength={2} placeholder="US, GB, MA" />
            <label htmlFor="city">City</label>
            <input id="city" name="city" />
            <label htmlFor="address">Address</label>
            <input id="address" name="address" />
            <label htmlFor="description">About the organization</label>
            <textarea id="description" name="description" rows={5} maxLength={5000} />
            <button className="button auth-submit" type="submit">Create organization</button>
            <p className="auth-hint">Your organization will be marked pending until the verification process is completed.</p>
          </form>
        )}

        {isCandidate ? <p><Link className="button button-secondary" href="/account/applications">My applications</Link> <Link className="button button-secondary" href="/jobs">Browse jobs</Link></p> : <p><Link className="button button-secondary" href="/employer/jobs">Manage vacancies</Link> <Link className="button button-secondary" href="/employer/applications">Review applications</Link></p>}
        <dl className="account-details">
          <div><dt>Account type</dt><dd>{profile.role}</dd></div>
          <div><dt>Preferred language</dt><dd>{profile.preferred_language}</dd></div>
          {membership && <div><dt>Organization access</dt><dd>{membership.role}</dd></div>}
        </dl>
      </section>
    </main>
  );
}
