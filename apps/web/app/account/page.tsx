import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { claims }, error } = await supabase.auth.getClaims();

  if (error || !claims?.sub) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role, preferred_language")
    .eq("id", claims.sub)
    .maybeSingle();

  return (
    <main className="account-page">
      <section className="account-card">
        <Link className="auth-brand" href="/">Global Employment</Link>
        <p className="auth-eyebrow">Your account</p>
        <h1>Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}</h1>
        <p className="auth-muted">Your account is authenticated. Profile and organization tools will be added in the next implementation step.</p>
        <dl className="account-details">
          <div><dt>Account type</dt><dd>{profile?.role ?? "Profile pending"}</dd></div>
          <div><dt>Preferred language</dt><dd>{profile?.preferred_language ?? "en"}</dd></div>
        </dl>
        <form action={signOut}><button className="button button-secondary" type="submit">Sign out</button></form>
      </section>
    </main>
  );
}
