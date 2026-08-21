"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

export default function AccountMenu() {
  const [handle, setHandle] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    import("../lib/supabase").then(async ({ supabase }) => {
      const { data: authData } = await supabase.auth.getUser();
      if (!active) return;

      if (!authData.user) {
        setSignedIn(false);
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("handle, avatar_url").eq("id", authData.user.id).maybeSingle();
      if (!active) return;
      setHandle(profile?.handle ?? null);
      if (profile?.avatar_url) {
        const { data } = await supabase.storage.from("proof-images").createSignedUrl(profile.avatar_url, 3600);
        if (active) setAvatarUrl(data?.signedUrl ?? "");
      }
      setSignedIn(true);
    });

    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    const { supabase } = await import("../lib/supabase");
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  if (signedIn === false) return <a className="account-signin" href="/signup">Sign in</a>;
  if (signedIn === null) return <span className="account-loading">Account</span>;

  return (
    <div className="account-menu">
      <a href="/settings" aria-label="Open account settings">
        <span className="account-avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : (handle || "M").charAt(0).toUpperCase()}</span>
        <span>@{handle || "member"}</span>
      </a>
      <button type="button" onClick={signOut}>Sign out</button>
    </div>
  );
}
