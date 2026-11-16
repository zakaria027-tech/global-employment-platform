import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function EmployerJobsPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id",claims.claims.sub).single();
  if (profile?.role !== "employer") redirect("/account?error=role");
  const { data: membership } = await supabase.from("organization_members").select("organization_id").eq("user_id",claims.claims.sub).limit(1).maybeSingle();
  if (!membership) redirect("/account?error=organization-required");
  const { data: jobs } = await supabase.from("jobs").select("id,title,status,city,country_code,created_at,job_applications(count)").eq("organization_id",membership.organization_id).order("created_at",{ascending:false});
  return <main className="jobs-page"><header className="jobs-header"><Link className="brand" href="/account">← Account dashboard</Link><Link className="button" href="/employer/jobs/new">+ Publish a vacancy</Link></header><section className="job-results"><div className="job-results-heading"><h1>Your vacancies</h1><span>{jobs?.length ?? 0} total</span></div>
    {!jobs?.length ? <div className="empty-state"><h3>No vacancies yet</h3><p>Create your first job listing to start recruiting.</p><Link className="button" href="/employer/jobs/new">Create vacancy</Link></div>
    : <div className="employer-job-list">{jobs.map(job=><article className="employer-job-row" key={job.id}><div><h3>{job.title}</h3><p>{[job.city,job.country_code].filter(Boolean).join(", ") || "Location not set"} · {new Date(job.created_at).toLocaleDateString()}</p></div><span className={`status-pill status-${job.status}`}>{job.status}</span><span>{job.job_applications?.[0]?.count ?? 0} applications</span><Link href="/employer/applications">View applications</Link></article>)}</div>}
  </section></main>;
}