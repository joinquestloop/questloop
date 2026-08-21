"use client";
/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element */

import { useEffect, useState } from "react";
import AccountMenu from "../../components/account-menu";
import ThemeToggle from "../../components/theme-toggle";

type FeedProof = {
  id: string;
  user_id: string;
  quest_day: number;
  progress_text: string;
  proof_url: string | null;
  image_path: string | null;
  submitted_at: string;
};

type Quest = { id: string; title: string };

export default function CommunityPage() {
  const [proofs, setProofs] = useState<FeedProof[]>([]);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [handles, setHandles] = useState<Record<string, string>>({});
  const [profileHandles, setProfileHandles] = useState<Record<string, string>>({});
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [cheerCounts, setCheerCounts] = useState<Record<string, number>>({});
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [myCheers, setMyCheers] = useState<Set<string>>(new Set());
  const [updatingProofId, setUpdatingProofId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadFeed() {
      const { supabase } = await import("../../lib/supabase");
      const { data: authData } = await supabase.auth.getUser();
      if (!active) return;

      if (!authData.user) {
        setLoading(false);
        return;
      }

      setUserId(authData.user.id);
      const { data: membership, error: membershipError } = await supabase
        .from("quest_memberships")
        .select("quest_id")
        .eq("user_id", authData.user.id)
        .eq("status", "active")
        .order("joined_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (membershipError) throw membershipError;
      if (!membership) {
        setLoading(false);
        return;
      }

      const [{ data: questData, error: questError }, { data: proofData, error: proofError }] = await Promise.all([
        supabase.from("quests").select("id, title").eq("id", membership.quest_id).single(),
        supabase
          .from("proofs")
          .select("id, user_id, quest_day, progress_text, proof_url, image_path, submitted_at")
          .eq("quest_id", membership.quest_id)
          .eq("visibility", "public")
          .order("submitted_at", { ascending: false })
          .limit(50),
      ]);

      if (questError) throw questError;
      if (proofError) throw proofError;
      if (!active) return;

      const loadedProofs = proofData ?? [];
      setQuest(questData);
      setProofs(loadedProofs);

      if (loadedProofs.length) {
        const userIds = [...new Set(loadedProofs.map((proof) => proof.user_id))];
        const proofIds = loadedProofs.map((proof) => proof.id);
        const [{ data: profiles }, { data: cheers }, { data: ownCheers }] = await Promise.all([
          supabase.from("profiles").select("id, handle, display_name, avatar_url").in("id", userIds),
          supabase.from("proof_cheers").select("proof_id, user_id").in("proof_id", proofIds),
          supabase.from("proof_cheers").select("proof_id").eq("user_id", authData.user.id).in("proof_id", proofIds),
        ]);

        if (!active) return;
        setHandles(Object.fromEntries((profiles ?? []).map((profile) => [profile.id, profile.display_name || `@${profile.handle || "member"}`])));
        setProfileHandles(Object.fromEntries((profiles ?? []).map((profile) => [profile.id, profile.handle])));
        const avatarProfiles = (profiles ?? []).filter((profile) => profile.avatar_url);
        if (avatarProfiles.length) {
          const avatarEntries = await Promise.all(avatarProfiles.map(async (profile) => {
            const { data } = await supabase.storage.from("proof-images").createSignedUrl(profile.avatar_url!, 3600);
            return [profile.id, data?.signedUrl ?? ""] as const;
          }));
          if (active) setAvatarUrls(Object.fromEntries(avatarEntries.filter((entry) => entry[1])));
        }

        const counts: Record<string, number> = {};
        for (const cheer of cheers ?? []) {
          counts[cheer.proof_id] = (counts[cheer.proof_id] ?? 0) + 1;
        }
        setCheerCounts(counts);
        setMyCheers(new Set((ownCheers ?? []).map((cheer) => cheer.proof_id)));
        const imageProofs = loadedProofs.filter((proof) => proof.image_path);
        if (imageProofs.length) {
          const signedEntries = await Promise.all(imageProofs.map(async (proof) => {
            const { data } = await supabase.storage.from("proof-images").createSignedUrl(proof.image_path!, 3600);
            return [proof.id, data?.signedUrl ?? ""] as const;
          }));
          if (active) setImageUrls(Object.fromEntries(signedEntries.filter((entry) => entry[1])));
        }
      }

      setLoading(false);
    }

    loadFeed().catch((error: unknown) => {
      if (!active) return;
      setMessage(error instanceof Error ? error.message : "We couldn’t load the community feed.");
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  async function toggleCheer(proof: FeedProof) {
    if (!userId || proof.user_id === userId) return;
    const hasCheered = myCheers.has(proof.id);
    setUpdatingProofId(proof.id);

    try {
      const { supabase } = await import("../../lib/supabase");
      const query = hasCheered
        ? supabase.from("proof_cheers").delete().eq("proof_id", proof.id).eq("user_id", userId)
        : supabase.from("proof_cheers").insert({ proof_id: proof.id, user_id: userId });
      const { error } = await query;
      if (error) throw error;

      setMyCheers((current) => {
        const next = new Set(current);
        if (hasCheered) next.delete(proof.id);
        else next.add(proof.id);
        return next;
      });
      setCheerCounts((current) => ({ ...current, [proof.id]: Math.max(0, (current[proof.id] ?? 0) + (hasCheered ? -1 : 1)) }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The cheer could not be updated.");
    } finally {
      setUpdatingProofId(null);
    }
  }

  return (
    <main className="community-page">
      <header className="dashboard-header">
        <a className="brand" href="/"><span className="brand-mark">Q</span><span>QuestLoop</span></a>
        <nav><a href="/quest">My quest</a><a href="/quests">Discover quests</a><AccountMenu /><ThemeToggle /></nav>
      </header>

      <section className="community-masthead">
        <div>
          <p className="eyebrow"><span /> Community</p>
          <h1>Progress, shared.</h1>
          <p>{quest ? `The latest from people showing up for ${quest.title}.` : "Real updates from people building better habits together."}</p>
        </div>
        {quest && !loading && <a className="community-share-cta" href="/quest">Share today’s progress <span>＋</span></a>}
      </section>

      <div className="community-layout">
        <div className="community-stream">
          <div className="community-stream-header">
            <div><strong>Latest updates</strong><span>{quest ? quest.title : "Your quest community"}</span></div>
            {quest && !loading && <span className="community-live"><i /> {proofs.length} updates</span>}
          </div>
          {loading ? (
            <p className="community-status">Loading community progress…</p>
          ) : !userId ? (
            <section className="community-empty"><span className="community-empty-icon">◎</span><h2>Your community is waiting.</h2><p>Sign in to see progress from people taking the same quest as you.</p><a href="/signup?mode=signin">Sign in to QuestLoop →</a></section>
          ) : !quest ? (
            <section className="community-empty"><span className="community-empty-icon">↗</span><h2>Choose a quest first.</h2><p>Your feed is shaped around people pursuing the same goal.</p><a href="/quests">Explore quests →</a></section>
          ) : proofs.length === 0 ? (
            <section className="community-empty"><span className="community-empty-icon">＋</span><h2>Start the conversation.</h2><p>Be the first person in this quest to share a progress update.</p><a href="/quest">Share today’s progress →</a></section>
          ) : (
            <section className="community-feed" aria-label={`${quest.title} public progress updates`}>
          {proofs.map((proof, index) => {
            const isMine = proof.user_id === userId;
            const hasCheered = myCheers.has(proof.id);
            return (
              <article className="feed-proof-card" key={proof.id} style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}>
                {profileHandles[proof.user_id] && (
                  <a className="feed-profile-link" href={`/profile?handle=${profileHandles[proof.user_id]}`} aria-label={`Open ${handles[proof.user_id] || "member"}'s profile`} />
                )}
                <div className="proof-author-avatar" aria-hidden="true">
                  {avatarUrls[proof.user_id] ? <img src={avatarUrls[proof.user_id]} alt="" /> : (handles[proof.user_id] || "M").replace("@", "").charAt(0).toUpperCase()}
                </div>
                <div className="feed-proof-content">
                  <div className="feed-proof-meta">
                    <strong>{handles[proof.user_id] || "QuestLoop member"}</strong>
                    <span className="feed-quest-tag">{quest.title}</span>
                    <span>Day {proof.quest_day}</span>
                    <time dateTime={proof.submitted_at}>{new Date(proof.submitted_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time>
                  </div>
                  <p>{proof.progress_text}</p>
                  {imageUrls[proof.id] && <img className="feed-proof-image" src={imageUrls[proof.id]} alt={`Day ${proof.quest_day} update by ${handles[proof.user_id] || "a QuestLoop member"}`} />}
                  {proof.proof_url && <a href={proof.proof_url} target="_blank" rel="noreferrer">View progress link ↗</a>}
                  <div className="feed-proof-actions">
                    {isMine ? (
                      <span className="own-proof-label">✓ Your update</span>
                    ) : (
                      <button type="button" className={`cheer-button ${hasCheered ? "cheered" : ""}`} onClick={() => toggleCheer(proof)} disabled={updatingProofId === proof.id} aria-label={hasCheered ? "Remove your cheer" : "Cheer this progress update"}>
                        <span className="cheer-heart" aria-hidden="true">{hasCheered ? "♥" : "♡"}</span>
                        <span className="cheer-label">{hasCheered ? "Cheered!" : "Cheer"}</span>
                        <span className="cheer-particles" aria-hidden="true"><i>✦</i><i>♥</i><i>＋1</i><i>✦</i><i>♥</i></span>
                      </button>
                    )}
                    <span>{cheerCounts[proof.id] ?? 0} cheers</span>
                    <span className="feed-open-profile">View profile ↗</span>
                  </div>
                </div>
              </article>
            );
          })}
            </section>
          )}
        </div>

        <aside className="community-sidebar">
          <section className="community-side-card community-side-highlight">
            <span className="side-icon">✦</span>
            <p className="panel-kicker">QuestLoop community</p>
            <h2>Built for momentum, not popularity.</h2>
            <p>Share honest progress, cheer useful work, and keep moving with people on the same path.</p>
          </section>
          <section className="community-side-card">
            <div className="side-card-title"><strong>Community values</strong><span>03</span></div>
            <ul className="community-values">
              <li><span>01</span><div><strong>Progress over perfection</strong><small>Small updates count.</small></div></li>
              <li><span>02</span><div><strong>Encouragement over metrics</strong><small>Cheer the effort.</small></div></li>
              <li><span>03</span><div><strong>People over algorithms</strong><small>Your quest shapes the feed.</small></div></li>
            </ul>
          </section>
          <a className="community-discover-card" href="/quests"><span>Discover another path</span><strong>Explore quests</strong><b>→</b></a>
        </aside>
      </div>

      <p className="community-message" aria-live="polite">{message}</p>
    </main>
  );
}
