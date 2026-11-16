import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CandidateApplicationsPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id",claims.claims.sub).single();
  if (profile?.role !== "candidate") redirect("/account?error=role");
  const { data: applications } = await supabase.from("job_applications")
    .select("id,status,applied_at,jobs(id,title,city,country_code,organizations(name))")
    .eq("candidate_user_id",claims.claims.sub).order("applied_at",{ascending:false});
  return <main className="jobs-page"><header className="jobs-header"><Link href="/account">← Account dashboard</Link><Link className="button" href="/jobs">Find jobs</Link></header><section className="job-results"><h1>My applications</h1>
    {!applications?.length ? <div className="empty-state"><h3>You have not applied to any jobs</h3><p>Explore open positions and submit your first application.</p><Link className="button" href="/jobs">Explore vacancies</Link></div> :
    <div className="employer-job-list">{applications.map(app=>{const job=Array.isArray(app.jobs)?app.jobs[0]:app.jobs;const org=job && (Array.isArray(job.organizations)?job.organizations[0]:job.organizations);return <article className="employer-job-row" key={app.id}><div><h3>{job?.title ?? "Vacancy"}</h3><p>{org?.name ?? "Employer"} · {[job?.city,job?.country_code].filter(Boolean).join(", ")}</p></div><span className={`status-pill status-${app.status}`}>{app.status}</span><small>{new Date(app.applied_at).toLocaleDateString()}</small>{job?.id && <Link href={`/jobs/${job.id}`}>View job</Link>}</article>;})}</div>}
  </section></main>;
}