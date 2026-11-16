import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Search = { q?: string; country?: string; city?: string; workplace?: string };
export default async function JobsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("jobs").select("id,title,description,city,country_code,employment_type,workplace_type,salary_min,salary_max,currency,pay_period,created_at,organizations(name,website_url)")
    .eq("status", "published").order("created_at", { ascending: false }).limit(60);
  if (params.q) query = query.ilike("title", `%${params.q.slice(0,80)}%`);
  if (params.country) query = query.eq("country_code", params.country.toUpperCase().slice(0,2));
  if (params.city) query = query.ilike("city", `%${params.city.slice(0,80)}%`);
  if (params.workplace && ["remote","hybrid","on_site"].includes(params.workplace)) query = query.eq("workplace_type", params.workplace);
  const { data: jobs, error } = await query;

  return <main className="jobs-page">
    <header className="jobs-header"><Link className="brand" href="/"><span className="brand-mark">G</span><span>Global Employment</span></Link><nav><Link href="/login">Sign in</Link><Link className="button" href="/register">Create account</Link></nav></header>
    <section className="jobs-intro"><span className="eyebrow">Find your next opportunity</span><h1>Explore open positions</h1><p>Search published vacancies from verified employers around the world.</p>
      <form className="job-search" method="get">
        <input name="q" placeholder="Job title or role" defaultValue={params.q ?? ""} aria-label="Job title"/>
        <input name="city" placeholder="City" defaultValue={params.city ?? ""} aria-label="City"/>
        <input name="country" placeholder="Country code (e.g. MA)" maxLength={2} defaultValue={params.country ?? ""} aria-label="Country code"/>
        <select name="workplace" defaultValue={params.workplace ?? ""} aria-label="Workplace type"><option value="">Any workplace</option><option value="on_site">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select>
        <button className="button" type="submit">Search jobs</button>
      </form>
    </section>
    <section className="job-results"><div className="job-results-heading"><h2>Available opportunities</h2><span>{jobs?.length ?? 0} positions</span></div>
      {error ? <p className="empty-state">Could not load vacancies right now. Please try again.</p> : jobs?.length ? <div className="job-grid">{jobs.map((job) => {
        const org = Array.isArray(job.organizations) ? job.organizations[0] : job.organizations;
        return <article className="job-card" key={job.id}><div className="job-card-top"><span className="job-tag">{job.workplace_type.replace("_"," ")}</span><span className="job-date">{new Date(job.created_at).toLocaleDateString()}</span></div><h3><Link href={`/jobs/${job.id}`}>{job.title}</Link></h3><p className="job-company">{org?.name ?? "Verified employer"}</p><p className="job-location">{[job.city,job.country_code].filter(Boolean).join(", ") || "Location not specified"}</p><p className="job-excerpt">{job.description.slice(0,150)}{job.description.length>150?"…":""}</p><div className="job-card-bottom"><span>{job.salary_min != null || job.salary_max != null ? `${job.salary_min ?? "—"}–${job.salary_max ?? "—"} ${job.currency} / ${job.pay_period}` : "Salary not disclosed"}</span><Link href={`/jobs/${job.id}`}>View details →</Link></div></article>;
      })}</div> : <div className="empty-state"><h3>No vacancies found yet</h3><p>Try a different search, or check back soon as employers publish new roles.</p></div>}
    </section>
    <footer className="jobs-footer">Global Employment · Connecting talent with opportunity</footer>
  </main>;
}