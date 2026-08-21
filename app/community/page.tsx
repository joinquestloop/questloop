"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useState } from "react";

type FeedProof = {
  id: string;
  user_id: string;
  quest_day: number;
  progress_text: string;
  proof_url: string | null;
  submitted_at: string;
};

type Quest = { id: string; title: string };

export default function CommunityPage() {
  const [proofs, setProofs] = useState<FeedProof[]>([]);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [handles, setHandles] = useState<Record<string, string>>({});
  const [cheerCounts, setCheerCounts] = useState<Record<string, number>>({});
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
          .select("id, user_id, quest_day, progress_text, proof_url, submitted_at")
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
          supabase.from("profiles").select("id, handle, display_name").in("id", userIds),
          supabase.from("proof_cheers").select("proof_id, user_id").in("proof_id", proofIds),
          supabase.from("proof_cheers").select("proof_id").eq("user_id", authData.user.id).in("proof_id", proofIds),
        ]);

        if (!active) return;
        setHandles(Object.fromEntries((profiles ?? []).map((profile) => [profile.id, profile.display_name || `@${profile.handle || "member"}`])));

        const counts: Record<string, number> = {};
        for (const cheer of cheers ?? []) {
          counts[cheer.proof_id] = (counts[cheer.proof_id] ?? 0) + 1;
        }
        setCheerCounts(counts);
        setMyCheers(new Set((ownCheers ?? []).map((cheer) => cheer.proof_id)));
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
        <nav><a href="/quest">My quest</a><a href="/quests">Discover</a></nav>
      </header>

      <section className="community-intro">
        <p className="eyebrow"><span /> Progress together</p>
        <h1>Community<br /><em>proof feed.</em></h1>
        <p>{quest ? `Public progress from members of ${quest.title}.` : "See what your quest community is building and learning."}</p>
      </section>

      {loading ? (
        <p className="community-status">Loading community progress…</p>
      ) : !userId ? (
        <section className="quest-picker-empty"><h2>Sign in to see your quest community.</h2><a className="auth-submit link-button" href="/signup">Go to sign in →</a></section>
      ) : !quest ? (
        <section className="quest-picker-empty"><h2>Join a quest to unlock its community.</h2><a className="auth-submit link-button" href="/quests">Explore quests →</a></section>
      ) : proofs.length === 0 ? (
        <section className="quest-picker-empty"><h2>No public proofs yet.</h2><p>Be the first member to share progress with this quest.</p><a className="auth-submit link-button" href="/quest">Submit today’s proof →</a></section>
      ) : (
        <section className="community-feed" aria-label={`${quest.title} public proofs`}>
          {proofs.map((proof) => {
            const isMine = proof.user_id === userId;
            const hasCheered = myCheers.has(proof.id);
            return (
              <article className="feed-proof-card" key={proof.id}>
                <div className="proof-author-avatar" aria-hidden="true">{(handles[proof.user_id] || "M").replace("@", "").charAt(0).toUpperCase()}</div>
                <div className="feed-proof-content">
                  <div className="feed-proof-meta">
                    <strong>{handles[proof.user_id] || "QuestLoop member"}</strong>
                    <span>Day {proof.quest_day}</span>
                    <time dateTime={proof.submitted_at}>{new Date(proof.submitted_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time>
                  </div>
                  <p>{proof.progress_text}</p>
                  {proof.proof_url && <a href={proof.proof_url} target="_blank" rel="noreferrer">View proof ↗</a>}
                  <div className="feed-proof-actions">
                    {isMine ? (
                      <span className="own-proof-label">✓ Your proof</span>
                    ) : (
                      <button type="button" className={hasCheered ? "cheered" : ""} onClick={() => toggleCheer(proof)} disabled={updatingProofId === proof.id}>
                        {hasCheered ? "♥ Cheered" : "♡ Cheer"}
                      </button>
                    )}
                    <span>{cheerCounts[proof.id] ?? 0} cheers</span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <p className="community-message" aria-live="polite">{message}</p>
    </main>
  );
}
