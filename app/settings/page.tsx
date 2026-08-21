"use client";
/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element */

import { FormEvent, useEffect, useRef, useState } from "react";

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [message, setMessage] = useState("");
  const confirmSaveButtonRef = useRef<HTMLButtonElement>(null);

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
        .select("handle, display_name, bio, avatar_url")
        .eq("id", authData.user.id)
        .single();
      if (error) throw error;
      if (!active) return;

      setUserId(authData.user.id);
      setHandle(profile.handle ?? "");
      setDisplayName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
      setAvatarPath(profile.avatar_url ?? null);
      if (profile.avatar_url) {
        const { data } = await supabase.storage.from("proof-images").createSignedUrl(profile.avatar_url, 3600);
        if (active) setAvatarUrl(data?.signedUrl ?? "");
      }
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

  useEffect(() => {
    if (!confirmingSave) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setConfirmingSave(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    confirmSaveButtonRef.current?.focus();
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [confirmingSave]);

  function requestSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmingSave(true);
  }

  async function saveProfile() {
    if (!userId) return;
    setConfirmingSave(false);
    setSaving(true);
    setMessage("Saving your profile…");

    try {
      const { supabase } = await import("../../lib/supabase");
      let uploadedPath: string | null = null;

      if (avatarFile) {
        const extension = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
        uploadedPath = `${userId}/avatar/avatar-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("proof-images").upload(uploadedPath, avatarFile, {
          contentType: avatarFile.type,
          upsert: false,
        });
        if (uploadError) throw uploadError;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          avatar_url: uploadedPath ?? avatarPath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      if (error) {
        if (uploadedPath) await supabase.storage.from("proof-images").remove([uploadedPath]);
        throw error;
      }

      if (uploadedPath) {
        if (avatarPath) await supabase.storage.from("proof-images").remove([avatarPath]);
        const { data } = await supabase.storage.from("proof-images").createSignedUrl(uploadedPath, 3600);
        setAvatarPath(uploadedPath);
        setAvatarUrl(data?.signedUrl ?? "");
        setAvatarFile(null);
      }
      setMessage("Profile saved. Your public page is updated.");
      window.location.assign("/profile");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function chooseAvatar(file: File | null) {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("Choose a PNG, JPEG or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage("Your profile picture must be 2 MB or smaller.");
      return;
    }

    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
    setMessage("New picture selected. Save your profile to publish it.");
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
        <nav><a href="/quest">My quest</a><a href="/community">Community</a><a href="/profile">Public profile</a></nav>
      </header>

      <section className="settings-layout">
        <div className="settings-intro">
          <p className="eyebrow"><span /> Your account</p>
          <h1>Make your progress<br /><em>recognizably yours.</em></h1>
          <p>Keep your public identity simple. Your work and consistency should remain the focus.</p>
        </div>

        <div className="settings-card">
          <div className="settings-avatar">
            {avatarUrl ? <img src={avatarUrl} alt="New profile preview" /> : (displayName || handle).charAt(0).toUpperCase()}
          </div>
          <strong>@{handle}</strong>
          <form onSubmit={requestSave}>
            <label htmlFor="profile-avatar">Profile picture</label>
            <input id="profile-avatar" className="avatar-file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => chooseAvatar(event.target.files?.[0] ?? null)} />
            <p className="avatar-help">PNG, JPEG or WebP · maximum 2 MB</p>
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

      {confirmingSave && (
        <div className="quest-confirm-backdrop">
          <button className="quest-confirm-dismiss" type="button" aria-label="Close confirmation" tabIndex={-1} onClick={() => setConfirmingSave(false)} />
          <section className="quest-confirm-dialog save-profile-confirm" role="dialog" aria-modal="true" aria-labelledby="save-profile-title">
            <p className="panel-kicker">Confirm your changes</p>
            <h2 id="save-profile-title">Update your public profile?</h2>
            <p>Your name, bio, and selected profile picture will be visible on your public QuestLoop page.</p>
            <div className="quest-confirm-actions">
              <button type="button" onClick={() => setConfirmingSave(false)}>Keep editing</button>
              <button ref={confirmSaveButtonRef} type="button" onClick={() => void saveProfile()}>Yes, save changes →</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
