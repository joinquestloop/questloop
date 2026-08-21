"use client";

import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

export default function OnboardingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    import("../../lib/supabase").then(({ supabase }) => {
      if (!active) return;

      supabase.auth.getUser().then(({ data }) => {
        if (!active) return;
        setUser(data.user);
        setHandle((data.user?.user_metadata.handle as string | undefined) ?? "");
        setLoading(false);
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        setUser(session?.user ?? null);
        setLoading(false);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  async function saveHandle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = handle.trim().toLowerCase().replace(/^@/, "");

    if (!HANDLE_PATTERN.test(normalized)) {
      setMessage("Use 3–20 lowercase letters, numbers, or underscores.");
      return;
    }

    setMessage("Saving your handle…");
    const { supabase } = await import("../../lib/supabase");
    const { error } = await supabase.auth.updateUser({ data: { handle: normalized } });

    if (error) {
      setMessage(error.message);
      return;
    }

    setHandle(normalized);
    setSaved(true);
    setMessage("Your QuestLoop profile is ready.");
  }

  if (loading) {
    return <main className="onboarding-page"><p className="onboarding-loading">Opening your QuestLoop profile…</p></main>;
  }

  if (!user) {
    return (
      <main className="onboarding-page">
        <section className="onboarding-card compact">
          <span className="step-badge">Email confirmation needed</span>
          <h1>Confirm your email first.</h1>
          <p>Open the confirmation link Supabase sent to your inbox, then return here.</p>
          <Link className="auth-submit link-button" href="/signup">Return to sign in →</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="onboarding-page">
      <section className="onboarding-card">
        <Link className="brand onboarding-brand" href="/"><span className="brand-mark">Q</span><span>QuestLoop</span></Link>
        <span className="step-badge">Step 2 of 3</span>
        <h1>{saved ? "You’re ready to begin." : "Choose your public handle."}</h1>
        <p>{saved ? "Next, you’ll choose your first quest and submit Day 1 proof." : "This becomes your shareable QuestLoop profile address."}</p>

        {!saved ? (
          <form className="handle-form" onSubmit={saveHandle}>
            <label htmlFor="handle">QuestLoop handle</label>
            <div className="handle-input"><span>@</span><input id="handle" value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="souvik" autoComplete="username" required /></div>
            <p>questloop.app/@{handle || "yourhandle"}</p>
            <button className="auth-submit" type="submit">Save my handle →</button>
          </form>
        ) : (
          <div className="onboarding-success">
            <div><span>✓</span><strong>@{handle}</strong><small>Public profile reserved</small></div>
            <button className="auth-submit" type="button" disabled>Choose a quest — coming next</button>
          </div>
        )}
        <p className={`auth-message ${saved ? "success" : ""}`} aria-live="polite">{message}</p>
      </section>
    </main>
  );
}
