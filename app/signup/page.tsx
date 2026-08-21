"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { FormEvent, useEffect, useState } from "react";
import ThemeToggle from "../../components/theme-toggle";

type Mode = "signup" | "signin";

function withTimeout<T>(promise: PromiseLike<T>, milliseconds = 15000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_resolve, reject) => {
      window.setTimeout(
        () => reject(new Error("The account service took too long to respond. Please try again.")),
        milliseconds,
      );
    }),
  ]);
}

export default function SignupPage() {
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "signin") {
      const timer = window.setTimeout(() => setMode("signin"), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setStatus("idle");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage(mode === "signup" ? "Creating your account…" : "Signing you in…");
    try {
      const { supabase } = await import("../../lib/supabase");

      if (mode === "signup") {
        const { data, error } = await withTimeout(
          supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: `${window.location.origin}/onboarding` },
          }),
        );

        if (error) throw error;

        if (data.session) {
          window.location.assign("/onboarding");
          return;
        }

        setStatus("success");
        setMessage("Check your inbox and confirm your email to continue.");
        return;
      }

      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
      );

      if (error) throw error;

      const [{ data: profile }, { data: membership }] = await Promise.all([
        supabase.from("profiles").select("handle").eq("id", data.user.id).maybeSingle(),
        supabase
          .from("quest_memberships")
          .select("id")
          .eq("user_id", data.user.id)
          .eq("status", "active")
          .limit(1)
          .maybeSingle(),
      ]);

      if (membership) window.location.assign("/quest");
      else if (profile?.handle) window.location.assign("/quests");
      else window.location.assign("/onboarding");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Account request failed. Please try again.");
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <a className="brand" href="/" aria-label="QuestLoop home">
          <span className="brand-mark" aria-hidden="true">Q</span>
          <span>QuestLoop</span>
        </a>
        <div className="auth-header-actions"><a className="auth-back" href="/">← Back to home</a><ThemeToggle /></div>
      </header>

      <section className="auth-layout">
        <div className="auth-story">
          <p className="eyebrow"><span /> Your first step</p>
          <h1>Make progress<br /><em>visible.</em></h1>
          <p>Join a quest, show up consistently, and build a portfolio of progress—one day at a time.</p>
          <div className="auth-loop" aria-label="QuestLoop account journey">
            <span className="active">1</span><i /><span>2</span><i /><span>3</span>
          </div>
          <div className="auth-loop-labels"><span>Create account</span><span>Choose handle</span><span>Join a quest</span></div>
        </div>

        <div className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="Account options">
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => switchMode("signup")}>Create account</button>
            <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => switchMode("signin")}>Sign in</button>
          </div>
          <div className="auth-card-copy">
            <p className="auth-kicker">{mode === "signup" ? "Start your first quest" : "Welcome back"}</p>
            <h2>{mode === "signup" ? "Create your account" : "Keep your loop moving"}</h2>
            <p>{mode === "signup" ? "You’ll choose your public handle after confirming your email." : "Sign in to continue your quests and daily streak."}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="account-email">Email address</label>
            <input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />

            <label htmlFor="account-password">Password</label>
            <input id="account-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} required />

            <button className="auth-submit" type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Please wait…" : mode === "signup" ? "Create my account →" : "Sign in →"}
            </button>
            <p className={`auth-message ${status}`} aria-live="polite">{message}</p>
          </form>

          <p className="auth-terms">By continuing, you agree to show up honestly and respect other members’ work.</p>
        </div>
      </section>
    </main>
  );
}
