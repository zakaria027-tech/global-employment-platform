import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applyToJob } from "@/app/jobs/actions";

export default async function JobDetailPage({ params, searchParams }: { params: Promise<{id:string}>; searchParams: Promise<{error?:string}> }) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("*,organizations(name,city,country_code,website_url,status)").eq("id",id).single();
  if (!job) notFound();
  const org = Array.isArray(job.organizations) ? job.organizations[0] : job.organizations;
  const { data: claims } = await supabase.auth.getClaims();
  let role: string | null = null;
  let alreadyApplied = false;
  if (claims?.claims?.sub) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id",claims.claims.sub).maybeSingle();
    role = profile?.role ?? null;
    if (role === "candidate") {
      const { data } = await supabase.from("job_applications").select("id").eq("job_id",id).eq("candidate_user_id",claims.claims.sub).maybeSingle();
      alreadyApplied = Boolean(data);
    }
  }
  const salary = job.salary_min != null || job.salary_max != null ? `${job.salary_min ?? "—"} – ${job.salary_max ?? "—"} ${job.currency} / ${job.pay_period}` : "Not disclosed";
  return <main className="job-detail-page"><header className="jobs-header"><Link className="brand" href="/"><span className="brand-mark">G</span><span>Global Employment</span></Link><Link href="/jobs">← All jobs</Link></header>
    <article className="job-detail"><span className="job-tag">{job.workplace_type.replace("_"," ")}</span><h1>{job.title}</h1><p className="job-company">{org?.name}</p><p className="job-location">{[job.city,job.country_code].filter(Boolean).join(", ") || "Location not specified"}</p>
      <div className="job-facts"><div><small>Compensation</small><strong>{salary}</strong></div><div><small>Employment</small><strong>{job.employment_type.replace("_"," ")}</strong></div><div><small>Open positions</small><strong>{job.openings}</strong></div></div>
      <section><h2>About this role</h2><p className="job-full-text">{job.description}</p></section>
      {job.requirements && <section><h2>Requirements</h2><p className="job-full-text">{job.requirements}</p></section>}
      <section className="apply-panel"><h2>Interested in this position?</h2>
        {query.error === "already-applied" ? <p className="auth-message">You have already applied for this vacancy.</p> : null}
        {query.error === "application-failed" ? <p className="auth-message">Your application could not be submitted. Please try again.</p> : null}
        {!claims?.claims?.sub ? <p> <Link href="/login">Sign in</Link> or <Link href="/register">create a candidate account</Link> to apply.</p>
        : role !== "candidate" ? <p>Applications are available to candidate accounts.</p>
        : alreadyApplied ? <p className="job-tag">Application already submitted</p>
        : job.status !== "published" ? <p>This vacancy is not currently accepting applications.</p>
        : <form action={applyToJob} className="auth-form"><input type="hidden" name="job_id" value={job.id}/><label htmlFor="cover_letter">Cover letter (optional)</label><textarea id="cover_letter" name="cover_letter" rows={5} maxLength={5000} placeholder="Introduce yourself and explain why you are a good fit."/><button className="button auth-submit" type="submit">Submit application</button></form>}
      </section>
    </article>
  </main>;
}