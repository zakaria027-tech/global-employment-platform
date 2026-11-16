import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateApplicationStatus } from "@/app/jobs/actions";

export default async function EmployerApplicationsPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id",claims.claims.sub).single();
  if (profile?.role !== "employer") redirect("/account?error=role");
  const { data: membership } = await supabase.from("organization_members").select("organization_id").eq("user_id",claims.claims.sub).limit(1).maybeSingle();
  if (!membership) redirect("/account?error=organization-required");
  const { data: jobs } = await supabase.from("jobs").select("id,title").eq("organization_id",membership.organization_id);
  const ids = (jobs ?? []).map(j=>j.id);
  const { data: applications } = ids.length ? await supabase.from("job_applications").select("id,job_id,candidate_user_id,cover_letter,status,applied_at,profiles!job_applications_candidate_user_id_fkey(display_name),candidate_profiles!candidate_profiles_user_id_fkey(headline,city,skills)").in("job_id",ids).order("applied_at",{ascending:false}) : {data:[]};
  const titles = new Map((jobs ?? []).map(j=>[j.id,j.title]));
  return <main className="jobs-page"><header className="jobs-header"><Link href="/employer/jobs">← Your vacancies</Link><Link className="button button-secondary" href="/account">Account</Link></header><section className="job-results"><h1>Candidate applications</h1>
    {!applications?.length ? <div className="empty-state"><h3>No applications yet</h3><p>Applications for your published vacancies will appear here.</p></div> :
    <div className="employer-job-list">{applications.map(app=><article className="application-card" key={app.id}><div className="job-results-heading"><div><h3>{(Array.isArray(app.profiles)?app.profiles[0]:app.profiles)?.display_name ?? "Candidate"}</h3><p>{(Array.isArray(app.candidate_profiles)?app.candidate_profiles[0]:app.candidate_profiles)?.headline ?? "Candidate profile"} · {titles.get(app.job_id)}</p></div><span className={`status-pill status-${app.status}`}>{app.status}</span></div>{app.cover_letter && <p className="job-excerpt">{app.cover_letter}</p>}<small>Applied {new Date(app.applied_at).toLocaleDateString()}</small><form action={updateApplicationStatus} className="inline-status-form"><input type="hidden" name="application_id" value={app.id}/><select name="status" defaultValue={app.status === "submitted" ? "reviewing" : app.status}><option value="reviewing">Reviewing</option><option value="shortlisted">Shortlisted</option><option value="rejected">Rejected</option></select><button className="button button-secondary" type="submit">Update status</button></form></article>)}</div>}
  </section></main>;
}