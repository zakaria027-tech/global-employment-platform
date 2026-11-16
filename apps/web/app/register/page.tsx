"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type AccountRole = "candidate" | "employer";

export default function RegisterPage() {
  const [role, setRole] = useState<AccountRole>("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
          data: { display_name: name.trim(), role },
        },
      });

      if (error) throw error;
      setMessage("Registration received. Check your email to confirm your account before signing in.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <Link className="auth-brand" href="/">Global Employment</Link>
        <p className="auth-eyebrow">Create your account</p>
        <h1 id="register-title">Join the world of work</h1>
        <p className="auth-muted">Choose how you want to use the platform. You can create one account type at this stage.</p>

        <div className="role-switch" role="group" aria-label="Account type">
          <button type="button" className={role === "candidate" ? "role-option selected" : "role-option"} onClick={() => setRole("candidate")}>I am looking for work</button>
          <button type="button" className={role === "employer" ? "role-option selected" : "role-option"} onClick={() => setRole("employer")}>I am hiring</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Full name</label>
          <input id="name" autoComplete="name" required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
          <p className="auth-hint">Use at least 8 characters. A verification email may be required.</p>
          <button className="button auth-submit" type="submit" disabled={loading}>{loading ? "Creating account…" : "Create account"}</button>
        </form>

        {message && <p className="auth-message" role="status">{message}</p>}
        <p className="auth-switch">Already registered? <Link href="/login">Sign in</Link></p>
        <p className="auth-legal">By creating an account, you agree to follow the platform&apos;s safety and acceptable-use rules.</p>
      </section>
    </main>
  );
}
