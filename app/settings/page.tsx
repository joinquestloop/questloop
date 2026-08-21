"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { FormEvent, useEffect, useState } from "react";

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      const { supabase } = await import("../../lib/supabase");
      const { data: authData } = await supabase.auth.getUser();
      if (!active) return;

      if (!authData.user) {
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("handle, display_name, bio")
        .eq("id", authData.user.id)
        .single();
      if (error) throw error;
      if (!active) return;

      setUserId(authData.user.id);
      setHandle(profile.handle ?? "");
      setDisplayName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
      setLoading(false);
    }

    loadSettings().catch((error: unknown) => {
      if (!active) return;
      setMessage(error instanceof Error ? error.message : "We couldn’t load your settings.");
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    setSaving(true);
    setMessage("Saving your profile…");

    try {
      const { supabase } = await import("../../lib/supabase");
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      if (error) throw error;
      setMessage("Profile saved. Your public page is updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    const { supabase } = await import("../../lib/supabase");
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  if (loading) return <main className="settings-page settings-loading">Opening account settings…</main>;
  if (!userId) return <main className="settings-page settings-empty"><h1>Sign in to manage your account.</h1><a className="auth-submit link-button" href="/signup">Go to sign in →</a></main>;

  return (
    <main className="settings-page">
      <header className="dashboard-header">
        <a className="brand" href="/"><span className="brand-mark">Q</span><span>QuestLoop</span></a>
        <nav><a href="/quest">My quest</a><a href="/profile">Public profile</a></nav>
      </header>

      <section className="settings-layout">
        <div className="settings-intro">
          <p className="eyebrow"><span /> Your account</p>
          <h1>Make your progress<br /><em>recognizably yours.</em></h1>
          <p>Keep your public identity simple. Your work and consistency should remain the focus.</p>
        </div>

        <div className="settings-card">
          <div className="settings-avatar">{(displayName || handle).charAt(0).toUpperCase()}</div>
          <strong>@{handle}</strong>
          <form onSubmit={saveProfile}>
            <label htmlFor="display-name">Display name</label>
            <input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={50} placeholder="Your name" />
            <label htmlFor="profile-bio">Short bio</label>
            <textarea id="profile-bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={160} placeholder="What are you working toward?" />
            <div className="settings-bio-count">{bio.length}/160</div>
            <button className="auth-submit" type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile →"}</button>
          </form>
          <p className="settings-message" aria-live="polite">{message}</p>
          <button className="settings-signout" type="button" onClick={signOut}>Sign out of QuestLoop</button>
        </div>
      </section>
    </main>
  );
}
