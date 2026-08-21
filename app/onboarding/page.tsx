"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

export default function OnboardingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    import("../../lib/supabase").then(({ supabase }) => {
      if (!active) return;

      supabase.auth.getUser().then(async ({ data }) => {
        if (!active) return;
        setUser(data.user);

        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("handle")
            .eq("id", data.user.id)
            .maybeSingle();

          if (!active) return;
          const storedHandle = profile?.handle ?? "";
          setHandle(storedHandle);
          setSaved(Boolean(storedHandle));
        }

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

    if (!user) {
      setMessage("Please sign in again before saving your handle.");
      return;
    }

    setMessage("Saving your handle…");
    setSaving(true);
    const { supabase } = await import("../../lib/supabase");
    const { error } = await supabase
      .from("profiles")
      .update({ handle: normalized, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("handle")
      .single();

    if (error) {
      setSaving(false);
      setMessage(error.code === "23505" ? "That handle is already taken. Try another one." : error.message);
      return;
    }

    await supabase.auth.updateUser({ data: { handle: normalized } });
    setHandle(normalized);
    setSaved(true);
    setSaving(false);
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
          <a className="auth-submit link-button" href="/signup">Return to sign in →</a>
        </section>
      </main>
    );
  }

  return (
    <main className="onboarding-page">
      <section className="onboarding-card">
        <a className="brand onboarding-brand" href="/"><span className="brand-mark">Q</span><span>QuestLoop</span></a>
        <span className="step-badge">Step 2 of 3</span>
        <h1>{saved ? "You’re ready to begin." : "Choose your public handle."}</h1>
        <p>{saved ? "Next, you’ll choose your first quest and share your Day 1 progress." : "This becomes your shareable QuestLoop profile address."}</p>

        {!saved ? (
          <form className="handle-form" onSubmit={saveHandle}>
            <label htmlFor="handle">QuestLoop handle</label>
            <div className="handle-input"><span>@</span><input id="handle" value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="souvik" autoComplete="username" required /></div>
            <p>questloop.app/@{handle || "yourhandle"}</p>
            <button className="auth-submit" type="submit" disabled={saving}>{saving ? "Saving…" : "Save my handle →"}</button>
          </form>
        ) : (
          <div className="onboarding-success">
            <div><span>✓</span><strong>@{handle}</strong><small>Public profile reserved</small></div>
            <a className="auth-submit link-button" href="/quests">Choose my first quest →</a>
          </div>
        )}
        <p className={`auth-message ${saved ? "success" : ""}`} aria-live="polite">{message}</p>
      </section>
    </main>
  );
}
