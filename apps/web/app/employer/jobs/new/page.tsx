import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createJob } from "@/app/jobs/actions";

export default async function NewJobPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id",claims.claims.sub).single();
  if (profile?.role !== "employer") redirect("/account?error=role");
  const { data: membership } = await supabase.from("organization_members").select("organization_id").eq("user_id",claims.claims.sub).limit(1).maybeSingle();
  if (!membership) redirect("/account?error=organization-required");
  const { data: organization } = await supabase.from("organizations").select("name,status").eq("id",membership.organization_id).single();
  return <main className="account-page"><section className="account-card account-dashboard"><Link href="/employer/jobs">← Employer jobs</Link><p className="auth-eyebrow">Recruitment workspace</p><h1>Publish a vacancy</h1><p className="auth-muted">For {organization?.name}. Employers must be verified before vacancies become publicly visible.</p>
    {organization?.status !== "verified" && <p className="auth-message">Your organization is pending verification. You can save drafts, but publishing will remain disabled until approval.</p>}
    <form action={createJob} className="auth-form profile-form">
      <label htmlFor="title">Job title</label><input id="title" name="title" required minLength={3} maxLength={180} placeholder="e.g. Production line operator"/>
      <label htmlFor="description">Job description</label><textarea id="description" name="description" rows={7} required minLength={30} maxLength={12000}/>
      <label htmlFor="requirements">Requirements and skills</label><textarea id="requirements" name="requirements" rows={4} maxLength={6000}/>
      <div className="form-two-col"><div><label htmlFor="employment_type">Employment type</label><select id="employment_type" name="employment_type"><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option><option value="temporary">Temporary</option><option value="internship">Internship</option><option value="freelance">Freelance</option></select></div><div><label htmlFor="workplace_type">Workplace</label><select id="workplace_type" name="workplace_type"><option value="on_site">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select></div></div>
      <div className="form-two-col"><div><label htmlFor="city">City</label><input id="city" name="city"/></div><div><label htmlFor="country_code">Country code</label><input id="country_code" name="country_code" maxLength={2} placeholder="MA"/></div></div>
      <div className="form-two-col"><div><label htmlFor="salary_min">Minimum salary</label><input id="salary_min" name="salary_min" type="number" min="0" step="0.01"/></div><div><label htmlFor="salary_max">Maximum salary</label><input id="salary_max" name="salary_max" type="number" min="0" step="0.01"/></div></div>
      <div className="form-two-col"><div><label htmlFor="currency">Currency (3 letters)</label><input id="currency" name="currency" defaultValue="USD" minLength={3} maxLength={3} required/></div><div><label htmlFor="pay_period">Pay period</label><select id="pay_period" name="pay_period"><option value="monthly">Monthly</option><option value="hourly">Hourly</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="yearly">Yearly</option></select></div></div>
      <div className="form-two-col"><div><label htmlFor="openings">Number of openings</label><input id="openings" name="openings" type="number" min="1" max="10000" defaultValue="1"/></div><div><label htmlFor="expires_at">Closing date (optional)</label><input id="expires_at" name="expires_at" type="date"/></div></div>
      <label htmlFor="status">Save as</label><select id="status" name="status"><option value="draft">Draft</option><option value="published" disabled={organization?.status !== "verified"}>Publish vacancy</option></select>
      <button className="button auth-submit" type="submit">Save vacancy</button>
    </form></section></main>;
}