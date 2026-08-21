"use client";
/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element */

import { useEffect, useState } from "react";

type Profile = {
  id: string;
  handle: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

type QuestSummary = {
  id: string;
  title: string;
  duration_days: number;
  started_on: string;
  proofCount: number;
};

type PublicProof = {
  id: string;
  quest_id: string;
  quest_day: number;
  progress_text: string;
  proof_url: string | null;
  image_path: string | null;
  submitted_at: string;
  cheerCount: number;
};

export default function PublicProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [quests, setQuests] = useState<QuestSummary[]>([]);
  const [proofs, setProofs] = useState<PublicProof[]>([]);
  const [questNames, setQuestNames] = useState<Record<string, string>>({});
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const { supabase } = await import("../../lib/supabase");
      const requestedHandle = new URLSearchParams(window.location.search).get("handle")?.trim().toLowerCase();
      let handle = requestedHandle;

      if (!handle) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          const { data: ownProfile } = await supabase.from("profiles").select("handle").eq("id", authData.user.id).maybeSingle();
          handle = ownProfile?.handle ?? undefined;
        }
      }

      if (!handle) {
        setMessage("Add ?handle=username to open a public QuestLoop profile.");
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, handle, display_name, bio, avatar_url, created_at")
        .eq("handle", handle)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        setMessage("That QuestLoop profile does not exist.");
        setLoading(false);
        return;
      }

      const [{ data: memberships, error: membershipError }, { data: proofData, error: proofError }] = await Promise.all([
        supabase.from("quest_memberships").select("quest_id, started_on").eq("user_id", profileData.id).eq("status", "active"),
        supabase
          .from("proofs")
          .select("id, quest_id, quest_day, progress_text, proof_url, image_path, submitted_at")
          .eq("user_id", profileData.id)
          .eq("visibility", "public")
          .order("submitted_at", { ascending: false })
          .limit(30),
      ]);

      if (membershipError) throw membershipError;
      if (proofError) throw proofError;

      const publicProofs = proofData ?? [];
      const questIds = [...new Set([...(memberships ?? []).map((item) => item.quest_id), ...publicProofs.map((proof) => proof.quest_id)])];
      const proofIds = publicProofs.map((proof) => proof.id);
      const [{ data: questData }, { data: cheers }] = await Promise.all([
        questIds.length ? supabase.from("quests").select("id, title, duration_days").in("id", questIds) : Promise.resolve({ data: [] }),
        proofIds.length ? supabase.from("proof_cheers").select("proof_id").in("proof_id", proofIds) : Promise.resolve({ data: [] }),
      ]);

      if (!active) return;
      const names = Object.fromEntries((questData ?? []).map((quest) => [quest.id, quest.title]));
      const cheerCounts: Record<string, number> = {};
      for (const cheer of cheers ?? []) cheerCounts[cheer.proof_id] = (cheerCounts[cheer.proof_id] ?? 0) + 1;
      const proofCounts: Record<string, number> = {};
      for (const proof of publicProofs) proofCounts[proof.quest_id] = (proofCounts[proof.quest_id] ?? 0) + 1;

      setProfile(profileData);
      setQuestNames(names);
      setProofs(publicProofs.map((proof) => ({ ...proof, cheerCount: cheerCounts[proof.id] ?? 0 })));
      const imageProofs = publicProofs.filter((proof) => proof.image_path);
      if (imageProofs.length) {
        const signedEntries = await Promise.all(imageProofs.map(async (proof) => {
          const { data } = await supabase.storage.from("proof-images").createSignedUrl(proof.image_path!, 3600);
          return [proof.id, data?.signedUrl ?? ""] as const;
        }));
        if (active) setImageUrls(Object.fromEntries(signedEntries.filter((entry) => entry[1])));
      }
      setQuests((memberships ?? []).map((membership) => {
        const questInfo = (questData ?? []).find((quest) => quest.id === membership.quest_id);
        return {
          id: membership.quest_id,
          title: questInfo?.title ?? "Quest",
          duration_days: questInfo?.duration_days ?? 1,
          started_on: membership.started_on,
          proofCount: proofCounts[membership.quest_id] ?? 0,
        };
      }));
      setLoading(false);
    }

    loadProfile().catch((error: unknown) => {
      if (!active) return;
      setMessage(error instanceof Error ? error.message : "We couldn’t open this public profile.");
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const totalCheers = proofs.reduce((sum, proof) => sum + proof.cheerCount, 0);

  async function shareProfile() {
    if (!profile) return;
    const url = `${window.location.origin}/profile?handle=${profile.handle}`;

    try {
      await navigator.clipboard.writeText(url);
      setShareMessage("Link copied!");
    } catch {
      setShareMessage("Copy the profile link shown below.");
    }
  }

  if (loading) return <main className="public-profile-page profile-loading">Opening public profile…</main>;

  if (!profile) {
    return <main className="public-profile-page profile-empty"><h1>Profile not found.</h1><p>{message}</p><a className="auth-submit link-button" href="/">Return to QuestLoop →</a></main>;
  }

  return (
    <main className="public-profile-page">
      <header className="dashboard-header">
        <a className="brand" href="/"><span className="brand-mark">Q</span><span>QuestLoop</span></a>
        <nav><a href="/quests">Discover quests</a><a className="nav-cta" href="/signup">Join QuestLoop</a></nav>
      </header>

      <section className="public-profile-header">
        <div className="public-avatar">{(profile.display_name || profile.handle).charAt(0).toUpperCase()}</div>
        <div className="public-identity">
          <h1>{profile.display_name || profile.handle}</h1>
          <strong>@{profile.handle}</strong>
          <p>{profile.bio || "Building progress in public, one quest at a time."}</p>
          <small>Member since {new Date(profile.created_at).getFullYear()}</small>
        </div>
        <div className="share-profile-area">
          <button type="button" className="share-profile-button" onClick={shareProfile}>{shareMessage === "Link copied!" ? "✓ Link copied!" : "Share profile"}</button>
          <small aria-live="polite">{shareMessage}</small>
          <a href={`/profile?handle=${profile.handle}`}>questloop.app/profile?handle={profile.handle}</a>
        </div>
      </section>

      <section className="public-profile-stats">
        <div><strong>{proofs.length}</strong><span>public proofs</span></div>
        <div><strong>{totalCheers}</strong><span>cheers received</span></div>
        <div><strong>{quests.length}</strong><span>active quests</span></div>
      </section>

      <section className="public-profile-grid">
        <div className="public-proof-list">
          <div className="profile-section-title"><p className="panel-kicker">Proof portfolio</p><h2>Progress made visible.</h2></div>
          {proofs.length ? proofs.map((proof) => (
            <article className="profile-proof-card" key={proof.id}>
              <div className="profile-proof-day"><strong>Day {proof.quest_day}</strong><span>{questNames[proof.quest_id] || "Quest"}</span></div>
              <p>{proof.progress_text}</p>
              {imageUrls[proof.id] && <img className="profile-proof-image" src={imageUrls[proof.id]} alt={`Day ${proof.quest_day} public proof`} />}
              <div>{proof.proof_url ? <a href={proof.proof_url} target="_blank" rel="noreferrer">View proof ↗</a> : <span>Progress update</span>}<strong>♥ {proof.cheerCount}</strong></div>
            </article>
          )) : <div className="profile-no-proofs">No public proofs have been shared yet.</div>}
        </div>

        <aside className="public-active-quests">
          <p className="panel-kicker">Active quests</p>
          <h2>Currently showing up for</h2>
          {quests.map((quest) => {
            const completion = Math.round((quest.proofCount / quest.duration_days) * 100);
            return <article key={quest.id}><strong>{quest.title}</strong><span>{quest.proofCount} of {quest.duration_days} proofs</span><div><i style={{ width: `${completion}%` }} /></div><small>{completion}% complete</small></article>;
          })}
          <p className="public-privacy-note">Only proofs @{profile.handle} chose to make public are shown here.</p>
        </aside>
      </section>
    </main>
  );
}
